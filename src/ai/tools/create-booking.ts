'use server';
import { z } from 'zod';
import { adminDb } from '@/firebase/admin';
import { RoomType, BookingStatus, PaymentMethod, DocumentType } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';
import { getAvailableRoomsForType } from '@/lib/data';

const CreateBookingInputSchema = z.object({
    guestId: z.string(),
    guestName: z.string(),
    guestEmail: z.string(),
    checkIn: z.string().describe("Check-in date in YYYY-MM-DD format."),
    checkOut: z.string().describe("Check-out date in YYYY-MM-DD format."),
    roomType: z.nativeEnum(RoomType),
    documentNumber: z.string(),
    documentImage: z.string().url(),
    selfieImage: z.string().url(),
    adults: z.string(),
    children: z.string(),
    numberOfRooms: z.string(),
});

export async function createBooking(input: z.infer<typeof CreateBookingInputSchema>) {
    console.log('Creating booking with input:', input);
    const { 
        guestId, guestName, guestEmail, checkIn, checkOut, 
        roomType, documentNumber, documentImage, selfieImage,
        adults, children, numberOfRooms
    } = input;

    try {
        const availableRooms = await getAvailableRoomsForType(roomType, new Date(checkIn), new Date(checkOut));
        if (availableRooms.length === 0) {
            return { success: false, message: `Sorry, there are no ${roomType} rooms available for those dates.`, bookingId: '' };
        }

        const bookingData = {
            guestId,
            guestName,
            guestEmail,
            guestPhone: '', // Not collected in chat
            country: '', // Not collected in chat
            documentType: DocumentType.Passport, // Default
            documentNumber,
            documentImageUrl: documentImage,
            selfieImageUrl: selfieImage,
            checkIn: new Date(checkIn),
            checkOut: new Date(checkOut),
            roomType,
            roomId: null,
            status: BookingStatus.ReviewNeeded, // All AI bookings need review
            paymentMethod: PaymentMethod.PayLater, // Default for AI
            adults: parseInt(adults, 10),
            children: parseInt(children, 10),
            numberOfRooms: parseInt(numberOfRooms, 10),
            createdAt: FieldValue.serverTimestamp(),
        };

        const newBookingRef = await adminDb.collection('bookings').add(bookingData);
        
        // Update guest history
        const guestRef = adminDb.collection('guests').doc(guestId);
        await guestRef.set({
            bookingHistory: FieldValue.arrayUnion(newBookingRef.id)
        }, { merge: true });


        return { success: true, bookingId: newBookingRef.id, message: 'Booking created successfully.' };
    } catch (error) {
        console.error('Error in createBookingTool:', error);
        const message = error instanceof Error ? error.message : 'An unknown server error occurred.';
        return { success: false, message, bookingId: '' };
    }
};