'use server';
/**
 * @fileoverview The primary conversational booking agent flow.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getSession, updateSession, type BookingSession } from './session';
import { getAvailabilityTool } from '../tools/get-availability';
import { createBookingTool } from '../tools/create-booking';
import { formatDate } from '@/lib/utils';

export const BookingStateSchema = z.object({
    hasAvailability: z.boolean().optional().describe('Whether there is availability for the given dates and room type.'),
    isReadyForBooking: z.boolean().optional().describe('Whether all necessary information has been collected to create the booking.'),
    missingInfo: z.array(z.string()).optional().describe('A list of pieces of information that are still missing from the user.'),
});
export type BookingState = z.infer<typeof BookingStateSchema>;

export const BookingResponseSchema = z.object({
    response: z.string().describe('The textual response to the user.'),
    state: BookingStateSchema.optional().describe('The current state of the booking flow.'),
    bookingId: z.string().optional().describe('The ID of the booking that was created.'),
    requires: z.enum(['documentImage', 'selfieImage', 'nothing']).optional().describe('The next piece of information required from the user.'),
});
export type BookingResponse = z.infer<typeof BookingResponseSchema>;

export async function bookingAgent(
    session: BookingSession
): Promise<BookingResponse> {
    return bookingAgentFlow(session);
}

const bookingAgentPrompt = ai.definePrompt({
    name: 'bookingAgentPrompt',
    input: {schema: z.any()},
    output: {schema: BookingResponseSchema},
    tools: [getAvailabilityTool, createBookingTool],
    system: `You are a friendly and helpful hotel booking assistant.
Your goal is to guide the user through the booking process.
The user's message history is provided, along with the current state of the booking.
The state is rebuilt on every turn, so you must re-evaluate it every time.

Your process is as follows:
1.  Greet the user and ask for their desired dates and room type if not already provided.
2.  Once you have dates and a room type, you MUST use the 'getAvailabilityTool' to check for room availability. This is a mandatory step.
3.  Based on the tool's response, update the 'hasAvailability' state. If there is no availability, inform the user and ask them to try different dates or room types.
4.  If there is availability, proceed to gather the remaining information required for booking: guest name, email, phone, document number, ID image, and selfie image. The user's name and email may already be in the session. For the images, you must prompt the user to upload them by setting the 'requires' field in your response to 'documentImage' or 'selfieImage'.
5.  Once all information is gathered, set 'isReadyForBooking' to true and ask the user for final confirmation.
6.  Upon user confirmation, use the 'createBookingTool' to finalize the booking.
7.  If the booking is successful, include the bookingId in your response and congratulate the user.

Always be polite and clear in your responses.
Analyze the user's latest message in the context of the session history and current state.
Today's date is ${formatDate(new Date())}.
`,
});

const bookingAgentFlow = ai.defineFlow(
    {
        name: 'bookingAgentFlow',
        inputSchema: z.any(),
        outputSchema: BookingResponseSchema,
    },
    async (session) => {
        const {output} = await bookingAgentPrompt(session);
        if (!output) {
            return {
                response: 'The booking agent failed to generate a response.',
                state: {
                    isReadyForBooking: false,
                    hasAvailability: false,
                }
            };
        }
        await updateSession(session.userId, output);
        return output;
    }
);
