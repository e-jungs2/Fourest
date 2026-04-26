import { GoogleGenAI } from "@google/genai";

export function hasGeminiKey() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function generateJson<T>(prompt: string, fallback: T): Promise<T> {
  if (!process.env.GEMINI_API_KEY) return fallback;
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
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
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });
    return response.text?.trim() || fallback;
  } catch {
    return fallback;
  }
}
