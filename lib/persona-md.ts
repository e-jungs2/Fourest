import { describeScores } from "./quiz";
import type { Participant, Persona } from "./types";

function describeBasicInfo(participant: Participant) {
  const { gender, ageGroup, relationship } = participant.basicInfo;
  return [gender, ageGroup, relationship].filter(Boolean).join(" / ") || "not provided";
}

export function buildPersonaMarkdown(persona: Persona, participant?: Participant) {
  const profile = participant
    ? [
        `- Participant: ${participant.name}`,
        `- Basic info: ${describeBasicInfo(participant)}`,
        `- Health note: ${participant.healthNote || "not provided"}`,
        `- Food note: ${participant.foodNote || "not provided"}`,
        `- Mobility note: ${participant.mobilityNote || "not provided"}`,
        `- Personal request: ${participant.personalRequests || "not provided"}`,
        `- Quiz traits: ${describeScores(participant.quizScores).join(", ")}`,
        participant.travelTypeResult ? `- Travel type: ${participant.travelTypeResult.primaryType} / ${participant.travelTypeResult.secondaryType}` : ""
      ]
        .filter(Boolean)
        .join("\n")
    : `- Participant: ${persona.displayName}`;

  return [
    `# ${persona.displayName}`,
    "",
    "## Participant Profile",
    profile,
    "",
    "## Persona Summary",
    persona.summary,
    "",
    "## Preferences",
    persona.preferences.map((item) => `- ${item}`).join("\n"),
    "",
    "## Constraints",
    persona.constraints.map((item) => `- ${item}`).join("\n"),
    "",
    "## Priorities",
    persona.priorities.map((item) => `- ${item}`).join("\n"),
    "",
    "## Decision Policy",
    `- Will support if: ${persona.decisionPolicy.willSupportIf.join("; ")}`,
    `- Will object if: ${persona.decisionPolicy.willObjectIf.join("; ")}`,
    `- Can compromise on: ${persona.decisionPolicy.canCompromiseOn.join("; ")}`,
    "",
    "## Conversation Style",
    `- Tone: ${persona.conversationStyle.tone}`,
    `- Assertiveness: ${persona.conversationStyle.assertiveness}`,
    `- Empathy: ${persona.conversationStyle.empathy}`
  ].join("\n");
}

export function ensurePersonaMarkdown(persona: Persona, participants: Participant[] = []): Persona {
  if (persona.contextMarkdown?.trim()) return persona;
  const participant = participants.find((item) => item.id === persona.participantId);
  return {
    ...persona,
    contextMarkdown: buildPersonaMarkdown(persona, participant)
  };
}
