
'use client';
import { useFirestore } from "@/firebase";
import { useDoc } from "@/firebase/hooks";
import { Admin } from "@/lib/types";
import { doc } from "firebase/firestore";
import { useMemo } from "react";

/**
 * Fetches the Admin profile data for a given user ID.
 * This hook is used to determine if a user has admin privileges.
 * @param uid The Firebase Auth user ID.
 * @returns The admin profile and loading state.
 */
export function useAdmin(uid?: string) {
    const firestore = useFirestore();

    // Memoize the document reference to prevent re-renders
    const adminRef = useMemo(() => {
        if (!firestore || !uid) return null;
        // The document ID in the 'admins' collection is the user's UID.
        return doc(firestore, 'admins', uid);
    }, [firestore, uid]);

    // Use the useDoc hook to get real-time document data.
    // If a document exists, the user is an admin.
    const { data: admin, loading, error } = useDoc<Admin>(adminRef);

    if (error) {
        // This error is expected if the user is not an admin, so we don't need to log it aggressively.
        // It simply means the document wasn't found, which is normal for non-admin users.
    }
    
    return { admin, loading, error };
}
