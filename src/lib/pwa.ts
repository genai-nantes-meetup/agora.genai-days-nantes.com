// Single service-worker registration wrapper. Never registers in dev, iframes or Lovable previews.
const PREVIEW_LABEL = /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

// Android Chrome fires beforeinstallprompt early, often before React mounts.
// Capture it at module load so the custom banner can call prompt() later.
const installEventListeners = new Set<(e: BeforeInstallPromptEvent) => void>();
let capturedInstallEvent: BeforeInstallPromptEvent | null = null;

if (typeof window !== "undefined" && typeof navigator !== "undefined" && /android/i.test(navigator.userAgent)) {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // we propose our own banner instead of the native mini-infobar
    if (capturedInstallEvent) return;
    capturedInstallEvent = e as BeforeInstallPromptEvent;
    installEventListeners.forEach((l) => l(capturedInstallEvent));
  });
}

export function getCapturedInstallEvent(): BeforeInstallPromptEvent | null {
  return capturedInstallEvent;
}

export function subscribeInstallEvent(cb: (e: BeforeInstallPromptEvent) => void): () => void {
  installEventListeners.add(cb);
  return () => {
    installEventListeners.delete(cb);
  };
}

function isRefusedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname.toLowerCase();
  const label = host.split(".")[0] ?? "";
  const lovableHosts = [".lovable.app", ".gpt-eng.com", ".gptengineer.run"];
  if (lovableHosts.some((d) => host.endsWith(d)) && PREVIEW_LABEL.test(label)) return true;
  if (/^project--[a-z0-9-]+-dev\.(lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(host)) return true;
  for (const d of ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"]) {
    if (host === d || host.endsWith(`.${d}`)) return true;
  }
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterAppSw() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs.filter((r) => (r.active || r.installing || r.waiting)?.scriptURL.endsWith("/sw.js")).map((r) => r.unregister()),
  );
}

export async function setupServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (isRefusedContext()) {
    await unregisterAppSw().catch(() => {});
    return;
  }
  const { registerSW } = await import("virtual:pwa-register");
  registerSW({ immediate: true });
}
