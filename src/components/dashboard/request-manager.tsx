
'use client';

import { Booking, ServiceRequest, ServiceRequestStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Check, MoreHorizontal, Clock, Loader2 } from 'lucide-react';
import { formatRelative } from 'date-fns';
import { updateServiceRequestStatusAction } from '@/app/actions';
import { useTransition } from 'react';

const statusMap: Record<ServiceRequestStatus, { icon: React.ElementType, variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    'Pending': { icon: Clock, variant: 'outline' },
    'In-Progress': { icon: Loader2, variant: 'default' },
    'Completed': { icon: Check, variant: 'secondary' },
};

export function RequestManager({ requests, bookings }: { requests: (Omit<ServiceRequest, 'createdAt'> & {createdAt: Date})[], bookings: (Omit<Booking, 'checkIn' | 'checkOut'> & { checkIn: Date; checkOut: Date })[] }) {
    let [isPending, startTransition] = useTransition();

    const handleStatusUpdate = (requestId: string, status: ServiceRequestStatus) => {
        startTransition(() => {
            updateServiceRequestStatusAction(requestId, status);
        });
    };
    
    const sortedRequests = [...requests].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Request Queue</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest/Room</TableHead>
              <TableHead>Request</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRequests.map(request => {
                const booking = bookings.find(b => b.id === request.bookingId);
                const StatusIcon = statusMap[request.status].icon;

                return (
                  <TableRow key={request.id} className={isPending ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="font-medium">{booking?.guestName}</div>
                      <div className="text-sm text-muted-foreground">Room {booking?.roomId || 'N/A'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{request.type}</div>
                      <div className="text-sm text-muted-foreground">{request.description}</div>
                    </TableCell>
                    <TableCell>
                      {formatRelative(request.createdAt, new Date())}
                    </TableCell>
                    <TableCell>
                        <Badge variant={statusMap[request.status].variant}>
                            <StatusIcon className={`mr-2 h-4 w-4 ${request.status === 'In-Progress' ? 'animate-spin' : ''}`} />
                            {request.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleStatusUpdate(request.id, 'In-Progress')} disabled={request.status === 'In-Progress' || isPending}>Mark In Progress</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate(request.id, 'Completed')} disabled={request.status === 'Completed' || isPending}>Mark Completed</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

    
