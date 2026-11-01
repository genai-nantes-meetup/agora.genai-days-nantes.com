ALTER TABLE public.session_feedback DROP CONSTRAINT session_feedback_pkey;
ALTER TABLE public.session_feedback ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.session_feedback ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.session_feedback ADD PRIMARY KEY (id);
ALTER TABLE public.session_feedback ADD COLUMN anon_token text;
CREATE UNIQUE INDEX session_feedback_user_unique ON public.session_feedback (user_id, session_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX session_feedback_anon_unique ON public.session_feedback (anon_token, session_id) WHERE anon_token IS NOT NULL;

CREATE OR REPLACE FUNCTION public.feedback_counts(sid text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_object_agg(choice,n),'{}'::jsonb) FROM (
    SELECT choice,count(*) n
    FROM public.session_feedback f CROSS JOIN LATERAL unnest(f.choices) choice
    WHERE f.session_id=sid
      AND (f.user_id IS NULL OR public.is_active_member(f.user_id))
    GROUP BY choice
  ) x
$$;

CREATE OR REPLACE FUNCTION public.feedback_comments(sid text)
RETURNS TABLE(user_id uuid, first_name text, last_name text, choices text[], comment text, updated_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT f.user_id,COALESCE(p.first_name,''),COALESCE(p.last_name,''),f.choices,f.comment,f.updated_at
  FROM public.session_feedback f LEFT JOIN public.profiles p ON p.user_id=f.user_id
  WHERE f.session_id=sid
    AND (f.user_id IS NULL OR public.is_active_member(f.user_id))
    AND NOT EXISTS(SELECT 1 FROM public.blocks b WHERE b.blocker_id=auth.uid() AND b.blocked_id=f.user_id)
  ORDER BY f.updated_at DESC
$$;

GRANT EXECUTE ON FUNCTION public.feedback_counts(text) TO anon;
GRANT EXECUTE ON FUNCTION public.feedback_comments(text) TO anon;
GRANT EXECUTE ON FUNCTION public.feedback_counts(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.feedback_comments(text) TO authenticated;