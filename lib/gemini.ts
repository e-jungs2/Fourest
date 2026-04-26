import { GoogleGenAI } from "@google/genai";

const DEFAULT_TIMEOUT_MS = 2500;

export function hasGeminiKey() {
  return Boolean(process.env.GEMINI_API_KEY);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)), timeoutMs);
    })
  ]);
}

export async function generateJsonWithTimeout<T>(prompt: string, fallback: T, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  return withTimeout(generateJson(prompt, fallback), timeoutMs).catch(() => fallback);
}

export async function generateJson<T>(prompt: string, fallback: T): Promise<T> {
  if (!process.env.GEMINI_API_KEY) return fallback;
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await withTimeout(
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      })
    );
    const text = response.text?.trim();
    if (!text) return fallback;
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

export async function generateText(prompt: string, fallback: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) return fallback;
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await withTimeout(
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      })
    );
    return response.text?.trim() || fallback;
  } catch {
    return fallback;
  }
}
