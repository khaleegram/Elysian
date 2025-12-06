
'use server';

import { getSession, updateSession } from './session';
import { getAvailableRoomsForType } from '@/lib/data';
import { RoomType, Guest, Room } from '@/lib/types';
import { adminDb } from '@/firebase/admin';
import { doc, getDoc } from 'firebase/firestore';
import { createBookingAction } from '@/app/actions';

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

  // Update session with images if provided, then clear them for the next turn
  if (documentImage) {
      session.documentImage = documentImage;
  }
  if (selfieImage) {
      session.selfieImage = selfieImage;
  }
  
  // If the booking was confirmed and user sends a new message, restart the confirmation process
  if(userMessage && session.bookingConfirmed) {
      session.bookingConfirmed = false;
  }
  
  if (userMessage) {
    session.history.push({role: 'user', content: userMessage});
  }

  // --- Start of Deterministic Logic ---

  if (session.history.length === 0 || (session.history.length === 1 && session.history[0].role === 'user')) {
      const welcomeMessage = "Welcome to ElysianAI! To get started, please provide your desired check-in and check-out dates.";
      session.history.push({role: 'assistant', content: welcomeMessage});
      await updateSession(userId, { history: session.history });
      return {
          response: welcomeMessage,
          history: session.history,
          request: 'dates'
      }
  }
  
  // Simple NLP for demo purposes
  if (userMessage) {
    if (!session.checkIn || !session.checkOut) {
        const checkIn = new Date();
        const checkOut = new Date();
        checkOut.setDate(checkIn.getDate() + 2); // default to 2 nights if not specified
        session.checkIn = checkIn.toISOString().split('T')[0];
        session.checkOut = checkOut.toISOString().split('T')[0];
    } else if (!session.roomType) {
        const roomTypeMatch = userMessage.match(/Standard|Deluxe|Suite/i);
        session.roomType = roomTypeMatch ? roomTypeMatch[0] as RoomType : undefined;
    } else if (!session.adults) {
        // A real implementation would parse this better
        session.adults = "2";
        session.children = "0";
        session.numberOfRooms = "1";
    } else if (!session.documentNumber) {
        session.documentNumber = userMessage;
    } else if (userMessage.toLowerCase() === 'yes' || userMessage.toLowerCase() === 'confirm') {
        session.bookingConfirmed = true;
    }
  }

  await updateSession(userId, session);


  // --- Step 1: Check for missing info and request it deterministically ---
  if (!session.checkIn || !session.checkOut) {
    const responseText = "Please provide your check-in and check-out dates (e.g., 'Dec 10 to Dec 12').";
    if (session.history[session.history.length-1].content !== responseText) {
        session.history.push({role: 'assistant', content: responseText });
        await updateSession(userId, { history: session.history });
    }
    return {
      response: responseText,
      history: session.history,
      request: 'dates'
    };
  }

  if (!session.roomType) {
    const responseText = `Great. Which room type would you like? Your options are: ${Object.values(RoomType).join(', ')}.`;
     if (session.history[session.history.length-1].content !== responseText) {
        session.history.push({role: 'assistant', content: responseText });
        await updateSession(userId, { history: session.history });
    }
    return {
      response: responseText,
      history: session.history,
      request: 'roomType'
    };
  }

  if (!session.adults || !session.children || !session.numberOfRooms) {
    const responseText = "Got it. How many adults, children, and rooms will you need?";
    if (session.history[session.history.length-1].content !== responseText) {
        session.history.push({role: 'assistant', content: responseText });
        await updateSession(userId, { history: session.history });
    }
    return {
      response: responseText,
      history: session.history,
      request: 'numberOfGuests'
    };
  }

  if (!session.documentNumber) {
    const responseText = "Perfect. For verification, please enter your ID document number (e.g., passport number).";
    if (session.history[session.history.length-1].content !== responseText) {
        session.history.push({role: 'assistant', content: responseText });
        await updateSession(userId, { history: session.history });
    }
    return {
      response: responseText,
      history: session.history,
      request: 'documentNumber'
    };
  }

  if (!session.documentImage) {
    const responseText = "Thank you. Now, please upload a clear image of that ID document.";
    if (session.history[session.history.length-1].content !== responseText) {
        session.history.push({role: 'assistant', content: responseText });
        await updateSession(userId, { history: session.history });
    }
    return {
      response: responseText,
      history: session.history,
      request: 'documentImage'
    };
  }

  if (!session.selfieImage) {
    const responseText = "Almost done. Please take a live selfie for verification.";
    if (session.history[session.history.length-1].content !== responseText) {
        session.history.push({role: 'assistant', content: responseText });
        await updateSession(userId, { history: session.history });
    }
    return {
      response: responseText,
      history: session.history,
      request: 'selfieImage'
    };
  }

  // --- Step 2: Check room availability ---
  const availableRooms: Room[] = await getAvailableRoomsForType(session.roomType, new Date(session.checkIn), new Date(session.checkOut));
  if (availableRooms.length === 0) {
    const responseText = "Sorry, no rooms of that type are available for your selected dates. Please choose different dates.";
    // Reset dates to re-trigger the check
    await updateSession(userId, { checkIn: undefined, checkOut: undefined, history: [...session.history, {role: 'assistant', content: responseText}] });
    return { response: responseText, history: session.history, request: 'dates' };
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
    return { response: responseText, history: session.history, request: 'confirmBooking' };
  }

  // --- Step 4: Create booking ---
  const formData = new FormData();
  formData.append('guestId', userId);
  formData.append('guestName', guest.name);
  formData.append('guestEmail', guest.email || '');
  formData.append('guestPhone', (guest as any).phone || '0000000000');
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
  session.history.push({ role: 'assistant', content: finalResponse });
  await updateSession(userId, { history: session.history });

  return { response: finalResponse, history: session.history, bookingId };
}
