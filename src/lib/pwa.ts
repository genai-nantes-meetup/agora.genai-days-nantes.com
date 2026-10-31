// Single service-worker registration wrapper. Never registers in dev, iframes or Lovable previews.
const PREVIEW_LABEL = /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/;

function isRefusedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname.toLowerCase();
  const label = host.split(".")[0];
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
