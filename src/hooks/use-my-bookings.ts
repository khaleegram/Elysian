
'use client';
import { useFirestore } from "@/firebase";
import { useCollection } from "@/firebase/hooks";
import { Booking } from "@/lib/types";
import { collection, query, where, orderBy, Timestamp } from "firebase/firestore";
import { useMemo } from "react";

/**
 * Fetches booking data for a given user ID.
 * @param uid The Firebase Auth user ID.
 * @returns The list of bookings and loading state.
 */
export function useMyBookings(uid?: string) {
    const firestore = useFirestore();

    const bookingsQuery = useMemo(() => {
        if (!firestore || !uid) return null;
        return query(
            collection(firestore, 'bookings'), 
            where('guestId', '==', uid),
            orderBy('checkIn', 'desc')
        );
    }, [firestore, uid]);

    const { data, loading, error } = useCollection<any>(bookingsQuery, []);
    
    const bookings = useMemo(() => {
        if (!data) return [];
        return data.map(b => ({
            ...b,
            checkIn: b.checkIn instanceof Timestamp ? b.checkIn.toDate() : new Date(b.checkIn),
            checkOut: b.checkOut instanceof Timestamp ? b.checkOut.toDate() : new Date(b.checkOut),
            createdAt: b.createdAt instanceof Timestamp ? b.createdAt.toDate() : b.createdAt ? new Date(b.createdAt) : null,
        })) as Booking[];
    }, [data]);


    if (error) {
        console.error("Error fetching user bookings:", error);
    }
    
    return { bookings, loading, error };
}
