
import { getBookings, getServiceRequests } from "@/lib/data";
import { ServiceRequestClient } from "@/components/admin/service-request-client";
import { GradientTitle } from "@/components/ui/gradient-title";
import { ClipboardList } from "lucide-react";
import { Timestamp } from "firebase-admin/firestore";

export const dynamic = 'force-dynamic';

export default async function ServiceRequestsPage() {
    const [requestsData, bookingsData] = await Promise.all([
        getServiceRequests(),
        getBookings(),
    ]);

    // Serialize date objects before passing to client component
    const requests = requestsData.map(r => ({
        ...r,
        createdAt: r.createdAt ? (r.createdAt instanceof Timestamp ? r.createdAt.toDate().toISOString() : new Date(r.createdAt).toISOString()) : null,
    }));

    const bookings = bookingsData.map(b => ({
        ...b,
        checkIn: b.checkIn ? (b.checkIn instanceof Timestamp ? b.checkIn.toDate().toISOString() : new Date(b.checkIn).toISOString()) : null,
        checkOut: b.checkOut ? (b.checkOut instanceof Timestamp ? b.checkOut.toDate().toISOString() : new Date(b.checkOut).toISOString()) : null,
        createdAt: b.createdAt ? (b.createdAt instanceof Timestamp ? b.createdAt.toDate().toISOString() : new Date(b.createdAt).toISOString()) : null,
    }));


    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <header className="mb-8">
                <GradientTitle>Service Requests</GradientTitle>
                <p className="mt-2 text-lg text-muted-foreground flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Manage and assign all incoming guest service requests.
                </p>
            </header>
            <ServiceRequestClient initialRequests={requests} initialBookings={bookings} />
        </div>
    );
}
