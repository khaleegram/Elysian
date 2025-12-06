
import { getBookings, getServiceRequests } from "@/lib/data";
import { ServiceRequestClient } from "@/components/admin/service-request-client";
import { GradientTitle } from "@/components/ui/gradient-title";
import { ClipboardList } from "lucide-react";

export default async function ServiceRequestsPage() {
    const [requests, bookings] = await Promise.all([
        getServiceRequests(),
        getBookings(),
    ]);

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
