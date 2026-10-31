import { useCallback, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { overlaps, type Session } from "./event";

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

/** Likes are private, local to this device for phase 1. */
export function useLikes() {
  const likes = useSyncExternalStore(subscribe, read, () => EMPTY);

  const toggle = useCallback(
    (session: Session, all: Session[], overlapMsg: (title: string) => string) => {
      const current = read();
      if (current.includes(session.id)) {
        write(current.filter((id) => id !== session.id));
        return;
      }
      const clash = all.find((o) => o.id !== session.id && current.includes(o.id) && overlaps(o, session));
      write([...current, session.id]);
      if (clash) toast.warning(overlapMsg(clash.title));
    },
    [],
  );

  return { likes, toggle };
}
