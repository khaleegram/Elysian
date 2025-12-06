
import { getBookings, getServiceRequests } from "@/lib/data";
import { NotificationClient } from "@/components/admin/notification-client";
import { GradientTitle } from "@/components/ui/gradient-title";
import { AnomalyDetector } from "@/components/admin/anomaly-detector";
import { Bell } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
    const [bookings, serviceRequests] = await Promise.all([
        getBookings(),
        getServiceRequests()
    ]);

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
