import { NextResponse } from "next/server";
import { calculatePersonaSatisfaction } from "@/lib/agent-dialogue";
import { generateJsonWithTimeout } from "@/lib/gemini";
import { mockItinerary } from "@/lib/mock";
import type { AgentMessage, Itinerary, Persona, TravelSession } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    session: TravelSession;
    personas: Persona[];
    messages: AgentMessage[];
    researchArtifacts?: unknown[];
    selectedDestination: string;
  };
  const destination = body.selectedDestination || body.session.destination || "추천 여행지";
  const fallback = mockItinerary(body.session, body.personas || [], destination);
  const personaIds = (body.personas || []).map((p) => p.id).join(", ");
  const prompt = `
Create a Korean day-block travel itinerary from a persona negotiation.
Return only JSON matching this exact shape:
{
  destination: string,
  days: [{
    day: number,
    title: string,
    morning: string,
    afternoon: string,
    evening: string,
    note: string,
    morningAttribution: string[],
    afternoonAttribution: string[],
    eveningAttribution: string[]
  }],
  tradeoffs: string[],
  personaSatisfaction: Record<string, number>,
  consensusSummary: string
}

Attribution arrays contain the persona IDs (from the list below) whose preferences or requests are
directly reflected in that time block. Leave empty [] if no specific persona drove that block.
Available persona IDs: [${personaIds}]

Use morning/afternoon/evening blocks, not exact hour schedules.
Write each block as 1-2 concise sentences in Korean.

Session:
${JSON.stringify(body.session, null, 2)}
Personas:
${JSON.stringify(body.personas, null, 2)}
Dialogue:
${JSON.stringify(body.messages, null, 2)}
Research:
${JSON.stringify(body.researchArtifacts || [], null, 2)}
Destination: ${destination}
`;
  const itinerary = await generateJsonWithTimeout<Itinerary>(prompt, fallback, 3000);
  itinerary.personaSatisfaction = calculatePersonaSatisfaction(body.personas, body.messages);
  return NextResponse.json({ itinerary });
}
