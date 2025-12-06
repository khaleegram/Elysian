
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, Cell, ResponsiveContainer, LabelList } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Booking, Room, ServiceRequest } from '@/lib/types';
import { subMonths, format, startOfMonth, differenceInDays } from 'date-fns';

const CHART_CONFIG = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--chart-1))',
  },
  Standard: {
    label: 'Standard',
    color: 'hsl(var(--chart-2))',
  },
  Deluxe: {
    label: 'Deluxe',
    color: 'hsl(var(--chart-3))',
  },
  Suite: {
    label: 'Suite',
    color: 'hsl(var(--chart-4))',
  },
  'Room Service': { label: 'Room Service', color: 'hsl(var(--chart-1))' },
  'Housekeeping': { label: 'Housekeeping', color: 'hsl(var(--chart-2))' },
  'Maintenance': { label: 'Maintenance', color: 'hsl(var(--chart-3))' },
};

type AnalyticsClientProps = {
  bookings: any[];
  rooms: Room[];
  serviceRequests: any[];
};

export function AnalyticsClient({ bookings, rooms, serviceRequests }: AnalyticsClientProps) {

  const analyticsData = useMemo(() => {
    if (!bookings || !rooms || !serviceRequests) return null;

    const now = new Date();
    const totalRooms = rooms.length;

    const bookingsWithDates = bookings.map(b => ({
        ...b,
        checkIn: new Date(b.checkIn),
        checkOut: new Date(b.checkOut)
    }));

    // Calculate total revenue
    const totalRevenue = bookingsWithDates.reduce((acc, booking) => {
      const room = rooms.find(r => r.id === booking.roomId);
      if (!room || !booking.checkIn || !booking.checkOut) return acc;
      const nights = differenceInDays(booking.checkOut, booking.checkIn);
      return acc + (nights > 0 ? nights * room.price : 0);
    }, 0);

    // Calculate Occupancy Rate over the last 90 days for relevance
    const daysInPeriod = 90;
    const periodStart = new Date(now.getTime() - daysInPeriod * 24 * 60 * 60 * 1000);
    const totalRoomNightsPossible = totalRooms * daysInPeriod;
    const totalRoomNightsBooked = bookingsWithDates
      .filter(b => b.checkIn >= periodStart || b.checkOut > periodStart)
      .reduce((acc, booking) => {
        const start = booking.checkIn > periodStart ? booking.checkIn : periodStart;
        const end = booking.checkOut > now ? now : booking.checkOut;
        const nights = differenceInDays(end, start);
        return acc + (nights > 0 ? nights : 0);
    }, 0);
    const occupancyRate = totalRoomNightsPossible > 0 ? (totalRoomNightsBooked / totalRoomNightsPossible) * 100 : 0;
    
    // Average Daily Rate (ADR)
    const totalNightsBookedAllTime = bookingsWithDates.reduce((acc, b) => {
        if (!b.checkIn || !b.checkOut) return acc;
        const nights = differenceInDays(b.checkOut, b.checkIn);
        return acc + (nights > 0 ? nights : 0);
    }, 0);
    const adr = totalNightsBookedAllTime > 0 ? totalRevenue / totalNightsBookedAllTime : 0;


    // Monthly Revenue (last 6 months)
    const monthlyRevenue = Array.from({ length: 6 }).map((_, i) => {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const revenue = bookingsWithDates
        .filter(b => b.checkIn >= monthStart && b.checkIn < new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1))
        .reduce((acc, booking) => {
            const room = rooms.find(r => r.id === booking.roomId);
            if (!room || !booking.checkIn || !booking.checkOut) return acc;
            const nights = differenceInDays(booking.checkOut, booking.checkIn);
            return acc + (nights > 0 ? nights * room.price : 0);
        }, 0);
      return { month: format(monthDate, 'MMM'), revenue };
    }).reverse();


    // Occupancy by Room Type
    const roomTypeOccupancy = bookingsWithDates.reduce((acc, booking) => {
      acc[booking.roomType] = (acc[booking.roomType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const roomTypeChartData = Object.entries(roomTypeOccupancy).map(([name, value]) => ({
      name,
      value,
      fill: CHART_CONFIG[name as keyof typeof CHART_CONFIG]?.color || '#ccc',
    }));

    // Service Requests by Category
    const requestsByCategory = serviceRequests.reduce((acc, request) => {
        acc[request.type] = (acc[request.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const requestChartData = Object.entries(requestsByCategory).map(([name, count]) => ({
        name,
        count,
        fill: CHART_CONFIG[name as keyof typeof CHART_CONFIG]?.color,
    }));


    return { totalRevenue, occupancyRate, adr, monthlyRevenue, roomTypeChartData, requestChartData };
  }, [bookings, rooms, serviceRequests]);

  if (!analyticsData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
          <CardDescription>No data available to generate analytics.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { totalRevenue, occupancyRate, adr, monthlyRevenue, roomTypeChartData, requestChartData } = analyticsData;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>All-time revenue from completed bookings.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Occupancy Rate</CardTitle>
            <CardDescription>Percentage of rooms booked over the last 90 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{occupancyRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average Daily Rate (ADR)</CardTitle>
            <CardDescription>The average rental revenue earned for an occupied room per day.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">${adr.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>Revenue over the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={CHART_CONFIG} className="h-[250px] w-full">
              <BarChart data={monthlyRevenue}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Bookings by Room Type</CardTitle>
             <CardDescription>Distribution of bookings across different room types.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ChartContainer config={CHART_CONFIG} className="h-[250px] w-full max-w-[300px]">
                <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="value" hideLabel />} />
                    <Pie data={roomTypeChartData} dataKey="value" nameKey="name" outerRadius={100}>
                        {roomTypeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-1">
        <Card>
            <CardHeader>
                <CardTitle>Service Requests by Category</CardTitle>
                <CardDescription>A breakdown of all guest service requests.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={CHART_CONFIG} className="h-[300px] w-full">
                    <BarChart data={requestChartData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid horizontal={false} />
                        <XAxis type="number" dataKey="count" hide />
                        <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="count" layout="vertical" radius={4}>
                             <LabelList dataKey="count" position="right" offset={8} className="fill-foreground" fontSize={12} />
                             {requestChartData.map((entry) => (
                                <Cell key={entry.name} fill={entry.fill} />
                             ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
