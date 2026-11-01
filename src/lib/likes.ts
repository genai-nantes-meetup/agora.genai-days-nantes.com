import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toggleSessionLike, type Session } from "./event";
import { useAuth } from "./auth";

const KEY = "hey-genai:likes";
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

  // On sign-in (including right after signup): push local likes to the DB, then load the DB list as source of truth.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void (async () => {
      const local = read();
      if (local.length) {
        await supabase
          .from("session_likes")
          .upsert(local.map((session_id) => ({ user_id: userId, session_id })), {
            onConflict: "user_id,session_id",
            ignoreDuplicates: true,
          });
      }
      const { data } = await supabase.from("session_likes").select("session_id").eq("user_id", userId);
      if (!cancelled && data) write(data.map((r) => r.session_id));
    })();
    return () => {
      cancelled = true;
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
      const removed = prev.filter((x) => !next.includes(x));
      const added = next.filter((x) => !prev.includes(x));
      if (removed.length) {
        void supabase.from("session_likes").delete().eq("user_id", userId).in("session_id", removed);
      }
      if (added.length) {
        void supabase.from("session_likes").insert(added.map((session_id) => ({ user_id: userId, session_id })));
      }
    },
    [userId, ready, navigate],
  );

  return { likes, toggle };
}
