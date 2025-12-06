
'use server';

import { getAvailableRoomsForType } from '@/lib/data';
import { RoomType, Guest, Room } from '@/lib/types';
import { adminDb } from '@/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { createBookingAction } from '@/app/actions';

// Use a simplified session type on the server
interface BookingSession {
    userId: string;
    history: { role: 'user' | 'assistant'; content: string }[];
    checkIn?: string;
    checkOut?: string;
    roomType?: RoomType;
    adults?: string;
    children?: string;
    numberOfRooms?: string;
    documentNumber?: string;
    documentImage?: string;
    selfieImage?: string;
    bookingConfirmed?: boolean;
    updatedAt?: Timestamp;
}


async function getSession(userId: string): Promise<BookingSession> {
    if (!userId) {
        throw new Error("User ID is required to get a session.");
    }
    const sessionRef = adminDb.collection('bookingSessions').doc(userId);
    const sessionDoc = await sessionRef.get();
    if (sessionDoc.exists) {
        const data = sessionDoc.data() as BookingSession;
        return { ...data, history: data.history || [] };
    }
    return { userId, history: [] };
}

async function updateSession(userId: string, data: Partial<BookingSession>): Promise<{ status: string }> {
    if (!userId) {
        throw new Error("User ID is required to update a session.");
    }
    const sessionRef = adminDb.collection('bookingSessions').doc(userId);
    await sessionRef.set({ ...data, updatedAt: Timestamp.now() }, { merge: true });
    return { status: "success" };
}


type UIRequest = 'dates' | 'roomType' | 'numberOfGuests' | 'documentNumber' | 'documentImage' | 'selfieImage' | 'confirmBooking';

export async function bookingAgent(
  userId: string,
  userMessage?: string,
  documentImage?: string,
  selfieImage?: string
): Promise<{ response: string; history: any[]; bookingId?: string; request?: UIRequest }> {
  if (!userId) throw new Error('User not authenticated');

  // Load session and guest info
  let session = await getSession(userId);
  const guestDoc = await adminDb.collection('guests').doc(userId).get();
  const guest: Guest = guestDoc.exists ? (guestDoc.data() as Guest) : { id: userId, name: 'Valued Guest', email: '' };

  // Update session with images if provided
  if (documentImage) session.documentImage = documentImage;
  if (selfieImage) session.selfieImage = selfieImage;
  
  if(userMessage && session.bookingConfirmed) {
      session.bookingConfirmed = false;
  }
  
  await updateSession(userId, session);

  const history = session.history || [];

  if (!userMessage && history.length === 0) {
      return {
          response: "Welcome to ElysianAI! To get started, please provide your desired check-in and check-out dates.",
          history,
          request: 'dates'
      }
  }

  if (userMessage) {
    session.history.push({role: 'user', content: userMessage});
  }


  // --- Step 1: Check for missing info and request it deterministically ---
  if (!session.checkIn || !session.checkOut) {
    const responseText = "Please provide your check-in and check-out dates (e.g., 'Dec 10 to Dec 12').";
    session.history.push({role: 'assistant', content: responseText });
    await updateSession(userId, { history: session.history });
    return {
      response: responseText,
      history,
      request: 'dates'
    };
  }

  if (!session.roomType) {
    const responseText = `Great. Which room type would you like? Your options are: ${Object.values(RoomType).join(', ')}.`;
    session.history.push({role: 'assistant', content: responseText });
    await updateSession(userId, { history: session.history });
    return {
      response: responseText,
      history,
      request: 'roomType'
    };
  }

  if (!session.adults || !session.children || !session.numberOfRooms) {
    const responseText = "Got it. How many adults, children, and rooms will you need?";
    session.history.push({role: 'assistant', content: responseText });
    await updateSession(userId, { history: session.history });
    return {
      response: responseText,
      history,
      request: 'numberOfGuests'
    };
  }

  if (!session.documentNumber) {
    const responseText = "Perfect. For verification, please enter your ID document number (e.g., passport number).";
    session.history.push({role: 'assistant', content: responseText });
    await updateSession(userId, { history: session.history });
    return {
      response: responseText,
      history,
      request: 'documentNumber'
    };
  }

  if (!session.documentImage) {
    const responseText = "Thank you. Now, please upload a clear image of that ID document.";
    session.history.push({role: 'assistant', content: responseText });
    await updateSession(userId, { history: session.history });
    return {
      response: responseText,
      history,
      request: 'documentImage'
    };
  }

  if (!session.selfieImage) {
    const responseText = "Almost done. Please take a live selfie for verification.";
    session.history.push({role: 'assistant', content: responseText });
    await updateSession(userId, { history: session.history });
    return {
      response: responseText,
      history,
      request: 'selfieImage'
    };
  }

  // --- Step 2: Check room availability ---
  const availableRooms: Room[] = await getAvailableRoomsForType(session.roomType, new Date(session.checkIn), new Date(session.checkOut));
  if (!availableRooms.length) {
    const responseText = "Sorry, no rooms of that type are available for your selected dates. Please choose different dates.";
    // Reset dates to re-trigger the check
    await updateSession(userId, { checkIn: undefined, checkOut: undefined, history: [...session.history, {role: 'assistant', content: responseText}] });
    return { response: responseText, history, request: 'dates' };
  }

  // --- Step 3: Confirm booking with the user ---
  if (!session.bookingConfirmed) {
    const summary = `
    Here is your booking summary:
    - **Guest**: ${guest.name}
    - **Dates**: ${session.checkIn} to ${session.checkOut}
    - **Room Type**: ${session.roomType}
    - **Occupancy**: ${session.adults} adults, ${session.children} children in ${session.numberOfRooms} room(s).
    `;
    const responseText = summary + "\nPlease type 'yes' or 'confirm' to finalize this booking.";
    session.history.push({role: 'assistant', content: responseText });
    await updateSession(userId, { history: session.history });
    return { response: responseText, history, request: 'confirmBooking' };
  }

  // --- Step 4: Create booking ---
  const formData = new FormData();
  formData.append('guestId', userId);
  formData.append('guestName', guest.name);
  formData.append('guestEmail', guest.email || '');
  formData.append('guestPhone', guest.phone || '0000000000');
  formData.append('country', 'US'); // Placeholder
  formData.append('documentType', 'Passport'); // Placeholder as AI "detects" it
  formData.append('documentNumber', session.documentNumber!);
  formData.append('documentImage', session.documentImage!);
  formData.append('selfieImage', session.selfieImage!);
  formData.append('checkIn', session.checkIn!);
  formData.append('checkOut', session.checkOut!);
  formData.append('roomType', session.roomType!);
  formData.append('adults', session.adults!);
  formData.append('children', session.children!);
  formData.append('numberOfRooms', session.numberOfRooms!);

  const result = await createBookingAction(formData);

  const bookingId = result.success ? result.bookingId : undefined;
  const finalResponse = result.success ? `Booking confirmed! Your booking ID is ${bookingId}. You will be redirected shortly.` : `Booking failed: ${result.message}`;

  // Update session history
  const finalHistory = [...history, { role: 'assistant', content: finalResponse }];
  await updateSession(userId, { history: finalHistory });

  return { response: finalResponse, history: finalHistory, bookingId };
}
