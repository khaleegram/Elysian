
'use client';
import { useFirestore } from "@/firebase";
import { useCollection } from "@/firebase/hooks";
import { Staff } from "@/lib/types";
import { collection, query } from "firebase/firestore";
import { useMemo } from "react";

export function useStaff() {
    const firestore = useFirestore();

    const staffQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'staff'));
    }, [firestore]);

    const { data: staff, loading, error } = useCollection<Staff>(staffQuery, []);

    if (error) {
        console.error("Error fetching staff:", error);
    }
    
    return { staff: staff || [], loading, error };
}
