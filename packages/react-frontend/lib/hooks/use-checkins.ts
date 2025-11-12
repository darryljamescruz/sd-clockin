import { useState, useEffect } from 'react';
import { checkinsAPI } from '../api/checkins.api.js';
import type { CheckIn, CheckInQueryParams } from '@sd-clockin/shared';

export function useCheckIns(params?: CheckInQueryParams) {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCheckIns = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await checkinsAPI.getAll(params);
        setCheckIns(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch check-ins');
        console.error('Error fetching check-ins:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCheckIns();
  }, [params?.studentId, params?.termId, params?.startDate, params?.endDate]);

  const refetch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await checkinsAPI.getAll(params);
      setCheckIns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch check-ins');
      console.error('Error fetching check-ins:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return { checkIns, isLoading, error, refetch };
}

