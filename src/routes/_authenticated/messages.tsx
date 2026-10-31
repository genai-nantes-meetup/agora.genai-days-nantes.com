import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Messages · Hey GenAI Days" },
      { name: "description", content: "Messages — bientôt disponible dans Hey GenAI Days." },
      { property: "og:title", content: "Messages · Hey GenAI Days" },
      { property: "og:description", content: "Messages — bientôt disponible dans l'app des GenAI Days." },
    ],
  }),
  component: ComingSoon,
});
