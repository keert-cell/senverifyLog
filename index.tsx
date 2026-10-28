import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { otpLogin } from "@/lib/app.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SensVerify-24-7 — AI Scam & Fake News Detector" },
      { name: "description", content: "24/7 AI protection from scam SMS, emails, calls, links and fake news." },
      { property: "og:title", content: "SensVerify-24-7 — AI Scam & Fake News Detector" },
      { property: "og:description", content: "24/7 AI protection from scam SMS, emails, calls, links and fake news." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) nav({ to: "/dashboard" }); });
  }, [nav]);

  async function verify() {
    setBusy(true); setErr("");
    const res = await otpLogin({ data: { phone: "91" + phone, otp } });
    if (!res.ok) { setErr(res.error); setBusy(false); return; }
    const { error } = await supabase.auth.signInWithPassword({ email: res.email, password: res.password });
    setBusy(false);
    if (error) return setErr("Sign in failed, try again");
    nav({ to: "/dashboard" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-5">
      <div className="glow-card w-full max-w-md p-8 text-center">
        <ShieldCheck className="mx-auto h-16 w-16 text-primary" />
        <h1 className="mt-3 text-3xl font-bold">SensVerify-24-7</h1>
        <p className="mt-1 text-muted-foreground">AI Scam & Fake News Detector</p>
        {step === "phone" ? (
          <div className="mt-8 space-y-4 text-left">
            <label className="text-lg font-semibold">Your mobile number</label>
            <div className="flex gap-2">
              <span className="flex items-center rounded-md border px-3 text-lg font-bold">+91</span>
              <Input inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} className="h-14 text-xl" placeholder="98765 43210" />
            </div>
            <Button size="lg" className="h-14 w-full text-lg" disabled={phone.length !== 10} onClick={() => setStep("otp")}>Get code</Button>
          </div>
        ) : (
          <div className="mt-8 space-y-4 text-left">
            <label className="text-lg font-semibold">Enter the 6-digit code</label>
            <Input inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} className="h-14 text-center text-2xl tracking-[0.5em]" placeholder="••••••" />
            {err && <p className="text-destructive font-semibold">{err}</p>}
            <Button size="lg" className="h-14 w-full text-lg" disabled={otp.length !== 6 || busy} onClick={verify}>{busy ? "Checking…" : "Sign in"}</Button>
            <button className="w-full text-muted-foreground underline" onClick={() => setStep("phone")}>Change number</button>
          </div>
        )}
      </div>
    </main>
  );
}
