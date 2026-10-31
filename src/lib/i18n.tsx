import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import fr from "@/locales/fr.json";
import en from "@/locales/en.json";

export type Lang = "fr" | "en";
type Dict = typeof fr;
export type TKey = keyof Dict;

const dicts: Record<Lang, Dict> = { fr, en };
const STORAGE_KEY = "hey-genai:lang";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: TKey, vars?: Record<string, string | number>) => string };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    let initial: Lang = "fr";
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "fr" || stored === "en") initial = stored;
      else initial = navigator.language?.toLowerCase().startsWith("fr") ? "fr" : "en";
    } catch {
      /* ignore */
    }
    setLangState(initial);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (k: TKey, vars?: Record<string, string | number>) => {
      let s = dicts[lang][k] ?? dicts.fr[k] ?? String(k);
      if (vars) for (const [v, val] of Object.entries(vars)) s = s.replaceAll(`{${v}}`, String(val));
      return s;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
