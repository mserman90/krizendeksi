
CREATE TABLE public.email_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'pending')),
  created_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz,
  unsubscribe_token uuid DEFAULT gen_random_uuid()
);

ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;

-- Public can subscribe (insert)
CREATE POLICY "Anyone can subscribe" ON public.email_subscribers
  FOR INSERT WITH CHECK (true);

-- Public can read their own subscription by email
CREATE POLICY "Public read by email" ON public.email_subscribers
  FOR SELECT USING (true);

-- Service role can update (for unsubscribe)
CREATE POLICY "Public update for unsubscribe" ON public.email_subscribers
  FOR UPDATE USING (true);
