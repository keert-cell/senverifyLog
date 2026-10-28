import { useState } from "react";
import { chatBot, translateText } from "@/lib/app.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";



const STEPS = [
  { icon: "📱", title: "Step 1: Login", text: "Enter your phone number with +91 and the code 606819." },
  { icon: "📊", title: "Step 2: Dashboard", text: "See your 92/100 Security Score, 18 threats blocked and 146 scans." },
  { icon: "🛡️", title: "Step 3: Auto SMS Detection", text: "New SMS are checked automatically as they arrive. No manual paste. 24/7 ON." },
  { icon: "💡", title: "Step 4: Stay Safe Tips", text: "Don't share your OTP. Don't click fake links. Check news before you forward it." },
];
const FAQ = [
  { q: "Is it free?", a: "Yes. Lifetime free." },
  { q: "Is it 24/7?", a: "Yes. It never sleeps — protection runs 24/7." },
  { q: "Is my data safe?", a: "Yes. Your data is encrypted and private to you." },
];

export function Helper() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"en" | "te">("en");
  const [msgs, setMsgs] = useState<{ me: boolean; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [tIn, setTIn] = useState("");
  const [tOut, setTOut] = useState("");
  const [tTo, setTTo] = useState<"en" | "te">("te");
  const [tBusy, setTBusy] = useState(false);

  async function send() {
    const m = input.trim(); if (!m) return;
    setMsgs((x) => [...x, { me: true, text: m }]); setInput(""); setBusy(true);
    try { const r = await chatBot({ data: { message: m, lang } }); setMsgs((x) => [...x, { me: false, text: r.reply }]); }
    catch (e) { setMsgs((x) => [...x, { me: false, text: e instanceof Error ? e.message : "Error" }]); }
    setBusy(false);
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">Helper - How to Use SensVerify</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {STEPS.map((s) => (
          <div key={s.title} className="glow-card flex gap-4 p-5">
            <span className="text-4xl" aria-hidden>{s.icon}</span>
            <div><h2 className="text-lg font-bold">{s.title}</h2><p className="text-muted-foreground">{s.text}</p></div>
          </div>
        ))}
      </div>

      <div className="glow-card p-5">
        <h2 className="mb-2 text-xl font-bold">FAQ</h2>
        <Accordion type="single" collapsible>
          {FAQ.map((f) => (
            <AccordionItem key={f.q} value={f.q}><AccordionTrigger className="text-lg">{f.q}</AccordionTrigger><AccordionContent className="text-base text-muted-foreground">{f.a}</AccordionContent></AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="glow-card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Translator</h2>
          <div className="flex gap-2">
            <Button variant={tTo === "te" ? "default" : "secondary"} onClick={() => setTTo("te")}>→ తెలుగు</Button>
            <Button variant={tTo === "en" ? "default" : "secondary"} onClick={() => setTTo("en")}>→ English</Button>
          </div>
        </div>
        <Textarea value={tIn} onChange={(e) => setTIn(e.target.value)} className="min-h-24 text-lg" placeholder="Text to translate" />
        <Button size="lg" className="w-full" disabled={!tIn.trim() || tBusy} onClick={async () => { setTBusy(true); try { setTOut((await translateText({ data: { text: tIn, to: tTo } })).text); } catch (e) { setTOut(e instanceof Error ? e.message : "Error"); } setTBusy(false); }}>{tBusy ? "Translating…" : "Translate"}</Button>
        {tOut && <p className="whitespace-pre-wrap rounded-lg bg-secondary p-4 text-lg">{tOut}</p>}
      </div>

      {!open && (
        <button onClick={() => setOpen(true)} className="fixed bottom-24 right-4 z-40 rounded-full border border-primary bg-primary px-5 py-3 font-bold text-primary-foreground shadow-lg">💬 Ask Help</button>
      )}
      {open && (
        <div className="fixed bottom-24 right-4 z-40 flex w-[min(24rem,calc(100vw-2rem))] flex-col rounded-2xl border border-primary bg-card p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-bold">Ask SensVerify</h2>
            <div className="flex items-center gap-1">
              <Button size="sm" variant={lang === "en" ? "default" : "secondary"} onClick={() => setLang("en")}>EN</Button>
              <Button size="sm" variant={lang === "te" ? "default" : "secondary"} onClick={() => setLang("te")}>తెలుగు</Button>
              <Button size="sm" variant="ghost" aria-label="Close chat" onClick={() => setOpen(false)}>✕</Button>
            </div>
          </div>
          <div className="max-h-72 min-h-32 space-y-2 overflow-y-auto">
            {msgs.length === 0 && <p className="text-muted-foreground">{lang === "te" ? "మోసాల గురించి ఏదైనా అడగండి." : "Ask anything about scams or a message you got."}</p>}
            {msgs.map((m, i) => (
              <div key={i} className={`whitespace-pre-wrap rounded-lg p-2 ${m.me ? "ml-8 bg-primary text-primary-foreground" : "mr-8 bg-secondary"}`}>{m.text}</div>
            ))}
            {busy && <div className="mr-8 rounded-lg bg-secondary p-2 text-muted-foreground">…</div>}
          </div>
          <div className="mt-3 flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} className="h-12" placeholder={lang === "te" ? "ఇక్కడ టైప్ చేయండి" : "Type here"} />
            <Button className="h-12" disabled={busy} onClick={send}>Send</Button>
          </div>
        </div>
      )}
    </div>
  );
}
