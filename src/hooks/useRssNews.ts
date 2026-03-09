import { useState, useEffect, useCallback } from "react";
import type { NewsItem } from "@/lib/mockData";
import { fetchRssNews } from "@/lib/api/rssApi";

export function useRssNews() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [filterEnabled, setFilterEnabled] = useState(true);

  const fetch = useCallback(async (filter: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRssNews(filter);
      if (res.success && res.items) {
        setItems(res.items);
        setIsLive(true);
      } else {
        setError(res.error || "Haberler yüklenemedi");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch(filterEnabled);
  }, []);

  const refresh = useCallback((filter: boolean) => {
    setFilterEnabled(filter);
    fetch(filter);
  }, [fetch]);

  return { items, loading, error, isLive, filterEnabled, setFilterEnabled: (v: boolean) => { setFilterEnabled(v); fetch(v); }, refresh };
}
