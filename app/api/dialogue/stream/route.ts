import { runAgentMainLoop } from "@/lib/agent-dialogue";
import type { AgentMessage, DestinationCandidate, Persona, ResearchArtifact, TravelSession } from "@/lib/types";

function encodeSse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function fallbackFriendMessage(persona: Persona | undefined, selectedDestination: string, previous?: AgentMessage): AgentMessage | null {
  if (!persona) return null;
  return {
    id: `fallback_${Date.now()}`,
    speakerId: persona.id,
    speakerType: "persona",
    replyToId: previous?.id,
    targetId: previous?.speakerId,
    speechAct: "suggest",
    content: `일단 ${selectedDestination} 괜찮아 보여. 너무 빡세게만 잡지 말고, 각자 하고 싶은 거 하나씩은 넣어보자.`,
    proposalDelta: "친구별로 하고 싶은 일정 하나씩 넣기",
    supportLevel: 0.82,
    concernLevel: 0.24
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    session: TravelSession;
    personas: Persona[];
    candidates: DestinationCandidate[];
    selectedDestination?: string;
  };

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const messages: AgentMessage[] = [];
      const researchArtifacts: ResearchArtifact[] = [];

      try {
        for await (const event of runAgentMainLoop({
          session: body.session,
          personas: body.personas || [],
          candidates: body.candidates || [],
          selectedDestination: body.selectedDestination
        })) {
          if (event.type === "research") {
            researchArtifacts.push(event.artifact);
            controller.enqueue(encoder.encode(encodeSse("research", event.artifact)));
          }
          if (event.type === "message") {
            messages.push(event.message);
            controller.enqueue(encoder.encode(encodeSse("message", event.message)));
          }
          if (event.type === "consensus") {
            controller.enqueue(encoder.encode(encodeSse("consensus", event.decision)));
          }
        }
      } catch (error) {
        const destination = body.selectedDestination || body.candidates?.[0]?.name || body.session.destination || "candidate destination";
        const fallback = fallbackFriendMessage(body.personas?.[0], destination, messages.at(-1));
        if (fallback) controller.enqueue(encoder.encode(encodeSse("message", fallback)));
        controller.enqueue(encoder.encode(encodeSse("error", { message: error instanceof Error ? error.message : "Dialogue stream failed" })));
      } finally {
        controller.enqueue(encoder.encode(encodeSse("done", { count: messages.length, researchCount: researchArtifacts.length })));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
