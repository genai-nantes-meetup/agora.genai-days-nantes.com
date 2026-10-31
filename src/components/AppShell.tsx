import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, Map, MessageCircle, User, Users, WifiOff } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useI18n, type TKey } from "@/lib/i18n";
import { InstallPrompt } from "./InstallPrompt";

const tabs: { to: "/networking" | "/messages" | "/" | "/plan" | "/profil"; key: TKey; icon: typeof Users; match: (p: string) => boolean }[] = [
  { to: "/networking", key: "nav.networking", icon: Users, match: (p) => p.startsWith("/networking") },
  { to: "/messages", key: "nav.messages", icon: MessageCircle, match: (p) => p.startsWith("/messages") },
  { to: "/", key: "nav.program", icon: CalendarDays, match: (p) => p === "/" || p.startsWith("/sessions") || p.startsWith("/speakers") },
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

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <header className="pt-safe sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <Link to="/" className="flex items-baseline gap-1.5">
            <span className="font-label text-xs text-muted-foreground">Hey</span>
            <span className="font-display text-xl font-semibold leading-none">GenAI Days</span>
            <span aria-hidden className="ml-0.5 inline-block size-2 rounded-full bg-accent" />
          </Link>
          <button
            type="button"
            onClick={() => setLang(lang === "fr" ? "en" : "fr")}
            aria-label={t("lang.switch")}
            className="flex overflow-hidden rounded-full border font-label text-xs"
          >
            {(["fr", "en"] as const).map((l) => (
              <span key={l} className={`px-2.5 py-1 uppercase ${lang === l ? "bg-primary text-primary-foreground" : ""}`}>
                {l}
              </span>
            ))}
          </button>
        </div>
        {!online && (
          <div className="flex items-center justify-center gap-2 bg-primary py-1 text-xs text-primary-foreground">
            <WifiOff className="size-3.5" /> {t("offline")}
          </div>
        )}
      </header>

      <main className="flex-1 pb-24">{children}</main>

      <InstallPrompt />

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 backdrop-blur">
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
                    <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
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
