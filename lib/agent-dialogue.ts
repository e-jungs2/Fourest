import { observeConsensus, finalizeConsensus } from "./consensus-observer";
import { generateJson } from "./gemini";
import { mockExpertMessage, mockPersonaMessage } from "./mock";
import { ensurePersonaMarkdown } from "./persona-md";
import { runMcpResearch } from "./research/research-agent";
import type { AgentMessage, DestinationCandidate, Persona, ResearchArtifact, TravelSession } from "./types";

type AgentTurnInput = {
  session: TravelSession;
  personas: Persona[];
  candidates: DestinationCandidate[];
  selectedDestination?: string;
};

type PersonaTurnContext = AgentTurnInput & {
  destination: string;
  persona: Persona;
  previousMessages: AgentMessage[];
  researchArtifact: ResearchArtifact;
  roundIndex: number;
  turnIndex: number;
};

export type AgentLoopEvent =
  | { type: "research"; artifact: ResearchArtifact }
  | { type: "message"; message: AgentMessage }
  | { type: "consensus"; decision: Awaited<ReturnType<typeof observeConsensus>> };

const roundSpeechActs: AgentMessage["speechAct"][] = ["suggest", "counter_proposal", "compromise", "agree", "final_vote"];

export async function runPersonaAgents(input: AgentTurnInput): Promise<AgentMessage[]> {
  const messages: AgentMessage[] = [];
  for await (const event of runAgentMainLoop(input)) {
    if (event.type === "message") messages.push(event.message);
  }
  return messages;
}

export async function* streamPersonaAgentTurns(input: AgentTurnInput): AsyncGenerator<AgentMessage> {
  for await (const event of runAgentMainLoop(input)) {
    if (event.type === "message") yield event.message;
  }
}

export async function* runAgentMainLoop(input: AgentTurnInput): AsyncGenerator<AgentLoopEvent> {
  const personas = (input.personas || []).map((persona) => ensurePersonaMarkdown(persona, input.session.participants));
  const destination = input.selectedDestination || input.candidates[0]?.name || input.session.destination || "후보 여행지";
  const rounds = Math.max(1, input.session.settings.maxNegotiationCycles || 1);
  const messages: AgentMessage[] = [];
  const researchArtifacts: ResearchArtifact[] = [];

  for (let roundIndex = 0; roundIndex < rounds; roundIndex += 1) {
    for (let turnIndex = 0; turnIndex < personas.length; turnIndex += 1) {
      const persona = personas[turnIndex];
      const researchArtifact = await runMcpResearch({
        session: input.session,
        persona,
        destination,
        messages,
        roundIndex,
        turnIndex
      });
      researchArtifacts.push(researchArtifact);
      yield { type: "research", artifact: researchArtifact };

      const fallback = withResearch(
        mockPersonaMessage(input.session, persona, messages.at(-1), destination, roundIndex, turnIndex),
        researchArtifact
      );
      const generated = await generatePersonaTurn({
        ...input,
        personas,
        destination,
        persona,
        previousMessages: messages,
        researchArtifact,
        roundIndex,
        turnIndex
      }, fallback);
      const message = normalizePersonaMessage(generated, persona, fallback, researchArtifact);
      messages.push(message);
      yield { type: "message", message };

      const decision = await observeConsensus(messages, researchArtifacts);
      yield { type: "consensus", decision };
      if (decision.status === "consensus_reached") {
        const finalMessage = await finalizeConsensus(messages, researchArtifacts);
        messages.push(finalMessage);
        yield { type: "message", message: finalMessage };
        return;
      }
    }
  }

  const fallbackExpert = mockExpertMessage(input.session, destination, messages.at(-1));
  const expert = await generateExpertTurn(input.session, personas, input.candidates, destination, messages, researchArtifacts, fallbackExpert);
  messages.push(expert);
  yield { type: "message", message: expert };
}

async function generatePersonaTurn(context: PersonaTurnContext, fallback: AgentMessage) {
  const suggestedAct = roundSpeechActs[Math.min(roundSpeechActs.length - 1, context.roundIndex + context.turnIndex)] || "agree";
  const prompt = `
You are one independent persona agent in a Korean travel decision system.
You are NOT writing for all agents. You only speak as this one persona.

Persona markdown:
${context.persona.contextMarkdown}

Other personas:
${JSON.stringify(
  context.personas
    .filter((item) => item.id !== context.persona.id)
    .map((item) => ({
      id: item.id,
      displayName: item.displayName,
      priorities: item.priorities,
      constraints: item.constraints
    })),
  null,
  2
)}

Travel session:
${JSON.stringify(context.session, null, 2)}

Destination candidates:
${JSON.stringify(context.candidates, null, 2)}

Selected/current destination: ${context.destination}
Current negotiation round: ${context.roundIndex + 1} of ${context.session.settings.maxNegotiationCycles}
Turn in this round: ${context.turnIndex + 1} of ${context.personas.length}

Previous dialogue:
${JSON.stringify(context.previousMessages, null, 2)}

Research gathered for this turn:
${JSON.stringify(
  {
    query: context.researchArtifact.query,
    summary: context.researchArtifact.summary,
    sources: context.researchArtifact.sources
  },
  null,
  2
)}

Task:
- Speak only as ${context.persona.displayName}.
- Use the persona markdown as the primary identity and decision policy.
- Use the chat history to react to the current negotiation state.
- Use the research summary as factual support, but do not invent details outside it.
- Make this turn clearly different from previous messages. Do not reuse the same sentence structure.
- Mention at least one concrete priority or constraint unique to this persona.
- If there is disagreement, propose a concrete compromise.
- Keep the content concise enough for a live chat card.
- Return only one JSON AgentMessage object.
- speakerId must be "${context.persona.id}" and speakerType must be "persona".
- researchSummary should briefly describe which research influenced the turn.
- researchRefs should contain source URLs from the research when available.
- speechAct should fit the turn. Suggested speechAct: ${suggestedAct}.

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
  researchSummary?:string,
  researchRefs?:string[],
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
  previousMessages: AgentMessage[],
  researchArtifacts: ResearchArtifact[],
  fallback: AgentMessage
) {
  const prompt = `
You are an independent Travel Expert Agent.
You do not represent a participant. Validate feasibility and mediate the persona discussion.
Return only one JSON AgentMessage object with speakerId "travel_expert" and speakerType "expert".
Keep the content concise and useful for the final itinerary generator.

Session:
${JSON.stringify(session, null, 2)}
Personas:
${JSON.stringify(personas, null, 2)}
Candidates:
${JSON.stringify(candidates, null, 2)}
Selected destination: ${selectedDestination}
Persona dialogue:
${JSON.stringify(previousMessages, null, 2)}
Research artifacts:
${JSON.stringify(researchArtifacts.slice(-8), null, 2)}
`;
  const message = await generateJson<AgentMessage>(prompt, fallback);
  return {
    ...fallback,
    ...message,
    id: message.id || fallback.id,
    speakerId: "travel_expert",
    speakerType: "expert" as const,
    speechAct: "validate" as const,
    researchSummary: message.researchSummary || summarizeResearch(researchArtifacts),
    researchRefs: message.researchRefs || researchArtifacts.flatMap((artifact) => artifact.sources.map((source) => source.url).filter(Boolean) as string[]),
    supportLevel: clampNumber(message.supportLevel, fallback.supportLevel),
    concernLevel: clampNumber(message.concernLevel, fallback.concernLevel)
  };
}

function normalizePersonaMessage(message: AgentMessage, persona: Persona, fallback: AgentMessage, researchArtifact: ResearchArtifact): AgentMessage {
  return {
    ...fallback,
    ...message,
    id: message.id || fallback.id,
    speakerId: persona.id,
    speakerType: "persona",
    replyToId: message.replyToId || fallback.replyToId,
    targetId: message.targetId || fallback.targetId,
    researchSummary: message.researchSummary || researchArtifact.summary,
    researchRefs: message.researchRefs || researchArtifact.sources.map((source) => source.url).filter(Boolean) as string[],
    supportLevel: clampNumber(message.supportLevel, fallback.supportLevel),
    concernLevel: clampNumber(message.concernLevel, fallback.concernLevel)
  };
}

function withResearch(message: AgentMessage, researchArtifact: ResearchArtifact): AgentMessage {
  return {
    ...message,
    researchSummary: researchArtifact.summary,
    researchRefs: researchArtifact.sources.map((source) => source.url).filter(Boolean) as string[]
  };
}

function summarizeResearch(researchArtifacts: ResearchArtifact[]) {
  return researchArtifacts
    .slice(-4)
    .map((artifact) => artifact.summary)
    .join("\n");
}

function clampNumber(value: number | undefined, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(1, value));
}
