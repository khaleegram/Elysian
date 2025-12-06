
'use client';
import { doc, updateDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { AssignmentStatus } from './types';

// This file contains client-side data mutation functions.
// They are intended to be called from client components and will
// interact with Firestore directly from the client.

const { firestore } = initializeFirebase();

export const setStaffAvailability = async (staffId: string, isAvailable: boolean): Promise<void> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const docRef = doc(firestore, 'staff', staffId);
    await updateDoc(docRef, { isAvailable });
};


export const updateServiceRequestStatus = async (id: string, status: 'In-Progress' | 'Completed'): Promise<void> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const docRef = doc(firestore, 'serviceRequests', id);
    await updateDoc(docRef, { status });
};

export const updateAssignmentStatus = async (id: string, status: AssignmentStatus): Promise<void> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const docRef = doc(firestore, 'assignments', id);
    await updateDoc(docRef, { status });
};
