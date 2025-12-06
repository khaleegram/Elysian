
'use client';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Booking, BookingStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { declineBookingAction, updateBookingStatusAction } from '@/app/actions';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  notes: z.string().min(10, 'Please provide a reason for this action (min. 10 characters).'),
});

interface UpdateBookingStatusDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking;
  action: 'decline' | 'cancel' | 'complete';
}

const actionDetails = {
    decline: {
        title: "Decline Booking",
        description: "This will permanently decline the booking and notify the user. Please provide a reason.",
        buttonText: "Confirm Decline",
        newStatus: BookingStatus.Declined,
        actionFunction: declineBookingAction,
    },
    cancel: {
        title: "Cancel Booking",
        description: "This will cancel the booking. A reason is required for internal records.",
        buttonText: "Confirm Cancellation",
        newStatus: BookingStatus.Cancelled,
        actionFunction: (id: string, newStatus: BookingStatus, formData: FormData) => updateBookingStatusAction(id, newStatus, formData),
    },
    complete: {
        title: "Mark as Completed",
        description: "This will mark the booking as checked-out and complete.",
        buttonText: "Confirm Completion",
        newStatus: BookingStatus.CheckedOut,
        actionFunction: (id: string, newStatus: BookingStatus, formData: FormData) => updateBookingStatusAction(id, newStatus, formData),
    }
}


export function UpdateBookingStatusDialog({ isOpen, onOpenChange, booking, action }: UpdateBookingStatusDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, formState: { errors } } = useForm<{ notes: string }>({ resolver: zodResolver(schema) });

  const details = actionDetails[action];

  const onSubmit = (data: { notes: string }) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('notes', data.notes);
      try {
        if (action === 'decline') {
            await (details.actionFunction as typeof declineBookingAction)(booking.id, formData);
        } else {
             await (details.actionFunction as typeof updateBookingStatusAction)(booking.id, details.newStatus, formData);
        }

        toast({ title: 'Success!', description: `Booking has been ${details.newStatus.toLowerCase()}.` });
        onOpenChange(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : `Failed to ${action} booking.`;
        toast({ variant: 'destructive', title: 'Error', description: message });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{details.title}</DialogTitle>
          <DialogDescription>{details.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="notes">Reason / Notes</Label>
            <Textarea
              id="notes"
              placeholder="e.g., ID verification failed, user requested cancellation..."
              {...register('notes')}
              disabled={isPending}
            />
            {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {details.buttonText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
