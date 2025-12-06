'use server';
import { getAvailableRoomsForType } from '@/lib/data';
import { RoomType } from '@/lib/types';
import { z } from 'zod';

const AvailabilityInputSchema = z.object({
    checkIn: z.string().describe("The check-in date in YYYY-MM-DD format."),
    checkOut: z.string().describe("The check-out date in YYYY-MM-DD format."),
    roomType: z.nativeEnum(RoomType).describe("The type of room to check for."),
});

export const getAvailability = async (input: z.infer<typeof AvailabilityInputSchema>) => {
    try {
        const availableRooms = await getAvailableRoomsForType(
            input.roomType,
            new Date(input.checkIn),
            new Date(input.checkOut)
        );

        if (availableRooms.length > 0) {
            return {
                isAvailable: true,
                message: `Yes, we have ${input.roomType} rooms available for those dates.`,
            };
        } else {
            return {
                isAvailable: false,
                message: `Unfortunately, there are no ${input.roomType} rooms available for the selected dates. Would you like to try different dates or another room type?`,
            };
        }
    } catch (error) {
        console.error('Error in getAvailabilityTool:', error);
        return {
            isAvailable: false,
            message: 'I encountered an error while checking for room availability. Please try again.',
        };
    }
};