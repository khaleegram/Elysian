
import { getBookings } from "@/lib/data";
import { DufClient } from "@/components/admin/duf-client";
import { GradientTitle } from "@/components/ui/gradient-title";
import { BrainCircuit } from "lucide-react";
import { BookingStatus } from "@/lib/types";

export const dynamic = 'force-dynamic';

export default async function DufPage() {
    const allBookings = await getBookings();
    
    // Filter for guests who are currently checked in and have a room assigned.
    const checkedInBookings = allBookings.filter(b => b.status === BookingStatus.CheckedIn && b.roomId);

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
            <header className="mb-8">
                <GradientTitle>Dynamic Utility Footprint (DUF) Monitor</GradientTitle>
                <p className="mt-2 text-lg text-muted-foreground flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5" />
                    Demonstrate predictive energy savings for any checked-in guest in real-time.
                </p>
            </header>
            <DufClient checkedInBookings={checkedInBookings} />
        </div>
    );
}

    