
'use client';

import { useState } from 'react';
import type { GuestInfoData } from '@/lib/validation/guest-info-schema';

export function useBookingFlow(initialStep = 0) {
  const [step, setStep] = useState(initialStep);
  const [guestInfo, setGuestInfo] = useState<GuestInfoData | null>(null);

  const goBack = () => {
    setStep(prev => (prev > 1 ? prev - 1 : 1));
  };

  const goNext = () => {
    setStep(prev => prev + 1);
  };
  
  const resetFlow = () => {
    setStep(0);
    setGuestInfo(null);
  };

  return {
    step,
    guestInfo,
    setStep,
    setGuestInfo,
    goBack,
    goNext,
    resetFlow,
  };
}
