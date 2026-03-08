import { supabase } from "@/integrations/supabase/client";
import type { NewsItem } from "@/lib/mockData";

export interface RssResponse {
  success: boolean;
  items?: NewsItem[];
  total?: number;
  errors?: string[];
  fetchedAt?: string;
  error?: string;
}

export async function fetchRssNews(filter = true): Promise<RssResponse> {
  const { data, error } = await supabase.functions.invoke("fetch-rss-news", {
    body: { filter },
  });

  if (error) {
    console.error("Edge function error:", error);
    return { success: false, error: error.message };
  }

  return data as RssResponse;
}
