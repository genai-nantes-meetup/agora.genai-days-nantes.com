import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, Map, MessageCircle, User, Users, WifiOff } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useI18n, type TKey } from "@/lib/i18n";
import { InstallPrompt } from "./InstallPrompt";
import { Wordmark } from "./common";
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
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col lg:max-w-6xl lg:px-6">
      <header className="grain pt-safe sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4">
          <Link to="/" className="flex min-w-0 items-baseline gap-1.5">
            <span className="font-display text-sm italic text-muted-foreground">Hey</span>
            <Wordmark className="text-2xl leading-none" />
          </Link>
          <div className="flex shrink-0 items-center gap-2"><Button asChild variant="ghost" size="icon" aria-label={t(user ? "nav.profile" : "auth.login")} title={t(user ? "nav.profile" : "auth.login")}><Link to={user ? "/profil" : "/login"}><User className="size-4" /></Link></Button><Button
            type="button"
            onClick={() => setLang(lang === "fr" ? "en" : "fr")}
            aria-label={t("lang.switch")}
            variant="outline" className="flex h-auto gap-0 overflow-hidden rounded-full p-0 font-label text-xs"
          >
            {(["fr", "en"] as const).map((l) => (
              <span key={l} className={`px-2.5 py-1 uppercase ${lang === l ? "bg-primary text-primary-foreground" : ""}`}>
                {l}
              </span>
            ))}
          </Button></div>
        </div>
        {!online && (
          <div className="flex items-center justify-center gap-2 bg-primary py-1 text-xs text-primary-foreground">
            <WifiOff className="size-3.5" /> {t("offline")}
          </div>
        )}
      </header>

      <div className="flex flex-1 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8"><aside className="sticky top-24 hidden h-fit border-r pr-5 pt-6 lg:block"><nav aria-label={t("nav.program")}><ul className="space-y-2">{tabs.map(({to,key,icon:Icon,match})=><li key={to}><Button asChild variant={match(pathname)?"secondary":"ghost"} className="h-12 w-full justify-start gap-3"><Link to={to} aria-current={match(pathname)?"page":undefined}><Icon className="size-5 shrink-0"/>{t(key)}</Link></Button></li>)}</ul></nav><Button asChild variant="link" className="mt-6 text-xs"><Link to="/donnees">{t("legal.link")}</Link></Button></aside><main className="min-w-0 flex-1 pb-24 lg:pb-8">{children}</main></div>

      <InstallPrompt />

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 backdrop-blur lg:hidden">
        <ul className="mx-auto grid max-w-2xl grid-cols-5">
          {tabs.map(({ to, key, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <li key={to}>
                <Link
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center gap-1 py-2 text-[11px] font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}
                >
                  <span className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${active ? "bg-accent" : ""}`}>
                    <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />{key==='nav.messages'&&unread>0&&<span className="ml-1 rounded-full bg-secondary px-1 text-[10px] text-secondary-foreground">{unread}</span>}
                  </span>
                  {t(key)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
