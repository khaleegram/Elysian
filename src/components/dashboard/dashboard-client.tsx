
'use client';

import { Room, Booking, ServiceRequest } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RoomStatusGrid } from './room-status-grid';
import { GuestList } from './guest-list';
import { RequestManager } from './request-manager';
import { LayoutGrid, Users, ClipboardList, HeartPulse } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { VibeScoreMonitor } from './vibe-score-monitor';

// The props are now strings, not Timestamps
type DashboardClientProps = {
  initialRooms: Room[];
  initialBookings: (Omit<Booking, 'checkIn' | 'checkOut' | 'createdAt'> & { checkIn: string; checkOut: string; createdAt: string | null; })[];
  initialServiceRequests: (Omit<ServiceRequest, 'createdAt'> & { createdAt: string; })[];
}

export function DashboardClient({
  initialRooms,
  initialBookings,
  initialServiceRequests,
}: DashboardClientProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const bookingsWithDates = initialBookings.map(b => ({...b, checkIn: new Date(b.checkIn), checkOut: new Date(b.checkOut)}));
  const requestsWithDates = initialServiceRequests.map(r => ({...r, createdAt: new Date(r.createdAt)}));


  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentGuests = bookingsWithDates.filter(b => b.status === 'Checked-In');

  return (
    <Tabs defaultValue="rooms" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="rooms"><LayoutGrid className="mr-2 h-4 w-4" />Room Status</TabsTrigger>
        <TabsTrigger value="vibe"><HeartPulse className="mr-2 h-4 w-4" />Vibe Scores</TabsTrigger>
        <TabsTrigger value="guests"><Users className="mr-2 h-4 w-4" />Guests</TabsTrigger>
        <TabsTrigger value="requests"><ClipboardList className="mr-2 h-4 w-4" />Service Requests</TabsTrigger>
      </TabsList>
      <TabsContent value="rooms" className="mt-4">
        <RoomStatusGrid rooms={initialRooms} />
      </TabsContent>
       <TabsContent value="vibe" className="mt-4">
        <VibeScoreMonitor guests={currentGuests as any} />
      </TabsContent>
      <TabsContent value="guests" className="mt-4">
        <GuestList bookings={bookingsWithDates} />
      </TabsContent>
      <TabsContent value="requests" className="mt-4">
        <RequestManager requests={requestsWithDates} bookings={bookingsWithDates} />
      </TabsContent>
    </Tabs>
  );
}
