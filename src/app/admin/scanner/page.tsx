
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GradientTitle } from '@/components/ui/gradient-title';
import { QrCode, Video, VideoOff } from 'lucide-react';
import dynamic from 'next/dynamic';
import { BookingDetails } from '@/components/admin/booking-details';
import { getBookingById } from '@/lib/data';
import { Loader2 } from 'lucide-react';

// Dynamically import the QR Scanner component to avoid SSR issues
const QrScanner = dynamic(() => import('react-qr-scanner'), { ssr: false });

export default function ScannerPage() {
    const [scannedData, setScannedData] = useState<string | null>(null);
    const [booking, setBooking] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    const handleScan = async (data: any) => {
        if (data && data.text !== scannedData) {
            setLoading(true);
            setError(null);
            setBooking(null);
            const bookingId = data.text;
            setScannedData(bookingId);

            try {
                const fetchedBooking = await getBookingById(bookingId);
                if (fetchedBooking) {
                    setBooking(fetchedBooking);
                } else {
                    setError(`No booking found with ID: ${bookingId}`);
                }
            } catch (err) {
                setError('Failed to fetch booking details.');
            } finally {
                setLoading(false);
                setIsScanning(false);
            }
        }
    };

    const handleError = (err: any) => {
        console.error(err);
        setError('Could not access the camera. Please check permissions.');
        setIsScanning(false);
    };

    const startScanning = () => {
        setScannedData(null);
        setBooking(null);
        setError(null);
        setIsScanning(true);
    };
    
    const stopScanning = () => {
        setIsScanning(false);
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <header className="mb-8">
                <GradientTitle>QR Code Scanner</GradientTitle>
                <p className="mt-2 text-lg text-muted-foreground flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Scan guest's digital pass to verify booking details.
                </p>
            </header>

            <Card className="max-w-2xl mx-auto">
                <CardContent className="p-6">
                    <div className="w-full aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center mb-4">
                        {isScanning ? (
                            <QrScanner
                                onScan={handleScan}
                                onError={handleError}
                                style={{ width: '100%', height: '100%' }}
                                constraints={{ video: { facingMode: 'environment' } }}
                            />
                        ) : (
                             <div className="text-center text-muted-foreground">
                                <QrCode className="h-24 w-24 mx-auto" />
                                <p className="mt-2">Camera is off</p>
                            </div>
                        )}
                    </div>
                     <Button onClick={isScanning ? stopScanning : startScanning} className="w-full">
                        {isScanning ? <VideoOff className="mr-2 h-4 w-4" /> : <Video className="mr-2 h-4 w-4" />}
                        {isScanning ? 'Stop Scanning' : 'Start Camera'}
                    </Button>
                </CardContent>
            </Card>

            {loading && (
                <div className="flex justify-center mt-6">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            )}
            {error && <p className="text-destructive text-center mt-4">{error}</p>}
            
            {booking && (
                <Card className="mt-6 max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>Booking Verification</CardTitle>
                        <CardDescription>Details for scanned booking ID: {booking.id}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <BookingDetails booking={booking} />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
