ALTER TABLE public.invitations ADD COLUMN invitation_sent_at timestamptz;
ALTER TABLE public.connection_requests ADD COLUMN accepted_email_sent_at timestamptz;
CREATE TABLE public.email_settings (id boolean PRIMARY KEY DEFAULT true CHECK (id), auto_send_late_invites boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.email_settings TO service_role;
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.email_settings(id) VALUES (true) ON CONFLICT DO NOTHING;