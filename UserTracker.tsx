import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const joined = [120, 150, 180, 200, 220, 180, 198].map((users, i) => ({ day: DAYS[i], users }));
const daily = [
  [980, 925], [1020, 968], [1090, 1030], [1150, 1088], [1200, 1135], [1170, 1108], [1248, 1180],
].map(([active, secure], i) => ({ day: DAYS[i], active, secure }));
const SECURE = 1180;
const AT_RISK = 68;
const TOTAL = SECURE + AT_RISK;
const CITIES = [
  { name: "Delhi", x: 52, y: 28 }, { name: "Mumbai", x: 30, y: 58 }, { name: "Hyderabad", x: 50, y: 62 },
  { name: "Bengaluru", x: 46, y: 76 }, { name: "Chennai", x: 56, y: 76 }, { name: "Kolkata", x: 78, y: 46 },
  { name: "Vijayawada", x: 58, y: 64 }, { name: "Visakhapatnam", x: 66, y: 58 },
];
const tip = { background: "var(--color-card)", border: "1px solid var(--color-border)" };
const axis = { stroke: "var(--color-muted-foreground)", fontSize: 12 };

export function UserTracker() {
  const [active, setActive] = useState(342);
  useEffect(() => {
    const t = setInterval(() => setActive((a) => Math.max(300, Math.min(390, a + Math.round(Math.random() * 10 - 5)))), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="glow-card space-y-6 p-5">
      <h2 className="text-xl font-bold">User Analytics Tracker</h2>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-secondary p-4">
          <p className="text-sm text-muted-foreground">TOTAL USERS</p>
          <p className="text-4xl font-bold">{TOTAL.toLocaleString("en-IN")}</p>
          <p className="text-sm text-muted-foreground">Users using the app</p>
        </div>
        <div className="rounded-xl bg-secondary p-4">
          <p className="text-sm text-muted-foreground">SECURE USERS</p>
          <p className="text-4xl font-bold text-success">{SECURE.toLocaleString("en-IN")}</p>
          <p className="text-sm text-muted-foreground">{((SECURE / TOTAL) * 100).toFixed(1)}% secure · <span className="text-destructive">{AT_RISK} at risk ({((AT_RISK / TOTAL) * 100).toFixed(1)}%)</span></p>
        </div>
        <div className="rounded-xl bg-secondary p-4">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full bg-success" /></span>
            ACTIVE NOW
          </p>
          <p className="text-4xl font-bold">{active}</p>
          <p className="text-sm text-muted-foreground">Updates every 5 sec</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-2 font-bold">Users joined · last 7 days</h3>
          <div className="h-52"><ResponsiveContainer>
            <BarChart data={joined}><XAxis dataKey="day" {...axis} /><YAxis {...axis} /><Tooltip contentStyle={tip} />
              <Bar dataKey="users" fill="var(--color-primary)" radius={[6, 6, 0, 0]} /></BarChart>
          </ResponsiveContainer></div>
        </div>
        <div>
          <h3 className="mb-2 font-bold">Secure vs At Risk</h3>
          <div className="h-52"><ResponsiveContainer>
            <PieChart><Tooltip contentStyle={tip} /><Legend />
              <Pie data={[{ name: "Secure", value: SECURE }, { name: "At Risk", value: AT_RISK }]} dataKey="value" innerRadius={45} outerRadius={75} stroke="none">
                <Cell fill="var(--color-success)" /><Cell fill="var(--color-destructive)" />
              </Pie></PieChart>
          </ResponsiveContainer></div>
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-bold">Daily Active vs Secure Users · 7 days</h3>
        <div className="h-60"><ResponsiveContainer>
          <BarChart data={daily}><XAxis dataKey="day" {...axis} /><YAxis {...axis} /><Tooltip contentStyle={tip} /><Legend />
            <Bar dataKey="active" name="Active" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="secure" name="Secure" fill="var(--color-success)" radius={[6, 6, 0, 0]} /></BarChart>
        </ResponsiveContainer></div>
      </div>

      <div>
        <h3 className="mb-2 font-bold">Where users are · India</h3>
        <div className="relative mx-auto aspect-[4/5] max-w-xs rounded-xl bg-secondary">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
            <path d="M40 5 L60 8 L58 20 L70 30 L88 38 L85 48 L72 50 L68 60 L60 72 L55 92 L48 95 L42 80 L35 68 L28 60 L22 50 L30 42 L36 30 L38 18 Z" fill="var(--color-card)" stroke="var(--color-primary)" strokeWidth="0.8" />
            {CITIES.map((c) => (
              <g key={c.name}><circle cx={c.x} cy={c.y} r="2.2" fill="var(--color-primary)" className="animate-pulse" /><title>{c.name}</title></g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
