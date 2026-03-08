
-- Crisis alerts table
CREATE TABLE public.crisis_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crisis_index NUMERIC NOT NULL,
  threshold NUMERIC NOT NULL DEFAULT 60,
  level TEXT NOT NULL,
  summary JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public read, no client write)
ALTER TABLE public.crisis_alerts ENABLE ROW LEVEL SECURITY;

-- Allow public reads (no auth needed for a public dashboard)
CREATE POLICY "Public read access" ON public.crisis_alerts
  FOR SELECT TO anon, authenticated USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.crisis_alerts;

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
