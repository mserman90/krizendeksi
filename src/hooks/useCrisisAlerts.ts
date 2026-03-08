import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CrisisAlert {
  id: string;
  crisis_index: number;
  threshold: number;
  level: string;
  summary: Record<string, number> | null;
  created_at: string;
}

export function useCrisisAlerts() {
  const [alerts, setAlerts] = useState<CrisisAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    const { data, error } = await supabase
      .from("crisis_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setAlerts(data as unknown as CrisisAlert[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAlerts();

    // Realtime subscription
    const channel = supabase
      .channel("crisis-alerts-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "crisis_alerts" },
        (payload) => {
          setAlerts((prev) => [payload.new as unknown as CrisisAlert, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAlerts]);

  return { alerts, loading, refetch: fetchAlerts };
}
