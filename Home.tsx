import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceToken } from "@/lib/app.functions";
import { UserTracker } from "@/components/UserTracker";



type Scan = { id: string; kind: string; source: string; content: string; verdict: string; risk: number; reason: string | null; created_at: string };

export function Home() {
  const qc = useQueryClient();
  const { data: scans = [] } = useQuery({
    queryKey: ["scans"],
    refetchInterval: 5000,
    queryFn: async () => {
      const { data } = await supabase.from("scans").select("*").order("created_at", { ascending: false }).limit(500);
      return (data ?? []) as Scan[];
    },
  });

  useEffect(() => {
    const ch = supabase.channel(`scans-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "scans" }, () => qc.invalidateQueries({ queryKey: ["scans"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const today = new Date().toDateString();
  const { data: dev } = useQuery({ queryKey: ["device-token"], queryFn: () => getDeviceToken(), staleTime: Infinity });
  const realThreats = scans.filter((s) => s.verdict === "scam" && new Date(s.created_at).toDateString() === today).length;
  const recent = scans.slice(0, 20);
  // Demo baseline for the expo; real SMS add on top.
  const BASE = { score: 92, threats: 18, scans: 146, risk: 0.6 };
  const threatsToday = BASE.threats + realThreats;
  const risk = (BASE.risk * BASE.scans + scans.reduce((a, s) => a + Number(s.risk), 0)) / (BASE.scans + scans.length);
  const score = Math.max(0, Math.min(100, Math.round(BASE.score - (risk - BASE.risk) * 20 - realThreats * 0.4)));
  const hours = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.now() - (11 - i) * 3600_000);
    const h = d.getHours();
    return { hour: `${h}:00`, threats: scans.filter((s) => s.verdict !== "safe" && new Date(s.created_at).getHours() === h && Date.now() - new Date(s.created_at).getTime() < 12 * 3600_000).length };
  });
  const C = 2 * Math.PI * 70;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-lg font-bold"><span className="live-dot" /> LIVE · updates every 5 sec</div>
      <div className="grid gap-5 md:grid-cols-[auto_1fr]">
        <div className="glow-card flex flex-col items-center p-6">
          <svg width="180" height="180" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r="70" fill="none" stroke="var(--color-secondary)" strokeWidth="14" />
            <circle cx="90" cy="90" r="70" fill="none" stroke="var(--color-primary)" strokeWidth="14" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - score / 100)} transform="rotate(-90 90 90)" />
            <text x="90" y="88" textAnchor="middle" fill="var(--color-foreground)" fontSize="40" fontWeight="800">{score}</text>
            <text x="90" y="115" textAnchor="middle" fill="var(--color-muted-foreground)" fontSize="15">/ 100</text>
          </svg>
          <p className="mt-2 text-lg font-bold">Security Score</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Stat label="THREATS BLOCKED TODAY" value={threatsToday} tone="text-destructive" />
          <Stat label="ACTIVE SCANS" value={BASE.scans + scans.length} />
          <Stat label="PROTECTED" value={1} tone="text-primary" />
          <Stat label="RISK" value={risk.toFixed(2)} tone="text-warning" />
        </div>
      </div>
      <div className="glow-card p-5">
        <h2 className="mb-3 text-xl font-bold">Threat Activity Trend</h2>
        <div className="h-56">
          <ResponsiveContainer>
            <LineChart data={hours}>
              <XAxis dataKey="hour" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis allowDecimals={false} stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }} />
              <Line type="monotone" dataKey="threats" stroke="var(--color-primary)" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <UserTracker />
      {dev && (
        <div className="glow-card p-5">
          <h2 className="mb-2 text-xl font-bold">Your phone link (keep private)</h2>
          <p className="mb-2 text-muted-foreground">Put this link in your SMS forwarder app. Add the message as sms= and your number as user_phone=.</p>
          <code className="block break-all rounded-lg bg-secondary p-3 text-sm">{`${typeof window !== "undefined" ? window.location.origin : ""}/api/public/sms?token=${dev.token}&user_phone=&sms=`}</code>
        </div>
      )}
      <div className="glow-card p-5">
        <h2 className="mb-3 text-xl font-bold">Scam Alerts Feed</h2>
        {recent.length === 0 && <p className="text-muted-foreground">No messages checked yet. New SMS from your phone appear here automatically.</p>}
        <ul className="space-y-3">
          {recent.map((s) => (
            <li key={s.id} className="rounded-lg bg-secondary p-4">
              <div className="flex items-center justify-between">
                <span className={`text-lg font-extrabold ${s.verdict === "scam" ? "text-destructive" : s.verdict === "safe" ? "text-primary" : "text-warning"}`}>
                  {s.verdict === "scam" ? "🔴 SCAM" : s.verdict === "safe" ? "🟢 SAFE" : "⚠️ CAREFUL"}
                </span>
                <span className="text-sm text-muted-foreground">{s.kind.toUpperCase()}{s.source === "sim" ? " · from SIM" : ""} · {new Date(s.created_at).toLocaleTimeString()}</span>
              </div>
              <p className="mt-1 line-clamp-2">{s.content}</p>
              {s.reason && <p className="mt-1 text-muted-foreground">{s.reason}</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "text-foreground" }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="glow-card p-5">
      <div className={`text-4xl font-extrabold ${tone}`}>{value}</div>
      <div className="mt-1 text-sm font-bold tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
