import { NextResponse } from "next/server";
import { generateJson } from "@/lib/gemini";
import { mockPersonas } from "@/lib/mock";
import { ensurePersonaMarkdown } from "@/lib/persona-md";
import type { Participant, Persona } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { participants: Participant[] };
  const fallback = mockPersonas(body.participants || []);
  const prompt = `
You create Korean travel decision personas.
For each participant, create exactly one Persona JSON object.
Return only a JSON array matching this TypeScript shape:
{
  id:string, participantId:string, displayName:string, summary:string,
  contextMarkdown:string,
  preferences:string[], constraints:string[], priorities:string[],
  decisionPolicy:{willSupportIf:string[], willObjectIf:string[], canCompromiseOn:string[]},
  conversationStyle:{tone:string, assertiveness:number, empathy:number},
  representationScore:number
}

Participants:
${JSON.stringify(body.participants, null, 2)}
`;
  const generated = await generateJson<Persona[]>(prompt, fallback);
  const personas = generated.map((persona) => ensurePersonaMarkdown(persona, body.participants || []));
  return NextResponse.json({ personas });
}
