'use client';

import { BookingManagementClient } from "@/components/admin/booking-management-client";
import { GradientTitle } from "@/components/ui/gradient-title";
import { BookCopy } from "lucide-react";
import { useBookings } from "@/hooks/use-bookings";


export default function BookingsPage() {
    const { bookings, loading } = useBookings();
    
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <header className="mb-8">
                <GradientTitle>Booking Management</GradientTitle>
                <p className="mt-2 text-lg text-muted-foreground flex items-center gap-2">
                    <BookCopy className="h-5 w-5" />
                    View, approve, and manage all guest bookings.
                </p>
            </header>
            <BookingManagementClient initialBookings={bookings || []} loading={loading} />
        </div>
    );
}
