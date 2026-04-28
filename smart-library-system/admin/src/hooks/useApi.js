import { useState, useCallback, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';

export const useApi = (endpoint, immediate = false) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { apiCall } = useAdmin();

  const execute = useCallback(
    async (method = 'GET', payload = null) => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiCall(method, endpoint, payload);
        setData(result);
        return result;
      } catch (err) {
        setError(err.message || 'An error occurred');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, apiCall]
  );

  useEffect(() => {
    if (immediate) {
      execute('GET');
    }
  }, [immediate, execute]);

  const refetch = useCallback(() => execute('GET'), [execute]);

  return { data, loading, error, execute, refetch };
};
