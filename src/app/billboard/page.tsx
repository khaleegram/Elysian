'use client';

import { BillboardClient } from "@/components/billboard/billboard-client";
import { useAssignments } from "@/hooks/use-assignments";
import { useBookings } from "@/hooks/use-bookings";
import { useServiceRequests } from "@/hooks/use-service-requests";
import { useStaff } from "@/hooks/use-staff";
import { Loader2 } from "lucide-react";

export default function BillboardPage() {
    const { assignments, loading: assignmentsLoading } = useAssignments();
    const { requests, loading: requestsLoading } = useServiceRequests();
    const { bookings, loading: bookingsLoading } = useBookings();
    const { staff, loading: staffLoading } = useStaff();

    const loading = assignmentsLoading || requestsLoading || bookingsLoading || staffLoading;

    if (loading) {
        return (
            <div className="bg-gray-900 min-h-screen flex items-center justify-center">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
            </div>
        )
    }

    return (
        <BillboardClient 
            initialAssignments={assignments}
            initialServiceRequests={requests}
            initialBookings={bookings}
            initialStaff={staff}
        />
    );
}

// Disable caching to ensure the page is always dynamic
export const dynamic = 'force-dynamic';
