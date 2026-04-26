import { generateText } from "@/lib/gemini";
import { generateMessages, type AgentMessage, type Persona } from "@/lib/travel";

const MAX_NEGOTIATION_CYCLES = 5;

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

function promptForPersona(
  persona: Persona,
  situation: string,
  previousMessages: AgentMessage[],
  turnIndex: number,
  totalTurns: number,
  personaCount: number
) {
  const cycleIndex = Math.floor(turnIndex / personaCount);
  const turnInCycle = turnIndex % personaCount;
  const isFinalCycle = turnIndex >= totalTurns - personaCount;
  const previous = previousMessages
    .map((message) => {
      const name = message.speakerId === persona.id ? persona.displayName : "다른 친구";
      return `- ${name}: ${message.content}`;
    })
    .join("\n");

  return [
    "너는 여행 의사결정 웹앱 triper에서 한 친구의 입장을 대신 말한다.",
    "상황은 친구들끼리 단톡방에서 여행 어디로 갈지, 어떻게 갈지 편하게 얘기하는 장면이다.",
    "너는 판정자, 검증자, 전문가, 사회자, 진행자가 아니다. 그냥 이 친구 한 명이다.",
    "반드시 한국어로만 답한다.",
    "친구 단톡방 말투로 자연스럽게 말한다. 너무 공손하거나 보고서처럼 쓰지 않는다.",
    "80자에서 150자 사이로 답하고, 마크다운/목록/따옴표는 쓰지 않는다.",
    "validator, feasibility, 합의안, 우선순위 반영, 만족도, 근거 같은 시스템 말투를 쓰지 않는다.",
    "말투는 사람 같아야 한다. 예: '난 여기 괜찮은데', '근데 이건 좀 빡셀 듯', '그럼 이렇게 하면 어때?'",
    "너무 쉽게 네네 하지 말고, 내 취향상 아쉬운 부분이 있으면 친구한테 말하듯 가볍게 짚는다.",
    "다른 친구 의견을 들으면 '그건 좋다', '근데', '차라리'처럼 이어서 반응한다.",
    "",
    `친구 이름: ${persona.displayName}`,
    `이 친구 성향: ${persona.summary}`,
    `좋아하는 것: ${persona.preferences.join(", ")}`,
    `불편해하는 것: ${persona.constraints.join(", ")}`,
    `챙기고 싶은 것: ${persona.priorities.join(", ")}`,
    `평소 판단 방식 참고: ${persona.decisionPolicy}`,
    `말투 참고: ${persona.conversationStyle}`,
    "",
    `사용자가 말한 여행 상황: ${situation}`,
    `현재 대화 흐름: ${cycleIndex + 1}번째 바퀴, ${turnInCycle + 1}/${personaCount}번째 친구`,
    previous ? `앞에서 친구들이 한 말:\n${previous}` : "앞에서 친구들이 한 말: 아직 없음",
    "",
    isFinalCycle
      ? "마지막 바퀴다. 최종 선언처럼 말하지 말고, 친구들 대화를 듣고 '이 정도면 난 좋아' 또는 '이 조건만 있으면 괜찮아' 정도로 자연스럽게 마무리해라."
      : cycleIndex === 0
        ? "첫 바퀴다. 이 친구가 끌리는 점이나 걱정되는 점을 먼저 편하게 말해라."
        : "앞선 친구 말에 직접 반응하고, 내 취향을 섞어서 현실적인 제안을 하나 해라."
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
      supportLevel: Math.min(95, 72 + index * 5),
      concernLevel: Math.max(8, 34 - index * 4)
    });
  }

  return Response.json({ messages });
}
