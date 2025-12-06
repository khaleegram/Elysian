
import { getBookings, getRooms, getServiceRequests } from "@/lib/data";
import { AnalyticsClient } from "@/components/admin/analytics-client";
import { GradientTitle } from "@/components/ui/gradient-title";
import { BarChart3 } from "lucide-react";

export default async function AnalyticsPage() {
    const [bookings, rooms, serviceRequests] = await Promise.all([
        getBookings(),
        getRooms(),
        getServiceRequests()
    ]);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <header className="mb-8">
                <GradientTitle>Analytics & Reporting</GradientTitle>
                <p className="mt-2 text-lg text-muted-foreground flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Operational trends, AI insights, and custom reports.
                </p>
            </header>
            <AnalyticsClient bookings={bookings} rooms={rooms} serviceRequests={serviceRequests} />
        </div>
    );
}
