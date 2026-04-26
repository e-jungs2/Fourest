import { generateJson } from "./gemini";
import { makeId } from "./mock";
import type { AgentMessage, DestinationCandidate, Persona, TravelSession } from "./types";

type AgentTurnInput = {
  session: TravelSession;
  personas: Persona[];
  candidates: DestinationCandidate[];
  selectedDestination?: string;
};

const speechActs: AgentMessage["speechAct"][] = ["suggest", "counter_proposal", "compromise", "agree", "final_vote"];

export async function runPersonaAgents(input: AgentTurnInput): Promise<AgentMessage[]> {
  const destination = input.selectedDestination || input.candidates[0]?.name || input.session.destination || "candidate destination";
  const messages: AgentMessage[] = [];
  const activePersonas = input.personas.slice(0, input.session.settings.maxNegotiationCycles);

  for (let index = 0; index < activePersonas.length; index += 1) {
    const persona = activePersonas[index];
    const fallback = fallbackPersonaMessage(persona, messages[index - 1], destination, index);
    const message = await generatePersonaTurn({
      session: input.session,
      persona,
      allPersonas: input.personas,
      candidates: input.candidates,
      selectedDestination: destination,
      previousMessages: messages,
      fallback,
      turnIndex: index
    });
    messages.push(normalizePersonaMessage(message, persona, fallback));
  }

  messages.push(await generateExpertTurn(input.session, input.personas, input.candidates, destination, messages));
  return messages;
}

async function generatePersonaTurn({
  session,
  persona,
  allPersonas,
  candidates,
  selectedDestination,
  previousMessages,
  fallback,
  turnIndex
}: {
  session: TravelSession;
  persona: Persona;
  allPersonas: Persona[];
  candidates: DestinationCandidate[];
  selectedDestination: string;
  previousMessages: AgentMessage[];
  fallback: AgentMessage;
  turnIndex: number;
}) {
  const prompt = `
You are one independent persona agent in a Korean travel decision system.
You are NOT writing for all agents. You only speak as this one persona.

Your persona:
${JSON.stringify(persona, null, 2)}

Other personas:
${JSON.stringify(
  allPersonas.filter((item) => item.id !== persona.id).map((item) => ({
    id: item.id,
    displayName: item.displayName,
    priorities: item.priorities,
    constraints: item.constraints
  })),
  null,
  2
)}

Travel session:
${JSON.stringify(session, null, 2)}

Destination candidates:
${JSON.stringify(candidates, null, 2)}

Selected/current destination: ${selectedDestination}

Previous dialogue:
${JSON.stringify(previousMessages, null, 2)}

Task:
- Speak only as ${persona.displayName}.
- Directly react to the previous message if one exists.
- Preserve this persona's preferences, constraints, priorities, and conversation style.
- If there is disagreement, propose a compromise instead of merely summarizing.
- Return only one JSON AgentMessage object.
- speakerId must be "${persona.id}" and speakerType must be "persona".
- speechAct should fit the turn. Suggested for this turn: ${speechActs[turnIndex] || "agree"}.

AgentMessage shape:
{
  id:string,
  speakerId:string,
  speakerType:"persona",
  replyToId?:string,
  targetId?:string,
  speechAct:"suggest"|"agree"|"disagree"|"counter_proposal"|"compromise"|"final_vote",
  content:string,
  proposalDelta?:string,
  supportLevel:number,
  concernLevel:number
}
`;
  return generateJson<AgentMessage>(prompt, fallback);
}

async function generateExpertTurn(
  session: TravelSession,
  personas: Persona[],
  candidates: DestinationCandidate[],
  selectedDestination: string,
  previousMessages: AgentMessage[]
) {
  const fallback: AgentMessage = {
    id: makeId("msg"),
    speakerId: "travel_expert",
    speakerType: "expert",
    replyToId: previousMessages.at(-1)?.id,
    targetId: "all",
    speechAct: "validate",
    content: `${selectedDestination} is feasible for ${session.duration}. Keep one key activity in the morning, choose low-movement routes in the afternoon, and mix dinner with free time in the evening.`,
    proposalDelta: "Adjust itinerary density with morning/afternoon/evening blocks.",
    supportLevel: 0.86,
    concernLevel: 0.18
  };

  const prompt = `
You are an independent Travel Expert Agent.
You do not represent a participant. Validate feasibility and mediate the persona discussion.
Return only one JSON AgentMessage object with speakerId "travel_expert" and speakerType "expert".

Session:
${JSON.stringify(session, null, 2)}
Personas:
${JSON.stringify(personas, null, 2)}
Candidates:
${JSON.stringify(candidates, null, 2)}
Selected destination: ${selectedDestination}
Persona dialogue:
${JSON.stringify(previousMessages, null, 2)}
`;
  const message = await generateJson<AgentMessage>(prompt, fallback);
  return {
    ...fallback,
    ...message,
    id: message.id || fallback.id,
    speakerId: "travel_expert",
    speakerType: "expert" as const,
    speechAct: "validate" as const
  };
}

function fallbackPersonaMessage(persona: Persona, previous: AgentMessage | undefined, destination: string, index: number): AgentMessage {
  return {
    id: makeId("msg"),
    speakerId: persona.id,
    speakerType: "persona",
    replyToId: previous?.id,
    targetId: previous?.speakerId,
    speechAct: speechActs[index] || "agree",
    content: previous
      ? `I agree with the previous point, but ${persona.constraints[0]} also matters. For ${destination}, I suggest keeping the key activity while reducing long transfers.`
      : `${destination} seems to reflect my needs well. I want ${persona.priorities[0]} to be clearly included in the plan.`,
    proposalDelta: "Keep key activities and replace long-transfer items with nearby options.",
    supportLevel: Math.min(0.9, 0.72 + index * 0.03),
    concernLevel: Math.max(0.22, 0.58 - index * 0.07)
  };
}

function normalizePersonaMessage(message: AgentMessage, persona: Persona, fallback: AgentMessage): AgentMessage {
  return {
    ...fallback,
    ...message,
    id: message.id || fallback.id,
    speakerId: persona.id,
    speakerType: "persona",
    supportLevel: clampNumber(message.supportLevel, fallback.supportLevel),
    concernLevel: clampNumber(message.concernLevel, fallback.concernLevel)
  };
}

function clampNumber(value: number | undefined, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(1, value));
}
