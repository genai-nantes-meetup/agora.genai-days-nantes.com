import { useCallback, useSyncExternalStore } from "react";
import { useNavigate } from "@tanstack/react-router";
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

/** Likes are private, and require a signed-in account. */
export function useLikes() {
  const likes = useSyncExternalStore(subscribe, read, () => EMPTY);
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  const toggle = useCallback(
    (session: Session, all: Session[]) => {
      if (!ready) return;
      if (!user) {
        void navigate({ to: "/login" });
        return;
      }
      write(toggleSessionLike(read(), session, all));
    },
    [user, navigate],
  );

  return { likes, toggle };
}
