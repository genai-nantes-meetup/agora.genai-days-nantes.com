import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const IOS_KEY = "hey-genai:ios-hint-seen";
const DISMISS_KEY = "hey-genai:install-dismissed";

export function InstallPrompt() {
  const { t } = useI18n();
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const ua = navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
    try {
      if (isIos && !localStorage.getItem(IOS_KEY)) {
        setIos(true);
        localStorage.setItem(IOS_KEY, "1"); // shown only once
      }
    } catch {
      /* ignore */
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      try {
        if (sessionStorage.getItem(DISMISS_KEY)) return;
      } catch {
        /* ignore */
      }
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => setDeferred(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!deferred && !ios) return null;

  const close = () => {
    if (deferred) {
      try {
        sessionStorage.setItem(DISMISS_KEY, "1");
      } catch {
        /* ignore */
      }
    }
    setDeferred(null);
    setIos(false);
  };

  return (
    <div className="fixed inset-x-3 bottom-20 z-40 mx-auto max-w-md rounded-xl bg-primary p-4 text-primary-foreground shadow-card">
      <div className="flex items-start gap-3">
        {ios ? <Share className="mt-0.5 size-5 shrink-0 text-accent" /> : <Download className="mt-0.5 size-5 shrink-0 text-accent" />}
        <p className="flex-1 text-sm leading-snug">{ios ? t("install.ios") : t("install.body")}</p>
        <button type="button" onClick={close} aria-label={t("close")} className="-m-1 p-1">
          <X className="size-4" />
        </button>
      </div>
      {deferred && (
        <button
          type="button"
          onClick={async () => {
            await deferred.prompt();
            await deferred.userChoice.catch(() => null);
            setDeferred(null);
          }}
          className="mt-3 w-full rounded-full bg-accent py-2 text-sm font-semibold text-accent-foreground"
        >
          {t("install.cta")}
        </button>
      )}
    </div>
  );
}
