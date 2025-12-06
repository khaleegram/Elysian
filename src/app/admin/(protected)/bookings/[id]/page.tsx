
'use client';

import { useParams, notFound } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { useDoc } from '@/firebase/hooks';
import { doc } from 'firebase/firestore';
import { useMemo, useState, useTransition } from 'react';
import { Booking, BookingStatus } from '@/lib/types';
import { Loader2, ArrowLeft, CheckCircle, ShieldX } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookingDetails } from '@/components/admin/booking-details';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { approveBookingAction } from '@/app/actions';
import { UpdateBookingStatusDialog } from '@/components/admin/update-booking-status-dialog';
import { GradientTitle } from '@/components/ui/gradient-title';

export default function AdminBookingDetailsPage() {
    const params = useParams();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isTransitioning, startTransition] = useTransition();

    const bookingId = typeof params.id === 'string' ? params.id : '';

    const bookingRef = useMemo(() => firestore && bookingId ? doc(firestore, 'bookings', bookingId) : null, [firestore, bookingId]);
    const { data: booking, loading: bookingLoading } = useDoc<any>(bookingRef);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogAction, setDialogAction] = useState<'decline' | 'cancel' | 'complete' | null>(null);

     const handleApprove = (bookingId: string) => {
        startTransition(async () => {
            try {
                await approveBookingAction(bookingId);
                toast({ title: 'Success', description: 'Booking has been approved.' });
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to approve booking.';
                toast({ variant: 'destructive', title: 'Error', description: message });
            }
        });
    };

    const openDialog = (action: 'decline' | 'cancel' | 'complete') => {
        setDialogAction(action);
        setDialogOpen(true);
    };

    const bookingWithDates = useMemo(() => {
        if (!booking) return null;
        return {
          ...booking,
          checkIn: booking.checkIn ? (booking.checkIn as any).toDate().toISOString() : new Date().toISOString(),
          checkOut: booking.checkOut ? (booking.checkOut as any).toDate().toISOString() : new Date().toISOString(),
          createdAt: booking.createdAt ? (booking.createdAt as any).toDate().toISOString() : null,
        }
      }, [booking]);

    if (bookingLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
    }
    
    if (!bookingWithDates) {
        notFound();
    }

    const isActionable = booking.status === BookingStatus.ReviewNeeded;

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            {booking && dialogAction && (
                <UpdateBookingStatusDialog
                    isOpen={dialogOpen}
                    onOpenChange={setDialogOpen}
                    booking={booking}
                    action={dialogAction}
                />
            )}
             <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" asChild>
                        <Link href="/admin/bookings">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <GradientTitle>Booking Details</GradientTitle>
                        <p className="text-muted-foreground">Review and manage this booking.</p>
                    </div>
                </div>
                {isActionable && (
                    <div className="flex gap-2">
                        <Button variant="destructive" onClick={() => openDialog('decline')} disabled={isTransitioning}>
                            <ShieldX className="mr-2 h-4 w-4" />
                            Decline
                        </Button>
                        <Button onClick={() => handleApprove(booking.id)} disabled={isTransitioning}>
                            {isTransitioning ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4" />}
                            Approve
                        </Button>
                    </div>
                )}
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Booking for {booking.guestName}</CardTitle>
                    <CardDescription>ID: {booking.id}</CardDescription>
                </CardHeader>
                <CardContent>
                    <BookingDetails booking={bookingWithDates} />
                </CardContent>
            </Card>
        </div>
    );
}

