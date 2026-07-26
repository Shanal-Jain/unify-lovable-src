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

  const fetchLatest = (cancelled: { v: boolean }) => {
    setLoading(true);
    setError(null);
    supabase
      .from('dashboard_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single()
      .then(({ data: row, error: err }) => {
        if (cancelled.v) return;
        if (err) { setError(err.message); setLoading(false); return; }
        setData(row as DashboardSnapshot);
        setLoading(false);
      });
  };

  useEffect(() => {
    const cancelled = { v: false };
    fetchLatest(cancelled);

    // Real-time: re-fetch whenever a new snapshot is upserted
    const channel = supabase
      .channel('dashboard_snapshots_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dashboard_snapshots' }, () => {
        if (!cancelled.v) fetchLatest(cancelled);
      })
      .subscribe();

    return () => {
      cancelled.v = true;
      supabase.removeChannel(channel);
    };
  }, [tick]);

  return { data, loading, error, refetch: () => setTick(t => t + 1) };
}
