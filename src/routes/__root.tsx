import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { I18nProvider } from "@/lib/i18n";
import { AppShell } from "@/components/AppShell";
import { setupServiceWorker } from "@/lib/pwa";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-medium">404</h1>
        <div className="mt-6">
          <Link to="/" className="inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
            Programme
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-medium">Oups / Oops</h1>
        <p className="mt-2 text-sm text-muted-foreground">Une erreur est survenue. Something went wrong.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
          >
            Réessayer / Retry
          </button>
          <a href="/" className="rounded-full border px-5 py-2 text-sm font-semibold">
            Programme
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Hey GenAI Days" },
      { name: "description", content: "L'app compagnon des GenAI Days, 17 novembre 2026, Nantes." },
      { name: "theme-color", content: "#09122e" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "GenAI Days" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;0,800;1,600;1,800&family=Special+Elite&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    void setupServiceWorker().catch(() => {});
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AppShell>
          <Outlet />
        </AppShell>
        <Toaster position="top-center" richColors closeButton />
      </I18nProvider>
    </QueryClientProvider>
  );
}
