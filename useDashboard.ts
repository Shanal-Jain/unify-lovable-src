import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { DashboardSnapshot } from '../types';

interface UseDashboardResult {
  data: DashboardSnapshot | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboard(): UseDashboardResult {
  const [data, setData] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    supabase
      .from('dashboard_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single()
      .then(({ data: row, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(err.message);
          setLoading(false);
          return;
        }
        setData(row as DashboardSnapshot);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [tick]);

  return { data, loading, error, refetch: () => setTick(t => t + 1) };
}
