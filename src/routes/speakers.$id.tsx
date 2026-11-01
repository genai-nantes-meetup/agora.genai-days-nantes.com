import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { membersOptions } from "@/lib/member-queries";
import { Button } from "@/components/ui/button";
import { ExternalLink, Globe, Linkedin } from "lucide-react";
import { useSessions, useSpeakers } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { useLikes } from "@/lib/likes";
import { BackLink, ErrorView, LoadingView } from "@/components/common";
import { SessionCard } from "@/components/SessionCard";

export const Route = createFileRoute("/speakers/$id")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Speaker · GenAI Days Nantes" },
      { name: "description", content: "Bio, parcours et sessions d'un speaker des GenAI Days." },
      { property: "og:title", content: "Speaker · GenAI Days Nantes" },
      { property: "og:description", content: "Bio, parcours et sessions de ce speaker des GenAI Days." },
    ],
  }),
  component: SpeakerPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-label text-xs uppercase text-muted-foreground">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function SpeakerPage() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const { data, isPending, isError, refetch } = useSpeakers();
  const { data: sessionsData } = useSessions();
  const { likes, toggle } = useLikes();
  const { user } = useAuth();
  const members = useQuery({ ...membersOptions(), enabled: !!user });
  const member = members.data?.find(p => p.profile_status?.speaker_id === id);

  if (isPending) return <LoadingView />;
  if (isError || !data) return <ErrorView onRetry={() => refetch()} />;
  const s = data.speakers.find((x) => x.id === id);
  if (!s) return <p className="p-6 text-center">{t("notFound")}</p>;

  const allSessions = sessionsData?.sessions ?? [];
  const mySessions = allSessions.filter((x) => x.speakers?.some((r) => r.id === s.id));
  const links = [
    s.links?.linkedin && { href: s.links.linkedin, label: "LinkedIn", icon: Linkedin },
    s.links?.website && { href: s.links.website, label: t("website"), icon: Globe },
    s.links?.x && { href: s.links.x, label: "X", icon: ExternalLink },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Globe }[];

  return (
    <article className="space-y-6 px-4 pb-6 pt-4">
      <BackLink to="/speakers" />
      {member && <Button asChild variant="outline"><Link to="/networking/$id" params={{id:member.user_id}}>{t('directory.speakerLink')}</Link></Button>}
      <header className="flex items-center gap-4">
        {s.photo && <img src={s.photo} alt="" className="size-24 shrink-0 rounded-full object-cover shadow-card" />}
        <div className="min-w-0">
          {s.eventRole && (
            <span className="font-label inline-block rounded bg-accent px-1.5 py-0.5 text-[11px] uppercase text-accent-foreground">{s.eventRole}</span>
          )}
          <h1 className="mt-1 text-3xl font-medium leading-tight">{s.name}</h1>
          <p className="text-sm text-muted-foreground">{[s.role, s.company].filter(Boolean).join(" · ")}</p>
        </div>
      </header>

      {s.bio && <p className="font-display text-xl leading-snug">{s.bio}</p>}

      {!!links.length && (
        <div className="flex flex-wrap gap-2">
          {links.map(({ href, label, icon: Icon }) => (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm font-medium">
              <Icon className="size-4" /> {label}
            </a>
          ))}
        </div>
      )}

      {!!mySessions.length && (
        <Section title={t("sessions")}>
          <div className="space-y-3">
            {mySessions.map((x) => (
              <SessionCard key={x.id} session={x} liked={likes.includes(x.id)} onLike={() => toggle(x, allSessions)} />
            ))}
          </div>
        </Section>
      )}

      {!!s.profile?.length && (
        <Section title={t("profile")}>
          <div className="space-y-3 leading-relaxed">{s.profile.map((p, i) => <p key={i}>{p}</p>)}</div>
        </Section>
      )}

      {s.genaiLegitimacy && (
        <Section title={t("legitimacy")}>
          <p className="leading-relaxed">{s.genaiLegitimacy}</p>
        </Section>
      )}

      {!!s.careerHighlights?.length && (
        <Section title={t("career")}>
          <ol className="space-y-4 border-l-2 border-accent pl-4">
            {s.careerHighlights.map((c, i) => (
              <li key={i}>
                {c.period && <p className="font-label text-xs text-muted-foreground">{c.period}</p>}
                {c.title && <p className="font-semibold">{c.title}</p>}
                {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {!!s.companies?.length && (
        <Section title={t("companies")}>
          <ul className="space-y-2">
            {s.companies.map((c) => (
              <li key={c.name} className="rounded-xl bg-surface p-3">
                <p className="font-semibold">
                  {c.website ? <a href={c.website} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{c.name}</a> : c.name}
                  {c.relationship && <span className="font-normal text-muted-foreground"> · {c.relationship}</span>}
                </p>
                {c.description && <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </article>
  );
}
