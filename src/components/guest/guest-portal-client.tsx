
'use client';

import { Booking, ServiceRequest } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { checkInAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { RequestTracker } from './request-tracker';
import { ServiceRequestForm } from './service-request-form';
import { format } from 'date-fns';
import { BedDouble, Calendar, Check, KeyRound, Loader2, PartyPopper, ShieldCheck, Wifi, Utensils, Map, ConciergeBell, ClipboardList } from 'lucide-react';
import { useDoc, useCollection } from '@/firebase/hooks';
import { doc, collection, query, where, Timestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useMemo, useTransition } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { LocalGuideClient } from './local-guide-client';
import { GradientTitle } from '../ui/gradient-title';

type GuestPortalClientProps = {
  booking: Omit<Booking, 'checkIn' | 'checkOut'> & { checkIn: Date; checkOut: Date; };
  initialRequests: (Omit<ServiceRequest, 'createdAt'> & { createdAt: Date; })[];
}

export function GuestPortalClient({
  booking: initialBooking,
  initialRequests,
}: GuestPortalClientProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isCheckingIn, startCheckInTransition] = useTransition();

  const bookingRef = useMemo(() => firestore ? doc(firestore, 'bookings', initialBooking.id) : null, [firestore, initialBooking.id]);
  const { data: liveBooking } = useDoc(bookingRef, initialBooking);

  const requestsQuery = useMemo(() => firestore ? query(collection(firestore, 'serviceRequests'), where('bookingId', '==', initialBooking.id)) : null, [firestore, initialBooking.id]);
  const { data: requests } = useCollection(requestsQuery, initialRequests);

  const booking = useMemo(() => {
    if (!liveBooking) return null;
    const checkIn = liveBooking.checkIn instanceof Timestamp ? liveBooking.checkIn.toDate() : new Date(liveBooking.checkIn);
    const checkOut = liveBooking.checkOut instanceof Timestamp ? liveBooking.checkOut.toDate() : new Date(liveBooking.checkOut);
    return {
        ...liveBooking,
        checkIn,
        checkOut,
    };
  }, [liveBooking]);


  if (!booking) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleCheckIn = async () => {
    startCheckInTransition(async () => {
      const result = await checkInAction(booking.id);
      if (result.success) {
        toast({
          title: 'Check-in Successful!',
          description: 'Welcome to Elysian. Your portal has been updated.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Check-in Failed',
          description: result.message,
        });
      }
    });
  };

  const isCheckedIn = booking.status === 'Checked-In';
  const isApproved = booking.status === 'Approved';

  return (
    <div className="space-y-8">
      <header>
        <GradientTitle>Welcome, {booking.guestName.split(' ')[0]}</GradientTitle>
        <p className="mt-2 text-lg text-muted-foreground">Your personal command center for a perfect stay.</p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
            {!isCheckedIn && isApproved && (
                <Alert>
                    <ShieldCheck className="h-4 w-4" />
                    <AlertTitle>You're ready for check-in!</AlertTitle>
                    <AlertDescription>
                        Complete your digital check-in to get your room number and access PIN.
                        <form action={handleCheckIn} className="mt-4">
                            <Button type="submit" disabled={isCheckingIn} size="lg" className="w-full">
                              {isCheckingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                              Complete Digital Check-In
                            </Button>
                        </form>
                    </AlertDescription>
                </Alert>
            )}

            {isCheckedIn ? (
                <Tabs defaultValue="new-request" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="new-request"><ConciergeBell className="mr-2 h-4 w-4"/>New Request</TabsTrigger>
                        <TabsTrigger value="my-requests"><ClipboardList className="mr-2 h-4 w-4"/>My Requests</TabsTrigger>
                        <TabsTrigger value="local-guide"><Map className="mr-2 h-4 w-4" />Local Guide</TabsTrigger>
                    </TabsList>
                    <TabsContent value="new-request">
                        <ServiceRequestForm bookingId={booking.id} type="Housekeeping" />
                    </TabsContent>
                    <TabsContent value="my-requests">
                        <RequestTracker requests={requests || []} />
                    </TabsContent>
                    <TabsContent value="local-guide">
                        <LocalGuideClient />
                    </TabsContent>
                </Tabs>
            ) : (
                 <Card>
                    <CardHeader>
                        <CardTitle>Awaiting Check-in</CardTitle>
                        <CardDescription>Your service portal will be activated once you are checked in.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground pt-8">
                        <PartyPopper className="h-12 w-12 mx-auto mb-4 text-primary" />
                        <p>We're preparing for your arrival!</p>
                    </CardContent>
                </Card>
            )}
        </div>

        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><KeyRound className="text-primary"/> Room Access</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   {isCheckedIn && booking.roomId ? (
                    <>
                        <div>
                            <p className="text-sm text-muted-foreground">Room Number</p>
                            <p className="font-bold text-2xl">{booking.roomId}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Access PIN</p>
                            <p className="font-bold text-5xl tracking-widest text-primary">{booking.accessPin}</p>
                        </div>
                    </>
                   ) : (
                    <p className="text-sm text-muted-foreground">Your room number and PIN will appear here after you check in.</p>
                   )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Your Stay</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                        <p className="font-semibold text-sm">{`${format(booking.checkIn, 'MMM d')} - ${format(booking.checkOut, 'MMM d, yyyy')}`}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <BedDouble className="h-5 w-5 text-muted-foreground" />
                        <div>
                        <p className="font-semibold text-sm">{booking.roomType} Room</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Hotel Services</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-4 text-sm">
                    <div className="flex items-center gap-3">
                        <Wifi className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="font-semibold">WiFi Network: <span className="font-mono text-primary">ElysianAI_Guest</span></p>
                            <p className="text-muted-foreground">Password: <span className="font-mono">serenity123</span></p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3">
                        <Utensils className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="font-semibold">In-Room Dining</p>
                            <p className="text-muted-foreground">Dial 200 from your room phone.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
