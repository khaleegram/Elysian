
'use client';

import { Room, Booking } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { addDays, format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import Link from "next/link";
import { Button } from "../ui/button";
import { Eye, DollarSign, CalendarDays, History } from "lucide-react";
import { statusStyles as roomStatusStyles } from "./room-management-client";
import { statusStyles as bookingStatusStyles } from "./booking-management-client";
import { GradientTitle } from "../ui/gradient-title";

type RoomDetailClientProps = {
    room: Room;
    bookings: (Omit<Booking, 'checkIn' | 'checkOut' | 'createdAt'> & { checkIn: string; checkOut: string; createdAt: string | null; })[];
}

export function RoomDetailClient({ room, bookings }: RoomDetailClientProps) {

    const bookingsWithDates = bookings.map(b => ({
        ...b,
        checkIn: new Date(b.checkIn),
        checkOut: new Date(b.checkOut)
    }));
    
    const [month, setMonth] = useState(new Date());

    const bookedDays = bookingsWithDates.map(b => ({
        from: b.checkIn,
        to: addDays(b.checkOut, -1) // Day picker range is inclusive
    }));

    const roomStatus = roomStatusStyles[room.status];

    return (
        <div className="space-y-6">
            <header className="flex items-start justify-between">
                <div>
                    <GradientTitle>Room {room.number}</GradientTitle>
                    <p className="text-lg text-muted-foreground">{room.type} Room</p>
                </div>
                 <Badge variant={roomStatus.variant} className={`${roomStatus.className} text-lg`}>
                    <roomStatus.icon className="mr-2 h-5 w-5" />
                    {room.status}
                </Badge>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Booking Calendar</CardTitle>
                        <CardDescription>Visual timeline of past and future bookings for this room.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Calendar
                            mode="range"
                            month={month}
                            onMonthChange={setMonth}
                            numberOfMonths={2}
                            selected={bookedDays}
                            modifiers={{
                                booked: bookedDays,
                            }}
                            modifiersClassNames={{
                                booked: 'bg-destructive/20 text-destructive-foreground day-range-middle',
                            }}
                             classNames={{
                                day_selected: "bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground",
                            }}
                        />
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Room Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center gap-2"><DollarSign className="h-4 w-4"/> Price per night</span>
                            <span className="font-semibold">${room.price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Type</span>
                            <span className="font-semibold">{room.type}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Status</span>
                            <span className="font-semibold">{room.status}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Booking History</CardTitle>
                    <CardDescription>A complete record of all stays for room {room.number}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Guest</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bookingsWithDates.length > 0 ? bookingsWithDates.map(booking => {
                                 const StatusIcon = bookingStatusStyles[booking.status]?.icon;
                                return (
                                <TableRow key={booking.id}>
                                    <TableCell>
                                        <div className="font-medium">{booking.guestName}</div>
                                        <div className="text-sm text-muted-foreground">{booking.guestEmail}</div>
                                    </TableCell>
                                    <TableCell>{format(booking.checkIn, 'PPP')} - {format(booking.checkOut, 'PPP')}</TableCell>
                                    <TableCell>
                                        <Badge variant={bookingStatusStyles[booking.status]?.variant || 'secondary'} className="gap-1">
                                            {StatusIcon && <StatusIcon className="h-3 w-3" />}
                                            {booking.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button asChild variant="ghost" size="icon">
                                            <Link href={`/admin/bookings?id=${booking.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )}) : (
                                 <TableRow>
                                    <TableCell colSpan={4} className="text-center">No booking history for this room.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    );
}
