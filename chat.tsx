import { createFileRoute } from "@tanstack/react-router";
import { Helper } from "@/components/pages/Helper";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [
    { title: "Helper — How to Use SensVerify" },
    { name: "description", content: "Login steps, automatic protection, safety tips, FAQs and Telugu/English help." },
    { property: "og:title", content: "Helper — How to Use SensVerify" },
    { property: "og:description", content: "Login steps, automatic protection, safety tips, FAQs and Telugu/English help." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Helper,
});
