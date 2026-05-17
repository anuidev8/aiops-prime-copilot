import { Content } from "@google/genai";
import { Event, isFinalResponse, stringifyContent } from "@google/adk";

export function userTextMessage(text: string): Content {
  return {
    role: "user",
    parts: [{ text }],
  };
}

export async function collectFinalResponseText(
  events: AsyncIterable<Event>,
): Promise<string> {
  let finalText = "";

  for await (const event of events) {
    if (!isFinalResponse(event)) continue;

    const text = stringifyContent(event).trim();

    if (text) {
      finalText = text;
    }
  }

  return finalText;
}

export function extractJsonObject<T>(raw: string): T | null {
  const trimmed = raw.trim();

  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
      return null;
    }

    const candidate = trimmed.slice(firstBrace, lastBrace + 1);

    try {
      return JSON.parse(candidate) as T;
    } catch {
      return null;
    }
  }
}
