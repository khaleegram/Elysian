
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';

// This component listens for Firestore permission errors and displays them.
// In a dev environment, this would throw an error to be caught by Next.js overlay.
// For this environment, we'll use a detailed toast.
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      console.error(error); // Log the full error for debugging

      // In a real dev setup, we might throw the error to leverage Next.js's overlay
      // For Studio, a detailed toast is more user-friendly.
      toast({
        variant: 'destructive',
        title: 'Firestore Security Error',
        description: (
          <pre className="mt-2 w-full rounded-md bg-slate-950 p-4">
            <code className="text-white">{error.message}</code>
          </pre>
        ),
        duration: 20000, // Give user time to read
      });
    };

    errorEmitter.on('permission-error', handleError);

    // No cleanup function is needed as errorEmitter is a singleton
  }, [toast]);

  return null; // This component does not render anything
}
