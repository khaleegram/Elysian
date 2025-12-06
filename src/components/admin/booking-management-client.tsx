
'use client';
import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { Booking, BookingStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, CheckCircle, XCircle, Ban, Hourglass, HelpCircle, Loader2, Search } from 'lucide-react';
import { UpdateBookingStatusDialog } from './update-booking-status-dialog';
import { approveBookingAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Input } from '../ui/input';

export const statusStyles: Record<BookingStatus, { variant: 'default' | 'secondary' | 'outline' | 'destructive', icon: React.ElementType }> = {
  [BookingStatus.Approved]: { variant: 'secondary', icon: CheckCircle },
  [BookingStatus.ReviewNeeded]: { variant: 'default', icon: Hourglass },
  [BookingStatus.Declined]: { variant: 'destructive', icon: XCircle },
  [BookingStatus.CheckedIn]: { variant: 'default', icon: CheckCircle },
  [BookingStatus.CheckedOut]: { variant: 'secondary', icon: CheckCircle },
  [BookingStatus.Cancelled]: { variant: 'outline', icon: Ban },
};


const getRiskBadgeVariant = (score?: number) => {
    if (score === undefined) return 'secondary';
    if (score > 70) return 'destructive';
    if (score > 40) return 'default';
    return 'secondary';
}

type BookingManagementClientProps = {
  initialBookings: Booking[];
  loading: boolean;
}

export function BookingManagementClient({ initialBookings, loading }: BookingManagementClientProps) {
    const [isTransitioning, startTransition] = useTransition();
    const { toast } = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [dialogAction, setDialogAction] = useState<'decline' | 'cancel' | 'complete' | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredBookings = useMemo(() => {
      if (!initialBookings) return [];
      const sorted = initialBookings.sort((a, b) => {
        const dateA = a.createdAt ? (a.createdAt as any).toDate ? (a.createdAt as any).toDate() : new Date(a.createdAt as any) : new Date(0);
        const dateB = b.createdAt ? (b.createdAt as any).toDate ? (b.createdAt as any).toDate() : new Date(b.createdAt as any) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      if (!searchTerm) {
          return sorted;
      }

      return sorted.filter(booking => 
        booking.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.guestEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.id.toLowerCase().includes(searchTerm.toLowerCase())
      );

    }, [initialBookings, searchTerm]);

    const handleApprove = (bookingId: string) => {
        startTransition(async () => {
            setSelectedBooking(initialBookings.find(b => b.id === bookingId) || null);
            try {
                await approveBookingAction(bookingId);
                toast({ title: 'Success', description: 'Booking has been approved.' });
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to approve booking.';
                toast({ variant: 'destructive', title: 'Error', description: message });
            }
        });
    };

    const openDialog = (booking: Booking, action: 'decline' | 'cancel' | 'complete') => {
        setSelectedBooking(booking);
        setDialogAction(action);
        setDialogOpen(true);
    };

    return (
        <TooltipProvider>
            {selectedBooking && dialogAction && (
                <UpdateBookingStatusDialog
                    isOpen={dialogOpen}
                    onOpenChange={setDialogOpen}
                    booking={selectedBooking}
                    action={dialogAction}
                />
            )}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle>All Bookings</CardTitle>
                            <CardDescription>A real-time list of all bookings in the system.</CardDescription>
                        </div>
                         <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by name, email, or booking ID..."
                                className="pl-9 w-full md:w-80"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Guest</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Room</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>AI Risk</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredBookings.length > 0 ? (
                            filteredBookings.map(booking => {
                                const StatusIcon = statusStyles[booking.status]?.icon || HelpCircle;
                                const isCurrentAction = isTransitioning && selectedBooking?.id === booking.id;
                                return (
                                <TableRow key={booking.id} className={isCurrentAction ? 'opacity-50' : ''}>
                                    <TableCell>
                                        <div className="font-medium">{booking.guestName}</div>
                                        <div className="text-sm text-muted-foreground">{booking.guestEmail}</div>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(booking.checkIn as any), 'MMM dd, yyyy')} - {format(new Date(booking.checkOut as any), 'MMM dd, yyyy')}
                                    </TableCell>
                                    <TableCell>{booking.roomType}</TableCell>
                                    <TableCell>
                                        <Badge variant={statusStyles[booking.status]?.variant || 'secondary'} className="gap-1">
                                            <StatusIcon className="h-3 w-3" />
                                            {booking.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Badge variant={getRiskBadgeVariant(booking.fraudScore)} className="cursor-help">
                                                    {booking.fraudScore ? `${booking.fraudScore}/100` : 'N/A'}
                                                </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="max-w-xs">{booking.fraudReasoning || 'No AI reasoning available.'}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" disabled={isTransitioning}>
                                                {isCurrentAction ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4" />}
                                                <span className="sr-only">Actions</span>
                                            </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/admin/bookings/${booking.id}`}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Details
                                                </Link>
                                            </DropdownMenuItem>
                                            {booking.status === BookingStatus.ReviewNeeded && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleApprove(booking.id)} disabled={isTransitioning}>
                                                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                                        Approve Booking
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openDialog(booking, 'decline')} className="text-destructive" disabled={isTransitioning}>
                                                        <XCircle className="mr-2 h-4 w-4" />
                                                        Decline Booking
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                             {[BookingStatus.Approved, BookingStatus.CheckedIn].includes(booking.status) && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => openDialog(booking, 'cancel')} className="text-destructive" disabled={isTransitioning}>
                                                        <Ban className="mr-2 h-4 w-4" />
                                                        Cancel Booking
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )})
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        No bookings found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                     </Table>
                </CardContent>
            </Card>
        </TooltipProvider>
    );
}
