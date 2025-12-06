'use client';

import { useFormState } from 'react-dom';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ServiceRequestType } from '@/lib/types';
import { createServiceRequestAction } from '@/app/actions';
import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Submit Request
        </Button>
    )
}

const placeholderMap: Record<ServiceRequestType, string> = {
    'Room Service': 'e.g., I would like to order a club sandwich and a coke.',
    'Housekeeping': 'e.g., Could we please have two extra towels?',
    'Maintenance': 'e.g., The sink in my bathroom is clogged.',
};

export function ServiceRequestForm({ bookingId, type }: { bookingId: string, type: ServiceRequestType }) {
  const [state, formAction] = useFormState(createServiceRequestAction, { message: '' });
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.message) {
      toast({
        title: 'Request Sent!',
        description: state.message,
      });
      formRef.current?.reset();
    }
  }, [state, toast]);

  const placeholderText = placeholderMap[type] || "Let us know what you need. Please be as specific as possible.";

  return (
    <Card>
      <CardHeader>
        <CardTitle>New {type} Request</CardTitle>
        <CardDescription>{placeholderText}</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="bookingId" value={bookingId} />
          <Textarea 
            name="requestText" 
            placeholder="Type your request here..." 
            required 
            rows={4}
          />
          <div className="flex justify-end">
            <SubmitButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
