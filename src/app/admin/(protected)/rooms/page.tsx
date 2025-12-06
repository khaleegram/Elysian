'use client';

import { RoomManagementClient } from "@/components/admin/room-management-client";
import { GradientTitle } from "@/components/ui/gradient-title";
import { useRooms } from "@/hooks/use-rooms";
import { BedDouble, Loader2 } from "lucide-react";

export default function RoomsPage() {
    const { rooms, loading } = useRooms();
    
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <header className="mb-8">
                <GradientTitle>Room Management</GradientTitle>
                <p className="mt-2 text-lg text-muted-foreground flex items-center gap-2">
                    <BedDouble className="h-5 w-5" />
                    Manage your room inventory, types, and maintenance.
                </p>
            </header>
            {loading ? (
                 <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <RoomManagementClient initialRooms={rooms || []} />
            )}
        </div>
    );
}
