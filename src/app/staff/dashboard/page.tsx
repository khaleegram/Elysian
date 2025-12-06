'use client';

import { StaffDashboardClient } from "@/components/staff/staff-dashboard-client";
import { useAssignments } from "@/hooks/use-assignments";
import { useBookings } from "@/hooks/use-bookings";
import { useServiceRequests } from "@/hooks/use-service-requests";

export default function StaffDashboardPage() {
    const { assignments, loading: assignmentsLoading } = useAssignments();
    const { requests, loading: requestsLoading } = useServiceRequests();
    const { bookings, loading: bookingsLoading } = useBookings();

    return (
        <StaffDashboardClient 
            initialAssignments={assignments}
            initialServiceRequests={requests}
            initialBookings={bookings}
            loading={assignmentsLoading || requestsLoading || bookingsLoading}
        />
    );
}
