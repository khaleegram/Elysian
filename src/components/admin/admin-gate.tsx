
'use client';

import { useRole } from '@/hooks/use-role';
import { Loader2 } from 'lucide-react';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

/**
 * This component is the definitive security gate for the admin section.
 * It uses the `useRole` hook to check for Firebase Custom Claims.
 * It ensures that only users with the 'admin' role can access the children.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const { role, loading } = useRole();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <span className="sr-only">Verifying administrator access...</span>
      </div>
    );
  }

  // After loading, if the role is not 'admin', deny access.
  if (role !== 'admin') {
    redirect('/'); // Redirect to a safe, non-admin page
    return null; // Return null while redirecting
  }

  // If all checks pass, render the children (the admin pages).
  return <>{children}</>;
}
