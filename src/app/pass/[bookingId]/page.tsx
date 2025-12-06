
'use client';

import { getBookingById } from '@/lib/data';
import { notFound, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, QrCode, ShieldAlert, User, Calendar, BedDouble, ShieldX, KeyRound, Wifi, Utensils } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Booking, BookingStatus } from '@/lib/types';
import { GradientTitle } from '@/components/ui/gradient-title';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import QRCode from 'qrcode.react';

export default function DigitalPassPage() {
    const { bookingId } = useParams();
    const [booking, setBooking] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (typeof bookingId !== 'string') return;
        const fetchBooking = async () => {
            try {
                const bookingData = await getBookingById(bookingId);
                if (!bookingData) {
                    notFound();
                }
                setBooking(bookingData);
            } catch (error) {
                console.error("Failed to fetch booking:", error);
                notFound();
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [bookingId]);

    if (loading || !booking) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
  
    const isCheckedIn = booking.status === 'Checked-In';

  return (
    <div className="container mx-auto max-w-lg py-12 sm:py-16">
        <div className="flex flex-col items-center text-center mb-8">
            <GradientTitle className="text-4xl md:text-5xl">Your Digital Pass</GradientTitle>
            <p className="mt-2 text-lg text-muted-foreground">Welcome, {booking.guestName.split(' ')[0]}. Everything you need is right here.</p>
        </div>
      
        <Card className="shadow-2xl">
            <CardContent className="p-6">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-white rounded-lg border">
                         <QRCode value={booking.id} size={160} />
                    </div>
                </div>
                 <div className="text-center space-y-2">
                    <p className="text-muted-foreground">Show this QR code at check-in or service points.</p>
                     <p className="font-mono text-xs text-muted-foreground">Booking ID: {booking.id}</p>
                 </div>
            </CardContent>
            
            <CardFooter className="grid grid-cols-2 gap-4 bg-muted/50 p-6">
                 <div className="text-center">
                    <p className="text-sm text-muted-foreground">Room No.</p>
                    <p className="text-3xl font-bold">{booking.roomId || '---'}</p>
                </div>
                <div className="text-center">
                    <p className="text-sm text-muted-foreground">Access PIN</p>
                    <p className="text-3xl font-bold tracking-widest">{booking.accessPin || '----'}</p>
                </div>
            </CardFooter>
        </Card>
        
        <div className="mt-8 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5"/> Your Stay</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                     <div>
                        <p className="text-sm font-medium text-muted-foreground">Check-in</p>
                        <p>{format(new Date(booking.checkIn), 'MMM dd, yyyy')}</p>
                    </div>
                     <div>
                        <p className="text-sm font-medium text-muted-foreground">Check-out</p>
                        <p>{format(new Date(booking.checkOut), 'MMM dd, yyyy')}</p>
                    </div>
                     <div>
                        <p className="text-sm font-medium text-muted-foreground">Guest</p>
                        <p>{booking.guestName}</p>
                    </div>
                     <div>
                        <p className="text-sm font-medium text-muted-foreground">Room Type</p>
                        <p>{booking.roomType}</p>
                    </div>
                </CardContent>
            </Card>

            <Button asChild className="w-full" size="lg">
                <Link href={`/guest/${booking.id}`}>
                    Go to Guest Portal
                </Link>
            </Button>
        </div>
    </div>
  );
}
