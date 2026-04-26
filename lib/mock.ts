import { buildPersonaMarkdown } from "./persona-md";
import { describeScores, scoreQuiz } from "./quiz";
import type { AgentMessage, DestinationCandidate, Itinerary, Participant, Persona, TravelSession } from "./types";

export function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createDemoSession(): TravelSession {
  return {
    id: makeId("session"),
    destinationStatus: "undecided",
    destination: "",
    departureArea: "서울",
    scope: "해외, 비행 4시간 이내",
    duration: "3박 4일",
    budget: "1인당 90만원",
    requirements: "친구 4명이 가는 졸업여행. 맛집, 사진, 적당한 자유시간이 중요하고 너무 빡빡한 일정은 피하고 싶음.",
    settings: { maxNegotiationCycles: 2, candidateCount: 3 },
    participants: [
      participant("p_mina", "민아", "사진과 카페를 좋아함", "예쁜 장소와 야경은 꼭 있었으면 좋겠어.", {
        pace: "balanced",
        food: "nice",
        budget: "balanced",
        comfort: "clean",
        planning: "outline",
        local: "mix"
      }),
      participant("p_jun", "준호", "맛집 탐방 담당", "하루 한 끼는 유명한 현지 맛집으로 가고 싶어.", {
        pace: "active",
        food: "core",
        budget: "spend",
        comfort: "clean",
        planning: "planned",
        local: "local"
      }),
      participant("p_sora", "소라", "예산을 신경 쓰는 편", "숙소와 교통이 너무 비싸지 않으면 좋겠어.", {
        pace: "balanced",
        food: "nice",
        budget: "save",
        comfort: "cheap",
        planning: "outline",
        local: "classic"
      }),
      participant("p_hae", "해린", "휴식과 여유를 선호", "아침 일찍 시작하는 일정은 피하고 휴식 시간이 있으면 좋겠어.", {
        pace: "rest",
        food: "simple",
        budget: "balanced",
        comfort: "easy",
        planning: "free",
        local: "mix"
      })
    ]
  };
}

function participant(
  id: string,
  name: string,
  basicInfo: string,
  personalRequests: string,
  quizAnswers: Record<string, string>
): Participant {
  return {
    id,
    name,
    basicInfo,
    personalRequests,
    quizAnswers,
    quizScores: scoreQuiz(quizAnswers),
    completed: true
  };
}

export function mockPersonas(participants: Participant[]): Persona[] {
  return participants.map((item) => {
    const traits = describeScores(item.quizScores);
    const active = item.quizScores.rest_vs_activity > 65;
    const budget = item.quizScores.budget_sensitivity > 70;
    const comfort = item.quizScores.comfort_need > 70;
    const persona = {
      id: `persona_${item.id}`,
      participantId: item.id,
      displayName: `${item.name} 페르소나`,
      summary: `${item.name}을 대표하며 ${traits.slice(0, 3).join(", ")} 성향이 강합니다.`,
      preferences: traits,
      constraints: [
        budget ? "예산 초과에 민감함" : "경험 만족도가 높으면 비용을 어느 정도 허용",
        comfort ? "이동 편의와 숙소 컨디션 필요" : "필요한 이동은 수용 가능",
        item.personalRequests || "개인 요청 없음"
      ],
      priorities: [
        active ? "활동 밀도" : "휴식 균형",
        item.quizScores.food_interest > 70 ? "맛집" : "동선 효율",
        budget ? "예산" : "경험 만족도"
      ],
      decisionPolicy: {
        willSupportIf: ["개인 요청이 반영됨", "전체 동선이 감당 가능함", "예산과 만족도의 균형이 좋음"],
        willObjectIf: ["자신의 핵심 요청이 사라짐", "일정이 지나치게 빡빡함", "예산 대비 만족도가 낮음"],
        canCompromiseOn: ["방문 순서", "일부 식사 장소", "자유시간 길이"]
      },
      conversationStyle: {
        tone: comfort ? "조심스럽고 현실적인 말투" : "솔직하고 제안이 빠른 말투",
        assertiveness: active ? 0.75 : 0.55,
        empathy: comfort ? 0.84 : 0.7
      },
      representationScore: 0.82 + Math.round(Math.random() * 10) / 100
    };
    return {
      ...persona,
      contextMarkdown: buildPersonaMarkdown(persona, item)
    };
  });
}

export function mockCandidates(session: TravelSession, personas: Persona[]): DestinationCandidate[] {
  const names = session.scope.includes("국내") ? ["부산", "강릉", "제주"] : ["후쿠오카", "타이베이", "오사카"];
  return names.map((name, index) => ({
    id: `candidate_${index + 1}`,
    name,
    reason:
      index === 0
        ? "짧은 이동, 맛집, 자유 일정의 균형이 좋아 여러 성향을 동시에 만족시키기 쉽습니다."
        : index === 1
          ? "로컬 분위기와 편한 관광이 강하고 예산 범위 안에서 설계하기 쉽습니다."
          : "선택지가 넓고 휴식, 사진, 맛집 만족도가 높지만 일정 밀도가 높아질 수 있습니다.",
    estimatedBudget: session.budget || "1인당 80~110만원",
    fitTags: index === 0 ? ["균형", "짧은 이동", "맛집"] : index === 1 ? ["로컬", "가성비", "편안함"] : ["휴식", "사진", "선택지"],
    pros: ["참여자 요청을 일정에 반영하기 쉬움", "3박 4일 구성에 적합"],
    cons: index === 2 ? ["인파와 이동 피로가 생길 수 있음"] : ["특정 취향에는 다소 평범할 수 있음"],
    personaScores: Object.fromEntries(personas.map((persona, pIndex) => [persona.id, Math.max(62, 88 - index * 7 - pIndex * 2)]))
  }));
}

export function mockDialogue(session: TravelSession, personas: Persona[], candidates: DestinationCandidate[], selectedDestination?: string): AgentMessage[] {
  const destination = selectedDestination || candidates[0]?.name || session.destination || "후보 여행지";
  const messages: AgentMessage[] = [];
  const rounds = Math.max(1, session.settings.maxNegotiationCycles);
  for (let roundIndex = 0; roundIndex < rounds; roundIndex += 1) {
    personas.forEach((persona, turnIndex) => {
      messages.push(mockPersonaMessage(session, persona, messages.at(-1), destination, roundIndex, turnIndex));
    });
  }
  messages.push(mockExpertMessage(session, destination, messages.at(-1)));
  return messages;
}

export function mockPersonaMessage(
  session: TravelSession,
  persona: Persona,
  previous: AgentMessage | undefined,
  destination: string,
  roundIndex: number,
  turnIndex: number
): AgentMessage {
  const opening = roundIndex === 0 && turnIndex === 0;
  const speechActs: AgentMessage["speechAct"][] = opening
    ? ["suggest"]
    : roundIndex === session.settings.maxNegotiationCycles - 1
      ? ["compromise", "agree", "final_vote"]
      : ["counter_proposal", "compromise", "agree"];
  const speechAct = speechActs[(roundIndex + turnIndex) % speechActs.length] || "agree";
  const priority = persona.priorities[roundIndex % persona.priorities.length] || "만족도";
  const constraint = persona.constraints[turnIndex % persona.constraints.length] || "무리 없는 일정";
  const preference = persona.preferences[(roundIndex + turnIndex) % persona.preferences.length] || "균형 있는 여행";
  const assertive = persona.conversationStyle.assertiveness > 0.7;
  const personaOffset = hashIndex(persona.id, 5);
  const templates = [
    `${destination}는 ${priority}을 살리기 좋은 선택이에요. 저는 ${constraint}이 걸리니 첫날은 가볍게 시작하고 핵심 장소를 하나만 고정했으면 합니다.`,
    `앞 의견에 더해 ${preference} 성향도 반영됐으면 해요. ${destination}에서는 맛집이나 명소를 몰아넣기보다 숙소 근처 선택지를 남겨두는 편이 안전합니다.`,
    `저는 ${priority} 쪽에 더 무게를 두고 싶어요. 대신 다른 사람들의 요구도 맞추려면 긴 이동 코스 하나를 줄이고 자유시간을 확보하는 타협이 좋겠습니다.`,
    `${assertive ? "분명하게 제안하면" : "조심스럽게 맞춰보면"}, ${constraint}을 기준으로 일정을 다시 보는 게 좋아요. 오전에는 핵심 활동, 오후에는 선택형 코스로 나누면 제 우려가 줄어듭니다.`,
    `마지막 판단으로는 ${destination}에 동의할 수 있어요. 조건은 ${priority}이 일정표에 분명히 들어가고, ${constraint}을 피할 완충 시간이 있어야 한다는 점입니다.`
  ];
  const contentIndex = opening ? 0 : (personaOffset + roundIndex + turnIndex) % templates.length;
  return {
    id: makeId("msg"),
    speakerId: persona.id,
    speakerType: "persona",
    replyToId: previous?.id,
    targetId: previous?.speakerId,
    speechAct,
    content: templates[contentIndex],
    proposalDelta: `${priority}은 유지하고, ${constraint}을 줄이도록 이동 밀도와 자유시간을 조정`,
    supportLevel: Math.min(0.92, 0.68 + roundIndex * 0.08 + turnIndex * 0.03),
    concernLevel: Math.max(0.12, 0.58 - roundIndex * 0.1 - turnIndex * 0.04)
  };
}

export function mockExpertMessage(session: TravelSession, destination: string, previous?: AgentMessage): AgentMessage {
  return {
    id: makeId("msg"),
    speakerId: "travel_expert",
    speakerType: "expert",
    replyToId: previous?.id,
    targetId: "all",
    speechAct: "validate",
    content: `${destination} 기준으로 ${session.duration} 일정은 현실적입니다. 오전에는 핵심 활동, 오후에는 이동이 적은 코스, 저녁에는 식사와 자유시간을 섞으면 합의 만족도가 높아집니다.`,
    proposalDelta: "일정을 오전/오후/저녁 블록으로 나누고 이동 밀도를 낮춤",
    supportLevel: 0.86,
    concernLevel: 0.18
  };
}

export function mockItinerary(session: TravelSession, personas: Persona[], destination: string): Itinerary {
  const days = parseDays(session.duration);
  return {
    destination,
    consensusSummary: `${destination}는 참여자들의 예산, 맛집, 사진, 휴식 요구를 균형 있게 반영한 선택입니다.`,
    tradeoffs: ["핵심 명소는 유지하되 이동이 긴 코스는 줄였습니다.", "맛집과 자유시간을 하루에 몰지 않고 분산했습니다."],
    personaSatisfaction: Object.fromEntries(personas.map((persona, index) => [persona.displayName, 78 + index * 3])),
    days: Array.from({ length: days }, (_, index) => ({
      day: index + 1,
      title: index === 0 ? "도착과 가벼운 적응" : index === days - 1 ? "마지막 휴식과 귀가" : "핵심 경험과 자유 조율",
      morning: index === 0 ? "출발, 도착 후 숙소 근처로 이동" : index === days - 1 ? "여유로운 체크아웃과 근처 산책" : "대표 명소 1곳 방문",
      afternoon: index === 0 ? "숙소 체크인, 근처 카페와 가벼운 산책" : index === days - 1 ? "기념품 쇼핑과 자유시간" : "사진 명소 또는 로컬 체험",
      evening: index === 0 ? "현지 맛집에서 저녁, 무리 없는 복귀" : index === days - 1 ? "공항 이동 및 귀가" : "합의한 맛집과 짧은 야경 코스",
      note: "이동 부담을 낮추고 각자 원하는 포인트를 하루에 하나 이상 반영했습니다."
    }))
  };
}

function parseDays(duration: string) {
  const nightDay = duration.match(/(\d+)\s*박\s*(\d+)\s*일/);
  if (nightDay) return Number(nightDay[2]);
  const dayOnly = duration.match(/(\d+)\s*일/);
  return dayOnly ? Number(dayOnly[1]) : 4;
}

function hashIndex(value: string, modulo: number) {
  const sum = Array.from(value).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return modulo ? sum % modulo : 0;
}
