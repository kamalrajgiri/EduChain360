import { useEffect, useState, useCallback } from 'react';

/**
 * Standard fetch hook with loading + error + retry.
 *   const { data, loading, error, retry } = useFetch(() => getDashboard(), []);
 *
 * @param {Function} fetcher  — async function that returns data
 * @param {Array}    deps     — optional dependency array (defaults to [])
 */
export function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    (async () => {
      try {
        const res = await fetcher();
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message || 'Failed to load data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  const retry = useCallback(() => setTick((t) => t + 1), []);

  return { data, loading, error, retry };
}