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

export type DestinationCandidate = {
  id: string;
  name: string;
  reason: string;
  estimatedBudget: string;
  fitTags: string[];
  pros: string[];
  cons: string[];
  personaScores: Record<string, number>;
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

export const SESSION_KEY = "persona-travel-mvp-session";

const emptyScores: QuizScores = {
  rest_vs_activity: 0,
  food_interest: 0,
  budget_sensitivity: 0,
  comfort_need: 0,
  planning_preference: 0,
  local_experience: 0
};

export function createParticipants(count: number): Participant[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `p-${index + 1}`,
    name: `참여자 ${index + 1}`,
    basicInfo: "",
    personalRequests: "",
    quizAnswers: {},
    quizScores: { ...emptyScores },
    completed: false
  }));
}

export function demoSession(): TravelSession {
  return {
    id: "demo-friends-trip",
    destinationStatus: "undecided",
    destination: "",
    departureArea: "서울",
    scope: "국내 2박 3일",
    duration: 3,
    budget: "1인 45만원",
    requirements: "운전 부담은 적게, 맛집과 풍경이 모두 있었으면 좋겠음",
    participants: [
      {
        id: "p-1",
        name: "지민",
        basicInfo: "사진 찍는 걸 좋아하고 이동이 너무 빡빡하면 지침",
        personalRequests: "오션뷰 카페와 산책 시간을 꼭 넣고 싶음",
        quizAnswers: { q1: 1, q2: 2, q3: 1, q4: 2, q5: 1, q6: 2 },
        quizScores: {
          rest_vs_activity: 35,
          food_interest: 72,
          budget_sensitivity: 44,
          comfort_need: 76,
          planning_preference: 58,
          local_experience: 62
        },
        completed: true
      },
      {
        id: "p-2",
        name: "도윤",
        basicInfo: "활동적인 편이고 새로운 동네를 걷는 걸 좋아함",
        personalRequests: "하루 한 번은 로컬 시장이나 골목 탐방이 있었으면 함",
        quizAnswers: { q1: 2, q2: 2, q3: 0, q4: 1, q5: 2, q6: 2 },
        quizScores: {
          rest_vs_activity: 82,
          food_interest: 68,
          budget_sensitivity: 55,
          comfort_need: 38,
          planning_preference: 74,
          local_experience: 84
        },
        completed: true
      },
      {
        id: "p-3",
        name: "서아",
        basicInfo: "예산과 숙소 컨디션을 중요하게 봄",
        personalRequests: "숙소 이동은 최소화하고 너무 비싼 식당은 피하고 싶음",
        quizAnswers: { q1: 0, q2: 1, q3: 2, q4: 2, q5: 1, q6: 1 },
        quizScores: {
          rest_vs_activity: 42,
          food_interest: 51,
          budget_sensitivity: 88,
          comfort_need: 82,
          planning_preference: 61,
          local_experience: 49
        },
        completed: true
      },
      {
        id: "p-4",
        name: "민준",
        basicInfo: "먹는 것과 가벼운 액티비티를 좋아함",
        personalRequests: "저녁은 제대로 먹고, 낮에는 한 번쯤 체험 코스가 있으면 좋겠음",
        quizAnswers: { q1: 2, q2: 2, q3: 1, q4: 1, q5: 0, q6: 2 },
        quizScores: {
          rest_vs_activity: 76,
          food_interest: 91,
          budget_sensitivity: 50,
          comfort_need: 45,
          planning_preference: 38,
          local_experience: 78
        },
        completed: true
      }
    ],
    settings: { maxNegotiationCycles: 5 }
  };
}

export function generatePersonas(session: TravelSession): Persona[] {
  return session.participants.map((participant, index) => {
    const scores = participant.quizScores;
    const active = scores.rest_vs_activity > 60;
    const comfort = scores.comfort_need > 60;
    const food = scores.food_interest > 65;
    return {
      id: `persona-${participant.id}`,
      participantId: participant.id,
      displayName: `${participant.name} 페르소나`,
      summary: `${active ? "활동" : "회복"} 중심, ${food ? "맛집 우선" : "균형형"} 여행자`,
      preferences: [
        active ? "걷기 좋은 동선과 체험 일정" : "여유로운 체크인과 휴식 시간",
        food ? "지역 맛집과 카페" : "동선 안에서 해결되는 식사",
        scores.local_experience > 60 ? "로컬 동네 경험" : "검증된 대표 코스"
      ],
      constraints: [
        comfort ? "숙소와 이동 편의성 필요" : "이동 난도는 어느 정도 감수 가능",
        scores.budget_sensitivity > 70 ? "예산 초과에 민감" : "가치가 있으면 지출 가능"
      ],
      priorities: [participant.personalRequests || "개인 요청 없음", session.requirements],
      decisionPolicy:
        scores.planning_preference > 60
          ? "큰 틀을 먼저 합의하고 세부 동선을 조율한다."
          : "현장 선택지를 남기되 핵심 예약만 고정한다.",
      conversationStyle: index % 2 === 0 ? "차분히 근거를 제시함" : "대안을 빠르게 제안함",
      representationScore: 76 + index * 5
    };
  });
}

export function generateCandidates(personas: Persona[]): DestinationCandidate[] {
  const names = ["강릉", "여수", "제주 동부"];
  return names.map((name, index) => ({
    id: `d-${index + 1}`,
    name,
    reason:
      index === 0
        ? "이동 부담이 낮고 바다, 카페, 로컬 식당을 균형 있게 넣기 좋습니다."
        : index === 1
          ? "먹거리와 야경이 강하고 여유로운 동선 설계가 쉽습니다."
          : "자연 풍경과 체험 요소가 풍부해 활동형 참여자의 만족도가 높습니다.",
    estimatedBudget: index === 2 ? "1인 55만~70만원" : "1인 38만~52만원",
    fitTags: index === 0 ? ["바다", "카페", "짧은 이동"] : index === 1 ? ["맛집", "야경", "낭만"] : ["자연", "체험", "드라이브"],
    pros: ["요구사항 반영이 쉬움", "참여자 선호를 나누어 담기 좋음"],
    cons: [index === 2 ? "항공과 렌트 변수가 있음" : "성수기 숙소 가격 변동 가능"],
    personaScores: Object.fromEntries(personas.map((persona, pIndex) => [persona.id, 72 + index * 4 + pIndex * 3]))
  }));
}

export function generateMessages(personas: Persona[], destination: string): AgentMessage[] {
  const acts: AgentMessage["speechAct"][] = ["suggest", "counter_proposal", "compromise", "validate", "final_vote"];
  return personas.flatMap((persona, index) => [
    {
      id: `m-${index + 1}`,
      speakerId: persona.id,
      speakerType: "persona",
      speechAct: acts[index % acts.length],
      content:
        index === 0
          ? `${destination || "후보지"}는 휴식과 산책 시간을 분리하기 좋아요. 첫날은 도착 후 강한 일정보다 분위기 잡는 코스가 좋겠습니다.`
          : index === 1
            ? `동의하지만 로컬 경험이 약하면 아쉬울 수 있어요. 시장이나 골목 탐방을 오후에 넣는 안을 제안합니다.`
            : index === 2
              ? `예산과 숙소 컨디션을 고려하면 숙소 이동은 줄이고, 비싼 식사는 하루 한 번만 확실히 잡는 편이 안전합니다.`
              : `저녁 식사는 만족도를 크게 좌우하니 예약 가능한 맛집을 중심으로 잡고 낮에는 짧은 체험을 넣으면 균형이 맞아요.`,
      supportLevel: 70 + index * 6,
      concernLevel: 30 - index * 3
    }
  ]);
}

export function generateItinerary(session: TravelSession, destination: string): Itinerary {
  const days = Array.from({ length: session.duration }, (_, index) => ({
    day: index + 1,
    morning:
      index === 0
        ? `${session.departureArea || "출발지"} 출발, 숙소 근처로 이동하며 부담 낮은 브런치`
        : `느린 아침 식사 후 ${destination} 대표 산책 코스`,
    afternoon:
      index === 0
        ? "체크인 전후 카페와 전망 좋은 산책길"
        : index === session.duration - 1
          ? "기념품 쇼핑과 이동 전 가벼운 로컬 식사"
          : "로컬 시장, 골목 탐방, 짧은 체험 일정",
    evening:
      index === session.duration - 1
        ? "귀가 동선에 맞춘 이른 저녁과 정리"
        : "예약 가능한 지역 맛집, 숙소 근처 자유 시간"
  }));

  return {
    destination,
    days,
    tradeoffs: ["숙소 이동을 줄이는 대신 일부 명소는 과감히 제외", "고가 식사는 하루 한 번으로 제한"],
    personaSatisfaction: Object.fromEntries(session.participants.map((participant, index) => [participant.id, 78 + index * 4])),
    consensusSummary: "휴식, 로컬 경험, 맛집, 예산 안정성을 모두 일정 안에 한 번씩 명확히 배치했습니다."
  };
}

export const quizQuestions = [
  {
    id: "q1",
    title: "여행 하루가 끝났을 때 더 만족스러운 쪽은?",
    options: ["충분히 쉬었다", "적당히 둘 다 했다", "많이 보고 움직였다"],
    axis: "rest_vs_activity"
  },
  {
    id: "q2",
    title: "식사는 여행에서 어느 정도 중요한가요?",
    options: ["동선 안에서 간단히", "괜찮은 곳이면 좋음", "맛집이 핵심"],
    axis: "food_interest"
  },
  {
    id: "q3",
    title: "예산이 예상보다 올라가면?",
    options: ["좋으면 괜찮음", "조금 조정", "바로 대안 필요"],
    axis: "budget_sensitivity"
  },
  {
    id: "q4",
    title: "숙소와 이동 편의성은?",
    options: ["크게 상관 없음", "평균이면 됨", "꽤 중요함"],
    axis: "comfort_need"
  },
  {
    id: "q5",
    title: "일정표는 어느 정도까지 정해져야 편한가요?",
    options: ["현장 즉흥", "큰 틀만", "시간대별 계획"],
    axis: "planning_preference"
  },
  {
    id: "q6",
    title: "로컬 경험에 대한 선호는?",
    options: ["대표 명소 중심", "섞이면 좋음", "동네 감각 중요"],
    axis: "local_experience"
  }
] as const;

export function scoreQuiz(answers: Record<string, number>): QuizScores {
  const scores = { ...emptyScores };
  quizQuestions.forEach((question) => {
    scores[question.axis] = 20 + (answers[question.id] ?? 1) * 35;
  });
  return scores;
}
