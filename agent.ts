import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createAIOpsCoordinatorAgent } from "./src/backend/infrastructure/adk/aiops-coordinator";

const rootDir = dirname(fileURLToPath(import.meta.url));

config({ path: resolve(rootDir, ".env.local") });
config({ path: resolve(rootDir, ".env") });

// ADK devtools docs use GEMINI_API_KEY; this app also accepts GOOGLE_* keys.
if (!process.env.GEMINI_API_KEY?.trim()) {
  const fallback =
    process.env.GOOGLE_API_KEY ??
    process.env.GOOGLE_GENAI_API_KEY ??
    process.env.GEMINI_API_KEY;
  if (fallback?.trim()) {
    process.env.GEMINI_API_KEY = fallback.trim();
  }
}

/** Root agent for `npm run adk:web` / `npm run adk:run` (same as chat `aiops_coordinator`). */
export const rootAgent = createAIOpsCoordinatorAgent();
