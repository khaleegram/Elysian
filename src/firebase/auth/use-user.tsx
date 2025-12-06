'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useAuth } from '../provider';

export function useUser() {
  const auth = useAuth();
  // Start with `undefined` to represent the loading state.
  // `null` will specifically mean "not logged in".
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    if (!auth) {
      setUser(null); // If no auth provider, user is not logged in.
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Sets user object or `null`
    });

    return () => unsubscribe();
  }, [auth]);

  return user;
}
