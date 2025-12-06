
'use client';
import { useFirestore } from "@/firebase";
import { useCollection } from "@/firebase/hooks";
import { Assignment } from "@/lib/types";
import { collection, query, orderBy, Timestamp } from "firebase/firestore";
import { useMemo } from "react";

// Centralized and robust date conversion function
const toDate = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (value instanceof Timestamp) return value.toDate();
    if (typeof value === 'string') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
    }
    if (value && typeof value.seconds === 'number') {
        const date = new Date(value.seconds * 1000);
        return isNaN(date.getTime()) ? null : date;
    }
    return null;
}


export function useAssignments() {
    const firestore = useFirestore();

    const assignmentsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'assignments'), orderBy('assignedAt', 'desc'));
    }, [firestore]);

    const { data, loading, error } = useCollection<any>(assignmentsQuery, []);
    
    const assignments = useMemo(() => {
        if (!data) return [];
        return data.map(a => {
            const assignedAtDate = toDate(a.assignedAt);
            
            return {
                ...a,
                assignedAt: assignedAtDate,
            } as Assignment;
        });
    }, [data]);


    if (error) {
        console.error("Error fetching assignments:", error);
    }
    
    return { assignments: assignments || [], loading, error };
}
