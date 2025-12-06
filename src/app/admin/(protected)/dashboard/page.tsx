
'use client';

import { useRooms } from "@/hooks/use-rooms";
import { useBookings } from "@/hooks/use-bookings";
import { useServiceRequests } from "@/hooks/use-service-requests";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { GradientTitle } from "@/components/ui/gradient-title";
import { LayoutDashboard, Loader2, Users, DollarSign, Percent } from "lucide-react";
import { differenceInDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGuests } from "@/hooks/use-guests";
import { useAdmins } from "@/hooks/use-admins";
import { useStaff } from "@/hooks/use-staff";

export default function DashboardOverviewPage() {
  const { rooms, loading: roomsLoading } = useRooms();
  const { bookings, loading: bookingsLoading } = useBookings();
  const { requests, loading: requestsLoading } = useServiceRequests();
  const { guests, loading: guestsLoading } = useGuests();
  const { admins, loading: adminsLoading } = useAdmins();
  const { staff, loading: staffLoading } = useStaff();

  const loading = roomsLoading || bookingsLoading || requestsLoading || guestsLoading || adminsLoading || staffLoading;

  const totalRevenue = bookings.reduce((acc, booking) => {
      const room = rooms.find(r => r.id === booking.roomId);
      if (!room || !booking.checkIn || !booking.checkOut) return acc;
      const nights = differenceInDays(booking.checkOut, booking.checkIn);
      return acc + (nights > 0 ? nights * room.price : 0);
  }, 0);
  
  const totalNightsBookedAllTime = bookings.reduce((acc, b) => {
        if (!b.checkIn || !b.checkOut) return acc;
        const nights = differenceInDays(b.checkOut, b.checkOut);
        return acc + (nights > 0 ? nights : 0);
    }, 0);
  const adr = totalNightsBookedAllTime > 0 ? totalRevenue / totalNightsBookedAllTime : 0;

  const occupancyRate = rooms.length > 0 ? 
    (bookings.filter(b => b.status === 'Checked-In').length / rooms.length) * 100 : 0;

  const totalUsers = (guests?.length || 0) + (admins?.length || 0) + (staff?.length || 0);

  if (loading) {
     return (
      <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
      <header className="mb-8">
        <GradientTitle>Dashboard</GradientTitle>
        <p className="mt-2 text-lg text-muted-foreground flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            A quick glance at your hotel's performance.
        </p>
      </header>
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Occupancy</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{occupancyRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Daily Rate</CardTitle>
             <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">${adr.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalUsers}</p>
          </CardContent>
        </Card>
      </div>

      <DashboardClient 
        initialRooms={rooms} 
        initialBookings={bookings} 
        initialServiceRequests={requests}
      />
    </div>
  );
}
