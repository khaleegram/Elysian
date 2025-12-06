'use client';

import { GuestManagementClient } from "@/components/admin/guest-management-client";
import { useGuests } from "@/hooks/use-guests";
import { GradientTitle } from "@/components/ui/gradient-title";
import { Loader2, Users } from "lucide-react";

export default function GuestsPage() {
    const { guests, loading } = useGuests();

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <header className="mb-8">
                <GradientTitle>Guest Management</GradientTitle>
                <p className="mt-2 text-lg text-muted-foreground flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    View guest profiles, stay history, and preferences.
                </p>
            </header>
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <GuestManagementClient initialGuests={guests} />
            )}
        </div>
    );
}
