import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common";

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({
    meta: [
      { title: "Profil · Hey GenAI Days" },
      { name: "description", content: "Profil — bientôt disponible dans Hey GenAI Days." },
      { property: "og:title", content: "Profil · Hey GenAI Days" },
      { property: "og:description", content: "Profil — bientôt disponible dans l'app des GenAI Days." },
    ],
  }),
  component: ComingSoon,
});
