import { NextResponse } from "next/server";
import { calculatePersonaSatisfaction } from "@/lib/agent-dialogue";
import { generateJson } from "@/lib/gemini";
import { mockDialogue, mockItinerary } from "@/lib/mock";
import type { AgentMessage, Itinerary, Persona, TravelSession } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    session: TravelSession;
    personas: Persona[];
    itinerary: Itinerary;
    feedback: string;
  };
  const destination = body.itinerary?.destination || body.session.destination || "추천 여행지";
  const fallbackMessages = mockDialogue(body.session, body.personas || [], [], destination).slice(0, 3).map((message) => ({
    ...message,
    content: `피드백 "${body.feedback}"을 반영하면, ${message.content}`
  }));
  const fallbackItinerary = mockItinerary(body.session, body.personas || [], destination);
  const personaIds = (body.personas || []).map((p) => p.id).join(", ");
  const prompt = `
Regenerate a Korean travel itinerary after user feedback.
Return only JSON:
{
  "messages": AgentMessage[],
  "itinerary": {
    destination: string,
    days: [{
      day: number, title: string,
      morning: string, afternoon: string, evening: string, note: string,
      morningAttribution: string[], afternoonAttribution: string[], eveningAttribution: string[]
    }],
    tradeoffs: string[],
    personaSatisfaction: Record<string, number>,
    consensusSummary: string
  }
}
AgentMessage fields: id,speakerId,speakerType,replyToId,targetId,speechAct,content,proposalDelta,supportLevel,concernLevel.

Attribution arrays contain persona IDs whose preferences are reflected in that block.
Available persona IDs: [${personaIds}]

Feedback: ${body.feedback}
Current itinerary:
${JSON.stringify(body.itinerary, null, 2)}
Session:
${JSON.stringify(body.session, null, 2)}
Personas:
${JSON.stringify(body.personas, null, 2)}
`;
  const result = await generateJson<{ messages: AgentMessage[]; itinerary: Itinerary }>(prompt, {
    messages: fallbackMessages,
    itinerary: fallbackItinerary
  });
  result.itinerary.personaSatisfaction = calculatePersonaSatisfaction(body.personas, result.messages);
  return NextResponse.json(result);
}
