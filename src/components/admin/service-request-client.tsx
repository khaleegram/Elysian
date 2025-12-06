
'use client';

import { useMemo, useTransition } from 'react';
import { Booking, ServiceRequest, ServiceRequestStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { formatRelative } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Check, Clock, Loader2 } from 'lucide-react';
import { updateServiceRequestStatusAction } from '@/app/actions';

const statusMap: Record<ServiceRequestStatus, { icon: React.ElementType, variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    'Pending': { icon: Clock, variant: 'outline' },
    'In-Progress': { icon: Loader2, variant: 'default' },
    'Completed': { icon: Check, variant: 'secondary' },
};

type ServiceRequestClientProps = {
  initialRequests: (Omit<ServiceRequest, 'createdAt'> & { createdAt: string; })[];
  initialBookings: (Omit<Booking, 'checkIn' | 'checkOut' | 'createdAt'> & { checkIn: string; checkOut: string; createdAt: string | null; })[];
}

export function ServiceRequestClient({ initialRequests, initialBookings }: ServiceRequestClientProps) {
    const [isPending, startTransition] = useTransition();

    const handleStatusUpdate = (requestId: string, status: ServiceRequestStatus) => {
        startTransition(() => {
            updateServiceRequestStatusAction(requestId, status);
        });
    };

    const requestsWithGuestData = useMemo(() => {
        if (!initialRequests || !initialBookings) return [];
        return initialRequests.map(request => {
            const booking = initialBookings.find(b => b.id === request.bookingId);
            return {
                ...request,
                guestName: booking?.guestName || 'Unknown Guest',
                roomNumber: booking?.roomId || 'N/A',
                createdAt: new Date(request.createdAt),
            };
        }).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
    }, [initialRequests, initialBookings]);

    const loading = !initialRequests || !initialBookings;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Request Queue</CardTitle>
                <CardDescription>A real-time list of all service requests from guests.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Guest / Room</TableHead>
                            <TableHead>Request</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && !requestsWithGuestData.length ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">Loading requests...</TableCell>
                            </TableRow>
                        ) : (
                           requestsWithGuestData.map(request => {
                            const StatusIcon = statusMap[request.status].icon;
                            return (
                            <TableRow key={request.id} className={isPending ? 'opacity-50' : ''}>
                                <TableCell>
                                    <div className="font-medium">{request.guestName}</div>
                                    <div className="text-sm text-muted-foreground">Room {request.roomNumber}</div>
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
                                            <Button variant="ghost" size="icon" disabled={isPending}>
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
                           )})
                        )}
                         {!loading && requestsWithGuestData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">
                                    No service requests found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                 </Table>
            </CardContent>
        </Card>
    );
}

    
