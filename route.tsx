import { createFileRoute, Link, Outlet, redirect, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { signOutToLogin } from "@/lib/sign-out";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/" });
    return { user: data.user };
  },
  component: Layout,
});

const tabs = [
  { to: "/dashboard", label: "Home" },
  { to: "/chat", label: "Helper" },
  { to: "/admin", label: "Admin" },
] as const;

function Layout() {
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useLocation({ select: (location) => location.pathname });
  const [activeTab, setActiveTab] = useState(pathname);
  const [signingOut, setSigningOut] = useState(false);
  useEffect(() => { setActiveTab(pathname); }, [pathname]);
  return (
    <div className="min-h-screen pb-24">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <span className="font-display text-xl font-bold">SensVerify-24-7</span>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-primary/60 bg-secondary px-3 py-1 text-xs font-bold tracking-wide text-primary">🛡️ 24/7 PROTECTED</span>
          <Button
            variant="link"
            disabled={signingOut}
            className="text-muted-foreground underline"
            onClick={async () => {
              setSigningOut(true);
              await signOutToLogin({
                cancelQueries: () => queryClient.cancelQueries(),
                clearQueries: () => queryClient.clear(),
                signOut: () => supabase.auth.signOut({ scope: "local" }),
                clearStorage: () => window.localStorage.clear(),
                navigate: () => nav({ to: "/", replace: true }),
                reloadLogin: () => window.location.replace("/"),
              });
            }}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4"><Outlet /></main>
      <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-50 border-t bg-secondary">
        <div className="mx-auto grid max-w-5xl grid-cols-3">
          {tabs.map((t) => (
            <Button key={t.to} asChild variant="ghost" className={`h-16 rounded-none text-base ${activeTab === t.to ? "font-bold text-primary" : "font-semibold text-muted-foreground"}`}>
              <Link to={t.to} preload={false} activeOptions={{ exact: true }} onClick={() => setActiveTab(t.to)}>{t.label}</Link>
            </Button>
          ))}
        </div>
      </nav>
    </div>
  );
}
