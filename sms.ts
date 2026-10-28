import { createFileRoute } from "@tanstack/react-router";
import { scanContent } from "@/lib/ai.server";

// Phone helper apps (SMS forwarders) call: /api/public/sms?sms=<text>&user_phone=<number>
async function handle(request: Request) {
  const url = new URL(request.url);
  let sms = url.searchParams.get("sms");
  let phone = url.searchParams.get("user_phone");
  let token = url.searchParams.get("token") ?? request.headers.get("x-device-token");
  if (request.method === "POST" && (!sms || !phone || !token)) {
    try {
      const b = (await request.json()) as { sms?: string; user_phone?: string; token?: string };
      sms ??= b.sms ?? null;
      phone ??= b.user_phone ?? null;
      token ??= b.token ?? null;
    } catch { /* ignore */ }
  }
  if (!sms || !phone || !token) return Response.json({ error: "sms, user_phone and token are required" }, { status: 400 });
  if (!/^[a-f0-9]{48}$/.test(token)) return Response.json({ error: "Invalid token" }, { status: 401 });
  const cleanPhone = phone.replace(/[^\d]/g, "");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: dev } = await supabaseAdmin.from("device_secrets").select("user_id").eq("token", token).maybeSingle();
  if (!dev) return Response.json({ error: "Invalid token" }, { status: 401 });
  const { data: prof } = await supabaseAdmin.from("profiles").select("id").eq("id", dev.user_id).eq("phone", cleanPhone).maybeSingle();
  if (!prof) return Response.json({ error: "Phone does not match this device link" }, { status: 403 });
  const r = await scanContent("sms", sms.slice(0, 4000));
  await supabaseAdmin.from("scans").insert({ user_id: prof.id, kind: "sms", source: "sim", content: sms.slice(0, 4000), ...r });
  return Response.json(r);
}

export const Route = createFileRoute("/api/public/sms")({
  server: { handlers: { GET: ({ request }) => handle(request), POST: ({ request }) => handle(request) } },
});
