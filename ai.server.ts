import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

export async function askAI(system: string, prompt: string): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured");
  const openai = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  const result = streamText({
    model: openai.responses("openai/gpt-6-astra"),
    system,
    prompt,
    maxRetries: 0,
    providerOptions: {
      openai: { forceReasoning: true, reasoningEffort: "low", store: false },
    },
  });
  return await result.text;
}

export type ScanResult = { verdict: "safe" | "suspicious" | "scam"; risk: number; reason: string };

export async function scanContent(kind: string, content: string): Promise<ScanResult> {
  const text = await askAI(
    `You are SensVerify, a scam and fake-news detector. Analyze the ${kind} content. Reply ONLY with json: {"verdict":"safe|suspicious|scam","risk":0-1 number,"reason":"one short simple sentence a grandmother understands"}. For fake news, "scam" means false/misleading.`,
    content.slice(0, 4000),
  );
  try {
    const m = text.match(/\{[\s\S]*\}/);
    const j = JSON.parse(m ? m[0] : text);
    const verdict = ["safe", "suspicious", "scam"].includes(j.verdict) ? j.verdict : "suspicious";
    const risk = Math.min(1, Math.max(0, Number(j.risk) || 0));
    return { verdict, risk, reason: String(j.reason ?? "").slice(0, 300) };
  } catch {
    return { verdict: "suspicious", risk: 0.5, reason: "Could not fully check. Be careful." };
  }
}
