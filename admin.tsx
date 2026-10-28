import { createFileRoute } from "@tanstack/react-router";
import { Admin } from "@/components/pages/Admin";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [
    { title: "Admin Panel — SensVerify User Tracking" },
    { name: "description", content: "User tracking, daily users chart, activity logs and CSV download." },
    { property: "og:title", content: "Admin Panel — SensVerify User Tracking" },
    { property: "og:description", content: "User tracking, daily users chart, activity logs and CSV download." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Admin,
});
