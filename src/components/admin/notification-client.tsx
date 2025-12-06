
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Booking, ServiceRequest } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ShieldAlert, ClipboardList } from 'lucide-react';
import { formatRelative } from 'date-fns';
import { Button } from '../ui/button';

type Notification = {
    id: string;
    type: 'fraud' | 'request';
    title: string;
    description: string;
    timestamp: Date;
    href: string;
    Icon: React.ElementType;
};

type NotificationClientProps = {
  initialBookings: (Omit<Booking, 'checkIn' | 'checkOut' | 'createdAt'> & { checkIn: string; checkOut: string; createdAt: string | null; })[];
  initialRequests: (Omit<ServiceRequest, 'createdAt'> & { createdAt: string; })[];
}

export function NotificationClient({ initialBookings, initialRequests }: NotificationClientProps) {

    const notifications = useMemo(() => {
        const allNotifications: Notification[] = [];

        // High-risk bookings
        initialBookings?.forEach(booking => {
            if (booking.status === 'Review Needed') {
                allNotifications.push({
                    id: `booking-${booking.id}`,
                    type: 'fraud',
                    title: `Booking needs review`,
                    description: `Booking for ${booking.guestName} was flagged by the AI with a fraud score of ${booking.fraudScore}.`,
                    timestamp: new Date(booking.checkIn), // Using checkIn for sorting, could be createdAt
                    href: `/admin/bookings`,
                    Icon: ShieldAlert,
                });
            }
        });

        // New service requests
        initialRequests?.forEach(request => {
            if (request.status === 'Pending') {
                 const booking = initialBookings?.find(b => b.id === request.bookingId);
                allNotifications.push({
                    id: `request-${request.id}`,
                    type: 'request',
                    title: `New ${request.type} Request`,
                    description: `From ${booking?.guestName || 'guest'} for room ${booking?.roomId || 'N/A'}: "${request.description}"`,
                    timestamp: new Date(request.createdAt),
                    href: `/admin/requests`,
                    Icon: ClipboardList,
                });
            }
        });

        // Sort notifications by most recent
        return allNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    }, [initialBookings, initialRequests]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Notifications Feed</CardTitle>
                <CardDescription>A list of events requiring your attention.</CardDescription>
            </CardHeader>
            <CardContent>
                {notifications.length > 0 ? (
                    <div className="space-y-6">
                        {notifications.map((notification) => (
                            <div key={notification.id} className="flex items-start gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                                    <notification.Icon className={`h-5 w-5 ${notification.type === 'fraud' ? 'text-destructive' : 'text-primary'}`} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold">{notification.title}</h3>
                                    <p className="text-sm text-muted-foreground">{notification.description}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatRelative(notification.timestamp, new Date())}
                                    </p>
                                </div>
                                <Button asChild variant="outline" size="sm">
                                    <Link href={notification.href}>View</Link>
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No active alerts or notifications.</p>
                        <p className="text-sm">Everything is running smoothly!</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

    
