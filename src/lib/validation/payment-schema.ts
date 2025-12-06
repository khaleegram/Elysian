
'use client';

import { z } from 'zod';
import { DocumentType } from '@/lib/types';

export const paymentSchema = z.object({
  documentType: z.nativeEnum(DocumentType, { required_error: 'Please select a document type.' }),
  documentNumber: z.string().min(6, 'A valid document number is required.'),
  documentImage: z.string().refine(val => val.startsWith('data:image/'), {
    message: "ID document image is required."
  }),
  selfieImage: z.string().optional(),
});

export type PaymentData = z.infer<typeof paymentSchema>;
