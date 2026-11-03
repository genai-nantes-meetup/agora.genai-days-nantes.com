import {track} from '@/lib/analytics';
import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, Map, MessageCircle, User, Users, WifiOff } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useI18n, type TKey } from "@/lib/i18n";
import { InstallPrompt } from "./InstallPrompt";
import { SiteFooter } from "./SiteFooter";
import { AppLockup } from "./common";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {useMessaging} from '@/lib/messaging-client';

const tabs: { to: "/networking" | "/messages" | "/" | "/plan" | "/profil"; key: TKey; icon: typeof Users; match: (p: string) => boolean }[] = [
  { to: "/networking", key: "nav.networking", icon: Users, match: (p) => p.startsWith("/networking") },
  { to: "/messages", key: "nav.messages", icon: MessageCircle, match: (p) => p.startsWith("/messages") },
  { to: "/", key: "nav.program", icon: CalendarDays, match: (p) => p === "/" || p.startsWith("/sessions") || p.startsWith("/speakers") || p.startsWith("/sponsors") },
  { to: "/plan", key: "nav.plan", icon: Map, match: (p) => p.startsWith("/plan") },
  { to: "/profil", key: "nav.profile", icon: User, match: (p) => p.startsWith("/profil") },
];

function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const online = useOnline();
  const { user } = useAuth();
  const {unread}=useMessaging();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="pt-safe sticky top-0 z-30 border-b border-foreground/80 bg-background">
        <div className="px-gutter mx-auto grid h-[3.65rem] w-full max-w-[78rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <Link to="/" className="flex min-w-0 items-center">
            <AppLockup shortName={t("appShortName")} label={t("appName")} />
          </Link>
          <div className="flex shrink-0 items-center gap-2"><Button asChild variant="ghost" size="icon" aria-label={t(user ? "nav.profile" : "auth.login")} title={t(user ? "nav.profile" : "auth.login")}><Link to={user ? "/profil" : "/login"}><User className="size-5" /></Link></Button><button
            type="button"
            onClick={() => { const to = lang === "fr" ? "en" : "fr"; track("language_switched", { from: lang, to }); setLang(to); }}
            aria-label={t("lang.switch")}
            className="flex min-h-11 cursor-pointer items-center"
          >
            <span className="flex border-2 border-primary text-xs font-bold uppercase tracking-[0.08em]">
            {(["fr", "en"] as const).map((l) => (
              <span key={l} className={`px-2.5 py-1.5 ${lang === l ? "bg-primary text-primary-foreground" : "text-primary"}`}>
                {l}
              </span>
            ))}
            </span>
          </button></div>
        </div>
        {!online && (
          <div className="font-label flex items-center justify-center gap-2 bg-night py-1 text-[11px] text-primary-foreground">
            <WifiOff className="size-3.5" /> {t("offline")}
          </div>
        )}
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col lg:max-w-[78rem] lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10 lg:px-[var(--gutter)]"><aside className="sticky top-[4.65rem] hidden h-fit border-r border-foreground/80 pr-5 pt-6 lg:block"><nav aria-label={t("nav.program")}><ul className="divide-y divide-surface">{tabs.map(({to,key,icon:Icon,match})=>{const on=match(pathname);return <li key={to}><Link to={to} aria-current={on?"page":undefined} className={`flex min-h-12 items-center gap-3 border-l-2 pl-3 text-sm font-bold tracking-[0.04em] transition-colors ${on?"border-accent text-primary":"border-transparent text-foreground hover:text-primary"}`}><Icon className="size-5 shrink-0" strokeWidth={on?2.25:1.75}/>{t(key)}{key==='nav.messages'&&unread>0&&<span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground" aria-label={t('messages.unread',{n:unread})}>{unread}</span>}</Link></li>})}</ul></nav><Button asChild variant="link" className="mt-6 text-xs"><Link to="/donnees">{t("legal.link")}</Link></Button></aside><main className="min-w-0 flex-1 pb-24 lg:pb-8">{children}</main></div>

      <SiteFooter />

      <InstallPrompt />

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-foreground/80 bg-background lg:hidden">
        <ul className="mx-auto grid max-w-2xl grid-cols-5">
          {tabs.map(({ to, key, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <li key={to}>
                <Link
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 pb-2 pt-1.5 text-[10.5px] font-bold tracking-[0.02em] ${active ? "text-primary" : "text-ink"}`}
                >
                  <span className="relative flex h-6 items-center justify-center">
                    <Icon className="size-5" strokeWidth={active ? 2.25 : 1.6} />{key==='nav.messages'&&unread>0&&<span className="absolute -right-3 -top-1 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] leading-4 text-primary-foreground">{unread}</span>}
                  </span>
                  <span className="max-w-full truncate px-0.5">{t(key)}</span>
                  <span aria-hidden="true" className={`absolute bottom-1 size-1 rounded-full bg-accent ${active ? "" : "invisible"}`} />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
