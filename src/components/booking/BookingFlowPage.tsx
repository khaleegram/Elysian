
'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { Loader2, CheckCircle } from 'lucide-react';
import { Room } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useBookingFlow } from '@/hooks/useBookingFlow';
import { GuestInfoStep } from './steps/GuestInfoStep';
import { createBookingAction } from '@/app/actions';
import { BookingLayout } from './BookingLayout';
import { useRouter } from 'next/navigation';


// Define a final success step type
type BookingStatus = 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR';

export function BookingFlowPage({ room, checkIn, checkOut }: { room: Room; checkIn: string; checkOut: string }) {
    const user = useUser();
    const router = useRouter();
    const { toast } = useToast();
    const [pageStatus, setPageStatus] = useState<BookingStatus>('IDLE');

    const {
        step,
        guestInfo,
        setStep,
        setGuestInfo,
    } = useBookingFlow();

    // 1. Authentication Check & Start Flow
    useEffect(() => {
        if (user === undefined) {
            setPageStatus('LOADING');
            return;
        }
        if (user === null) {
            const redirectUrl = `/login?redirect=${encodeURIComponent(`/booking?roomId=${room.id}&checkIn=${checkIn}&checkOut=${checkOut}`)}`;
            router.push(redirectUrl);
            return;
        }
        if (user && step === 0) {
            setStep(1);
            setPageStatus('IDLE');
        }
    }, [user, step, setStep, room.id, checkIn, checkOut, router]);

    // 2. Step Handlers
    const handleGuestInfoSubmit = async (data: any) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'User not authenticated.' });
            return;
        }
        setPageStatus('LOADING');
        setGuestInfo(data);
        
        const finalData = new FormData();
        finalData.append('guestId', user.uid);
        finalData.append('guestName', data.guestName);
        finalData.append('guestEmail', data.guestEmail);
        finalData.append('guestPhone', data.guestPhone);
        finalData.append('country', data.country);
        finalData.append('checkIn', checkIn);
        finalData.append('checkOut', checkOut);
        finalData.append('roomType', room.type);
        finalData.append('documentType', data.documentType);
        finalData.append('documentNumber', data.documentNumber);
        finalData.append('documentImage', data.documentImage);
        finalData.append('selfieImage', data.selfieImage);
        // Add occupancy details
        finalData.append('adults', data.adults || '1');
        finalData.append('children', data.children || '0');
        finalData.append('numberOfRooms', data.numberOfRooms || '1');


        let result;
        try {
            result = await createBookingAction(finalData);
            if (!result.success) {
                 throw new Error(result.message || "Failed to create booking.");
            }
        } catch (error) {
            console.error("Booking Failed:", error);
            const message = error instanceof Error ? error.message : "An unknown error occurred during booking creation.";
            toast({ variant: 'destructive', title: 'Booking Failed', description: message });
            setPageStatus('IDLE');
            return;
        }

        // Redirect only on success, outside the try...catch block
        if (result.success && result.bookingId) {
            router.push(`/booking/${result.bookingId}/status`);
        }
    };


    // 3. Render Logic
    const renderStepContent = () => {
        if (pageStatus === 'LOADING') {
            return (
                <div className="flex flex-col items-center justify-center h-96">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="mt-4 text-lg text-muted-foreground">
                        {step === 0 ? 'Verifying user...' : 'Submitting verification...'}
                    </p>
                </div>
            );
        }
        
        switch (step) {
            case 1:
                return <GuestInfoStep user={user} onSubmit={handleGuestInfoSubmit} isSubmitting={pageStatus === 'LOADING'} />;
            default:
                 return (
                    <div className="flex flex-col items-center justify-center h-96">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                );
        }
    };

    return (
        <BookingLayout currentStep={step} totalSteps={1}>
            {renderStepContent()}
        </BookingLayout>
    );
}

    