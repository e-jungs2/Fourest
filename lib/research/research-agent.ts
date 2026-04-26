import { generateJsonWithTimeout } from "../gemini";
import { makeId } from "../mock";
import { buildMcpToolCalls, runMcpToolCall } from "./mcp-registry";
import type { AgentMessage, Persona, ResearchArtifact, TravelSession } from "../types";

type ResearchContext = {
  session: TravelSession;
  persona: Persona;
  destination: string;
  messages: AgentMessage[];
  roundIndex: number;
  turnIndex: number;
};

export async function planResearchForTurn(context: ResearchContext) {
  const fallback = {
    query: `${context.destination} ${context.persona.priorities.slice(0, 2).join(" ")} travel information`,
    focus: context.persona.priorities.slice(0, 2)
  };
  const prompt = `
Create one concise Korean research query for a travel persona agent.
Use the persona markdown and chat history to decide what this agent should investigate before speaking.
Return JSON: { "query": string, "focus": string[] }

Destination: ${context.destination}
Session: ${JSON.stringify(context.session, null, 2)}
Persona markdown:
${context.persona.contextMarkdown}
Chat history:
${JSON.stringify(context.messages.slice(-8), null, 2)}
`;
  return generateJsonWithTimeout<typeof fallback>(prompt, fallback, 2000);
}

export async function runMcpResearch(context: ResearchContext): Promise<ResearchArtifact> {
  const researchPlan = await planResearchForTurn(context);
  const toolCalls = buildMcpToolCalls(researchPlan.query, {
    destination: context.destination,
    personaId: context.persona.id,
    roundIndex: context.roundIndex,
    turnIndex: context.turnIndex
  });
  const toolResults = await Promise.all(toolCalls.map((call) => runMcpToolCall(call)));
  const sources = toolResults.map((result) => ({
    title: result.title,
    url: result.url,
    snippet: result.summary
  }));
  const summary = toolResults.map((result) => `${result.title}: ${result.summary}`).join("\n");

  return {
    id: makeId("research"),
    personaId: context.persona.id,
    roundIndex: context.roundIndex,
    turnIndex: context.turnIndex,
    destination: context.destination,
    query: researchPlan.query,
    toolCalls,
    toolResults,
    summary,
    sources,
    createdAt: new Date().toISOString()
  };
}
