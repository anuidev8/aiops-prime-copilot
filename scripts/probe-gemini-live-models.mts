/**
 * Validates Live connect against the official Google sample shape.
 * Run: npx tsx scripts/probe-gemini-live-models.mts
 */
import { readFileSync } from "node:fs";
import { GoogleGenAI, type LiveConnectConfig, type LiveServerMessage } from "@google/genai";
import { config } from "dotenv";
import {
  buildOfficialGoogleLiveConfig,
  buildVoiceLiveConnectConfig,
  OFFICIAL_LIVE_MODEL,
  resolveLiveModel,
} from "../src/features/voice-live/lib/voice-live-config.ts";

config();

const key =
  process.env.NEXT_PUBLIC_GOOGLE_API_KEY?.trim() ??
  process.env.GEMINI_API_KEY?.trim();
if (!key) {
  console.error("Missing NEXT_PUBLIC_GOOGLE_API_KEY or GEMINI_API_KEY");
  process.exit(1);
}

const pkg = JSON.parse(
  readFileSync(new URL("../node_modules/@google/genai/package.json", import.meta.url), "utf8"),
) as { version: string };

console.log("@google/genai:", pkg.version);
console.log("resolved model:", resolveLiveModel());
console.log("official model:", OFFICIAL_LIVE_MODEL);

async function probeOfficial(
  sessionConfig: LiveConnectConfig,
  label: string,
): Promise<{ ok: boolean; detail: string }> {
  const responseQueue: LiveServerMessage[] = [];

  return new Promise((resolve) => {
    const ai = new GoogleGenAI({ apiKey: key });
    let settled = false;
    const finish = (ok: boolean, detail: string) => {
      if (settled) return;
      settled = true;
      resolve({ ok, detail });
    };
    const timer = setTimeout(() => finish(false, "timeout"), 10000);

    void ai.live
      .connect({
        model: OFFICIAL_LIVE_MODEL,
        config: sessionConfig,
        callbacks: {
          onopen: () => {
            clearTimeout(timer);
            finish(true, "onopen");
          },
          onmessage: (message: LiveServerMessage) => {
            responseQueue.push(message);
          },
          onerror: (e: ErrorEvent) => {
            clearTimeout(timer);
            finish(false, `onerror: ${e.message}`);
          },
          onclose: (e: CloseEvent) => {
            if (!settled) {
              clearTimeout(timer);
              finish(false, `onclose ${e.code}: ${e.reason || "(no reason)"}`);
            }
          },
        },
      })
      .then((session) => {
        session.sendClientContent({
          turns: ["Say hello in one short sentence."],
        });
        setTimeout(() => {
          try {
            session.close();
          } catch {
            // no-op
          }
        }, 1500);
      })
      .catch((err: unknown) => {
        clearTimeout(timer);
        finish(false, err instanceof Error ? err.message : String(err));
      });
  }).then((r) => {
    console.log(r.ok ? "PASS" : "FAIL", `[${label}]`, r.detail);
    return r;
  });
}

const official = await probeOfficial(buildOfficialGoogleLiveConfig(), "official-google-config");
const aiops = await probeOfficial(buildVoiceLiveConnectConfig(), "aiops-voice-bridge-config");

if (!official.ok || !aiops.ok) {
  process.exit(1);
}
