'use server';

import { adminDb } from '@/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { BookingResponseSchema } from './booking-agent';

export const MessageSchema = z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;

export const BookingSessionSchema = z.object({
    userId: z.string(),
    userName: z.string().optional(),
    userEmail: z.string().optional(),
    history: z.array(MessageSchema).optional(),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    roomType: z.string().optional(),
    documentNumber: z.string().optional(),
    documentImage: z.string().optional(),
    selfieImage: z.string().optional(),
    updatedAt: z.any().optional(),
});
export type BookingSession = z.infer<typeof BookingSessionSchema>;

export async function getSession(userId: string, userName?: string, userEmail?: string, userMessage?: string): Promise<BookingSession> {
    const sessionRef = adminDb.collection('bookingSessions').doc(userId);
    const sessionDoc = await sessionRef.get();
    
    let session: BookingSession;
    if (sessionDoc.exists) {
        session = BookingSessionSchema.parse(sessionDoc.data());
    } else {
        session = { userId, history: [] };
    }

    if (userName) session.userName = userName;
    if (userEmail) session.userEmail = userEmail;
    if (userMessage) {
        if (!session.history) session.history = [];
        session.history.push({ role: 'user', content: userMessage });
    }

    return session;
}

export async function updateSession(userId: string, data: any): Promise<void> {
    const sessionRef = adminDb.collection('bookingSessions').doc(userId);
    
    const updateData: Partial<BookingSession> = {};

    if (data.response) {
        updateData.history = FieldValue.arrayUnion({ role: 'assistant', content: data.response }) as any;
    }
    if (data.checkIn) updateData.checkIn = data.checkIn;
    if (data.checkOut) updateData.checkOut = data.checkOut;
    if (data.roomType) updateData.roomType = data.roomType;
    if (data.documentNumber) updateData.documentNumber = data.documentNumber;
    if (data.documentImage) updateData.documentImage = data.documentImage;
    if (data.selfieImage) updateData.selfieImage = data.selfieImage;

    updateData.updatedAt = FieldValue.serverTimestamp();

    await sessionRef.set(updateData, { merge: true });
}

export async function clearSession(userId: string): Promise<void> {
    const sessionRef = adminDb.collection('bookingSessions').doc(userId);
    await sessionRef.delete();
}