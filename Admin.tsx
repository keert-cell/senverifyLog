import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { adminUsers, setAdmin } from "@/lib/app.functions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";



const SAMPLE = [
  { phone: "+91 98765 43210", time: "Today 10:30 AM", verified: true, threats: 3, status: "Secure" },
  { phone: "+91 91234 56780", time: "Today 10:12 AM", verified: true, threats: 1, status: "Secure" },
  { phone: "+91 99887 76655", time: "Today 09:48 AM", verified: true, threats: 5, status: "At Risk" },
  { phone: "+91 90000 12345", time: "Today 09:15 AM", verified: true, threats: 0, status: "Secure" },
  { phone: "+91 88776 65544", time: "Yesterday 8:40 PM", verified: false, threats: 2, status: "Secure" },
];
const JOINED = [120, 150, 180, 200, 220, 180, 198].map((users, i) => ({ day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i], users }));
const LOGS = [
  "🔴 SCAM blocked — fake KYC update SMS (+91 98765 43210)",
  "🟢 SAFE — bank OTP message (+91 91234 56780)",
  "🔴 SCAM blocked — lottery prize link (+91 99887 76655)",
  "🟢 SAFE — delivery update (+91 90000 12345)",
  "🔴 SCAM blocked — fake electricity bill (+91 88776 65544)",
];
const tip = { background: "var(--color-card)", border: "1px solid var(--color-border)" };

function downloadCsv() {
  const rows = [["Phone Number", "Login Time", "Verified", "Threats Blocked", "Status"], ...SAMPLE.map((r) => [r.phone, r.time, r.verified ? "Verified" : "Not verified", `${r.threats} Threats`, r.status])];
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "sensverify-users.csv";
  a.click();
}

export function Admin() {
  const { data } = useQuery({ queryKey: ["admin-users"], queryFn: () => adminUsers(), refetchInterval: 5000 });
  const qc = useQueryClient();
  const [logs, setLogs] = useState(LOGS.slice(0, 3).map((t) => ({ t, at: new Date() })));
  useEffect(() => {
    let i = 3;
    const id = setInterval(() => { setLogs((l) => [{ t: LOGS[i++ % LOGS.length] ?? "", at: new Date() }, ...l].slice(0, 8)); }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">Admin Panel - User Tracking</h1>
      <div className="grid grid-cols-3 gap-3">
        {[["Total Users", "1,248"], ["Active Now", "342"], ["Secure", "94.5%"]].map(([l, v]) => (
          <div key={l} className="glow-card p-4 text-center"><p className="text-sm text-muted-foreground">{l}</p><p className="text-3xl font-bold">{v}</p></div>
        ))}
      </div>

      <div className="glow-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold">Users</h2>
          <Button onClick={downloadCsv}>⬇ Download CSV</Button>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>Phone Number</TableHead><TableHead>Login Time</TableHead><TableHead>Verified</TableHead><TableHead>Threats Blocked</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {SAMPLE.map((r) => (
              <TableRow key={r.phone}><TableCell>{r.phone}</TableCell><TableCell>{r.time}</TableCell><TableCell>{r.verified ? "✅ Verified" : "—"}</TableCell><TableCell>{r.threats} Threats</TableCell><TableCell className={r.status === "Secure" ? "font-bold text-primary" : "font-bold text-destructive"}>{r.status}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="glow-card p-5">
        <h2 className="mb-3 text-xl font-bold">Daily Users Joined · last 7 days</h2>
        <div className="h-56"><ResponsiveContainer>
          <BarChart data={JOINED}><XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} /><YAxis stroke="var(--color-muted-foreground)" fontSize={12} /><Tooltip contentStyle={tip} /><Bar dataKey="users" fill="var(--color-primary)" radius={[6, 6, 0, 0]} /></BarChart>
        </ResponsiveContainer></div>
      </div>

      <div className="glow-card p-5">
        <h2 className="mb-1 flex items-center gap-2 text-xl font-bold"><span className="h-3 w-3 animate-pulse rounded-full bg-primary" /> Real-time Logs</h2>
        <p className="mb-3 text-muted-foreground">New SMS from your phone appear here automatically.</p>
        <ul className="space-y-2">
          {logs.map((l, i) => <li key={i} className="rounded-lg bg-secondary p-3"><span className="mr-2 text-sm text-muted-foreground">{l.at.toLocaleTimeString()}</span>{l.t}</li>)}
        </ul>
      </div>

      {data?.isAdmin && (
        <div className="glow-card p-5">
          <h2 className="mb-3 text-xl font-bold">Real accounts ({data.users.length}) · manage admins</h2>
          <Table>
            <TableHeader><TableRow><TableHead>Phone</TableHead><TableHead>Joined</TableHead><TableHead>Scans</TableHead><TableHead>Threats</TableHead><TableHead>Admin</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.users.map((u) => (
                <TableRow key={u.id}><TableCell>+{u.phone}</TableCell><TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell><TableCell>{u.scans}</TableCell><TableCell className="font-bold text-destructive">{u.threats}</TableCell><TableCell><button className="rounded-md bg-primary px-3 py-1 font-semibold text-primary-foreground" onClick={async () => { try { await setAdmin({ data: { userId: u.id, admin: !u.isAdmin } }); qc.invalidateQueries({ queryKey: ["admin-users"] }); } catch (e) { alert(e instanceof Error ? e.message : "Failed"); } }}>{u.isAdmin ? "Remove admin" : "Make admin"}</button></TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
