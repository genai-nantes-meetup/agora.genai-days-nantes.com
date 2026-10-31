// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        strategies: "generateSW",
        registerType: "autoUpdate",
        injectRegister: null,
        filename: "sw.js",
        outDir: "dist/client", // TanStack Start serves static assets from dist/client
        manifest: false, // served from public/manifest.webmanifest
        devOptions: { enabled: false },
        workbox: {
          globPatterns: ["**/*.{js,css,png,svg,ico,webmanifest}"],
          navigateFallback: null,
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: ({ request, url }) => request.mode === "navigate" && (url.pathname === "/" || url.pathname === "/plan" || url.pathname === "/donnees" || /^\/(sessions|speakers|sponsors)(\/|$)/.test(url.pathname)),
              handler: "NetworkFirst",
              options: { cacheName: "pages", networkTimeoutSeconds: 4, expiration: { maxEntries: 50 } },
            },
            {
              urlPattern: ({ url }) => url.origin === "https://genai-days-nantes.com" && url.pathname.startsWith("/api/"),
              handler: "NetworkFirst",
              options: {
                cacheName: "event-data",
                networkTimeoutSeconds: 4,
                cacheableResponse: { statuses: [0, 200] },
                matchOptions: { ignoreSearch: true },
                fetchOptions: { cache: "no-store" },
              },
            },
            {
              urlPattern: ({ request, url }) =>
                request.destination === "image" && url.origin === "https://genai-days-nantes.com",
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "event-images",
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            {
              urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com",
              handler: "StaleWhileRevalidate",
              options: { cacheName: "fonts", cacheableResponse: { statuses: [0, 200] }, expiration: { maxEntries: 30 } },
            },
          ],
        },
      }),
    ],
  },
});
