
'use client';

import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import { useState } from 'react';
import { initializePaystack } from '@/lib/booking/paystack';
import { useToast } from '@/hooks/use-toast';
import { processPaymentAction } from '@/app/actions';
import { useRouter } from 'next/navigation';

interface PaymentStepProps {
  guestEmail: string;
  amount: number;
  bookingId: string;
}

export function PaymentStep({ guestEmail, amount, bookingId }: PaymentStepProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const paystackRef = await initializePaystack({ email: guestEmail, amount });
      const result = await processPaymentAction(bookingId, paystackRef);

      if (result.success) {
        toast({ title: 'Payment Successful!', description: 'Your booking is confirmed.' });
        router.push(`/pass/${bookingId}`); // Redirect to the digital pass
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: message,
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div>
        <h2 className="text-3xl font-bold font-headline">Final Step: Secure Payment</h2>
        <p className="text-muted-foreground">Please complete the payment to confirm your booking.</p>
      </div>

      <div className="p-6 bg-primary/5 border-primary/20 rounded-lg">
        <p className="text-muted-foreground">Total Amount Due</p>
        <p className="text-4xl font-bold">{formatCurrency(amount)}</p>
      </div>

      <Button onClick={handlePayment} disabled={isProcessing} size="lg" className="w-full">
        {isProcessing ? (
          <><Loader2 className="h-5 w-5 animate-spin mr-2" />Processing Payment...</>
        ) : (
          <><Send className="h-5 w-5 mr-2" />Pay Now</>
        )}
      </Button>
    </div>
  );
}
