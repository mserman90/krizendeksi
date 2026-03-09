
DROP POLICY "Service role insert" ON public.news_articles;
CREATE POLICY "Service role only insert" ON public.news_articles FOR INSERT TO service_role WITH CHECK (true);
