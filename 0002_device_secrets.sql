CREATE TABLE public.device_secrets (
  user_id uuid PRIMARY KEY,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.device_secrets ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.device_secrets TO authenticated;
GRANT ALL ON public.device_secrets TO service_role;
CREATE POLICY "Owner reads own device secret" ON public.device_secrets FOR SELECT TO authenticated USING (auth.uid() = user_id);