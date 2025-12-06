
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';

type UserRole = 'admin' | 'guest' | 'staff';

export function useRole(): { role: UserRole | null; loading: boolean } {
  const user = useUser();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user === undefined) {
      // Auth state is still loading
      setLoading(true);
      return;
    }

    if (user === null) {
      // User is not logged in
      setRole(null);
      setLoading(false);
      return;
    }

    // User is logged in, get their ID token and check claims
    let isMounted = true;
    const checkClaims = async () => {
      try {
        const idTokenResult = await user.getIdTokenResult(true); // Force refresh
        if (!isMounted) return;

        if (idTokenResult.claims.role === 'admin') {
          setRole('admin');
        } else if (idTokenResult.claims.role === 'staff') {
            setRole('staff');
        } else {
          setRole('guest');
        }
      } catch (error) {
        console.error("Error fetching user role from claims:", error);
        if (isMounted) setRole('guest'); // Default to guest on error
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkClaims();

    return () => {
      isMounted = false;
    };
    
  }, [user]);

  return { role, loading };
}
