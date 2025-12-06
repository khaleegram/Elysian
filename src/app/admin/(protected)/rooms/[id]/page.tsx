
import { getRoomById, getBookings } from "@/lib/data";
import { notFound } from "next/navigation";
import { RoomDetailClient } from "@/components/admin/room-detail-client";

export default async function RoomDetailsPage({ params }: { params: { id: string } }) {
    
    const [room, allBookings] = await Promise.all([
        getRoomById(params.id),
        getBookings()
    ]);

    if (!room) {
        notFound();
    }
    
    const roomBookings = allBookings.filter(booking => booking.roomId === room.id);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <RoomDetailClient room={room} bookings={roomBookings} />
        </div>
    );
}
