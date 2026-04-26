import { generateText } from "@/lib/gemini";
import { generateMessages, type AgentMessage, type Persona } from "@/lib/travel";

const MAX_NEGOTIATION_CYCLES = 2;

function speechActForTurn(turnIndex: number, personaCount: number, totalTurns: number): AgentMessage["speechAct"] {
  const cycleIndex = Math.floor(turnIndex / personaCount);
  if (turnIndex >= totalTurns - personaCount) return "final_vote";
  if (cycleIndex === 0) return turnIndex % personaCount === 0 ? "suggest" : "counter_proposal";
  if (cycleIndex === 1) return "counter_proposal";
  if (cycleIndex === 2) return "compromise";
  return "agree";
}

function cleanReply(text: string) {
  return text
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function speakingPattern(persona: Persona) {
  const profile = [...persona.preferences, ...persona.priorities, ...persona.constraints, persona.summary].join(" ");
  if (/맛집|식사|음식|미식|저녁/.test(profile)) {
    return "먹을 곳을 먼저 콕 집어 말한다. 배고픔, 웨이팅, 예약 얘기를 자연스럽게 섞고 질문으로 끝내도 좋다.";
  }
  if (/카페|사진|분위기|야경|예쁜|감성/.test(profile)) {
    return "장면이 그려지게 말한다. 카페, 사진, 풍경, 쉬는 타이밍을 먼저 떠올리고 부드럽게 제안한다.";
  }
  if (/로컬|골목|시장|현지|탐방|즉흥/.test(profile)) {
    return "대표 코스만 따라가는 걸 아쉬워한다. '여기 근처 골목도 보자'처럼 새 선택지를 가볍게 던진다.";
  }
  if (/예산|가성비|비용|비싼|가격|체력|이동|동선/.test(profile)) {
    return "현실적인 걱정을 먼저 짚는다. 비용, 이동, 체력 부담을 말하되 결론을 막지 말고 대안을 붙인다.";
  }
  return "친구들 의견을 받아서 중간안을 만든다. 단, 너무 사회자처럼 정리하지 말고 자기 취향도 한 줄 넣는다.";
}

function promptForPersona(
  persona: Persona,
  situation: string,
  previousMessages: AgentMessage[],
  turnIndex: number,
  totalTurns: number,
  personaCount: number
) {
  const previous = previousMessages
    .map((message) => {
      const name = message.speakerId === persona.id ? persona.displayName : "다른 친구";
      return `- ${name}: ${message.content}`;
    })
    .join("\n");
  const ownPrevious = previousMessages
    .filter((message) => message.speakerId === persona.id)
    .map((message) => message.content)
    .join(" / ");

  return [
    "친구들끼리 여행 얘기하는 단톡방이다.",
    `너는 ${persona.displayName} 한 명으로만 말한다. 판정자, 진행자, 전문가처럼 굴지 않는다.`,
    "아래 페르소나를 보고 그 사람이 실제로 할 법한 말을 한 번만 한다.",
    "반드시 한국어로 답하고, 마크다운/목록/따옴표는 쓰지 않는다.",
    "40자에서 130자 사이로 자연스럽게 말한다.",
    "시스템 말투 금지: validator, feasibility, 합의안, 우선순위 반영, 만족도, 근거, 조율 사이클 같은 말은 쓰지 않는다.",
    "앞에서 이미 나온 말이나 자기 이전 말을 다른 단어로 반복하지 않는다.",
    "문장 구조를 일부러 맞추지 말고, 페르소나가 신경 쓰는 것에 따라 자유롭게 말한다.",
    "",
    `페르소나: ${persona.summary}`,
    `좋아하는 것: ${persona.preferences.join(", ")}`,
    `싫거나 불편한 것: ${persona.constraints.join(", ")}`,
    `챙기고 싶은 것: ${persona.priorities.join(", ")}`,
    `말하는 성향: ${persona.conversationStyle}`,
    `말할 때 자연스럽게 드러날 포인트: ${speakingPattern(persona)}`,
    "",
    `여행 상황: ${situation}`,
    previous ? `앞 대화:\n${previous}` : "앞 대화: 아직 없음",
    ownPrevious ? `내가 전에 한 말, 반복 금지:\n${ownPrevious}` : "",
    "",
    "지금 이 순간 이 친구가 할 법한 새 의견만 말해라."
  ].join("\n");
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    personas?: Persona[];
    situation?: string;
  };
  const personas = body.personas ?? [];
  const situation = body.situation?.trim() ?? "";
  const fallback = generateMessages(personas, situation);

  if (!personas.length || !situation) {
    return Response.json({ messages: [] });
  }

  const messages: AgentMessage[] = [];

  const totalTurns = personas.length * MAX_NEGOTIATION_CYCLES;

  for (let index = 0; index < totalTurns; index += 1) {
    const persona = personas[index % personas.length];
    const fallbackContent = fallback[index % fallback.length]?.content ?? `${situation}에 대해 ${persona.displayName}의 취향도 함께 고려해 보자.`;
    const content = cleanReply(await generateText(promptForPersona(persona, situation, messages, index, totalTurns, personas.length), fallbackContent, 9000));
    messages.push({
      id: `gemini-${Date.now()}-${index}`,
      speakerId: persona.id,
      speakerType: "persona",
      speechAct: speechActForTurn(index, personas.length, totalTurns),
      content,
      supportLevel: 78,
      concernLevel: 22
    });
  }

  return Response.json({ messages });
}
