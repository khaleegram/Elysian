'use server';
/**
 * @fileoverview The primary conversational booking agent flow.
 */
import { z } from 'zod';
import { getSession, updateSession, type BookingSession } from './session';
import { getAvailability } from '../tools/get-availability';
import { createBooking } from '../tools/create-booking';
import { formatDate } from '@/lib/utils';
import { uploadDataUri } from '@/lib/cloudinary-server';
import { openai } from '@/ai/openai';

export const BookingStateSchema = z.object({
  hasAvailability: z
    .boolean()
    .optional()
    .describe(
      'Whether there is availability for the given dates and room type.'
    ),
  isReadyForBooking: z
    .boolean()
    .optional()
    .describe(
      'Whether all necessary information has been collected to create the booking.'
    ),
  missingInfo: z
    .array(z.string())
    .optional()
    .describe('A list of pieces of information that are still missing from the user.'),
});
export type BookingState = z.infer<typeof BookingStateSchema>;

export const BookingResponseSchema = z.object({
  response: z.string().describe('The textual response to the user.'),
  state: BookingStateSchema.optional().describe('The current state of the booking flow.'),
  bookingId: z.string().optional().describe('The ID of the booking that was created.'),
  requires: z
    .enum(['documentImage', 'selfieImage', 'nothing'])
    .optional()
    .describe('The next piece of information required from the user.'),
});
export type BookingResponse = z.infer<typeof BookingResponseSchema>;

export async function bookingAgent(
  session: BookingSession
): Promise<BookingResponse> {
  return bookingAgentFlow(session);
}

const systemPrompt = `You are a friendly and helpful hotel booking assistant for ElysianAI.
Your goal is to guide the user through the booking process smoothly and efficiently.
The user's message history and the current session state are provided.

Your process MUST follow these steps in order:
1.  **Greeting & Initial Info**: If this is the first message, greet the user warmly. Check if the session already has check-in dates and a room type. If not, ask for them.
2.  **Check Availability (CRITICAL STEP)**: Once you have a check-in date, check-out date, AND a room type from the user, you MUST immediately use the 'getAvailability' function tool. Do NOT ask for any other information before performing this check.
3.  **Handle Availability Response**:
    *   If the 'getAvailability' function tool returns \`isAvailable: false\`, you MUST inform the user that no rooms are available and ask them to choose different dates or a different room type. DO NOT proceed.
    *   If the 'getAvailability' function tool returns \`isAvailable: true\`, inform the user the room is available and then proceed to the next step.
4.  **Gather Guest Information**: After confirming availability, collect the following information if it's missing from the session:
    *   Guest's full name (if not already in \`userName\`).
    *   Guest's email (if not already in \`userEmail\`).
    *   Number of adults, children, and rooms.
    *   ID Document number.
5.  **Request Image Uploads**:
    *   After getting the document number, you must ask the user to upload an image of their ID by setting the 'requires' field in your response to 'documentImage'.
    *   After the document image is provided, you must ask for a selfie by setting the 'requires' field to 'selfieImage'.
6.  **Confirm and Book**: Once all information, including both images, is present in the session, set \`isReadyForBooking\` to true and ask the user for final confirmation to book.
7.  **Create Booking**: Upon user confirmation ("yes", "book it", "confirm", etc.), you MUST use the 'createBooking' function tool to finalize the booking.
8.  **Congratulate**: If the booking is successful, include the \`bookingId\` in your response and congratulate the user on their confirmed booking.

Today's date is ${formatDate(new Date())}.
Always be polite, clear, and efficient in your responses. You MUST return a JSON object that conforms to the BookingResponse schema.
`;

const tools = [
    {
        type: 'function',
        function: {
            name: 'getAvailability',
            description: 'Checks if a given room type is available for the specified dates.',
            parameters: {
                type: 'object',
                properties: {
                    checkIn: { type: 'string', description: 'The check-in date in YYYY-MM-DD format.'},
                    checkOut: { type: 'string', description: 'The check-out date in YYYY-MM-DD format.'},
                    roomType: { type: 'string', enum: ['Standard', 'Deluxe', 'Suite'], description: 'The type of room to check for.'},
                },
                required: ['checkIn', 'checkOut', 'roomType'],
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'createBooking',
            description: 'Creates a booking in the system once all information is collected and confirmed.',
            parameters: {
                type: 'object',
                properties: {
                    guestId: { type: 'string' },
                    guestName: { type: 'string' },
                    guestEmail: { type: 'string' },
                    checkIn: { type: 'string', description: "Check-in date in YYYY-MM-DD format." },
                    checkOut: { type: 'string', description: "Check-out date in YYYY-MM-DD format." },
                    roomType: { type: 'string', enum: ['Standard', 'Deluxe', 'Suite'] },
                    documentNumber: { type: 'string' },
                    adults: { type: 'string' },
                    children: { type: 'string' },
                    numberOfRooms: { type: 'string' },
                    documentImage: { type: 'string', format: 'uri' },
                    selfieImage: { type: 'string', format: 'uri' },
                },
                required: ['guestId', 'guestName', 'guestEmail', 'checkIn', 'checkOut', 'roomType', 'documentNumber', 'adults', 'children', 'numberOfRooms', 'documentImage', 'selfieImage'],
            }
        }
    }
];

async function bookingAgentFlow(session: BookingSession): Promise<BookingResponse> {
    // Handle image uploads before calling the AI
    if (session.documentImage && session.documentImage.startsWith('data:')) {
        const uploadResult = await uploadDataUri(session.documentImage, 'elysian_ai_ids');
        session.documentImage = uploadResult.secure_url;
        session.history.push({role: 'user', content: '[ID Document Image Uploaded]'});
    }
    if (session.selfieImage && session.selfieImage.startsWith('data:')) {
        const uploadResult = await uploadDataUri(session.selfieImage, 'elysian_ai_selfies');
        session.selfieImage = uploadResult.secure_url;
         session.history.push({role: 'user', content: '[Selfie Image Uploaded]'});
    }

    const messages: any[] = [
        { role: 'system', content: systemPrompt },
        ...session.history.map(h => ({ role: h.role, content: h.content })),
    ];

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
        tools: tools,
        tool_choice: 'auto',
        response_format: { type: 'json_object' }
    });

    const responseMessage = response.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    if (toolCalls) {
        messages.push(responseMessage); // Add assistant's reply to history
        for (const toolCall of toolCalls) {
            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments);
            let functionResponse;

            if (functionName === 'getAvailability') {
                functionResponse = await getAvailability(functionArgs);
            } else if (functionName === 'createBooking') {
                const bookingArgs = { ...functionArgs, guestId: session.userId };
                functionResponse = await createBooking(bookingArgs);
            }

            messages.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                name: functionName,
                content: JSON.stringify(functionResponse),
            });
        }
        
        const secondResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: messages,
            response_format: { type: 'json_object' }
        });
        
        const jsonOutput = secondResponse.choices[0].message.content;
        const parsedOutput = BookingResponseSchema.parse(JSON.parse(jsonOutput || '{}'));
        await updateSession(session.userId, { ...session, ...parsedOutput });
        return parsedOutput;

    } else {
        const jsonOutput = response.choices[0].message.content;
        if (!jsonOutput) {
            throw new Error("AI response was empty.");
        }
        const parsedOutput = BookingResponseSchema.parse(JSON.parse(jsonOutput));
        await updateSession(session.userId, { ...session, ...parsedOutput });
        return parsedOutput;
    }
}