
CREATE TABLE public.news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  link text NOT NULL,
  description text,
  pub_date text,
  source text NOT NULL,
  language text DEFAULT 'tr',
  fetched_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add unique constraint to avoid duplicates
ALTER TABLE public.news_articles ADD CONSTRAINT news_articles_link_unique UNIQUE (link);

-- Enable RLS
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access" ON public.news_articles FOR SELECT USING (true);

-- Service role insert (edge functions)
CREATE POLICY "Service role insert" ON public.news_articles FOR INSERT WITH CHECK (true);
