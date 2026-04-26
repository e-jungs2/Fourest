import { NextResponse } from "next/server";
import { generateJsonWithTimeout } from "@/lib/gemini";
import { mockCandidates } from "@/lib/mock";
import type { DestinationCandidate, Persona, TravelSession } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { session: TravelSession; personas: Persona[] };
  const fallback = mockCandidates(body.session, body.personas || []);
  if (body.session.destinationStatus === "fixed") {
    return NextResponse.json({ candidates: [] });
  }

  const prompt = `
You recommend travel destinations for a Korean group decision app.
Create exactly 3 candidate destinations. Return only a JSON array matching:
{
  id:string, name:string, reason:string, estimatedBudget:string,
  fitTags:string[], pros:string[], cons:string[], personaScores: Record<string, number>
}
personaScores values are 0-100 and keys must be persona ids.

Session:
${JSON.stringify(body.session, null, 2)}

Personas:
${JSON.stringify(body.personas, null, 2)}
`;
  const candidates = await generateJsonWithTimeout<DestinationCandidate[]>(prompt, fallback, 3000);
  return NextResponse.json({ candidates: candidates.slice(0, 3) });
}
