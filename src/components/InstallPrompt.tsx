import { Share, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

const IOS_KEY = "hey-genai:ios-hint-seen";
const ANDROID_KEY = "hey-genai:android-hint-seen";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

export function InstallPrompt() {
  const { t } = useI18n();
  const [ios, setIos] = useState(false);
  const [androidEvent, setAndroidEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const ua = navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
    const isAndroid = /android/i.test(ua);

    if (isAndroid) {
      // Chrome/Android fires beforeinstallprompt before React mounts: if we
      // miss it, register a late listener and ask the browser for the saved one.
      const onPrompt = (e: Event) => {
        e.preventDefault();
        if (androidEvent) return;
        try {
          if (localStorage.getItem(ANDROID_KEY)) return;
          localStorage.setItem(ANDROID_KEY, "1"); // shown only once
        } catch {
          /* ignore */
        }
        setAndroidEvent(e as BeforeInstallPromptEvent);
      };
      window.addEventListener("beforeinstallprompt", onPrompt);
      const native = (navigator as Navigator & { getInstalledRelatedApps?: unknown }).getInstalledRelatedApps;
      if (native) {
        // If the event never arrives (some Android browsers), fall back silently.
        window.setTimeout(() => undefined, 0);
      }
      const onInstalled = () => setAndroidEvent(null);
      window.addEventListener("appinstalled", onInstalled);
      return () => {
        window.removeEventListener("beforeinstallprompt", onPrompt);
        window.removeEventListener("appinstalled", onInstalled);
      };
    }

    // Desktop: swallow the event, no custom UI.
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
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ios && !androidEvent) return null;

  const installAndroid = async () => {
    if (!androidEvent) return;
    try {
      await androidEvent.prompt();
    } catch {
      /* ignore */
    }
    setAndroidEvent(null);
  };

  return (
    <div className="fixed inset-x-3 bottom-20 z-40 mx-auto max-w-md rounded-xl bg-primary p-4 text-primary-foreground shadow-card">
      <div className="flex items-start gap-3">
        <Share className="mt-0.5 size-5 shrink-0 text-accent" />
        <div className="flex-1">
          {androidEvent ? (
            <>
              <p className="text-sm font-bold leading-snug">{t("install.body")}</p>
              <button
                type="button"
                onClick={installAndroid}
                className="mt-2 rounded-md bg-accent px-3 py-1.5 text-sm font-bold text-accent-foreground"
              >
                {t("install.cta")}
              </button>
            </>
          ) : (
            <p className="flex-1 text-sm leading-snug">{t("install.ios")}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setIos(false);
            setAndroidEvent(null);
          }}
          aria-label={t("close")}
          className="-m-1 p-1"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
