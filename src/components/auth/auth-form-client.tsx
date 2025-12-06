'use client';

import { useEffect, useState } from 'react';
import { AuthForm } from './auth-form';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

/**
 * This component acts as a client-side boundary to prevent hydration errors.
 * It ensures that the AuthForm, which uses components that generate dynamic IDs,
 * is only rendered on the client after the initial mount.
 */
export function AuthFormClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Render a placeholder or loader on the server and during initial client hydration
    return (
        <div className="space-y-4 pt-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                    </span>
                </div>
            </div>
            <Skeleton className="h-10 w-full" />
        </div>
    );
  }

  return <AuthForm />;
}
