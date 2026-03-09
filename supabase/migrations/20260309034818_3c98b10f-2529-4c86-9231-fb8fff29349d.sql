ALTER TABLE public.news_articles 
  ADD COLUMN ai_summary text,
  ADD COLUMN ai_tags text[] DEFAULT '{}';