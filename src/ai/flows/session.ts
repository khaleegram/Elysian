
'use server';

import { adminDb } from '@/firebase/admin';
import { RoomType } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';

// Define the structure of the session object in Firestore
export interface BookingSession {
    userId: string;
    history: { role: 'user' | 'assistant'; content: string }[];
    checkIn?: string;
    checkOut?: string;
    roomType?: RoomType;
    adults?: string;
    children?: string;
    numberOfRooms?: string;
    documentNumber?: string;
    documentImage?: string; // This will be a URL
    selfieImage?: string; // This will be a URL
    bookingConfirmed?: boolean;
    updatedAt?: Timestamp;
}

/**
 * Retrieves the current user's booking session state from Firestore.
 * @param userId - The unique ID of the user.
 * @returns The user's session data.
 */
export async function getSession(userId: string): Promise<BookingSession> {
    if (!userId) {
        throw new Error("User ID is required to get a session.");
    }
    const sessionRef = adminDb.collection('bookingSessions').doc(userId);
    const sessionDoc = await sessionRef.get();
    
    if (sessionDoc.exists) {
        const data = sessionDoc.data() as BookingSession;
        // Ensure history is always an array
        return { ...data, history: data.history || [] };
    }
    
    // Return a new session with an empty history array if it doesn't exist
    return { userId, history: [] };
}

/**
 * Updates the user's booking session with new information.
 * It filters out any undefined values before writing to Firestore.
 * @param userId - The unique ID of the user.
 * @param data - The partial session data to update.
 * @returns A success status object.
 */
export async function updateSession(userId: string, data: Partial<BookingSession>): Promise<{ status: string }> {
     if (!userId) {
        throw new Error("User ID is required to update a session.");
    }
    const sessionRef = adminDb.collection('bookingSessions').doc(userId);

    // Create a clean object to save, removing any keys with 'undefined' values
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined) {
            acc[key as keyof BookingSession] = value;
        }
        return acc;
    }, {} as Partial<BookingSession>);

    // Use set with merge: true to create or update the document
    await sessionRef.set({ ...cleanData, updatedAt: Timestamp.now() }, { merge: true });
    return { status: "success" };
}
