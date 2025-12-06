
import { getGuestById, getBookings } from "@/lib/data";
import { notFound } from "next/navigation";
import { GuestProfileClient } from "@/components/admin/guest-profile-client";

export default async function GuestProfilePage({ params }: { params: { id: string } }) {
    
    const [guest, allBookings] = await Promise.all([
        getGuestById(params.id),
        getBookings()
    ]);

    if (!guest) {
        notFound();
    }

    const guestBookings = allBookings.filter(booking => guest.bookingHistory?.includes(booking.id));

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <GuestProfileClient guest={guest} bookings={guestBookings} />
        </div>
    );
}
