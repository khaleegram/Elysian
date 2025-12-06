
import { getBookingById, getRooms } from '@/lib/data';
import { notFound, redirect } from 'next/navigation';
import { BookingStatus, Room } from '@/lib/types';
import { PaymentStep } from '@/components/booking/steps/PaymentStep';
import { calculateBookingCost } from '@/lib/booking/calculate-cost';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldAlert, Clock, ShieldX } from 'lucide-react';
import { GradientTitle } from '@/components/ui/gradient-title';

async function getRoomForBooking(roomType: string): Promise<Room | undefined> {
    // In a real app, you'd have a more robust way to get a representative room or store price on booking.
    // For now, we'll find the first available room of that type to get the price.
    const rooms = await getRooms();
    return rooms.find(r => r.type === roomType);
}

export default async function BookingStatusPage({ params }: { params: { id: string } }) {
  const booking = await getBookingById(params.id);

  if (!booking) {
    notFound();
  }

  // If already approved and paid, redirect to the digital pass page
  if (booking.status === BookingStatus.Approved && booking.paymentId) {
      redirect(`/pass/${booking.id}`);
  }
  
  // Fetch room data to get the price for cost calculation
  const room = await getRoomForBooking(booking.roomType);

  const { totalCost } = (room && booking.checkIn && booking.checkOut) ? 
      calculateBookingCost({checkIn: booking.checkIn, checkOut: booking.checkOut, pricePerNight: room.price })
      : { totalCost: 0 };


  return (
    <div className="container mx-auto max-w-2xl py-12">
      <div className="text-center mb-8">
        <GradientTitle>Booking Status</GradientTitle>
        <p className="text-muted-foreground mt-2">Here's the current status of your booking request.</p>
        <p className="font-mono text-sm bg-muted p-2 rounded-lg inline-block mt-4">
            Booking ID: {booking.id}
        </p>
      </div>

      {booking.status === BookingStatus.Approved && !booking.paymentId && (
        <PaymentStep 
          guestEmail={booking.guestEmail} 
          amount={totalCost} 
          bookingId={booking.id}
        />
      )}

      {booking.status === BookingStatus.ReviewNeeded && (
        <Card>
            <CardHeader className="text-center">
                <ShieldAlert className="h-12 w-12 mx-auto text-yellow-500" />
                <CardTitle className="mt-4">Booking Under Review</CardTitle>
                <CardDescription>Our team needs to manually verify your details.</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
                <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertTitle>Your Reservation is Held!</AlertTitle>
                    <AlertDescription>
                        Your room is reserved for the next 24 hours. We will contact you at <strong>{booking.guestEmail}</strong> once the review is complete. You will be able to complete your payment here once approved.
                    </AlertDescription>
                </Alert>
                <Button asChild variant="outline">
                    <Link href="/bookings">Go to My Bookings</Link>
                </Button>
            </CardContent>
        </Card>
      )}

      {booking.status === BookingStatus.Declined && (
         <Card>
            <CardHeader className="text-center">
                <ShieldX className="h-12 w-12 mx-auto text-destructive" />
                <CardTitle className="mt-4">Booking Declined</CardTitle>
                <CardDescription>Unfortunately, we were unable to proceed with your booking.</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
                 <Alert variant="destructive">
                    <AlertTitle>Reason for Decline</AlertTitle>
                    <AlertDescription>
                        {booking.fraudReasoning || 'The booking could not be verified at this time.'}
                    </AlertDescription>
                </Alert>
                <Button asChild>
                    <Link href="/">Return to Homepage</Link>
                </Button>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
