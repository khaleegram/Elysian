
import { Timestamp } from 'firebase/firestore';

export enum RoomStatus {
    Available = 'Available',
    Occupied = 'Occupied',
    Dirty = 'Dirty',
    Maintenance = 'Maintenance'
};

export enum RoomType {
  Standard = 'Standard',
  Deluxe = 'Deluxe',
  Suite = 'Suite',
}

export interface RoomImage {
    url: string;
    publicId: string;
}

export interface Room {
  id: string; 
  number: string;
  type: RoomType;
  status: RoomStatus;
  price: number;
  images?: RoomImage[];
}

export enum BookingStatus {
    Approved = 'Approved',
    ReviewNeeded = 'Review Needed',
    Declined = 'Declined',
    CheckedIn = 'Checked-In',
    CheckedOut = 'Checked-Out',
    Cancelled = 'Cancelled'
};

export enum PaymentMethod {
    Paystack = 'Paystack',
    Card = 'Card',
    BankTransfer = 'Bank Transfer',
    PayLater = 'Pay Later'
};

export enum DocumentType {
    Passport = 'Passport',
    DriversLicense = "Driver's License",
    NIN = "National ID (NIN)",
}

export interface AuditLogEntry {
  timestamp: Timestamp;
  adminId: string;
  adminName: string;
  action: string;
  notes?: string;
}

export interface Booking {
  id: string;
  guestId: string; // Link to the Guest entity
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  country: string;
  adults: number;
  children: number;
  numberOfRooms: number;
  documentType: DocumentType;
  documentNumber: string;
  documentImageUrl: string;
  selfieImageUrl?: string;
  checkIn: Timestamp | Date; 
  checkOut: Timestamp | Date; 
  roomType: RoomType;
  roomId: string | null; 
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  paymentId?: string;
  fraudScore?: number;
  fraudReasoning?: string;
  accessPin?: string;
  notes?: string;
  auditLog?: AuditLogEntry[];
  createdAt?: Timestamp | Date;
}

export enum ServiceRequestType {
    RoomService = 'Room Service',
    Housekeeping = 'Housekeeping',
    Maintenance = 'Maintenance'
};
export type ServiceRequestStatus = 'Pending' | 'In-Progress' | 'Completed';

export interface ServiceRequest {
  id: string;
  bookingId: string;
  type: ServiceRequestType;
  description: string;
  status: ServiceRequestStatus;
  createdAt: Timestamp; 
}

export type UserRole = 'guest' | 'admin' | 'staff';

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bookingHistory?: string[]; // Array of booking IDs
}

export interface Admin {
    id: string;
    name: string;
    email: string;
    role: 'admin';
}

export interface Reservation {
    id: string;
    roomId: string;
    bookingId: string;
    checkIn: Timestamp;
    checkOut: Timestamp;
}


// --- New Staff & Assignment Types ---

export const StaffType = ServiceRequestType;
export type StaffType = ServiceRequestType;


export interface Staff {
    id: string;
    name: string;
    email?: string;
    role: 'staff';
    staffType: StaffType;
    isAvailable: boolean;
}

export type AssignmentStatus = 'Assigned' | 'Completed';

export interface Assignment {
    id: string;
    serviceRequestId: string;
    staffId: string;
    assignedAt: Timestamp;
    status: AssignmentStatus;
}
