
import { getBookings, getServiceRequests } from "@/lib/data";
import { NotificationClient } from "@/components/admin/notification-client";
import { GradientTitle } from "@/components/ui/gradient-title";
import { AnomalyDetector } from "@/components/admin/anomaly-detector";
import { Bell } from "lucide-react";
import { Timestamp } from "firebase-admin/firestore";


export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
    const [bookingsData, serviceRequestsData] = await Promise.all([
        getBookings(),
        getServiceRequests()
    ]);

    // Serialize date objects before passing to client component
    const bookings = bookingsData.map(b => ({
      ...b,
      checkIn: b.checkIn instanceof Timestamp ? b.checkIn.toDate().toISOString() : b.checkIn,
      checkOut: b.checkOut instanceof Timestamp ? b.checkOut.toDate().toISOString() : b.checkOut,
      createdAt: b.createdAt instanceof Timestamp ? b.createdAt.toDate().toISOString() : b.createdAt,
    }));

    const serviceRequests = serviceRequestsData.map(r => ({
        ...r,
        createdAt: r.createdAt instanceof Timestamp ? r.createdAt.toDate().toISOString() : r.createdAt,
    }));

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
            <header className="mb-8">
                <GradientTitle>Alerts & Notifications</GradientTitle>
                <p className="mt-2 text-lg text-muted-foreground flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    An aggregated real-time feed of important system events and AI-driven operational insights.
                </p>
            </header>

            <AnomalyDetector />

            <NotificationClient initialBookings={bookings} initialRequests={serviceRequests} />
        </div>
    );
}
