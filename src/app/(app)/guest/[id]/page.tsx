
'use client';

import { notFound } from 'next/navigation';
import { GuestPortalClient } from '@/components/guest/guest-portal-client';
import { useUser, useFirestore } from '@/firebase';
import { useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { Booking, ServiceRequest } from '@/lib/types';
import { useDoc, useCollection } from '@/firebase/hooks';
import { doc, collection, query, where } from 'firebase/firestore';
import { useAdmin } from '@/hooks/use-admin';

export default function GuestPortalPage({ params }: { params: { id: string } }) {
    const firestore = useFirestore();
    const user = useUser();
    const { admin, loading: adminLoading } = useAdmin(user?.uid);
    
    // Client-side data fetching using hooks
    const bookingRef = useMemo(() => firestore ? doc(firestore, 'bookings', params.id) : null, [firestore, params.id]);
    const { data: booking, loading: bookingLoading } = useDoc<Booking>(bookingRef);

    const requestsQuery = useMemo(() => firestore ? query(collection(firestore, 'serviceRequests'), where('bookingId', '==', params.id)) : null, [firestore, params.id]);
    const { data: requests, loading: requestsLoading } = useCollection<ServiceRequest>(requestsQuery, []);
    
    const loading = bookingLoading || adminLoading || requestsLoading || user === undefined;

    // Security Check
    useEffect(() => {
        if (loading) return; // Don't run checks until all data is loaded

        if (!booking || !user) {
            notFound();
            return;
        }

        // Allow access if the user is an admin OR if the user's ID matches the booking's guestId
        const isAdmin = !!admin;
        const isOwner = user.uid === booking.guestId;

        if (!isAdmin && !isOwner) {
            notFound();
        }

    }, [user, admin, booking, loading]);

    const bookingWithDates = useMemo(() => {
      if (!booking) return null;
      return {
        ...booking,
        checkIn: booking.checkIn ? (booking.checkIn as any).toDate() : new Date(),
        checkOut: booking.checkOut ? (booking.checkOut as any).toDate() : new Date(),
      }
    }, [booking]);

    const requestsWithDates = useMemo(() => {
      if (!requests) return [];
      return requests.map(r => ({
        ...r,
        createdAt: r.createdAt ? (r.createdAt as any).toDate() : new Date(),
      }));
    }, [requests]);


    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
  
    if (!bookingWithDates) {
        notFound();
    }

    return (
        <div className="container mx-auto max-w-5xl py-8">
            <GuestPortalClient booking={bookingWithDates} initialRequests={requestsWithDates} />
        </div>
    );
}

    