import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { askAI, scanContent } from "./ai.server";

const FIXED_OTP = "606819";

export const otpLogin = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ phone: z.string().regex(/^\+?\d{7,15}$/), otp: z.string() }).parse(d))
  .handler(async ({ data }) => {
    if (data.otp !== FIXED_OTP) return { ok: false as const, error: "Wrong code" };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const phone = data.phone.replace(/^\+/, "");
    const email = `${phone}@sensverify.app`;
    const password = crypto.randomUUID() + crypto.randomUUID();
    const { data: prof } = await supabaseAdmin.from("profiles").select("id").eq("phone", phone).maybeSingle();
    if (prof) {
      await supabaseAdmin.auth.admin.updateUserById(prof.id, { password });
    } else {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error || !created.user) return { ok: false as const, error: "Could not create account" };
      await supabaseAdmin.from("profiles").insert({ id: created.user.id, phone });
      // New accounts are never admins; an existing admin must approve them.
      await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: "user" });
    }
    return { ok: true as const, email, password };
  });

export const runScan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ kind: z.enum(["sms", "email", "call", "url", "news"]), content: z.string().min(1).max(4000) }).parse(d))
  .handler(async ({ data, context }) => {
    const r = await scanContent(data.kind, data.content);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("scans").insert({ user_id: context.userId, kind: data.kind, content: data.content, ...r });
    return r;
  });

export const chatBot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ message: z.string().min(1).max(2000), lang: z.enum(["en", "te"]) }).parse(d))
  .handler(async ({ data }) => {
    const reply = await askAI(
      `You are SensVerify helper, a kind assistant for elderly people about scams, fraud and fake news. Use very simple words, short sentences. Reply in ${data.lang === "te" ? "Telugu (తెలుగు script)" : "English"}.`,
      data.message,
    );
    return { reply };
  });

export const translateText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ text: z.string().min(1).max(3000), to: z.enum(["en", "te"]) }).parse(d))
  .handler(async ({ data }) => {
    const out = await askAI(
      `Translate the user text to ${data.to === "te" ? "Telugu" : "English"}. Output only the translation.`,
      data.text,
    );
    return { text: out };
  });

export const adminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) return { isAdmin: false, users: [] };
    const { data: roles } = await context.supabase.from("user_roles").select("user_id, role").eq("role", "admin");
    const { data: profiles } = await context.supabase.from("profiles").select("id, phone, name, created_at").order("created_at", { ascending: false });
    const { data: scans } = await context.supabase.from("scans").select("user_id, verdict");
    const users = (profiles ?? []).map((p) => {
      const mine = (scans ?? []).filter((s) => s.user_id === p.id);
      return { ...p, isAdmin: (roles ?? []).some((r) => r.user_id === p.id), scans: mine.length, threats: mine.filter((s) => s.verdict === "scam").length };
    });
    return { isAdmin: true, users };
  });

export const setAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid(), admin: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Only an admin can do this");
    if (data.userId === context.userId && !data.admin) throw new Error("You cannot remove your own admin access");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.admin) await supabaseAdmin.from("user_roles").upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
    else await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", "admin");
    return { ok: true };
  });

export const getDeviceToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("device_secrets").select("token").eq("user_id", context.userId).maybeSingle();
    if (data) return { token: data.token };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("device_secrets").upsert({ user_id: context.userId }, { onConflict: "user_id", ignoreDuplicates: false }).select("token").single();
    if (error || !row) throw new Error("Could not create phone link");
    return { token: row.token };
  });
