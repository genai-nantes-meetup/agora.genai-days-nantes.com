import { Share, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

const IOS_KEY = "hey-genai:ios-hint-seen";

export function InstallPrompt() {
  const { t } = useI18n();
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const ua = navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
    // Android: leave beforeinstallprompt untouched so the browser's native
    // install dialog shows. Desktop: swallow the event, no custom UI.
    if (!isIos) {
      const swallow = (e: Event) => e.preventDefault();
      window.addEventListener("beforeinstallprompt", swallow);
      return () => window.removeEventListener("beforeinstallprompt", swallow);
    }

    try {
      if (!localStorage.getItem(IOS_KEY)) {
        setIos(true);
        localStorage.setItem(IOS_KEY, "1"); // shown only once
      }
    } catch {
      /* ignore */
    }
  }, []);

  if (!ios) return null;

  return (
    <div className="fixed inset-x-3 bottom-20 z-40 mx-auto max-w-md rounded-xl bg-primary p-4 text-primary-foreground shadow-card">
      <div className="flex items-start gap-3">
        <Share className="mt-0.5 size-5 shrink-0 text-accent" />
        <p className="flex-1 text-sm leading-snug">{t("install.ios")}</p>
        <button
          type="button"
          onClick={() => setIos(false)}
          aria-label={t("close")}
          className="-m-1 p-1"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
