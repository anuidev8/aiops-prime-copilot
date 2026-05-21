import type { GoogleGenAIOptions } from "@google/genai";

export type LiveClientOptions = GoogleGenAIOptions;

export interface StreamingLog {
  date: Date;
  type: string;
  message: unknown;
}
