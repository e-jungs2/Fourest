import { runAgentMainLoop } from "@/lib/agent-dialogue";
import type { AgentMessage, DestinationCandidate, Persona, ResearchArtifact, TravelSession } from "@/lib/types";

function encodeSse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function fallbackExpertMessage(session: TravelSession, selectedDestination: string, previous?: AgentMessage): AgentMessage {
  return {
    id: `fallback_${Date.now()}`,
    speakerId: "travel_expert",
    speakerType: "expert",
    replyToId: previous?.id,
    targetId: "all",
    speechAct: "validate",
    content: `${selectedDestination} is feasible for ${session.duration}. Keep the route compact and balance food, rest, and group preferences.`,
    proposalDelta: "Fallback expert validation after dialogue stream error.",
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
        const fallback = fallbackExpertMessage(body.session, destination, messages.at(-1));
        controller.enqueue(encoder.encode(encodeSse("message", fallback)));
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
