import { createFileRoute } from "@tanstack/react-router";
import { Home } from "@/components/pages/Home";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [
    { title: "Home — SensVerify-24-7" },
    { name: "description", content: "Live security score, automatic SMS protection, threat activity and scam alerts." },
    { property: "og:title", content: "Home — SensVerify-24-7" },
    { property: "og:description", content: "Live security score, automatic SMS protection, threat activity and scam alerts." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Home,
});
