
'use client';
import { useFirestore } from "@/firebase";
import { useDoc } from "@/firebase/hooks";
import { Guest } from "@/lib/types";
import { doc } from "firebase/firestore";
import { useMemo } from "react";

/**
 * Fetches the Guest profile data for a given user ID.
 * @param uid The Firebase Auth user ID.
 * @returns The guest profile and loading state.
 */
export function useGuest(uid?: string) {
    const firestore = useFirestore();

    // Memoize the document reference to prevent re-renders
    const guestRef = useMemo(() => {
        if (!firestore || !uid) return null;
        return doc(firestore, 'guests', uid);
    }, [firestore, uid]);

    // Use the useDoc hook to get real-time document data
    const { data: guest, loading, error } = useDoc<Guest>(guestRef);

    if (error) {
        console.error("Error fetching guest profile:", error);
    }
    
    return { guest, loading, error };
}
