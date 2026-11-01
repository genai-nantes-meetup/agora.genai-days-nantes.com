-- Retire Twilio-specific structures (never used in production). Kept in place, marked deprecated.
DROP TRIGGER IF EXISTS retain_deleted_conversation ON public.conversations;
DROP FUNCTION IF EXISTS public.retain_twilio_cleanup();
COMMENT ON TABLE public.twilio_cleanup IS 'DEPRECATED: Twilio removed; messaging is in-house (public.messages)';
COMMENT ON TABLE public.message_events IS 'DEPRECATED: replaced by public.messages';
COMMENT ON COLUMN public.conversations.conversation_sid IS 'DEPRECATED: Twilio removed';
COMMENT ON COLUMN public.conversations.participant_a_sid IS 'DEPRECATED: Twilio removed';
COMMENT ON COLUMN public.conversations.participant_b_sid IS 'DEPRECATED: Twilio removed';
COMMENT ON COLUMN public.conversations.twilio_closed_at IS 'DEPRECATED: Twilio removed';
COMMENT ON COLUMN public.conversation_receipts.read_index IS 'DEPRECATED: replaced by last_read_message_id';
COMMENT ON COLUMN public.conversation_receipts.last_reminder_index IS 'DEPRECATED: replaced by digested_at';
COMMENT ON COLUMN public.conversation_receipts.reminder_claim IS 'DEPRECATED: replaced by message_digests';
COMMENT ON COLUMN public.conversation_receipts.reminder_claimed_at IS 'DEPRECATED: replaced by message_digests';
COMMENT ON FUNCTION public.finish_connection_accept(uuid, uuid, text, text, text) IS 'DEPRECATED: replaced by finish_connection_accept(uuid, uuid)';
REVOKE ALL ON FUNCTION public.finish_connection_accept(uuid, uuid, text, text, text) FROM PUBLIC, anon, authenticated;

-- Messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  body text NOT NULL,
  reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  edited_at timestamptz,
  deleted_at timestamptz,
  CONSTRAINT messages_body_check CHECK ((deleted_at IS NULL AND char_length(body) BETWEEN 1 AND 1600) OR (deleted_at IS NOT NULL AND body = ''))
);
CREATE INDEX messages_conversation_created_idx ON public.messages(conversation_id, created_at DESC);
CREATE INDEX messages_sender_created_idx ON public.messages(sender_id, created_at DESC);
GRANT SELECT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.message_reactions (
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  emoji text NOT NULL CHECK (emoji IN ('👍','❤️','😂','😮','🙏','🔥')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id, emoji)
);
GRANT SELECT ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_reactions TO service_role;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.conversation_presence (
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, conversation_id)
);
GRANT ALL ON public.conversation_presence TO service_role;
ALTER TABLE public.conversation_presence ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.message_digests (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  last_sent_at timestamptz
);
GRANT ALL ON public.message_digests TO service_role;
ALTER TABLE public.message_digests ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.conversation_receipts
  ADD COLUMN last_read_message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  ADD COLUMN last_read_at timestamptz,
  ADD COLUMN digested_at timestamptz;

CREATE OR REPLACE FUNCTION public.can_read_conversation(cid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = cid AND c.closed_at IS NULL AND auth.uid() IN (c.user_a, c.user_b)
      AND public.is_active_member(c.user_a) AND public.is_active_member(c.user_b)
      AND NOT EXISTS (SELECT 1 FROM public.blocks b WHERE least(b.blocker_id,b.blocked_id)=least(c.user_a,c.user_b) AND greatest(b.blocker_id,b.blocked_id)=greatest(c.user_a,c.user_b))
  )
$$;
CREATE OR REPLACE FUNCTION public.messaging_closed()
RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT now() >= timestamptz '2026-11-24 00:00:00 Europe/Paris'
$$;
CREATE OR REPLACE FUNCTION public.assert_can_write(cid uuid)
RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.can_read_conversation(cid) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF public.messaging_closed() THEN RAISE EXCEPTION 'ReadOnly'; END IF;
END $$;

CREATE POLICY messages_read ON public.messages FOR SELECT TO authenticated USING (public.can_read_conversation(conversation_id));
CREATE POLICY reactions_read ON public.message_reactions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND public.can_read_conversation(m.conversation_id)));
DROP POLICY IF EXISTS receipts_read ON public.conversation_receipts;
CREATE POLICY receipts_read ON public.conversation_receipts FOR SELECT TO authenticated USING (public.can_read_conversation(conversation_id));

CREATE OR REPLACE FUNCTION public.finish_connection_accept(request uuid, claim uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.connection_requests; result uuid;
BEGIN
  SELECT * INTO r FROM public.connection_requests WHERE id = request FOR UPDATE;
  IF r.provisioning_claim IS DISTINCT FROM claim OR r.status <> 'pending' OR r.cancelled_at IS NOT NULL
     OR EXISTS (SELECT 1 FROM public.blocks WHERE least(blocker_id,blocked_id)=least(r.requester_id,r.recipient_id) AND greatest(blocker_id,blocked_id)=greatest(r.requester_id,r.recipient_id)) THEN
    RAISE EXCEPTION 'Cancelled';
  END IF;
  INSERT INTO public.conversations(request_id, user_a, user_b) VALUES (r.id, r.requester_id, r.recipient_id) RETURNING id INTO result;
  INSERT INTO public.conversation_receipts(conversation_id, user_id) VALUES (result, r.requester_id), (result, r.recipient_id);
  UPDATE public.connection_requests SET status='accepted', responded_at=now(), provisioning_claim=NULL, provisioning_at=NULL WHERE id = request;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.finish_connection_accept(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_connection_accept(uuid, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.send_message(p_id uuid, p_conversation_id uuid, p_body text, p_reply_to_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE existing public.messages; inserted public.messages; recent int;
BEGIN
  SELECT * INTO existing FROM public.messages WHERE id = p_id;
  IF FOUND THEN
    IF existing.sender_id IS DISTINCT FROM auth.uid() OR existing.conversation_id <> p_conversation_id THEN RAISE EXCEPTION 'Forbidden'; END IF;
    RETURN jsonb_build_object('message', to_jsonb(existing), 'created', false);
  END IF;
  PERFORM public.assert_can_write(p_conversation_id);
  p_body := btrim(p_body);
  IF char_length(p_body) < 1 OR char_length(p_body) > 1600 THEN RAISE EXCEPTION 'InvalidBody'; END IF;
  IF p_reply_to_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.messages WHERE id = p_reply_to_id AND conversation_id = p_conversation_id) THEN RAISE EXCEPTION 'InvalidReply'; END IF;
  SELECT count(*) INTO recent FROM public.messages WHERE sender_id = auth.uid() AND created_at > now() - interval '1 minute';
  IF recent >= 20 THEN RAISE EXCEPTION 'RateLimited'; END IF;
  INSERT INTO public.messages(id, conversation_id, sender_id, body, reply_to_id) VALUES (p_id, p_conversation_id, auth.uid(), p_body, p_reply_to_id)
  ON CONFLICT (id) DO NOTHING RETURNING * INTO inserted;
  IF inserted.id IS NULL THEN
    SELECT * INTO existing FROM public.messages WHERE id = p_id AND sender_id = auth.uid() AND conversation_id = p_conversation_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Forbidden'; END IF;
    RETURN jsonb_build_object('message', to_jsonb(existing), 'created', false);
  END IF;
  UPDATE public.conversation_receipts SET last_read_message_id = inserted.id, last_read_at = now() WHERE conversation_id = p_conversation_id AND user_id = auth.uid();
  RETURN jsonb_build_object('message', to_jsonb(inserted), 'created', true);
END $$;

CREATE OR REPLACE FUNCTION public.edit_message(p_id uuid, p_body text)
RETURNS public.messages LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m public.messages;
BEGIN
  SELECT * INTO m FROM public.messages WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR m.sender_id IS DISTINCT FROM auth.uid() OR m.deleted_at IS NOT NULL OR m.created_at <= now() - interval '15 minutes' THEN RAISE EXCEPTION 'Forbidden'; END IF;
  PERFORM public.assert_can_write(m.conversation_id);
  p_body := btrim(p_body);
  IF char_length(p_body) < 1 OR char_length(p_body) > 1600 THEN RAISE EXCEPTION 'InvalidBody'; END IF;
  IF p_body = m.body THEN RETURN m; END IF;
  UPDATE public.messages SET body = p_body, edited_at = now() WHERE id = p_id RETURNING * INTO m;
  RETURN m;
END $$;

CREATE OR REPLACE FUNCTION public.delete_message(p_id uuid)
RETURNS public.messages LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m public.messages;
BEGIN
  SELECT * INTO m FROM public.messages WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR m.sender_id IS DISTINCT FROM auth.uid() OR m.created_at <= now() - interval '15 minutes' THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF m.deleted_at IS NOT NULL THEN RETURN m; END IF;
  PERFORM public.assert_can_write(m.conversation_id);
  DELETE FROM public.message_reactions WHERE message_id = p_id;
  UPDATE public.messages SET body = '', deleted_at = now() WHERE id = p_id RETURNING * INTO m;
  RETURN m;
END $$;

CREATE OR REPLACE FUNCTION public.toggle_reaction(p_message_id uuid, p_emoji text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m public.messages;
BEGIN
  SELECT * INTO m FROM public.messages WHERE id = p_message_id;
  IF NOT FOUND OR m.deleted_at IS NOT NULL THEN RAISE EXCEPTION 'Forbidden'; END IF;
  PERFORM public.assert_can_write(m.conversation_id);
  DELETE FROM public.message_reactions WHERE message_id = p_message_id AND user_id = auth.uid() AND emoji = p_emoji;
  IF FOUND THEN RETURN false; END IF;
  INSERT INTO public.message_reactions(message_id, user_id, emoji) VALUES (p_message_id, auth.uid(), p_emoji);
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.mark_read(p_conversation_id uuid, p_message_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target timestamptz; current_at timestamptz;
BEGIN
  IF auth.uid() IS NULL OR NOT public.can_read_conversation(p_conversation_id) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT created_at INTO target FROM public.messages WHERE id = p_message_id AND conversation_id = p_conversation_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT m.created_at INTO current_at FROM public.conversation_receipts r JOIN public.messages m ON m.id = r.last_read_message_id WHERE r.conversation_id = p_conversation_id AND r.user_id = auth.uid();
  IF current_at IS NOT NULL AND current_at >= target THEN RETURN; END IF;
  UPDATE public.conversation_receipts SET last_read_message_id = p_message_id, last_read_at = now() WHERE conversation_id = p_conversation_id AND user_id = auth.uid();
END $$;

CREATE OR REPLACE FUNCTION public.conversation_heartbeat(p_conversation_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.can_read_conversation(p_conversation_id) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  INSERT INTO public.conversation_presence(user_id, conversation_id, last_seen_at) VALUES (auth.uid(), p_conversation_id, now())
  ON CONFLICT (user_id, conversation_id) DO UPDATE SET last_seen_at = now();
END $$;

CREATE OR REPLACE FUNCTION public.inbox_summaries()
RETURNS TABLE(conversation_id uuid, last_body text, last_deleted boolean, last_sender uuid, last_at timestamptz, unread integer)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT c.id,
    l.body, l.deleted_at IS NOT NULL, l.sender_id, l.created_at,
    (SELECT count(*)::int FROM public.messages u WHERE u.conversation_id = c.id AND u.sender_id <> auth.uid() AND u.deleted_at IS NULL
       AND u.created_at > coalesce((SELECT rm.created_at FROM public.conversation_receipts r JOIN public.messages rm ON rm.id = r.last_read_message_id WHERE r.conversation_id = c.id AND r.user_id = auth.uid()), '-infinity'::timestamptz))
  FROM public.conversations c
  LEFT JOIN LATERAL (SELECT m.body, m.deleted_at, m.sender_id, m.created_at FROM public.messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) l ON true
  WHERE c.closed_at IS NULL AND auth.uid() IN (c.user_a, c.user_b)
$$;

CREATE OR REPLACE FUNCTION public.digest_candidates()
RETURNS TABLE(recipient_id uuid, conversation_id uuid, sender_id uuid, unread integer, oldest_unread_at timestamptz, last_read_at timestamptz, digested_at timestamptz, last_digest_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.user_id, c.id, CASE WHEN c.user_a = r.user_id THEN c.user_b ELSE c.user_a END,
    count(m.id)::int, min(m.created_at), r.last_read_at, r.digested_at, d.last_sent_at
  FROM public.conversation_receipts r
  JOIN public.conversations c ON c.id = r.conversation_id AND c.closed_at IS NULL
  LEFT JOIN public.messages lr ON lr.id = r.last_read_message_id
  JOIN public.messages m ON m.conversation_id = c.id AND m.sender_id <> r.user_id AND m.deleted_at IS NULL AND m.created_at > coalesce(lr.created_at, '-infinity'::timestamptz)
  LEFT JOIN public.message_digests d ON d.user_id = r.user_id
  WHERE public.is_active_member(r.user_id)
  GROUP BY r.user_id, c.id, c.user_a, c.user_b, r.last_read_at, r.digested_at, d.last_sent_at
$$;

CREATE OR REPLACE FUNCTION public.claim_digest(p_user uuid, p_conversations uuid[])
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE previous timestamptz;
BEGIN
  INSERT INTO public.message_digests(user_id, last_sent_at) VALUES (p_user, NULL) ON CONFLICT (user_id) DO NOTHING;
  SELECT last_sent_at INTO previous FROM public.message_digests WHERE user_id = p_user FOR UPDATE;
  IF previous IS NOT NULL AND previous > now() - interval '30 minutes' THEN RAISE EXCEPTION 'NotDue'; END IF;
  UPDATE public.message_digests SET last_sent_at = now() WHERE user_id = p_user;
  UPDATE public.conversation_receipts SET digested_at = now() WHERE user_id = p_user AND conversation_id = ANY(p_conversations);
  RETURN previous;
END $$;

REVOKE ALL ON FUNCTION public.digest_candidates() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_digest(uuid, uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.digest_candidates() TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_digest(uuid, uuid[]) TO service_role;
REVOKE ALL ON FUNCTION public.assert_can_write(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.send_message(uuid, uuid, text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.edit_message(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_message(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.toggle_reaction(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_read(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.conversation_heartbeat(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.inbox_summaries() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_message(uuid, uuid, text, uuid), public.edit_message(uuid, text), public.delete_message(uuid), public.toggle_reaction(uuid, text), public.mark_read(uuid, uuid), public.conversation_heartbeat(uuid), public.inbox_summaries(), public.can_read_conversation(uuid), public.assert_can_write(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.message_broadcast()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.conversations; cid uuid; payload jsonb; ev text;
BEGIN
  IF TG_TABLE_NAME = 'messages' THEN
    cid := NEW.conversation_id; ev := CASE WHEN TG_OP = 'INSERT' THEN 'message' ELSE 'message_update' END; payload := to_jsonb(NEW);
  ELSIF TG_TABLE_NAME = 'message_reactions' THEN
    SELECT m.conversation_id INTO cid FROM public.messages m WHERE m.id = coalesce(NEW.message_id, OLD.message_id);
    ev := 'reaction'; payload := jsonb_build_object('message_id', coalesce(NEW.message_id, OLD.message_id), 'user_id', coalesce(NEW.user_id, OLD.user_id), 'emoji', coalesce(NEW.emoji, OLD.emoji), 'op', TG_OP);
  ELSE
    cid := NEW.conversation_id; ev := 'read'; payload := jsonb_build_object('user_id', NEW.user_id, 'last_read_message_id', NEW.last_read_message_id);
  END IF;
  IF cid IS NULL THEN RETURN coalesce(NEW, OLD); END IF;
  PERFORM realtime.send(payload, ev, 'conversation:' || cid::text, true);
  IF TG_TABLE_NAME <> 'message_reactions' THEN
    SELECT * INTO c FROM public.conversations WHERE id = cid;
    PERFORM realtime.send('{}'::jsonb, 'changed', 'inbox:' || c.user_a::text, true);
    PERFORM realtime.send('{}'::jsonb, 'changed', 'inbox:' || c.user_b::text, true);
  END IF;
  RETURN coalesce(NEW, OLD);
END $$;
REVOKE ALL ON FUNCTION public.message_broadcast() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER messages_broadcast AFTER INSERT OR UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.message_broadcast();
CREATE TRIGGER reactions_broadcast AFTER INSERT OR DELETE ON public.message_reactions FOR EACH ROW EXECUTE FUNCTION public.message_broadcast();
CREATE TRIGGER receipts_broadcast AFTER UPDATE OF last_read_message_id ON public.conversation_receipts FOR EACH ROW WHEN (NEW.last_read_message_id IS DISTINCT FROM OLD.last_read_message_id) EXECUTE FUNCTION public.message_broadcast();

CREATE POLICY conversation_topic_read ON realtime.messages FOR SELECT TO authenticated
  USING (realtime.topic() LIKE 'conversation:%' AND public.can_read_conversation(substring(realtime.topic() from 14)::uuid));
CREATE POLICY conversation_topic_typing ON realtime.messages FOR INSERT TO authenticated
  WITH CHECK (realtime.topic() LIKE 'conversation:%' AND extension = 'broadcast' AND public.can_read_conversation(substring(realtime.topic() from 14)::uuid) AND NOT public.messaging_closed());
