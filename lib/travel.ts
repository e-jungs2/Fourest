export type DestinationStatus = "fixed" | "undecided";

export type QuizScores = {
  rest_vs_activity: number;
  food_interest: number;
  budget_sensitivity: number;
  comfort_need: number;
  planning_preference: number;
  local_experience: number;
};

export type Participant = {
  id: string;
  name: string;
  basicInfo: string;
  personalRequests: string;
  quizAnswers: Record<string, number>;
  quizScores: QuizScores;
  completed: boolean;
};

export type TravelSession = {
  id: string;
  destinationStatus: DestinationStatus;
  destination: string;
  departureArea: string;
  scope: string;
  duration: number;
  budget: string;
  requirements: string;
  participants: Participant[];
  settings: {
    maxNegotiationCycles: number;
  };
};

export type Persona = {
  id: string;
  participantId: string;
  displayName: string;
  summary: string;
  preferences: string[];
  constraints: string[];
  priorities: string[];
  decisionPolicy: string;
  conversationStyle: string;
  representationScore: number;
};

export type AgentMessage = {
  id: string;
  speakerId: string;
  speakerType: "persona" | "system";
  speechAct:
    | "suggest"
    | "agree"
    | "disagree"
    | "counter_proposal"
    | "compromise"
    | "validate"
    | "final_vote";
  content: string;
  supportLevel: number;
  concernLevel: number;
};

export type ItineraryDay = {
  day: number;
  morning: string;
  afternoon: string;
  evening: string;
};

export type Itinerary = {
  destination: string;
  days: ItineraryDay[];
  tradeoffs: string[];
  personaSatisfaction: Record<string, number>;
  consensusSummary: string;
};

const friendProfiles = [
  {
    id: "kwon-yonghu",
    name: "권용후",
    summary: "맛집과 동선을 꼼꼼히 챙기는 계획형 여행자",
    preferences: ["현지 맛집", "효율적인 이동", "예약 가능한 코스"],
    constraints: ["불필요한 대기 시간은 줄이고 싶어함", "예산 초과에 민감함"],
    priorities: ["저녁 맛집은 실패하지 않는 곳", "숙소와 이동 동선 최적화"],
    decisionPolicy: "근거가 분명한 선택지를 선호하고, 일정이 너무 느슨하면 보완안을 제안한다.",
    conversationStyle: "차분하게 장단점을 비교하며 말한다.",
    scores: {
      rest_vs_activity: 58,
      food_interest: 88,
      budget_sensitivity: 76,
      comfort_need: 62,
      planning_preference: 86,
      local_experience: 70
    }
  },
  {
    id: "lee-chaewon",
    name: "이채원",
    summary: "카페, 사진, 분위기를 중요하게 보는 감성형 여행자",
    preferences: ["예쁜 카페", "사진 명소", "여유로운 자유 시간"],
    constraints: ["너무 빡빡한 일정은 피하고 싶어함", "숙소 컨디션을 중요하게 봄"],
    priorities: ["하루 한 번은 분위기 좋은 장소", "휴식 시간이 있는 일정"],
    decisionPolicy: "전체 분위기와 만족도를 기준으로 보고, 모두가 지치지 않는 선택을 지지한다.",
    conversationStyle: "부드럽게 의견을 내고 타협점을 잘 찾는다.",
    scores: {
      rest_vs_activity: 38,
      food_interest: 64,
      budget_sensitivity: 54,
      comfort_need: 82,
      planning_preference: 48,
      local_experience: 68
    }
  },
  {
    id: "lee-jeongyeon",
    name: "이정연",
    summary: "로컬 경험과 즉흥적인 발견을 좋아하는 탐색형 여행자",
    preferences: ["로컬 골목", "시장 탐방", "새로운 체험"],
    constraints: ["관광지만 도는 코스는 아쉬워함", "식사는 너무 무난하면 만족도가 낮음"],
    priorities: ["현지 분위기가 느껴지는 장소", "예상 밖의 재미가 있는 코스"],
    decisionPolicy: "검증된 일정 사이에 새로운 선택지를 하나씩 넣는 방식에 적극적이다.",
    conversationStyle: "아이디어를 빠르게 던지고 분위기를 살린다.",
    scores: {
      rest_vs_activity: 78,
      food_interest: 72,
      budget_sensitivity: 42,
      comfort_need: 46,
      planning_preference: 36,
      local_experience: 92
    }
  },
  {
    id: "in-taeyoung",
    name: "인태영",
    summary: "체력과 비용 균형을 보면서 모두의 만족도를 챙기는 조율형 여행자",
    preferences: ["균형 잡힌 일정", "가성비", "편한 숙소"],
    constraints: ["이동이 과하면 피로도가 높아짐", "비싼 선택에는 명확한 이유가 필요함"],
    priorities: ["무리 없는 동선", "친구들 의견이 반영된 일정"],
    decisionPolicy: "가장 강한 취향과 가장 큰 불편을 함께 보고 중간 지점을 찾는다.",
    conversationStyle: "현실적인 질문을 던지며 합의를 돕는다.",
    scores: {
      rest_vs_activity: 52,
      food_interest: 58,
      budget_sensitivity: 84,
      comfort_need: 74,
      planning_preference: 66,
      local_experience: 56
    }
  }
] as const;

export function demoSession(): TravelSession {
  return {
    id: "triper-friends-trip",
    destinationStatus: "undecided",
    destination: "",
    departureArea: "서울",
    scope: "국내 2박 3일",
    duration: 3,
    budget: "1인 45만원",
    requirements: "친구 4명이 함께 가는 여행. 맛집, 사진, 휴식, 예산 균형을 모두 고려한다.",
    participants: friendProfiles.map((friend, index) => ({
      id: `p-${index + 1}`,
      name: friend.name,
      basicInfo: friend.summary,
      personalRequests: friend.priorities.join(" / "),
      quizAnswers: {},
      quizScores: friend.scores,
      completed: true
    })),
    settings: { maxNegotiationCycles: 5 }
  };
}

export function generatePersonas(session: TravelSession): Persona[] {
  return session.participants.map((participant) => {
    const friend = friendProfiles.find((item) => item.name === participant.name);
    return {
      id: `persona-${participant.id}`,
      participantId: participant.id,
      displayName: participant.name,
      summary: friend?.summary ?? `${participant.name}의 여행 페르소나`,
      preferences: friend?.preferences ? [...friend.preferences] : ["여행 만족도"],
      constraints: friend?.constraints ? [...friend.constraints] : ["큰 제약 없음"],
      priorities: friend?.priorities ? [...friend.priorities] : [participant.personalRequests || "즐거운 여행"],
      decisionPolicy: friend?.decisionPolicy ?? "모두의 의견을 보고 균형 있게 결정한다.",
      conversationStyle: friend?.conversationStyle ?? "차분하고 협조적으로 말한다.",
      representationScore: 82
    };
  });
}

export function createCustomPersona(name: string, personaText: string): Persona {
  const cleanName = name.trim() || "나";
  const text = personaText.trim();
  return {
    id: `persona-me-${Date.now()}`,
    participantId: `me-${Date.now()}`,
    displayName: cleanName,
    summary: text || "직접 입력한 내 여행 페르소나",
    preferences: extractList(text, ["내가 중요하게 생각하는 여행 스타일"]),
    constraints: ["직접 입력한 페르소나를 우선 반영"],
    priorities: [text || "내 취향이 반영된 여행"],
    decisionPolicy: "입력된 페르소나 문장을 기준으로 여행 선택을 판단한다.",
    conversationStyle: "내가 적은 취향을 직접적으로 반영해 의견을 낸다.",
    representationScore: 90
  };
}

function extractList(text: string, fallback: string[]) {
  const parts = text
    .split(/[,\n/]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 4);
  return parts.length ? parts : fallback;
}

const MAX_FALLBACK_NEGOTIATION_CYCLES = 5;

function fallbackSpeechActForTurn(turnIndex: number, personaCount: number, totalTurns: number): AgentMessage["speechAct"] {
  const cycleIndex = Math.floor(turnIndex / personaCount);
  if (turnIndex >= totalTurns - personaCount) return "final_vote";
  if (cycleIndex === 0) return turnIndex % personaCount === 0 ? "suggest" : "counter_proposal";
  if (cycleIndex === 1) return "counter_proposal";
  if (cycleIndex === 2) return "compromise";
  return "agree";
}

export function generateMessages(personas: Persona[], situation: string): AgentMessage[] {
  const totalTurns = personas.length * MAX_FALLBACK_NEGOTIATION_CYCLES;
  return Array.from({ length: totalTurns }, (_, index) => {
    const persona = personas[index % personas.length];
    return {
      id: `m-${Date.now()}-${index}`,
      speakerId: persona.id,
      speakerType: "persona",
      speechAct: fallbackSpeechActForTurn(index, personas.length, totalTurns),
      content: buildMessage(persona, situation, index, personas.length, totalTurns),
      supportLevel: Math.min(95, 72 + index * 5),
      concernLevel: Math.max(8, 34 - index * 4)
    };
  });
}

function buildMessage(persona: Persona, situation: string, index: number, personaCount: number, totalTurns: number) {
  const destination = situation || "이번 여행";
  const cycleIndex = Math.floor(index / personaCount);
  const finalCycle = index >= totalTurns - personaCount;
  if (finalCycle) {
    return `오케이, 이 정도면 난 좋아. 대신 ${persona.priorities[0]}은 꼭 하나 넣고, ${persona.constraints[0]}만 너무 심하지 않게 가자.`;
  }
  if (cycleIndex === 0) {
    return `난 ${destination}이면 ${persona.preferences[0]} 쪽이 제일 끌려. ${persona.priorities[0]}도 같이 챙기면 꽤 재밌을 것 같아.`;
  }
  if (cycleIndex === 1) {
    return `그건 괜찮은데 ${persona.constraints[0]}은 좀 신경 쓰이긴 해. 하루에 한 번쯤은 숨 돌릴 시간 넣으면 좋겠어.`;
  }
  if (cycleIndex === 2) {
    return `나는 ${persona.preferences[0]} 같은 게 하나쯤 있으면 좋겠어. 대신 그거 넣는 대신 다른 코스는 가까운 데로 줄여도 돼.`;
  }
  return `그럼 맛집이랑 쉬는 시간, 예산을 하루에 너무 몰지 말고 나눠 넣자. 그 정도면 나도 편하게 따라갈 수 있을 듯.`;
}

export function generateItinerary(session: TravelSession, destination: string): Itinerary {
  const safeDestination = destination || "추천 여행지";
  const days = Array.from({ length: session.duration }, (_, index) => ({
    day: index + 1,
    morning:
      index === 0
        ? `${session.departureArea} 출발, 숙소 근처로 이동하며 가벼운 브런치`
        : `${safeDestination} 대표 산책 코스와 카페`,
    afternoon:
      index === session.duration - 1
        ? "기념품 쇼핑과 이동 전 여유 시간"
        : "로컬 골목, 시장, 사진 명소를 묶은 짧은 동선",
    evening:
      index === session.duration - 1
        ? "귀가 동선에 맞춰 이른 저녁"
        : "예약 가능한 현지 맛집과 숙소 근처 자유 시간"
  }));

  return {
    destination: safeDestination,
    days,
    tradeoffs: ["핵심 명소는 유지하고 이동 부담이 큰 코스는 줄임", "비싼 식사는 하루 한 번으로 제한"],
    personaSatisfaction: Object.fromEntries(session.participants.map((participant, index) => [participant.id, 80 + index * 4])),
    consensusSummary: "맛집, 사진, 휴식, 예산을 하루 안에 나눠 배치해 네 친구의 취향이 모두 보이도록 구성했습니다."
  };
}
