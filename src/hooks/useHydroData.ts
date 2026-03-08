import { useState, useCallback } from "react";
import { fetchHydroData, type HydroData } from "@/lib/api/hydroApi";

export function useHydroData() {
  const [data, setData] = useState<HydroData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const fetch = useCallback(async (pastDays = 14, basinId = "firat-dicle") => {
    setLoading(true);
    setError(null);
    setWarnings([]);
    try {
      const res = await fetchHydroData(pastDays, basinId);
      if (res.success && res.data) {
        setData(res.data);
        if (res.errors?.length) setWarnings(res.errors);
      } else {
        setError(res.error || "Hidrolojik veri alınamadı");
      }
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setWarnings([]);
  }, []);

  return { data, loading, error, warnings, fetch, reset };
}
