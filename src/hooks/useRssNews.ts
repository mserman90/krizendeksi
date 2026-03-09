import { useState, useEffect, useCallback, useRef } from "react";
import type { NewsItem } from "@/lib/mockData";
import { fetchRssNews } from "@/lib/api/rssApi";

const AUTO_REFRESH_MS = 15 * 60 * 1000; // 15 minutes

export function useRssNews() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [filterEnabled, setFilterEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const filterRef = useRef(filterEnabled);

  filterRef.current = filterEnabled;

  const fetchNews = useCallback(async (filter: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRssNews(filter);
      if (res.success && res.items) {
        setItems(res.items);
        setIsLive(true);
        setLastUpdated(new Date());
      } else {
        setError(res.error || "Haberler yüklenemedi");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNews(filterEnabled);
  }, []);

  // Auto-refresh interval
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchNews(filterRef.current);
      }, AUTO_REFRESH_MS);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchNews]);

  const refresh = useCallback((filter: boolean) => {
    setFilterEnabled(filter);
    fetchNews(filter);
  }, [fetchNews]);

  return {
    items, loading, error, isLive, filterEnabled,
    setFilterEnabled: (v: boolean) => { setFilterEnabled(v); fetchNews(v); },
    refresh, autoRefresh, setAutoRefresh, lastUpdated,
  };
}
