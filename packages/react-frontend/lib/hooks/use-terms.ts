import { useState, useEffect } from 'react';
import { termsAPI } from '../api/terms.api.js';
import type { Term } from '@sd-clockin/shared';

export function useTerms() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await termsAPI.getAll();
        setTerms(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch terms');
        console.error('Error fetching terms:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTerms();
  }, []);

  const refetch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await termsAPI.getAll();
      setTerms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch terms');
      console.error('Error fetching terms:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return { terms, isLoading, error, refetch };
}

export function useTerm(id: string) {
  const [term, setTerm] = useState<Term | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    const fetchTerm = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await termsAPI.getById(id);
        setTerm(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch term');
        console.error('Error fetching term:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTerm();
  }, [id]);

  return { term, isLoading, error };
}

