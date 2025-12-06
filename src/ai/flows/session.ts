
import { z } from 'zod';

const MessageSchema = z.object({
    role: z.enum(['user', 'assistant', 'tool']),
    content: z.string(),
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

    