
'use server';

import { bookingAgent } from '@/ai/flows/booking-agent';
import { localGuide } from '@/ai/flows/local-guide';
import { fraudScoringAndReasoning, FraudScoringInput } from '@/ai/flows/fraud-scoring-and-reasoning';
import { analyzeServiceRequest } from '@/ai/flows/service-request-analysis';
import { assignStaffToRequest } from '@/ai/flows/staff-assignment';
import { predictVibeScore } from '@/ai/flows/vibe-score-predictor';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import cloudinary from '@/lib/cloudinary';
import { adminAuth, adminDb } from '@/firebase/admin';
import { cookies, headers } from 'next/headers';
import { detectAnomalies } from '@/ai/flows/anomaly-detection-with-explainable-alerts';


import {
  createBooking as dbCreateBooking,
  checkInBooking as dbCheckInBooking,
  createServiceRequest as dbCreateServiceRequest,
  updateServiceRequestStatus as dbUpdateServiceRequestStatus,
  updateBooking,
  getBookings,
  getServiceRequests,
  getRooms,
  getBookingById,
  updateUserRole as dbUpdateUserRole,
  createRoom as dbCreateRoom,
  updateRoom as dbUpdateRoom,
  deleteRoom as dbDeleteRoom,
  getAvailableRoomsForType,
  getAdminById,
  getAdmins,
  updateBookingPayment,
  getAvailableStaff,
  createAssignment,
  getGuests,
  getGuestById,
  getRequestsByBookingId
} from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { RoomType, PaymentMethod, BookingStatus, UserRole, RoomStatus, DocumentType, RoomImage, StaffType, Booking, Admin, AuditLogEntry } from '@/lib/types';
import { countries } from '@/lib/constants';


// --- Paystack Verification ---
async function verifyPaystackTransaction(reference: string) {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
        console.error("Paystack secret key is not set.");
        return { success: false, message: "Payment processor is not configured.", data: null };
    }

    try {
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${secretKey}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            return { success: false, message: `Payment verification failed: ${errorData.message}`, data: null };
        }

        const data = await response.json();
        
        if (data.data.status === 'success') {
            return { success: true, message: "Payment verified successfully.", data: data.data };
        } else {
            return { success: false, message: `Payment not completed: ${data.data.gateway_response}`, data: data.data };
        }

    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred during payment verification.";
        return { success: false, message, data: null };
    }
}

const dataUriToBuffer = (dataUri: string) => {
    const base64 = dataUri.split(',')[1];
    return Buffer.from(base64, 'base64');
};

const uploadDataUri = async (dataUri: string, folder: string): Promise<{ secure_url: string; public_id: string }> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
                if (error) reject(error);
                else if (result) resolve({ secure_url: result.secure_url, public_id: result.public_id });
                else reject(new Error("Cloudinary upload failed without error."));
            }
        );
        uploadStream.end(dataUriToBuffer(dataUri));
    });
};


const bookingSchema = z.object({
  guestId: z.string(),
  guestName: z.string().min(2, 'Guest name is required.'),
  guestEmail: z.string().email('Invalid email address.'),
  guestPhone: z.string().min(10, 'Invalid phone number.'),
  country: z.string().min(2, 'Country is required.'),
  documentType: z.nativeEnum(DocumentType),
  documentNumber: z.string().min(6, "A valid document number is required."),
  documentImage: z.string().min(1, "Document image is required."), // data URI
  selfieImage: z.string().optional(),
  checkIn: z.string(),
  checkOut: z.string(),
  roomType: z.nativeEnum(RoomType),
  adults: z.string(),
  children: z.string(),
  numberOfRooms: z.string(),
});

const mapDecisionToStatus = (decision: "APPROVE" | "REVIEW" | "DECLINE"): BookingStatus => {
    switch (decision) {
        case "APPROVE": return BookingStatus.Approved;
        case "REVIEW": return BookingStatus.ReviewNeeded;
        case "DECLINE": return BookingStatus.Declined;
    }
};

export async function createBookingAction(data: FormData) {
    
    const validatedFields = bookingSchema.safeParse(Object.fromEntries(data.entries()));
    if (!validatedFields.success) {
        console.error("Booking validation failed:", validatedFields.error.flatten().fieldErrors);
        return {
            success: false,
            message: 'Invalid form data. Please check all fields and try again.',
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }
  
  try {
    const { 
        guestId, guestName, guestEmail, guestPhone, country, checkIn, checkOut, 
        roomType, documentType, documentNumber, documentImage, selfieImage,
        adults, children, numberOfRooms,
    } = validatedFields.data;
    
    // --- Parallelize image uploads to Cloudinary ---
    const [documentImageUpload, selfieImageUpload] = await Promise.all([
        documentImage ? uploadDataUri(documentImage, "elysian_ai_ids") : Promise.resolve(null),
        selfieImage ? uploadDataUri(selfieImage, "elysian_ai_selfies") : Promise.resolve(null)
    ]);
    
    const clientIp = headers().get('x-forwarded-for') ?? '127.0.0.1';
    
    // --- AI FRAUD & RISK ANALYSIS ---
    const fraudAnalysisInput: FraudScoringInput = {
        guestName, email: guestEmail, phone: guestPhone, country,
        bookingTime: new Date().toISOString(),
        documentType, documentNumber,
        documentImageUrl: documentImageUpload?.secure_url || '',
        selfieImageUrl: selfieImageUpload?.secure_url,
        ipAddress: clientIp, 
        deviceId: `device_${guestId}`, // Placeholder
    };
    
    const fraudAnalysisResult = await fraudScoringAndReasoning(fraudAnalysisInput);
    const initialStatus = mapDecisionToStatus(fraudAnalysisResult.decision);

    const bookingData: Omit<Booking, 'id' | 'createdAt' | 'accessPin'> = {
      guestId, guestName, guestEmail, guestPhone, country,
      documentType, documentNumber,
      documentImageUrl: documentImageUpload?.secure_url || '',
      selfieImageUrl: selfieImageUpload?.secure_url,
      checkIn: new Date(checkIn), checkOut: new Date(checkOut),
      roomType, roomId: null,
      status: initialStatus,
      fraudScore: fraudAnalysisResult.fraudScore,
      fraudReasoning: fraudAnalysisResult.reasoning,
      paymentMethod: PaymentMethod.Paystack,
      adults: parseInt(adults, 10) || 1,
      children: parseInt(children, 10) || 0,
      numberOfRooms: parseInt(numberOfRooms, 10) || 1,
    };
    
    const newBooking = await dbCreateBooking(bookingData);

    revalidatePath('/admin/dashboard');

    return { success: true, bookingId: newBooking.id, message: "Booking created successfully!" };
  } catch (error) {
    console.error("CREATE BOOKING ACTION FAILED:", error);
    const message = error instanceof Error ? error.message : 'Failed to create booking. Please try again.';
    return { success: false, message };
  }
}

export async function processPaymentAction(bookingId: string, paymentReference: string) {
    // For the hackathon demo, we will treat any provided reference as a successful payment.
    const paymentId = `demo_${paymentReference || Date.now()}`;
    
    await updateBookingPayment(bookingId, paymentId);
    revalidatePath(`/pass/${bookingId}`);
    return { success: true, bookingId, message: "Payment confirmed successfully." };
}

export async function checkInAction(bookingId: string) {
  try {
    const booking = await getBookingById(bookingId);

    if (!booking) {
      throw new Error('Booking not found.');
    }
    if (booking.status !== 'Approved') {
        throw new Error(`Cannot check-in a booking with status: ${booking.status}`);
    }
    if (!booking.paymentId) {
        throw new Error('Payment has not been completed for this booking.');
    }
    
    // Find the first available room of the correct type.
    const availableRooms = await getAvailableRoomsForType(booking.roomType, new Date(booking.checkIn), new Date(booking.checkOut));
    if (availableRooms.length === 0) {
        throw new Error(`No ${booking.roomType} rooms are available for the selected dates. Please contact the front desk.`);
    }
    const roomId = availableRooms[0].id;
    
    await dbCheckInBooking(bookingId, roomId);

    revalidatePath(`/guest/${bookingId}`);
    revalidatePath('/admin/dashboard');
    return { success: true, message: `Checked in successfully to Room ${roomId}!` };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Check-in failed.';
    console.error("Check-in Error:", message);
    return { success: false, message };
  }
}

const serviceRequestSchema = z.object({
    bookingId: z.string(),
    requestText: z.string().min(1, 'Request description is required'),
});

export async function createServiceRequestAction(prevState: any, formData: FormData) {
    const validatedFields = serviceRequestSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { message: 'Invalid data.' };
    }
    
    const { bookingId, requestText } = validatedFields.data;

    // AI-powered request analysis
    const analysisResult = await analyzeServiceRequest({ requestText });

    // Create the service request in the database
    const newRequest = await dbCreateServiceRequest(bookingId, {
        type: analysisResult.category,
        description: requestText,
    });

    // Get available staff for the category
    const availableStaff = await getAvailableStaff(analysisResult.category);
    
    // Trigger the AI assignment flow (don't wait for it to complete)
    if (availableStaff.length > 0) {
        assignStaffToRequest({
            serviceRequestId: newRequest.id,
            requestType: newRequest.type,
            requestDescription: newRequest.description,
            availableStaff: availableStaff,
        }).catch(err => {
            // Log the error but don't block the user response
            console.error("AI Staff Assignment Error:", err);
        });
    } else {
        console.warn(`No available staff found for category: ${analysisResult.category}`);
        // You might want to create a notification for admins here
    }


    revalidatePath(`/guest/${bookingId}`);
    revalidatePath('/admin/dashboard');
    
    return { message: `Your ${analysisResult.category} request has been submitted and is being assigned.`};
}


export async function updateServiceRequestStatusAction(requestId: string, status: 'In-Progress' | 'Completed') {
    await dbUpdateServiceRequestStatus(requestId, status);
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/requests');
}

export async function updateUserRoleAction(userId: string, role: UserRole, staffType?: StaffType) {
    try {
        await dbUpdateUserRole(userId, role, staffType);
        revalidatePath('/admin/users'); 
        return { success: true, message: `User role updated to ${role}.` };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update user role.';
        console.error("Role Update Error:", message);
        return { success: false, message };
    }
}

const uploadImage = async (file: File): Promise<{ secure_url: string; public_id: string }> => {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "elysian_ai_rooms", tags: "room_image" },
            (error, result) => {
                if (error) {
                    reject(error);
                } else if (result) {
                    resolve({ secure_url: result.secure_url, publicId: result.public_id });
                } else {
                    reject(new Error("Cloudinary upload failed without an error."));
                }
            }
        );
        uploadStream.end(buffer);
    });
};


const roomFormSchema = z.object({
    number: z.string().min(1, 'Room number is required.'),
    type: z.nativeEnum(RoomType),
    price: z.coerce.number().min(1, 'Price must be greater than 0.'),
    status: z.nativeEnum(RoomStatus),
});

export async function createRoomAction(prevState: any, formData: FormData) {
    try {
        const validatedFields = roomFormSchema.safeParse(Object.fromEntries(formData.entries()));

        if (!validatedFields.success) {
            return { success: false, message: 'Invalid form data.', errors: validatedFields.error.flatten().fieldErrors };
        }

        const newImages: File[] = [];
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('new-images-') && value instanceof File) {
                newImages.push(value);
            }
        }
        
        const uploadedImages = await Promise.all(newImages.map(file => uploadImage(file)));

        const roomData = {
            ...validatedFields.data,
            images: uploadedImages.map(img => ({ url: img.secure_url, publicId: img.public_id })),
        };
        
        await dbCreateRoom(roomData as any);

        revalidatePath('/admin/rooms');
        return { success: true, message: `Room ${validatedFields.data.number} created successfully.` };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create room.';
        console.error("Create Room Error:", message);
        return { success: false, message };
    }
}

export async function updateRoomAction(roomId: string, prevState: any, formData: FormData) {
    try {
        const validatedFields = roomFormSchema.safeParse(Object.fromEntries(formData.entries()));
        
        if (!validatedFields.success) {
            return { success: false, message: 'Invalid form data.', errors: validatedFields.error.flatten().fieldErrors };
        }
        
        const existingImagesRaw = formData.get('existingImages');
        let existingImages: RoomImage[] = [];
        if (typeof existingImagesRaw === 'string') {
            existingImages = JSON.parse(existingImagesRaw);
        }

        const newImageFiles: File[] = [];
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('new-images-') && value instanceof File) {
                newImageFiles.push(value);
            }
        }

        const uploadedImages = await Promise.all(newImageFiles.map(file => uploadImage(file)));
        const finalImages = [
            ...existingImages,
            ...uploadedImages.map(img => ({ url: img.secure_url, publicId: img.public_id }))
        ];

        const roomData = {
            ...validatedFields.data,
            images: finalImages
        };
        
        await dbUpdateRoom(roomId, roomData);

        revalidatePath('/admin/rooms');
        return { success: true, message: `Room ${validatedFields.data.number} updated successfully.` };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update room.';
        console.error("Update Room Error:", message);
        return { success: false, message };
    }
}


export async function deleteRoomAction(roomId: string) {
    try {
        await dbDeleteRoom(roomId);
        revalidatePath('/admin/rooms');
        return { success: true, message: `Room deleted successfully.` };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete room.';
        console.error("Delete Room Error:", message);
        return { success: false, message };
    }
}

const updateBookingStatusSchema = z.object({
    notes: z.string().optional(),
});

async function getAuthenticatedAdmin(): Promise<Admin> {
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) {
        // This is a bypass for the hackathon demo.
        return { id: 'mockAdminId', name: 'Demo Admin', email: 'admin@demo.com', role: 'admin' };
    }
    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        const admin = await getAdminById(decodedToken.uid);
        if (!admin) {
             throw new Error("Admin privileges required.");
        }
        return admin;
    } catch (error) {
        console.error("Session verification failed. Using mock admin.", error);
        return { id: 'mockAdminId', name: 'Demo Admin', email: 'admin@demo.com', role: 'admin' };
    }
}


export async function approveBookingAction(bookingId: string) {
    const admin = await getAuthenticatedAdmin();

    const auditLogEntry: AuditLogEntry = {
        action: 'Booking Approved',
        adminId: admin.id,
        adminName: admin.name,
        timestamp: new Date(),
    };

    await updateBooking(bookingId, { status: BookingStatus.Approved }, auditLogEntry);
    revalidatePath('/admin/bookings');
    revalidatePath('/admin/dashboard');
}

export async function declineBookingAction(bookingId: string, formData: FormData) {
    const admin = await getAuthenticatedAdmin();
    
    const { notes } = updateBookingStatusSchema.parse({
        notes: formData.get('notes'),
    });

    const auditLogEntry: AuditLogEntry = {
        action: 'Booking Declined',
        adminId: admin.id,
        adminName: admin.name,
        notes: `Reason: ${notes}`,
        timestamp: new Date(),
    };

    await updateBooking(bookingId, { status: BookingStatus.Declined, notes }, auditLogEntry);
    revalidatePath('/admin/bookings');
    revalidatePath('/admin/dashboard');
}

export async function updateBookingStatusAction(bookingId: string, newStatus: BookingStatus, formData: FormData) {
    const admin = await getAuthenticatedAdmin();

    const { notes } = updateBookingStatusSchema.parse({
        notes: formData.get('notes'),
    });
    
    const auditLogEntry: AuditLogEntry = {
        action: `Status changed to ${newStatus}`,
        adminId: admin.id,
        adminName: admin.name,
        notes,
        timestamp: new Date(),
    };
    await updateBooking(bookingId, { status: newStatus, notes }, auditLogEntry);
    revalidatePath('/admin/bookings');
    revalidatePath('/admin/dashboard');
}


// Server action for the booking agent
export async function bookingAgentAction(userId: string, prompt: string, docImage?: string, selfImage?: string) {
  try {
    if (!userId) {
      return { history: [], error: true, errorMessage: 'Not authenticated' };
    }
    const result = await bookingAgent(userId, prompt, docImage, selfImage);
    // Normalize result
    return {
      history: Array.isArray(result?.history) ? result.history : [],
      response: result?.response ?? '',
      bookingId: result?.bookingId ?? null,
      request: result?.request ?? null,
      error: false
    };
  } catch (err) {
    console.error('bookingAgentAction failed:', err);
    return { history: [], error: true, errorMessage: (err instanceof Error ? err.message : String(err)) };
  }
}

// Server action for Text-to-Speech
export async function textToSpeechAction(text: string) {
    try {
        const response = await textToSpeech(text);
        return { success: true, audio: response.audio };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An AI error occurred.';
        return { success: false, error: message };
    }
}

export async function localGuideAction(prompt: string) {
    try {
        const response = await localGuide(prompt);
        return { success: true, response };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An AI error occurred.';
        return { success: false, error: message };
    }
}

export async function predictVibeScoreAction(guestId: string) {
    try {
        if (!guestId) {
            throw new Error("Guest ID is required.");
        }

        const guest = await getGuestById(guestId);
        if (!guest) {
            throw new Error(`Guest not found with ID: ${guestId}`);
        }

        const guestBookings = guest.bookingHistory && guest.bookingHistory.length > 0 
            ? (await Promise.all(guest.bookingHistory.map(id => getBookingById(id)))).filter(Boolean) as any[]
            : [];
        
        const bookingIds = guestBookings.map(b => b.id);

        const recentRequests = bookingIds.length > 0 
            ? (await Promise.all(bookingIds.map(id => getRequestsByBookingId(id)))).flat()
            : [];
        
        const activitySummary = `
            Guest Name: ${guest.name}
            Total Bookings: ${guestBookings.length}
            Most Recent Booking Status: ${guestBookings[0]?.status || 'N/A'}
            Recent Service Requests (${recentRequests.length}): ${recentRequests.length > 0 ? recentRequests.map(r => `${r.type} - ${r.description} (Status: ${r.status})`).join('; ') : 'None'}
        `;

        if (!activitySummary.trim()) {
            return {
                success: true,
                response: {
                    vibeScore: 7,
                    escalationRisk: "Low",
                    reasoning: "No activity data available to analyze. Assuming neutral satisfaction.",
                    suggestedAction: "Engage with the guest to establish a baseline."
                }
            };
        }

        const response = await predictVibeScore({ activitySummary });
        return { success: true, response };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'An AI error occurred.';
        console.error("Vibe Score Prediction Error:", message);
        return { success: false, error: message };
    }
}

export async function detectAnomaliesAction() {
    try {
        const recentBookings = await getBookings();
        const recentServiceRequests = await getServiceRequests();

        const result = await detectAnomalies({
            recentBookings,
            recentServiceRequests,
        });

        return { success: true, anomalies: result.anomalies };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'An AI error occurred during anomaly detection.';
        console.error("Anomaly Detection Action Error:", message);
        return { success: false, error: message };
    }
}

    