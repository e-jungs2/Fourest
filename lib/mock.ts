import { buildTravelTypeResult, describeScores, scoreQuiz } from "./quiz";
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
    settings: { maxNegotiationCycles: 5, candidateCount: 3 },
    participants: [
      participant("p_mina", "민아", { gender: "여성", ageGroup: "20대", relationship: "친구" }, "사진과 카페를 좋아함", "디저트 선호", "환승 많은 코스는 싫어함", "예쁜 장소와 야경은 꼭 있었으면 좋겠어.", {
        morning_plan: "keep_one",
        one_empty_slot: "pretty_cafe",
        dinner_choice: "split_food",
        hotel_tradeoff: "unique_stay",
        rainy_day: "rain_photo",
        hidden_place: "check_reviews",
        photo_delay: "photo_time",
        budget_issue: "save_elsewhere",
        planning_style: "rough_plan",
        group_conflict: "one_each",
        souvenir_time: "last_photo",
        best_memory: "group_happy"
      }),
      participant("p_jun", "준호", { gender: "남성", ageGroup: "20대", relationship: "친구" }, "많이 걸어도 괜찮음", "현지 맛집 중요", "이동이 길어도 좋은 경험이면 수용", "하루 한 끼는 유명한 현지 맛집으로 가고 싶어.", {
        morning_plan: "move_now",
        one_empty_slot: "famous_spot",
        dinner_choice: "wait_food",
        hotel_tradeoff: "middle_hotel",
        rainy_day: "food_tour",
        hidden_place: "try_local",
        photo_delay: "time_limit",
        budget_issue: "worth_it",
        planning_style: "must_book_food",
        group_conflict: "my_pick",
        souvenir_time: "last_food",
        best_memory: "best_meal"
      }),
      participant("p_sora", "소라", { gender: "여성", ageGroup: "20대", relationship: "친구" }, "중간 휴식 필요", "무난한 음식 선호", "숙소와 관광지 동선이 단순한 것 선호", "너무 빡빡하지 않고 카페 시간이 있었으면 해.", {
        morning_plan: "slow_cafe",
        one_empty_slot: "rest_lobby",
        dinner_choice: "nearby_food",
        hotel_tradeoff: "central_hotel",
        rainy_day: "hotel_rest",
        hidden_place: "ask_group",
        photo_delay: "photo_time",
        budget_issue: "save_elsewhere",
        planning_style: "rough_plan",
        group_conflict: "one_each",
        souvenir_time: "airport_early",
        best_memory: "rested"
      }),
      participant("p_hae", "해린", { gender: "여성", ageGroup: "20대", relationship: "친구" }, "휴식과 쇼핑 선호", "음식은 무난하면 됨", "너무 이른 이동은 피하고 싶음", "아침 일찍 시작하는 일정은 피하고 쇼핑 시간이 있으면 좋겠어.", {
        morning_plan: "free_time",
        one_empty_slot: "pretty_cafe",
        dinner_choice: "split_food",
        hotel_tradeoff: "middle_hotel",
        rainy_day: "museum",
        hidden_place: "ask_group",
        photo_delay: "split_photo",
        budget_issue: "save_elsewhere",
        planning_style: "rough_plan",
        group_conflict: "one_each",
        souvenir_time: "souvenir",
        best_memory: "group_happy"
      })
    ]
  };
}

function participant(
  id: string,
  name: string,
  basicInfo: Participant["basicInfo"],
  healthNote: string,
  foodNote: string,
  mobilityNote: string,
  personalRequests: string,
  quizAnswers: Record<string, string>
): Participant {
  const quizScores = scoreQuiz(quizAnswers);
  return {
    id,
    name,
    basicInfo,
    healthNote,
    foodNote,
    mobilityNote,
    personalRequests,
    quizAnswers,
    quizScores,
    travelTypeResult: buildTravelTypeResult(quizAnswers),
    completed: true
  };
}

export function mockPersonas(participants: Participant[]): Persona[] {
  return participants.map((item) => {
    const traits = describeScores(item.quizScores);
    const active = item.quizScores.rest_vs_activity > 65;
    const budget = item.quizScores.budget_sensitivity > 70;
    const comfort = item.quizScores.comfort_need > 70;
    const typeSummary = item.travelTypeResult ? `${item.travelTypeResult.primaryType} / ${item.travelTypeResult.secondaryType}` : traits.slice(0, 2).join(", ");
    return {
      id: `persona_${item.id}`,
      participantId: item.id,
      displayName: `${item.name} 페르소나`,
      summary: `${item.name}을 대표하는 ${typeSummary} 성향의 여행 페르소나입니다.`,
      preferences: traits,
      constraints: [
        budget ? "예산 초과에 민감함" : "경험 만족도가 높으면 비용을 일부 허용",
        comfort ? "이동 편의와 숙소 컨디션 필요" : "일정상 필요한 이동은 수용 가능",
        item.healthNote || "체력 관련 특이사항 없음",
        item.foodNote || "음식 관련 특이사항 없음",
        item.mobilityNote || "이동 관련 특이사항 없음",
        item.personalRequests || "개인적으로 중요한 것 없음"
      ],
      priorities: [
        active ? "활동 밀도" : "휴식 균형",
        item.quizScores.food_interest > 70 ? "맛집" : "동선 효율",
        budget ? "예산" : "경험 만족도"
      ],
      decisionPolicy: {
        willSupportIf: ["개인 요청이 반영됨", "전체 동선이 납득 가능함", "예산과 만족도가 균형을 이룸"],
        willObjectIf: ["자신의 핵심 요청이 사라짐", "일정이 지나치게 피곤함", "예산 대비 만족도가 낮음"],
        canCompromiseOn: ["방문 순서", "일부 식사 장소", "자유시간 길이"]
      },
      conversationStyle: {
        tone: comfort ? "조심스럽고 현실적인 말투" : "솔직하고 제안이 빠른 말투",
        assertiveness: active ? 0.75 : 0.55,
        empathy: comfort ? 0.84 : 0.7
      },
      representationScore: 0.82 + Math.round(Math.random() * 10) / 100
    };
  });
}

export function mockCandidates(session: TravelSession, personas: Persona[]): DestinationCandidate[] {
  const names = session.scope.includes("국내")
    ? ["부산", "강릉", "전주"]
    : ["후쿠오카", "타이베이", "오사카"];
  return names.map((name, index) => ({
    id: `candidate_${index + 1}`,
    name,
    reason:
      index === 0
        ? "짧은 이동, 맛집, 여유 일정의 균형이 좋아 여러 성향을 동시에 만족시킵니다."
        : index === 1
          ? "로컬 먹거리와 도심 관광이 강하고 예산 범위 안에서 설계하기 쉽습니다."
          : "선택지가 풍부하고 쇼핑/사진/맛집 만족도가 높지만 일정 밀도가 높아질 수 있습니다.",
    estimatedBudget: session.budget || "1인당 80~110만원",
    fitTags: index === 0 ? ["균형", "짧은 이동", "맛집"] : index === 1 ? ["로컬", "가성비", "도심"] : ["쇼핑", "사진", "선택지"],
    pros: ["참여자 요청을 일정에 반영하기 쉬움", "3박 4일 구성에 적합"],
    cons: index === 2 ? ["인파와 이동 피로가 생길 수 있음"] : ["특정 취향에는 다소 심심할 수 있음"],
    personaScores: Object.fromEntries(personas.map((persona, pIndex) => [persona.id, Math.max(62, 88 - index * 7 - pIndex * 2)]))
  }));
}

export function mockDialogue(session: TravelSession, personas: Persona[], candidates: DestinationCandidate[], selectedDestination?: string): AgentMessage[] {
  const destination = selectedDestination || candidates[0]?.name || session.destination || "후보 여행지";
  const messages: AgentMessage[] = [];
  personas.slice(0, session.settings.maxNegotiationCycles).forEach((persona, index) => {
    const speechActs: AgentMessage["speechAct"][] = ["suggest", "counter_proposal", "compromise", "agree", "final_vote"];
    messages.push({
      id: makeId("msg"),
      speakerId: persona.id,
      speakerType: "persona",
      replyToId: index ? messages[index - 1]?.id : undefined,
      targetId: index ? messages[index - 1]?.speakerId : undefined,
      speechAct: speechActs[index] || "agree",
      content:
        index === 0
          ? `${destination}는 제 요청을 꽤 잘 반영할 수 있어 보여요. 다만 일정에 ${persona.priorities[0]}이 분명히 들어갔으면 합니다.`
          : `${messages[index - 1]?.speakerId ? "앞 의견에 동의하지만" : "저도"} ${persona.constraints[0]}도 같이 고려해야 해요. 그래서 핵심 활동은 남기고 이동 부담을 줄이는 절충안이 좋겠습니다.`,
      proposalDelta: "핵심 활동 유지, 이동이 긴 일정은 숙소 근처 활동으로 대체",
      supportLevel: 0.72 + index * 0.03,
      concernLevel: Math.max(0.22, 0.58 - index * 0.07)
    });
  });
  messages.push({
    id: makeId("msg"),
    speakerId: "travel_expert",
    speakerType: "expert",
    speechAct: "validate",
    content: `${destination} 기준으로 ${session.duration} 일정은 현실적입니다. 오전에는 대표 활동, 오후에는 이동이 적은 코스, 저녁에는 식사와 자유시간을 섞으면 합의 수준이 높아집니다.`,
    proposalDelta: "일자별 오전/오후/저녁 블록으로 일정 밀도 조정",
    supportLevel: 0.86,
    concernLevel: 0.18
  });
  return messages;
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
      title: index === 0 ? "도착과 가벼운 적응" : index === days - 1 ? "마지막 쇼핑과 귀가" : "핵심 경험과 여유 조율",
      morning: index === 0 ? "출발, 도착 후 숙소 근처로 이동" : index === days - 1 ? "느긋한 체크아웃과 근처 산책" : "대표 명소 1곳 방문",
      afternoon: index === 0 ? "숙소 체크인, 근처 카페와 가벼운 산책" : index === days - 1 ? "기념품 쇼핑과 자유시간" : "사진 명소 또는 로컬 체험",
      evening: index === 0 ? "현지 맛집 1곳에서 저녁, 무리 없는 복귀" : index === days - 1 ? "공항 이동 및 귀가" : "합의된 맛집과 짧은 야경 코스",
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
