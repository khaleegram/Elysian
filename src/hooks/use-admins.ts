
'use client';
import { useFirestore } from "@/firebase";
import { useCollection } from "@/firebase/hooks";
import { Admin } from "@/lib/types";
import { collection, query } from "firebase/firestore";
import { useMemo } from "react";

export function useAdmins() {
    const firestore = useFirestore();

    const adminsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'admins'));
    }, [firestore]);

    const { data: admins, loading, error } = useCollection<Admin>(adminsQuery, []);

    if (error) {
        console.error("Error fetching admins:", error);
    }
    
    return { admins: admins || [], loading, error };
}
