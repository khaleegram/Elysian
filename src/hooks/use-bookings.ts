
'use client';
import { useFirestore } from "@/firebase";
import { useCollection } from "@/firebase/hooks";
import { Booking } from "@/lib/types";
import { collection, query, orderBy, Timestamp } from "firebase/firestore";
import { useMemo } from "react";

export function useBookings() {
    const firestore = useFirestore();

    const bookingsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'bookings'), orderBy('checkIn', 'desc'));
    }, [firestore]);

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
        console.error("Error fetching bookings:", error);
    }
    
    return { bookings, loading, error };
}
