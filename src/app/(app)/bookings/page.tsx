
'use client';

import { MyBookingsClient } from '@/components/guest/my-bookings-client';
import { useUser } from '@/firebase';
import { useMyBookings } from '@/hooks/use-my-bookings';
import { Loader2, Briefcase } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { GradientTitle } from '@/components/ui/gradient-title';

export default function MyBookingsPage() {
  const user = useUser();
  const router = useRouter();

  // Redirect if user is not logged in after check.
  useEffect(() => {
    if (user === null) {
      router.push('/login');
    }
  }, [user, router]);

  const { bookings, loading } = useMyBookings(user?.uid);
  
  if (user === undefined || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <header className="mb-8">
        <GradientTitle>My Bookings</GradientTitle>
        <p className="mt-2 text-lg text-muted-foreground flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          View your past and upcoming stays.
        </p>
      </header>
      <MyBookingsClient bookings={bookings as any[] || []} />
    </div>
  );
}
