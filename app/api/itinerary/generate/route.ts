import { NextResponse } from "next/server";
import { generateJson } from "@/lib/gemini";
import { mockItinerary } from "@/lib/mock";
import type { AgentMessage, Itinerary, Persona, TravelSession } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    session: TravelSession;
    personas: Persona[];
    messages: AgentMessage[];
    selectedDestination: string;
  };
  const destination = body.selectedDestination || body.session.destination || "추천 여행지";
  const fallback = mockItinerary(body.session, body.personas || [], destination);
  const prompt = `
Create a Korean day-block travel itinerary from a persona negotiation.
Return only JSON matching:
{
  destination:string,
  days:[{day:number,title:string,morning:string,afternoon:string,evening:string,note:string}],
  tradeoffs:string[],
  personaSatisfaction: Record<string, number>,
  consensusSummary:string
}
Use morning/afternoon/evening blocks, not exact hour schedules.
Use researchSummary and researchRefs in the dialogue when they help explain route, food, transport, or lodging tradeoffs.

Session:
${JSON.stringify(body.session, null, 2)}
Personas:
${JSON.stringify(body.personas, null, 2)}
Dialogue:
${JSON.stringify(body.messages, null, 2)}
Destination: ${destination}
`;
  const itinerary = await generateJson<Itinerary>(prompt, fallback);
  return NextResponse.json({ itinerary });
}
