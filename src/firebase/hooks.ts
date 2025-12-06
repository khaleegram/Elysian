
'use client';
import { useState, useEffect, useMemo } from 'react';
import { onSnapshot, DocumentData, Query, DocumentReference, DocumentSnapshot, collection } from 'firebase/firestore';
import { useFirestore } from './provider';

// Hook to get a real-time collection
export function useCollection<T>(
  query: Query<DocumentData> | null,
  initialData?: T[]
): { data: T[] | null; loading: boolean; error: Error | null } {
  const [data, setData] = useState<T[] | null>(initialData || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setData(initialData || null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = onSnapshot(
      query,
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        setData(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error in useCollection:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  // The query object itself is not stable. We can't easily stringify it.
  // The components using this hook should memoize the query object they pass in.
  // The effect will re-run if a new query object is passed.
  }, [query]);

  return { data, loading, error };
}


// Hook to get a real-time document
export function useDoc<T>(
  ref: DocumentReference<DocumentData> | null,
  initialData?: T
): { data: T | null; loading: boolean; error: Error | null } {
  const [data, setData] = useState<T | null>(initialData || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ref) {
      setData(initialData || null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error in useDoc:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref]);

  return { data, loading, error };
}
