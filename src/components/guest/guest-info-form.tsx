
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import type { User } from 'firebase/auth';

const formSchema = z.object({
  guestName: z.string().min(2, 'Name is required'),
  guestEmail: z.string().email('A valid email is required'),
  guestPhone: z.string().min(10, 'A valid phone number is required'),
});

export type GuestInfoData = z.infer<typeof formSchema>;

interface GuestInfoFormProps {
  user: User | null;
  onSubmit: (data: GuestInfoData) => void;
}

export function GuestInfoForm({ user, onSubmit }: GuestInfoFormProps) {
  const form = useForm<GuestInfoData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      guestName: user?.displayName || '',
      guestEmail: user?.email || '',
      guestPhone: user?.phoneNumber || '',
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-headline text-2xl">Guest Information</DialogTitle>
        <DialogDescription>
          {user ? `Welcome back, ${user.displayName}! Please confirm your details.` : 'Let\'s start with some basic information.'}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <FormField
            control={form.control}
            name="guestName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="guestEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="guestPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="(123) 456-7890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button type="submit">Next Step</Button>
          </div>
        </form>
      </Form>
    </>
  );
}
