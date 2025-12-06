

'use server';

import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from '@/firebase/admin';
import type { Assignment, AuditLogEntry, Booking, Room, RoomType, ServiceRequest, ServiceRequestStatus, PaymentMethod, Guest, UserRole, Admin, DocumentType, RoomImage, Staff, StaffType } from './types';
import { BookingStatus } from './types';

// --- Data Fetching Functions ---

export const getRooms = async (): Promise<Room[]> => {
  const snapshot = await adminDb.collection('rooms').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
};

export const getRoomById = async (id: string): Promise<Room | undefined> => {
    const docRef = adminDb.collection('rooms').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return undefined;
    return { id: docSnap.id, ...docSnap.data() } as Room;
}

export const getBookings = async (): Promise<any[]> => {
  const snapshot = await adminDb.collection('bookings').orderBy('checkIn', 'desc').get();
  return snapshot.docs.map(doc => {
      const data = doc.data();
      // Convert Timestamps to ISO strings
      return { 
        id: doc.id, 
        ...data,
        checkIn: data.checkIn ? (data.checkIn as Timestamp).toDate().toISOString() : null,
        checkOut: data.checkOut ? (data.checkOut as Timestamp).toDate().toISOString() : null,
        createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate().toISOString() : null,
      };
  });
};

export const getServiceRequests = async (): Promise<any[]> => {
  const snapshot = await adminDb.collection('serviceRequests').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return { 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate().toISOString() : null,
    };
  });
};

export const getGuests = async (): Promise<Guest[]> => {
    const snapshot = await adminDb.collection('guests').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Guest));
}
export const getAdmins = async (): Promise<Admin[]> => {
    const snapshot = await adminDb.collection('admins').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Admin));
}

export const getStaff = async (): Promise<Staff[]> => {
    const snapshot = await adminDb.collection('staff').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
}

export const getAssignments = async (): Promise<any[]> => {
  const snapshot = await adminDb.collection('assignments').orderBy('assignedAt', 'desc').limit(10).get();
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return { 
        id: doc.id, 
        ...data,
        assignedAt: data.assignedAt ? (data.assignedAt as Timestamp).toDate().toISOString() : null,
    };
  });
};


export const getGuestById = async (id: string): Promise<Guest | undefined> => {
    const docRef = adminDb.collection('guests').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return undefined;
    return { id: docSnap.id, ...docSnap.data() } as Guest;
}
export const getAdminById = async (id: string): Promise<Admin | undefined> => {
    const docRef = adminDb.collection('admins').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return undefined;
    return { id: docSnap.id, ...docSnap.data() } as Admin;
}

export const getBookingById = async (id: string): Promise<any | undefined> => {
  const docRef = adminDb.collection('bookings').doc(id);
  const docSnap = await docRef.get();
  if (!docSnap.exists) return undefined;
  const data = docSnap.data();
  if (!data) return undefined;
  return { 
      id: docSnap.id, 
      ...data,
      checkIn: data.checkIn ? (data.checkIn as Timestamp).toDate().toISOString() : null,
      checkOut: data.checkOut ? (data.checkOut as Timestamp).toDate().toISOString() : null,
      createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate().toISOString() : null,
    };
};

export const getRequestsByBookingId = async (bookingId: string): Promise<any[]> => {
    const q = adminDb.collection("serviceRequests").where("bookingId", "==", bookingId);
    const snapshot = await q.get();
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id, 
            ...data,
            createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate().toISOString() : null,
        };
    });
};

export async function getAvailableRoomsForType(roomType: RoomType, checkIn: Date, checkOut: Date): Promise<Room[]> {
    
    // 1. Find all rooms of the given type
    const roomsSnapshot = await adminDb.collection('rooms').where('type', '==', roomType).get();
    if (roomsSnapshot.empty) {
        return [];
    }
    const allRoomsOfType = roomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
    const roomIds = allRoomsOfType.map(room => room.id);

    // If there are no rooms of the type, no need to check reservations.
    if (roomIds.length === 0) {
        return [];
    }

    // 2. Find all reservations for these rooms
    // We fetch all reservations and filter in memory to avoid needing a composite index.
    const reservationsRef = adminDb.collection('reservations');
    const overlappingReservationsQuery = reservationsRef.where('roomId', 'in', roomIds);

    const overlappingSnapshot = await overlappingReservationsQuery.get();

    const busyRoomIds = new Set<string>();
    overlappingSnapshot.forEach(doc => {
        const reservation = doc.data();
        const resCheckIn = (reservation.checkIn as Timestamp).toDate();
        const resCheckOut = (reservation.checkOut as Timestamp).toDate();
        
        // The condition for overlap:
        // (ourCheckIn < resCheckOut) AND (ourCheckOut > resCheckIn)
        if (checkIn < resCheckOut && checkOut > resCheckIn) {
            busyRoomIds.add(reservation.roomId);
        }
    });

    // 3. Filter out the busy rooms
    const availableRooms = allRoomsOfType.filter(room => !busyRoomIds.has(room.id));
    
    return availableRooms;
}

export const getAvailableStaff = async (staffType: StaffType): Promise<Staff[]> => {
    const snapshot = await adminDb.collection('staff')
        .where('staffType', '==', staffType)
        .where('isAvailable', '==', true)
        .get();
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
}

// --- Data Mutation Functions ---

export const createRoom = async (data: { number: string; type: RoomType; price: number, images?: RoomImage[] }): Promise<Room> => {
  const newRoomData = {
    ...data,
    status: 'Available' as const,
  };
  const docRef = await adminDb.collection('rooms').add(newRoomData);
  return { id: docRef.id, ...newRoomData } as Room;
};

export const updateRoom = async (roomId: string, data: Partial<Room>): Promise<void> => {
    const roomRef = adminDb.collection('rooms').doc(roomId);
    await roomRef.update(data);
};

export const deleteRoom = async (roomId: string): Promise<void> => {
    await adminDb.collection('rooms').doc(roomId).delete();
};


const findOrCreateGuest = async (db: FirebaseFirestore.Firestore, guestData: {uid: string, name: string, email: string, phone: string}) => {
    const guestRef = db.collection('guests').doc(guestData.uid);
    const guestDoc = await guestRef.get();

    if (!guestDoc.exists) {
        const newGuestData: Omit<Guest, 'id'> = {
             name: guestData.name, 
             email: guestData.email, 
             phone: guestData.phone, 
             bookingHistory: [] 
        };
        await guestRef.set(newGuestData);
    }
    return guestRef;
};

export const createBooking = async (bookingData: Omit<Booking, 'id' | 'accessPin'>): Promise<Booking> => {
    const { guestId, guestName, guestEmail, guestPhone } = bookingData;

    try {
        const newBookingRef = adminDb.collection('bookings').doc(); // Create a new ref with a unique ID

        // Generate PIN and set server timestamp for creation
        const accessPin = Math.floor(1000 + Math.random() * 9000).toString();
        const finalBookingData = {
            ...bookingData,
            checkIn: Timestamp.fromDate(bookingData.checkIn as Date),
            checkOut: Timestamp.fromDate(bookingData.checkOut as Date),
            accessPin,
            createdAt: FieldValue.serverTimestamp(),
        };

        // Set the booking data
        await newBookingRef.set(finalBookingData);

        // Update guest history
        const guestRef = await findOrCreateGuest(adminDb, { uid: guestId, name: guestName, email: guestEmail, phone: guestPhone });
        await guestRef.update({
            bookingHistory: FieldValue.arrayUnion(newBookingRef.id)
        });

        return { id: newBookingRef.id, ...finalBookingData } as unknown as Booking;

    } catch (error) {
        console.error("Booking creation failed: ", error);
        // Re-throw a generic error to be handled by the action.
        throw new Error("Failed to create booking record in database.");
    }
};

export const updateBookingPayment = async (bookingId: string, paymentId: string): Promise<void> => {
  const docRef = adminDb.collection('bookings').doc(bookingId);
  await docRef.update({ paymentId, status: BookingStatus.Approved });
};


export const updateBooking = async (id: string, updates: Partial<Booking>, auditLogEntry?: Omit<AuditLogEntry, 'timestamp'> & { timestamp: Date }): Promise<void> => {
  const docRef = adminDb.collection('bookings').doc(id);

  const updateData: any = { ...updates };

  if (auditLogEntry) {
    // Firestore Admin SDK can accept a JS Date object directly
    updateData.auditLog = FieldValue.arrayUnion(auditLogEntry);
  }

  await docRef.update(updateData);
};

export const updateUserRole = async (userId: string, role: UserRole, staffType?: StaffType): Promise<void> => {
    
    await adminAuth.setCustomUserClaims(userId, { role });

    // Ensure the corresponding document exists in the correct collection
    if (role === 'admin') {
        const userRecord = await adminAuth.getUser(userId);
        const adminData: Omit<Admin, 'id'> = {
            name: userRecord.displayName || userRecord.email || 'New Admin',
            email: userRecord.email || '',
            role: 'admin'
        };
        await adminDb.collection('admins').doc(userId).set(adminData, { merge: true });
    } else if (role === 'staff') {
        if (!staffType) {
            throw new Error("A staff type (e.g., Housekeeping) is required when assigning the staff role.");
        }
        const userRecord = await adminAuth.getUser(userId);
        const staffData: Partial<Staff> = {
            name: userRecord.displayName || userRecord.email || 'New Staff',
            email: userRecord.email,
            role: 'staff',
            staffType: staffType,
            isAvailable: true, 
        };
        await adminDb.collection('staff').doc(userId).set(staffData, { merge: true });
    }
};

export const checkInBooking = async (bookingId: string, roomId: string): Promise<void> => {
    
    const batch = adminDb.batch();

    const bookingRef = adminDb.collection('bookings').doc(bookingId);
    batch.update(bookingRef, { status: 'Checked-In', roomId: roomId });
    
    const roomRef = adminDb.collection('rooms').doc(roomId);
    batch.update(roomRef, { status: 'Occupied' });

    // Create a reservation lock
    const bookingDoc = await bookingRef.get();
    const bookingData = bookingDoc.data();
    if (bookingData) {
        const reservationRef = adminDb.collection('reservations').doc();
        batch.set(reservationRef, {
            roomId: roomId,
            bookingId: bookingId,
            checkIn: bookingData.checkIn,
            checkOut: bookingData.checkOut,
        });
    }

    await batch.commit();
};

export const createServiceRequest = async (bookingId: string, data: Omit<ServiceRequest, 'id' | 'bookingId' | 'status' | 'createdAt'>): Promise<ServiceRequest> => {
    const newRequestData = {
        ...data,
        bookingId,
        status: 'Pending' as const,
        createdAt: FieldValue.serverTimestamp(),
    };
    const docRef = await adminDb.collection('serviceRequests').add(newRequestData);
    
    const createdRequest = {
        id: docRef.id,
        ...data,
        bookingId,
        status: 'Pending',
        createdAt: Timestamp.now(),
    } as ServiceRequest;

    return createdRequest;
};


export const updateServiceRequestStatus = async (id: string, status: ServiceRequestStatus): Promise<void> => {
    const docRef = adminDb.collection('serviceRequests').doc(id);
    await docRef.update({ status });
};

export const setStaffAvailability = async (staffId: string, isAvailable: boolean): Promise<void> => {
    const docRef = adminDb.collection('staff').doc(staffId);
    await docRef.update({ isAvailable });
};

export const createAssignment = async (data: {serviceRequestId: string, staffId: string}): Promise<Assignment> => {
    const newAssignmentData = {
        ...data,
        status: 'Assigned' as const,
        assignedAt: FieldValue.serverTimestamp(),
    };
    const docRef = await adminDb.collection('assignments').add(newAssignmentData);
    
    // Also update the service request to 'In-Progress'
    await adminDb.collection('serviceRequests').doc(data.serviceRequestId).update({
        status: 'In-Progress'
    });

    return { id: docRef.id, ...newAssignmentData } as unknown as Assignment;
};

    

    

      