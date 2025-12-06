'use server';
import { ai } from '@/ai/genkit';
import { getAvailableRoomsForType } from '@/lib/data';
import { RoomType } from '@/lib/types';
import { z } from 'zod';

const AvailabilityInputSchema = z.object({
    checkIn: z.string().describe("The check-in date in YYYY-MM-DD format."),
    checkOut: z.string().describe("The check-out date in YYYY-MM-DD format."),
    roomType: z.nativeEnum(RoomType).describe("The type of room to check for."),
});

export const getAvailabilityTool = ai.defineTool(
    {
        name: 'getAvailabilityTool',
        description: 'Checks if a given room type is available for the specified dates.',
        inputSchema: AvailabilityInputSchema,
        outputSchema: z.object({
            isAvailable: z.boolean(),
            message: z.string(),
        }),
    },
    async (input) => {
        try {
            const availableRooms = await getAvailableRoomsForType(
                input.roomType,
                new Date(input.checkIn),
                new Date(input.checkOut)
            );

            if (availableRooms.length > 0) {
                return {
                    isAvailable: true,
                    message: `Yes, ${availableRooms.length} ${input.roomType} room(s) are available.`,
                };
            } else {
                return {
                    isAvailable: false,
                    message: `No, there are no ${input.roomType} rooms available for those dates.`,
                };
            }
        } catch (error) {
            console.error('Error in getAvailabilityTool:', error);
            return {
                isAvailable: false,
                message: 'I encountered an error while checking for room availability. Please try again.',
            };
        }
    }
);
