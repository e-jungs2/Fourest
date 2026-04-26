import { runPersonaAgents } from "@/lib/agent-dialogue";
import type { AgentMessage, DestinationCandidate, Persona, TravelSession } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    session: TravelSession;
    personas: Persona[];
    candidates: DestinationCandidate[];
    selectedDestination?: string;
  };

  const messages = await runPersonaAgents({
    session: body.session,
    personas: body.personas || [],
    candidates: body.candidates || [],
    selectedDestination: body.selectedDestination
  });
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      for (const message of messages) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(message satisfies AgentMessage)}\n\n`));
        await new Promise((resolve) => setTimeout(resolve, 450));
      }
      controller.enqueue(encoder.encode("event: done\ndata: {}\n\n"));
      controller.close();
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
