
import { User } from 'firebase/auth';
import { Room } from '@/lib/types';
import { GuestInfoData } from '@/lib/validation/guest-info-schema';
import { PaymentData } from '@/lib/validation/payment-schema';

interface PrepareDataParams {
  user: User;
  guestInfo: GuestInfoData;
  paymentData: PaymentData;
  paystackRef: string;
  room: Room;
  checkIn: string;
  checkOut: string;
}

export function prepareFinalData({
  user,
  guestInfo,
  paymentData,
  paystackRef,
  room,
  checkIn,
  checkOut,
}: PrepareDataParams): FormData {
  const formData = new FormData();

  formData.append('guestId', user.uid);
  formData.append('guestName', guestInfo.guestName);
  formData.append('guestEmail', guestInfo.guestEmail);
  formData.append('guestPhone', guestInfo.guestPhone);
  formData.append('checkIn', checkIn);
  formData.append('checkOut', checkOut);
  formData.append('roomType', room.type);
  formData.append('documentType', paymentData.documentType);
  formData.append('documentNumber', paymentData.documentNumber);
  formData.append('documentImage', paymentData.documentImage);
  formData.append('selfieImage', paymentData.selfieImage);
  formData.append('paymentMethod', 'Paystack');
  formData.append('paymentReference', paystackRef);

  return formData;
}
