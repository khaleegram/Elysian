'use server';

import { adminDb } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

const MessageSchema = z.object({
    role: z.enum(['user', 'assistant', 'tool']),
    content: z.string(),
    name: z.string().optional(), // for tool role
});
export type Message = z.infer<typeof MessageSchema>;

const BookingSessionSchema = z.object({
    userId: z.string(),
    userName: z.string().optional(),
    userEmail: z.string().optional(),
    history: z.array(MessageSchema),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    roomType: z.string().optional(),
    adults: z.string().optional(),
    children: z.string().optional(),
    numberOfRooms: z.string().optional(),
    documentNumber: z.string().optional(),
    documentImage: z.string().optional(),
    selfieImage: z.string().optional(),
    bookingConfirmed: z.boolean().optional(),
    updatedAt: z.any().optional(),
});
export type BookingSession = z.infer<typeof BookingSessionSchema>;

export async function getSession(userId: string): Promise<BookingSession> {
    const sessionRef = adminDb.collection('bookingSessions').doc(userId);
    const sessionDoc = await sessionRef.get();
    
    if (sessionDoc.exists) {
        // Safe parsing, falling back to a default structure if it doesn't match
        const parsed = BookingSessionSchema.safeParse(sessionDoc.data());
        if (parsed.success) {
            return parsed.data;
        }
    }
    
    // Return a default, empty session if one doesn't exist or is malformed
    return { userId, history: [] };
}

export async function updateSession(userId: string, data: Partial<BookingSession>): Promise<void> {
    const sessionRef = adminDb.collection('bookingSessions').doc(userId);
    
    const updateData = {
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
    };
    
    await sessionRef.set(updateData, { merge: true });
}

export async function clearSession(userId: string): Promise<void> {
    const sessionRef = adminDb.collection('bookingSessions').doc(userId);
    await sessionRef.delete();
}

    