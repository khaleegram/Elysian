
'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { Booking, BookingStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';

const statusStyles: Record<BookingStatus, { variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  'Approved': { variant: 'secondary' },
  'Review Needed': { variant: 'default' },
  'Declined': { variant: 'destructive' },
  'Checked-In': { variant: 'default' },
  'Checked-Out': { variant: 'secondary' },
  'Cancelled': { variant: 'outline' },
};

type MyBookingsClientProps = {
  bookings: Booking[];
}

export function MyBookingsClient({ bookings: initialBookings }: MyBookingsClientProps) {

    const bookings = useMemo(() => {
        if (!initialBookings) return [];
        return initialBookings;
    }, [initialBookings]);

    if (bookings.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Booking History</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">You have no booking history yet.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Booking History</CardTitle>
                <CardDescription>A list of your past and upcoming stays.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Dates</TableHead>
                            <TableHead>Room Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bookings.map(booking => (
                        <TableRow key={booking.id}>
                            <TableCell>
                                {format(booking.checkIn as Date, 'MMM dd, yyyy')} - {format(booking.checkOut as Date, 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>{booking.roomType}</TableCell>
                            <TableCell>
                                <Badge variant={statusStyles[booking.status]?.variant || 'secondary'}>
                                    {booking.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/guest/${booking.id}`}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Portal
                                    </Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                 </Table>
            </CardContent>
        </Card>
    );
}
