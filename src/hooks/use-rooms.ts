
'use client';
import { useFirestore } from "@/firebase";
import { useCollection } from "@/firebase/hooks";
import { Room } from "@/lib/types";
import { collection } from "firebase/firestore";
import { useMemo } from "react";

export function useRooms() {
    const firestore = useFirestore();

    const roomsQuery = useMemo(() => {
        if (!firestore) return null;
        return collection(firestore, 'rooms');
    }, [firestore]);

    const { data: rooms, loading, error } = useCollection<Room>(roomsQuery, []);

    if (error) {
        console.error("Error fetching rooms:", error);
    }
    
    return { rooms, loading, error };
}
