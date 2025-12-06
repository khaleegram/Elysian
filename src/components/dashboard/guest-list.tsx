
import { Booking } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { ShieldAlert } from 'lucide-react';

export function GuestList({ bookings }: { bookings: (Omit<Booking, 'checkIn' | 'checkOut'> & { checkIn: Date; checkOut: Date })[] }) {
    const sortedBookings = [...bookings].sort((a, b) => b.checkIn.getTime() - a.checkIn.getTime());
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Guest & Booking List</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedBookings.map(booking => (
              <TableRow key={booking.id}>
                <TableCell>
                  <div className="font-medium flex items-center gap-2">
                    {booking.fraudScore && booking.fraudScore > 40 && <ShieldAlert className="h-4 w-4 text-destructive" title={`High-risk booking (Score: ${booking.fraudScore})`} />}
                    {booking.guestName}
                  </div>
                  <div className="text-sm text-muted-foreground">{booking.guestEmail}</div>
                </TableCell>
                <TableCell>
                  {format(booking.checkIn, 'MMM d')} - {format(booking.checkOut, 'MMM d, yyyy')}
                </TableCell>
                <TableCell>{booking.roomId ? `Room ${booking.roomId}` : 'N/A'}</TableCell>
                <TableCell>
                    <Badge variant={booking.status === 'Checked-In' ? 'default' : 'secondary'}>{booking.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

    