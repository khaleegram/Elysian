
import { z } from 'zod';
import { DocumentType } from '@/lib/types';
import { countries } from '@/lib/constants';

export const guestInfoSchema = z.object({
  guestName: z.string().min(2, 'Name is required'),
  guestEmail: z.string().email('A valid email is required'),
  guestPhone: z.string().min(10, 'A valid phone number is required'),
  country: z.string().refine(val => countries.some(c => c.value === val), {
    message: "Please select a valid country."
  }),
  documentType: z.nativeEnum(DocumentType, { required_error: 'Please select a document type.' }),
  documentNumber: z.string().min(6, 'A valid document number is required.'),
  documentImage: z.string().refine(val => val.startsWith('data:image/'), {
    message: "ID document image is required."
  }),
  selfieImage: z.string().refine(val => val.startsWith('data:image/'), {
    message: "A live selfie is required for verification."
  }),
  adults: z.string().optional(),
  children: z.string().optional(),
  numberOfRooms: z.string().optional(),
});

export type GuestInfoData = z.infer<typeof guestInfoSchema>;
