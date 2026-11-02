ALTER TABLE public.sponsor_domains ADD COLUMN source text NOT NULL DEFAULT 'auto';
UPDATE public.sponsor_domains SET source='manual' WHERE domain='clever-cloud.com';
ALTER TABLE public.sponsor_domains ADD CONSTRAINT sponsor_domains_source_check CHECK (source IN ('auto','manual'));

CREATE OR REPLACE FUNCTION public.refresh_sponsor_status_for_domains(domains text[]) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  UPDATE public.profile_status s
     SET sponsor_id=d.sponsor_id, sponsor_tier=d.tier
    FROM public.profiles p
    LEFT JOIN public.sponsor_domains d ON d.domain=lower(split_part(p.email,'@',2))
   WHERE p.user_id=s.user_id
     AND NOT s.manual_override
     AND lower(split_part(p.email,'@',2))=ANY(domains)
     AND (s.sponsor_id IS DISTINCT FROM d.sponsor_id OR s.sponsor_tier IS DISTINCT FROM d.tier);
END $$;
REVOKE ALL ON FUNCTION public.refresh_sponsor_status_for_domains(text[]) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.sponsor_domains_changed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP='DELETE' THEN PERFORM public.refresh_sponsor_status_for_domains(ARRAY[OLD.domain]); RETURN OLD;
  ELSIF TG_OP='UPDATE' THEN PERFORM public.refresh_sponsor_status_for_domains(ARRAY[OLD.domain,NEW.domain]);
  ELSE PERFORM public.refresh_sponsor_status_for_domains(ARRAY[NEW.domain]); END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER sponsor_domains_refresh_members AFTER INSERT OR UPDATE OR DELETE ON public.sponsor_domains FOR EACH ROW EXECUTE FUNCTION public.sponsor_domains_changed();

CREATE OR REPLACE FUNCTION public.create_member_shell() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.profiles(user_id,email) VALUES(NEW.id,lower(NEW.email));
  INSERT INTO public.profile_status(user_id,sponsor_id,sponsor_tier)
  SELECT NEW.id,d.sponsor_id,d.tier FROM (SELECT 1) x LEFT JOIN public.sponsor_domains d ON d.domain=lower(split_part(NEW.email,'@',2));
  RETURN NEW;
END $$;

-- Catch up members whose domain was added after they signed up.
SELECT public.refresh_sponsor_status_for_domains(ARRAY(SELECT DISTINCT lower(split_part(email,'@',2)) FROM public.profiles));