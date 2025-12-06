
'use server';

import { getSession, updateSession, BookingSession } from './session';
import { getAvailableRoomsForType } from '@/lib/data';
import { RoomType, Guest, Room } from '@/lib/types';
import { adminDb } from '@/firebase/admin';
import { doc, getDoc } from 'firebase/firestore';
import { createBookingAction } from '@/app/actions';
import cloudinary from '@/lib/cloudinary';

// --- Image Upload Helpers (moved from actions.ts) ---
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


type UIRequest = 'dates' | 'roomType' | 'numberOfGuests' | 'documentNumber' | 'documentImage' | 'selfieImage' | 'confirmBooking';

export async function bookingAgent(
  userId: string,
  userMessage?: string,
  documentImage?: string, // base64 data URI
  selfieImage?: string // base64 data URI
): Promise<{ response: string; history: any[]; bookingId?: string; request?: UIRequest }> {
  if (!userId) throw new Error('User not authenticated');

  // Load session and guest info
  let session = await getSession(userId);
  const guestDoc = await adminDb.collection('guests').doc(userId).get();
  const guest: Guest = guestDoc.exists ? (guestDoc.data() as Guest) : { id: userId, name: 'Valued Guest', email: '' };

  // --- Start of Deterministic Logic ---

  // Handle incoming user text message
  if (userMessage) {
    session.history.push({role: 'user', content: userMessage});
    
    if (session.bookingConfirmed) {
        session = { userId, history: session.history }; // Reset session if starting new conversation after confirmation
    } else if (!session.checkIn || !session.checkOut) {
        // Super simple date parsing for demo. A real app would use the GPT date tool.
        session.checkIn = new Date().toISOString().split('T')[0];
        const checkoutDate = new Date();
        checkoutDate.setDate(checkoutDate.getDate() + 2);
        session.checkOut = checkoutDate.toISOString().split('T')[0];
    } else if (!session.roomType) {
        const roomTypeMatch = userMessage.match(/Standard|Deluxe|Suite/i);
        session.roomType = roomTypeMatch ? roomTypeMatch[0] as RoomType : undefined;
    } else if (!session.adults) {
        session.adults = "2";
        session.children = "0";
        session.numberOfRooms = "1";
    } else if (!session.documentNumber) {
        session.documentNumber = userMessage;
    } else if (userMessage.toLowerCase() === 'yes' || userMessage.toLowerCase() === 'confirm') {
        session.bookingConfirmed = true;
    }
  }
  
  // Handle incoming images by uploading them to Cloudinary
  if (documentImage) {
      const uploadResult = await uploadDataUri(documentImage, "elysian_ai_ids");
      session.documentImage = uploadResult.secure_url; // Store URL
  }
  if (selfieImage) {
      const uploadResult = await uploadDataUri(selfieImage, "elysian_ai_selfies");
      session.selfieImage = uploadResult.secure_url; // Store URL
  }
  
  // --- Step 1: Check for missing info and request it deterministically ---
  if (session.history.length === 0 || (session.history.length === 1 && session.history[0].role === 'user')) {
      const welcomeMessage = "Welcome to ElysianAI! To get started, please provide your desired check-in and check-out dates.";
      session.history.push({role: 'assistant', content: welcomeMessage});
      await updateSession(userId, { history: session.history });
      return { response: welcomeMessage, history: session.history, request: 'dates' };
  }

  if (!session.checkIn || !session.checkOut) {
    const responseText = "Please provide your check-in and check-out dates (e.g., 'Dec 10 to Dec 12').";
    if (session.history[session.history.length-1].content !== responseText) {
        session.history.push({role: 'assistant', content: responseText });
    }
    await updateSession(userId, session);
    return { response: responseText, history: session.history, request: 'dates' };
  }

  if (!session.roomType) {
    const responseText = `Great. Which room type would you like? Your options are: ${Object.values(RoomType).join(', ')}.`;
     if (session.history[session.history.length-1].content !== responseText) {
        session.history.push({role: 'assistant', content: responseText });
    }
    await updateSession(userId, session);
    return { response: responseText, history: session.history, request: 'roomType' };
  }

  if (!session.adults || !session.children || !session.numberOfRooms) {
    const responseText = "Got it. How many adults, children, and rooms will you need?";
    if (session.history[session.history.length-1].content !== responseText) {
        session.history.push({role: 'assistant', content: responseText });
    }
    await updateSession(userId, session);
    return { response: responseText, history: session.history, request: 'numberOfGuests' };
  }

  if (!session.documentNumber) {
    const responseText = "For verification, please enter your ID document number (e.g., passport number).";
    if (session.history[session.history.length-1].content !== responseText) {
        session.history.push({role: 'assistant', content: responseText });
    }
    await updateSession(userId, session);
    return { response: responseText, history: session.history, request: 'documentNumber' };
  }

  if (!session.documentImage) {
    const responseText = "Thank you. Now, please upload a clear image of that ID document.";
    if (session.history[session.history.length-1].content !== responseText) {
        session.history.push({role: 'assistant', content: responseText });
    }
    await updateSession(userId, session);
    return { response: responseText, history: session.history, request: 'documentImage' };
  }

  if (!session.selfieImage) {
    const responseText = "Almost done. Please take a live selfie for verification.";
    if (session.history[session.history.length-1].content !== responseText) {
        session.history.push({role: 'assistant', content: responseText });
    }
    await updateSession(userId, session);
    return { response: responseText, history: session.history, request: 'selfieImage' };
  }

  // --- Step 2: Check room availability ---
  const availableRooms: Room[] = await getAvailableRoomsForType(session.roomType, new Date(session.checkIn), new Date(session.checkOut));
  if (availableRooms.length === 0) {
    const responseText = "Sorry, no rooms of that type are available for your selected dates. Please choose different dates.";
    session.history.push({role: 'assistant', content: responseText});
    await updateSession(userId, { history: session.history, checkIn: undefined, checkOut: undefined });
    return { response: responseText, history: session.history, request: 'dates' };
  }

  // --- Step 3: Confirm booking with the user ---
  if (!session.bookingConfirmed) {
    const summary = `I've found an available ${session.roomType} room for your selected dates.
- **Guest**: ${guest.name}
- **Dates**: ${session.checkIn} to ${session.checkOut}
- **Room Type**: ${session.roomType}
- **Occupancy**: ${session.adults} adults, ${session.children} children in ${session.numberOfRooms} room(s).
`;
    const responseText = summary + "\nPlease type 'yes' or 'confirm' to finalize this booking.";
    session.history.push({role: 'assistant', content: responseText });
    await updateSession(userId, session);
    return { response: responseText, history: session.history, request: 'confirmBooking' };
  }

  // --- Step 4: Create booking ---
  const formData = new FormData();
  formData.append('guestId', userId);
  formData.append('guestName', guest.name);
  formData.append('guestEmail', guest.email || '');
  formData.append('guestPhone', (guest as any).phone || '0000000000');
  formData.append('country', 'US');
  formData.append('documentType', 'Passport');
  formData.append('documentNumber', session.documentNumber!);
  formData.append('documentImage', session.documentImage!); // Now a URL
  formData.append('selfieImage', session.selfieImage!);     // Now a URL
  formData.append('checkIn', session.checkIn!);
  formData.append('checkOut', session.checkOut!);
  formData.append('roomType', session.roomType!);
  formData.append('adults', session.adults!);
  formData.append('children', session.children!);
  formData.append('numberOfRooms', session.numberOfRooms!);

  const result = await createBookingAction(formData);

  const bookingId = result.success ? result.bookingId : undefined;
  const finalResponse = result.success ? `Booking confirmed! Your booking ID is ${bookingId}. You will be redirected shortly.` : `Booking failed: ${result.message}`;

  session.history.push({ role: 'assistant', content: finalResponse });
  await updateSession(userId, session);

  return { response: finalResponse, history: session.history, bookingId };
}
