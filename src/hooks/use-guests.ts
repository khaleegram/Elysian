
'use client';
import { useFirestore } from "@/firebase";
import { useCollection } from "@/firebase/hooks";
import { Guest } from "@/lib/types";
import { collection, query } from "firebase/firestore";
import { useMemo } from "react";

export function useGuests() {
    const firestore = useFirestore();

    const guestsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'guests'));
    }, [firestore]);

    const { data: guests, loading, error } = useCollection<Guest>(guestsQuery, []);

    if (error) {
        console.error("Error fetching guests:", error);
    }
    
    return { guests: guests || [], loading, error };
}
