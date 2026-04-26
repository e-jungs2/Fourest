import { NextResponse } from "next/server";
import { calculatePersonaSatisfaction } from "@/lib/agent-dialogue";
import { generateJsonWithTimeout } from "@/lib/gemini";
import { mockItinerary } from "@/lib/mock";
import type { AgentMessage, Itinerary, Persona, TravelSession } from "@/lib/types";

function lastPersonaMessage(messages: AgentMessage[], personaId: string) {
  return [...messages].reverse().find((message) => message.speakerType === "persona" && message.speakerId === personaId);
}

function buildDialogueConsensus(destination: string, personas: Persona[], messages: AgentMessage[]) {
  const finalVote = [...messages].reverse().find((message) => message.speechAct === "final_vote");
  const compromise = [...messages].reverse().find((message) => message.speechAct === "compromise" || message.speechAct === "agree");
  const anchor = finalVote?.content || compromise?.content || messages.at(-1)?.content || "";
  const reflected = personas
    .map((persona) => {
      const last = lastPersonaMessage(messages, persona.id);
      const priority = persona.priorities[0] || persona.preferences[0] || persona.displayName;
      return `${persona.displayName}: ${last?.content || priority}`;
    })
    .join(" / ");

  return anchor
    ? `${destination}는 페르소나 대화에서 나온 "${anchor}"를 최종 기준으로 삼고, ${reflected} 요구를 일정 블록에 나눠 반영한 합의안입니다.`
    : `${destination}는 ${reflected} 요구를 일정 블록에 나눠 반영한 합의안입니다.`;
}

function dialogueAwareFallback(session: TravelSession, personas: Persona[], messages: AgentMessage[], destination: string) {
  const fallback = mockItinerary(session, personas, destination);
  const consensusSummary = buildDialogueConsensus(destination, personas, messages);
  return {
    ...fallback,
    consensusSummary,
    tradeoffs: [
      ...personas.slice(0, 3).map((persona) => {
        const last = lastPersonaMessage(messages, persona.id);
        return last?.proposalDelta || `${persona.displayName}의 ${persona.priorities[0] || "핵심 선호"}를 일부 일정에 반영`;
      }),
      "앞선 발화에서 충돌한 요구는 같은 날에 몰지 않고 오전/오후/저녁으로 분산"
    ].slice(0, 4)
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    session: TravelSession;
    personas: Persona[];
    messages: AgentMessage[];
    researchArtifacts?: unknown[];
    selectedDestination: string;
  };
  const destination = body.selectedDestination || body.session.destination || "추천 여행지";
  const fallback = dialogueAwareFallback(body.session, body.personas || [], body.messages || [], destination);
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
The consensusSummary and tradeoffs must be derived from the persona dialogue, not from generic mock wording.
Explicitly reflect the latest or final_vote message from each persona when possible.

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
