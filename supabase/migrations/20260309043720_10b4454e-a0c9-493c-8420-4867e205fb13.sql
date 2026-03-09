
CREATE TABLE public.daily_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  summary_date date NOT NULL DEFAULT CURRENT_DATE,
  summary_text text NOT NULL,
  news_count integer NOT NULL DEFAULT 0,
  tr_count integer NOT NULL DEFAULT 0,
  en_count integer NOT NULL DEFAULT 0,
  rss_errors text[] DEFAULT '{}',
  UNIQUE(summary_date)
);

ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.daily_summaries
  FOR SELECT USING (true);
