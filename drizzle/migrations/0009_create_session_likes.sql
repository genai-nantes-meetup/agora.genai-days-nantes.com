CREATE TABLE public.session_likes (
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  session_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, session_id)
);

GRANT SELECT, INSERT, DELETE ON public.session_likes TO authenticated;
GRANT ALL ON public.session_likes TO service_role;

ALTER TABLE public.session_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY likes_read ON public.session_likes FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY likes_insert ON public.session_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY likes_delete ON public.session_likes FOR DELETE TO authenticated USING (user_id = auth.uid());