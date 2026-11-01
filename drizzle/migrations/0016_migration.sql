CREATE TABLE public.session_feedback_pushes(session_id text PRIMARY KEY, sent_at timestamptz NOT NULL DEFAULT now(), recipients integer NOT NULL DEFAULT 0);
GRANT ALL ON public.session_feedback_pushes TO service_role;
ALTER TABLE public.session_feedback_pushes ENABLE ROW LEVEL SECURITY;