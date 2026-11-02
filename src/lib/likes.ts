import {track} from '@/lib/analytics';
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { overlaps, toggleSessionLike, type Session } from "./event";
import { useAuth } from "./auth";

const KEY = "hey-genai:likes";
const OWNER_KEY = "hey-genai:likes-owner";
const EMPTY: string[] = [];
let cacheRaw: string | null = null;
let cache: string[] = EMPTY;
const listeners = new Set<() => void>();

function read(): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return cache;
  }
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    try {
      const v = raw ? JSON.parse(raw) : [];
      cache = Array.isArray(v) ? v.filter((x) => typeof x === "string") : EMPTY;
    } catch {
      cache = EMPTY;
    }
  }
  return cache;
}

function write(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => e.key === KEY && l();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

/** Likes are private, and require a signed-in account. Signed-in likes live in the database; localStorage is the signed-out store and local cache. */
export function useLikes() {
  const likes = useSyncExternalStore(subscribe, read, () => EMPTY);
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id ?? null;

  // The database is the source of truth. Local likes are pushed only once per account on this device
  // (likes made before signing in); afterwards the local copy is a cache refreshed on sign-in and on return to the app,
  // so a replacement made on another device is never resurrected here.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let running = false;
    const refresh = async () => {
      if (running) return;
      running = true;
      try {
        let owner: string | null = null;
        try { owner = localStorage.getItem(OWNER_KEY); } catch { /* ignore */ }
        const local = read();
        let { data } = await supabase.from("session_likes").select("session_id").eq("user_id", userId);
        if (!data) return;
        // Push device likes only on this account's first sync here, and only if the account has none yet.
        if (owner !== userId && local.length && data.length === 0) {
          const { error } = await supabase
            .from("session_likes")
            .upsert(local.map((session_id) => ({ user_id: userId, session_id })), { onConflict: "user_id,session_id", ignoreDuplicates: true });
          if (!error) data = local.map((session_id) => ({ session_id }));
        }
        if (cancelled || !data) return;
        try { localStorage.setItem(OWNER_KEY, userId); } catch { /* ignore */ }
        write(data.map((r) => r.session_id));
      } finally {
        running = false;
      }
    };
    void refresh();
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [userId]);

  const toggle = useCallback(
    (session: Session, all: Session[]) => {
      if (!ready) return;
      if (!userId) {
        void navigate({ to: "/login" });
        return;
      }
      const prev = read();
      const next = toggleSessionLike(prev, session, all);
      write(next);
      track(next.includes(session.id) ? 'session_liked' : 'session_unliked', { session_id: session.id });
      // When adding, clear every overlapping like in the database, including ones made on another device.
      const removed = next.includes(session.id)
        ? all.filter((o) => o.id !== session.id && overlaps(o, session)).map((o) => o.id)
        : [session.id];
      const added = next.filter((x) => !prev.includes(x));
      void (async () => {
        try {
          if (removed.length) {
            await supabase.from("session_likes").delete().eq("user_id", userId).in("session_id", removed);
          }
          if (added.length) {
            await supabase.from("session_likes").insert(added.map((session_id) => ({ user_id: userId, session_id })));
          }
        } catch {
          /* offline or transient failure: local copy already updated */
        }
      })();
    },
    [userId, ready, navigate],
  );

  return { likes, toggle };
}
