import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common";

export const Route = createFileRoute("/networking")({
  head: () => ({
    meta: [
      { title: "Networking · Hey GenAI Days" },
      { name: "description", content: "Networking — bientôt disponible dans Hey GenAI Days." },
      { property: "og:title", content: "Networking · Hey GenAI Days" },
      { property: "og:description", content: "Networking — bientôt disponible dans l'app des GenAI Days." },
    ],
  }),
  component: ComingSoon,
});
