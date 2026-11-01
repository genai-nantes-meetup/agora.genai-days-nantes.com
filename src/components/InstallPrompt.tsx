import {track} from '@/lib/analytics';
import { Share, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { getCapturedInstallEvent, subscribeInstallEvent, type BeforeInstallPromptEvent } from "@/lib/pwa";

const IOS_KEY = "hey-genai:ios-hint-seen";
const ANDROID_KEY = "hey-genai:android-hint-seen";

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

    if (!isIos) {
      // Desktop: no custom UI (pwa.ts only captures the prompt event on Android).
      const swallow = (e: Event) => e.preventDefault();
      window.addEventListener("beforeinstallprompt", swallow);
      return () => window.removeEventListener("beforeinstallprompt", swallow);
    }

    try {
      if (!localStorage.getItem(IOS_KEY)) {
        setIos(true);
        track("pwa_install_prompt_shown");
        localStorage.setItem(IOS_KEY, "1"); // shown only once
      }
    } catch {
      /* ignore */
    }
    return undefined;
  }, []);

  useEffect(() => {
    const showOnce = (e: BeforeInstallPromptEvent): boolean => {
      try {
        if (localStorage.getItem(ANDROID_KEY)) return false;
        localStorage.setItem(ANDROID_KEY, "1"); // shown only once
      } catch {
        /* ignore */
      }
      setAndroidEvent(e);
      track("pwa_install_prompt_shown");
      return true;
    };

    const captured = getCapturedInstallEvent();
    if (captured) showOnce(captured);
    return subscribeInstallEvent((e) => showOnce(e));
  }, []);

  useEffect(() => {
    if (!androidEvent) return;
    const onInstalled = () => setAndroidEvent(null);
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, [androidEvent]);

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
            <p className="text-sm leading-snug">{t("install.ios")}</p>
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
