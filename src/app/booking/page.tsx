
// app/booking/page.tsx
import { Suspense } from 'react';
import { BookingFlowPage } from '@/components/booking/BookingFlowPage';
import { notFound } from 'next/navigation';
import { Room } from '@/lib/types';
import { getRooms } from '@/lib/data';


// In a real app, this would query your database.
const getRoomData = async (roomId: string): Promise<Room | undefined> => {
    const rooms = await getRooms();
    return rooms.find(r => r.id === roomId);
};

export default async function BookingRoute({
    searchParams,
}: {
    searchParams: {
        roomId?: string;
        checkIn?: string;
        checkOut?: string;
    };
}) {
    const { roomId, checkIn, checkOut } = searchParams;

    if (!roomId || !checkIn || !checkOut) {
        // Handle cases where required booking info is missing
        return (
            <div className="container py-12">
                <h1 className="text-3xl font-bold text-red-600">Booking Error</h1>
                <p className="mt-4">
                    Missing room, check-in, or check-out details. Please start your booking from the room page.
                </p>
            </div>
        );
    }

    const room = await getRoomData(roomId); 

    if (!room) {
        notFound();
    }

    return (
        <Suspense fallback={<div>Loading Booking Flow...</div>}>
            <BookingFlowPage 
                room={room} 
                checkIn={checkIn} 
                checkOut={checkOut} 
            />
        </Suspense>
    );
}
