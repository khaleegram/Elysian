
'use client';
import { useFirestore } from "@/firebase";
import { useCollection } from "@/firebase/hooks";
import { ServiceRequest } from "@/lib/types";
import { collection, query, orderBy, Timestamp } from "firebase/firestore";
import { useMemo } from "react";

export function useServiceRequests() {
    const firestore = useFirestore();

    const requestsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'serviceRequests'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data, loading, error } = useCollection<any>(requestsQuery, []);
    
    const requests = useMemo(() => {
        if (!data) return [];
        return data.map(r => ({
            ...r,
            createdAt: r.createdAt instanceof Timestamp ? r.createdAt.toDate() : new Date(r.createdAt),
        })) as ServiceRequest[];
    }, [data]);


    if (error) {
        console.error("Error fetching service requests:", error);
    }
    
    return { requests, loading, error };
}
