import { observeConsensus, finalizeConsensus } from "./consensus-observer";
import { generateJsonWithTimeout } from "./gemini";
import { makeId } from "./mock";
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
  totalTurnIndex: number;
  maxTurns: number;
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
  const destination = input.selectedDestination || input.candidates[0]?.name || input.session.destination || "candidate destination";
  const maxTurns = Math.max(1, input.session.settings.maxNegotiationCycles || 1);
  const messages: AgentMessage[] = [];
  const researchArtifacts: ResearchArtifact[] = [];

  for (let totalTurnIndex = 0; totalTurnIndex < maxTurns; totalTurnIndex += 1) {
      const roundIndex = Math.floor(totalTurnIndex / Math.max(1, personas.length));
      const turnIndex = totalTurnIndex % Math.max(1, personas.length);
      const persona = personas[turnIndex];
      if (!persona) break;
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
        fallbackPersonaMessage(persona, messages.at(-1), destination, totalTurnIndex),
        researchArtifact
      );
      const generated = await generatePersonaTurn(
        {
          ...input,
          personas,
          destination,
          persona,
          previousMessages: messages,
          researchArtifact,
          roundIndex,
          turnIndex,
          totalTurnIndex,
          maxTurns
        },
        fallback
      );
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

  return;
}

async function generatePersonaTurn(context: PersonaTurnContext, fallback: AgentMessage) {
  const suggestedAct = roundSpeechActs[Math.min(roundSpeechActs.length - 1, context.totalTurnIndex)] || "agree";
  const prompt = `
You speak for one friend in a Korean travel group chat.
You are not a validator, judge, mediator, expert, facilitator, or narrator.
You are only this one friend talking naturally with other friends about a trip.

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
Overall turn: ${context.totalTurnIndex + 1} of ${context.maxTurns}

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

Tone:
- Write like a real friend in a group chat.
- Do not sound like a report, policy, validator, or meeting facilitator.
- Avoid words like feasibility, validate, consensus, satisfaction score, priority reflected, tradeoff analysis.
- It is okay to say things like "난 이건 좋아", "근데 이건 좀 빡셀 듯", "차라리 이렇게 하자".
- Be casual but not rude. No markdown, no bullet points inside content.

Task:
- Speak only as ${context.persona.displayName}.
- Use the persona markdown only as background taste, not as something to quote mechanically.
- React directly to what friends already said.
- If using research, mention it lightly as something you checked or heard, not like evidence in a report.
- Mention one concrete thing this friend wants or dislikes.
- If there is disagreement, suggest a friend-like alternative.
- On the final overall turn, end naturally: "이 정도면 난 괜찮아" or "이 조건이면 좋아" style.
- Keep the content short enough for a live chat bubble.
- Return only one JSON AgentMessage object.
- speakerId must be "${context.persona.id}" and speakerType must be "persona".
- researchSummary should be short and plain if present.
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
  return generateJsonWithTimeout<AgentMessage>(prompt, fallback, 2500);
}

function fallbackPersonaMessage(
  persona: Persona,
  previous: AgentMessage | undefined,
  destination: string,
  totalTurnIndex: number
): AgentMessage {
  const speechAct = roundSpeechActs[Math.min(roundSpeechActs.length - 1, totalTurnIndex)] || "agree";
  return {
    id: makeId("msg"),
    speakerId: persona.id,
    speakerType: "persona",
    replyToId: previous?.id,
    targetId: previous?.speakerId,
    speechAct,
    content: previous
      ? `그 방향 괜찮은데 ${persona.constraints[0]}은 좀 신경 쓰여. ${persona.priorities[0]}은 살리고, 이동 긴 건 가까운 걸로 바꾸면 어때?`
      : `난 ${destination} 괜찮아 보여. 대신 ${persona.priorities[0]}은 하나쯤 꼭 넣었으면 좋겠어.`,
    proposalDelta: "핵심 취향은 살리고 이동이 긴 일정은 가까운 대안으로 줄이기",
    supportLevel: Math.min(0.9, 0.72 + totalTurnIndex * 0.03),
    concernLevel: Math.max(0.22, 0.58 - totalTurnIndex * 0.07)
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
    researchRefs: message.researchRefs || (researchArtifact.sources.map((source) => source.url).filter(Boolean) as string[]),
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

function clampNumber(value: number | undefined, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(1, value));
}

/**
 * Derives persona satisfaction scores from dialogue messages.
 *
 * Keyed by persona.id. Later messages carry more weight because the final
 * stance is usually the best proxy for satisfaction.
 */
export function calculatePersonaSatisfaction(personas: Persona[], messages: AgentMessage[]): Record<string, number> {
  return Object.fromEntries(
    personas.map((persona) => {
      const turns = messages.filter((m) => m.speakerType === "persona" && m.speakerId === persona.id);
      if (turns.length === 0) return [persona.id, 75];

      let totalWeight = 0;
      let weightedSupport = 0;
      let weightedConcern = 0;

      turns.forEach((msg, idx) => {
        const weight = idx + 1;
        weightedSupport += clampNumber(msg.supportLevel, 0) * weight;
        weightedConcern += clampNumber(msg.concernLevel, 0) * weight;
        totalWeight += weight;
      });

      const avgSupport = weightedSupport / totalWeight;
      const avgConcern = weightedConcern / totalWeight;
      const raw = Math.round(avgSupport * 100 * (1 - avgConcern * 0.35));
      const score = Number.isFinite(raw) ? raw : 75;
      return [persona.id, Math.max(50, Math.min(98, score))];
    })
  );
}
