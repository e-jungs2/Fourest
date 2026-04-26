import type { QuizAxis, QuizScores, TravelerTypeId, TravelTypeResult } from "./types";

type EffectMap = Partial<Record<QuizAxis, number>>;
type TypeEffectMap = Partial<Record<TravelerTypeId, number>>;

export const defaultScores: QuizScores = {
  rest_vs_activity: 50,
  food_interest: 50,
  budget_sensitivity: 50,
  comfort_need: 50,
  planning_preference: 50,
  local_experience: 50,
  photo_mood_importance: 50,
  conflict_flexibility: 50
};

const defaultTypeScores: Record<TravelerTypeId, number> = {
  slow_healer: 50,
  active_explorer: 50,
  food_radar: 50,
  mood_collector: 50,
  budget_strategist: 50,
  stable_planner: 50,
  local_diver: 50,
  group_mediator: 50
};

export const travelerTypes: Record<
  TravelerTypeId,
  {
    label: string;
    summary: string;
    strengths: string[];
    riskFactors: string[];
    decisionStyle: string;
  }
> = {
  slow_healer: {
    label: "여유 충전형",
    summary: "쉬는 시간과 편안한 동선을 중요하게 생각하는 여행자",
    strengths: ["일정의 피로도를 잘 감지함", "무리 없는 여행 흐름을 만드는 데 강함"],
    riskFactors: ["일정이 빽빽하면 만족도가 크게 떨어질 수 있음"],
    decisionStyle: "편안한 동선과 휴식 시간이 보장되면 절충 가능"
  },
  active_explorer: {
    label: "알차게 탐험형",
    summary: "짧은 시간 안에 많이 보고 경험하고 싶은 여행자",
    strengths: ["새로운 활동을 적극적으로 제안함", "여행 밀도를 높이는 데 강함"],
    riskFactors: ["동행자의 체력 부담을 놓칠 수 있음"],
    decisionStyle: "핵심 활동이 남아 있으면 일정 일부 축소를 수용"
  },
  food_radar: {
    label: "맛집 레이더형",
    summary: "여행 만족도를 음식과 현지 맛집에서 크게 느끼는 여행자",
    strengths: ["식사 선택의 만족도를 높임", "현지 경험을 음식으로 연결함"],
    riskFactors: ["맛집 동선 때문에 일정이 비효율적일 수 있음"],
    decisionStyle: "하루 한 끼의 만족도가 보장되면 다른 식사는 양보 가능"
  },
  mood_collector: {
    label: "감성 기록형",
    summary: "사진, 분위기, 카페, 야경처럼 기억에 남는 장면을 중요하게 여기는 여행자",
    strengths: ["여행의 기억 포인트를 잘 찾음", "장소의 분위기를 세심하게 봄"],
    riskFactors: ["예쁜 장소를 쫓다가 이동 부담이 커질 수 있음"],
    decisionStyle: "사진/분위기 포인트가 반영되면 동선 조정에 협조적"
  },
  budget_strategist: {
    label: "가성비 전략형",
    summary: "예산 안에서 만족도를 최대화하려는 여행자",
    strengths: ["비용 대비 만족도를 잘 따짐", "예산 초과 위험을 줄임"],
    riskFactors: ["경험의 특별함보다 가격을 우선할 수 있음"],
    decisionStyle: "가성비가 명확하면 비용이 조금 높은 선택도 수용"
  },
  stable_planner: {
    label: "안정 계획형",
    summary: "미리 정리된 일정과 예측 가능한 동선을 선호하는 여행자",
    strengths: ["일정 누락과 혼란을 줄임", "예약과 이동 계획에 강함"],
    riskFactors: ["즉흥적인 재미를 제한할 수 있음"],
    decisionStyle: "큰 틀이 유지되면 현장 조정도 제한적으로 수용"
  },
  local_diver: {
    label: "로컬 몰입형",
    summary: "유명 관광지보다 현지 분위기와 골목 경험을 좋아하는 여행자",
    strengths: ["평범하지 않은 경험을 발굴함", "현지 감각을 일정에 더함"],
    riskFactors: ["검증되지 않은 장소 선택이 생길 수 있음"],
    decisionStyle: "대표 코스와 로컬 코스가 섞이면 만족"
  },
  group_mediator: {
    label: "모두의 조율자형",
    summary: "자기 취향도 있지만 동행자 만족과 갈등 조율을 중요하게 보는 여행자",
    strengths: ["의견 충돌을 부드럽게 조정함", "합의 가능한 대안을 잘 찾음"],
    riskFactors: ["자기 선호가 뒤로 밀릴 수 있음"],
    decisionStyle: "각자 원하는 것이 하나씩 반영되는 균형안을 선호"
  }
};

export const quizQuestions: Array<{
  id: string;
  title: string;
  scene: string;
  options: Array<{
    id: string;
    label: string;
    effects: EffectMap;
    typeEffects: TypeEffectMap;
  }>;
}> = [
  {
    id: "morning_plan",
    title: "여행 둘째 날 아침, 친구가 '오늘은 쉬엄쉬엄 가자'고 말한다.",
    scene: "어제 많이 걸어서 모두가 살짝 지친 상황입니다.",
    options: [
      {
        id: "slow_cafe",
        label: "좋아, 카페부터 가고 컨디션 보고 움직이자.",
        effects: { rest_vs_activity: -14, comfort_need: 8, conflict_flexibility: 8 },
        typeEffects: { slow_healer: 16, group_mediator: 8 }
      },
      {
        id: "keep_one",
        label: "쉬는 건 좋은데 예약해둔 한 곳은 가고 싶어.",
        effects: { planning_preference: 10, rest_vs_activity: 5, conflict_flexibility: 5 },
        typeEffects: { stable_planner: 12, group_mediator: 5 }
      },
      {
        id: "move_now",
        label: "여기까지 왔는데 아침부터 움직여야지.",
        effects: { rest_vs_activity: 16, comfort_need: -4 },
        typeEffects: { active_explorer: 16 }
      },
      {
        id: "free_time",
        label: "그럼 오전은 각자 자유시간 갖고 점심에 만나자.",
        effects: { conflict_flexibility: 14, planning_preference: -4 },
        typeEffects: { group_mediator: 14, local_diver: 5 }
      }
    ]
  },
  {
    id: "one_empty_slot",
    title: "일정표에 빈 시간이 3시간 생겼다.",
    scene: "숙소 체크인 전까지 애매하게 시간이 남았습니다.",
    options: [
      {
        id: "famous_spot",
        label: "근처 대표 명소 하나는 찍고 가자.",
        effects: { rest_vs_activity: 9, planning_preference: 5 },
        typeEffects: { active_explorer: 9, stable_planner: 4 }
      },
      {
        id: "pretty_cafe",
        label: "분위기 좋은 카페나 포토 스팟을 찾자.",
        effects: { photo_mood_importance: 16, comfort_need: 4 },
        typeEffects: { mood_collector: 18 }
      },
      {
        id: "local_walk",
        label: "관광지 말고 골목을 걸으며 현지 분위기를 보자.",
        effects: { local_experience: 16, planning_preference: -5 },
        typeEffects: { local_diver: 18 }
      },
      {
        id: "rest_lobby",
        label: "짐도 있고 피곤하니까 근처에서 쉬자.",
        effects: { rest_vs_activity: -16, comfort_need: 12 },
        typeEffects: { slow_healer: 18 }
      }
    ]
  },
  {
    id: "dinner_choice",
    title: "저녁 식당을 정해야 하는데 후보가 갈립니다.",
    scene: "한 곳은 유명 맛집이지만 웨이팅이 길고, 한 곳은 숙소 근처입니다.",
    options: [
      {
        id: "wait_food",
        label: "기다려도 유명 맛집은 가볼 가치가 있어.",
        effects: { food_interest: 18, comfort_need: -4 },
        typeEffects: { food_radar: 18 }
      },
      {
        id: "nearby_food",
        label: "숙소 근처에서 맛 괜찮은 곳을 찾는 게 낫다.",
        effects: { comfort_need: 12, food_interest: 4 },
        typeEffects: { slow_healer: 8, stable_planner: 5 }
      },
      {
        id: "budget_food",
        label: "가격과 평점이 적당한 곳이면 충분하다.",
        effects: { budget_sensitivity: 14, food_interest: -2 },
        typeEffects: { budget_strategist: 16 }
      },
      {
        id: "split_food",
        label: "오늘은 가까운 곳, 내일은 유명 맛집으로 나누자.",
        effects: { conflict_flexibility: 16, planning_preference: 6 },
        typeEffects: { group_mediator: 16, stable_planner: 5 }
      }
    ]
  },
  {
    id: "hotel_tradeoff",
    title: "숙소를 고르는 순간, 가격과 위치가 충돌한다.",
    scene: "중심가 숙소는 비싸고, 외곽 숙소는 저렴하지만 이동이 깁니다.",
    options: [
      {
        id: "central_hotel",
        label: "비싸도 중심가가 편하고 시간을 아낄 수 있어.",
        effects: { comfort_need: 16, budget_sensitivity: -8 },
        typeEffects: { slow_healer: 8, stable_planner: 8 }
      },
      {
        id: "cheap_hotel",
        label: "숙소는 잠만 자니까 외곽이어도 괜찮아.",
        effects: { budget_sensitivity: 18, comfort_need: -10 },
        typeEffects: { budget_strategist: 18 }
      },
      {
        id: "middle_hotel",
        label: "가격이 조금 올라가도 환승 적은 중간 지점이 좋다.",
        effects: { budget_sensitivity: 6, comfort_need: 10, planning_preference: 6 },
        typeEffects: { stable_planner: 10, group_mediator: 6 }
      },
      {
        id: "unique_stay",
        label: "숙소 자체가 예쁘거나 특별하면 위치는 감수 가능해.",
        effects: { photo_mood_importance: 14, comfort_need: 2 },
        typeEffects: { mood_collector: 16 }
      }
    ]
  },
  {
    id: "rainy_day",
    title: "비가 와서 야외 일정이 어려워졌다.",
    scene: "원래 가려던 명소 대신 대안을 골라야 합니다.",
    options: [
      {
        id: "museum",
        label: "실내 전시나 쇼핑몰로 빠르게 대체하자.",
        effects: { planning_preference: 10, comfort_need: 8 },
        typeEffects: { stable_planner: 12 }
      },
      {
        id: "rain_photo",
        label: "비 오는 분위기도 좋으니 사진 잘 나오는 곳을 찾자.",
        effects: { photo_mood_importance: 18, local_experience: 4 },
        typeEffects: { mood_collector: 18 }
      },
      {
        id: "food_tour",
        label: "비 오는 날엔 맛집 투어가 제일 안전하다.",
        effects: { food_interest: 16, comfort_need: 4 },
        typeEffects: { food_radar: 16 }
      },
      {
        id: "hotel_rest",
        label: "일정을 줄이고 숙소에서 쉬는 것도 여행이다.",
        effects: { rest_vs_activity: -18, comfort_need: 14 },
        typeEffects: { slow_healer: 18 }
      }
    ]
  },
  {
    id: "hidden_place",
    title: "현지인이 추천한 작은 장소가 있다.",
    scene: "평점은 많지 않지만 분위기가 좋아 보입니다.",
    options: [
      {
        id: "try_local",
        label: "이런 게 여행이지. 가보자.",
        effects: { local_experience: 18, planning_preference: -8 },
        typeEffects: { local_diver: 18 }
      },
      {
        id: "check_reviews",
        label: "후기와 동선을 확인하고 괜찮으면 가자.",
        effects: { planning_preference: 12, local_experience: 5 },
        typeEffects: { stable_planner: 10, local_diver: 5 }
      },
      {
        id: "classic_first",
        label: "처음 가는 곳이면 대표 코스가 더 안전해.",
        effects: { planning_preference: 10, local_experience: -10 },
        typeEffects: { stable_planner: 12 }
      },
      {
        id: "ask_group",
        label: "다들 끌리면 가고, 아니면 무리하지 말자.",
        effects: { conflict_flexibility: 16 },
        typeEffects: { group_mediator: 18 }
      }
    ]
  },
  {
    id: "photo_delay",
    title: "한 명이 사진을 오래 찍고 싶어 한다.",
    scene: "다음 예약 시간까지 여유가 많지는 않습니다.",
    options: [
      {
        id: "photo_time",
        label: "여행 기억이니까 사진 시간은 충분히 줘야지.",
        effects: { photo_mood_importance: 18, conflict_flexibility: 8 },
        typeEffects: { mood_collector: 14, group_mediator: 6 }
      },
      {
        id: "time_limit",
        label: "좋은데 15분만 찍고 이동하자.",
        effects: { planning_preference: 12, conflict_flexibility: 8 },
        typeEffects: { stable_planner: 10, group_mediator: 8 }
      },
      {
        id: "skip_photo",
        label: "예약이 더 중요하니까 바로 움직여야 해.",
        effects: { planning_preference: 16, photo_mood_importance: -8 },
        typeEffects: { stable_planner: 14 }
      },
      {
        id: "split_photo",
        label: "찍고 싶은 사람은 남고, 나머지는 먼저 가도 돼.",
        effects: { conflict_flexibility: 18, planning_preference: -4 },
        typeEffects: { group_mediator: 18 }
      }
    ]
  },
  {
    id: "budget_issue",
    title: "예상보다 항공권이 15만원 비싸졌다.",
    scene: "여행지는 마음에 들지만 예산을 다시 봐야 합니다.",
    options: [
      {
        id: "change_destination",
        label: "예산이 중요하니까 여행지 후보를 다시 보자.",
        effects: { budget_sensitivity: 18, planning_preference: 8 },
        typeEffects: { budget_strategist: 18 }
      },
      {
        id: "save_elsewhere",
        label: "숙소나 식비를 줄여서 맞추면 되지 않을까?",
        effects: { budget_sensitivity: 12, conflict_flexibility: 8 },
        typeEffects: { budget_strategist: 12, group_mediator: 6 }
      },
      {
        id: "worth_it",
        label: "여행지가 확실히 좋다면 그 정도는 쓸 수 있어.",
        effects: { budget_sensitivity: -14, rest_vs_activity: 4 },
        typeEffects: { active_explorer: 8, mood_collector: 5 }
      },
      {
        id: "compare_dates",
        label: "날짜를 바꿔서 가격을 다시 비교하자.",
        effects: { planning_preference: 16, budget_sensitivity: 10 },
        typeEffects: { stable_planner: 10, budget_strategist: 10 }
      }
    ]
  },
  {
    id: "planning_style",
    title: "출발 전날, 일정표가 아직 느슨하다.",
    scene: "대략적인 후보만 있고 예약은 거의 없습니다.",
    options: [
      {
        id: "make_plan",
        label: "불안하니까 동선과 예약을 정리하고 싶어.",
        effects: { planning_preference: 18, comfort_need: 6 },
        typeEffects: { stable_planner: 18 }
      },
      {
        id: "rough_plan",
        label: "큰 방향만 있으면 현장에서 정해도 괜찮아.",
        effects: { planning_preference: -4, conflict_flexibility: 8 },
        typeEffects: { group_mediator: 8, local_diver: 5 }
      },
      {
        id: "no_plan",
        label: "그때그때 끌리는 대로 가는 게 더 재밌어.",
        effects: { planning_preference: -18, local_experience: 10 },
        typeEffects: { local_diver: 12, active_explorer: 6 }
      },
      {
        id: "must_book_food",
        label: "다른 건 몰라도 맛집 예약은 해두자.",
        effects: { food_interest: 16, planning_preference: 8 },
        typeEffects: { food_radar: 16, stable_planner: 5 }
      }
    ]
  },
  {
    id: "group_conflict",
    title: "한 명은 쇼핑, 한 명은 자연, 한 명은 맛집을 원한다.",
    scene: "하루 안에 모두 넣기는 어렵습니다.",
    options: [
      {
        id: "one_each",
        label: "각자 원하는 걸 하나씩 넣는 균형안이 좋다.",
        effects: { conflict_flexibility: 18, planning_preference: 6 },
        typeEffects: { group_mediator: 20 }
      },
      {
        id: "vote",
        label: "가장 많은 사람이 원하는 걸 우선하자.",
        effects: { conflict_flexibility: 4, planning_preference: 8 },
        typeEffects: { stable_planner: 6 }
      },
      {
        id: "split",
        label: "오후에는 취향별로 나눠서 움직이자.",
        effects: { conflict_flexibility: 14, local_experience: 4 },
        typeEffects: { group_mediator: 14 }
      },
      {
        id: "my_pick",
        label: "이번 여행에서 내가 가장 기대한 일정은 꼭 넣고 싶다.",
        effects: { conflict_flexibility: -8, rest_vs_activity: 6 },
        typeEffects: { active_explorer: 8, mood_collector: 4 }
      }
    ]
  },
  {
    id: "souvenir_time",
    title: "마지막 날 시간이 애매하게 남았다.",
    scene: "공항 가기 전 2~3시간 정도 여유가 있습니다.",
    options: [
      {
        id: "souvenir",
        label: "기념품과 쇼핑을 여유롭게 마무리하고 싶어.",
        effects: { comfort_need: 6, planning_preference: 6 },
        typeEffects: { stable_planner: 5, group_mediator: 4 }
      },
      {
        id: "last_food",
        label: "마지막 한 끼를 제대로 먹고 가야지.",
        effects: { food_interest: 16 },
        typeEffects: { food_radar: 16 }
      },
      {
        id: "last_photo",
        label: "마지막 사진 남길 수 있는 장소를 가고 싶어.",
        effects: { photo_mood_importance: 16 },
        typeEffects: { mood_collector: 16 }
      },
      {
        id: "airport_early",
        label: "변수 생기면 싫으니까 공항에 일찍 가자.",
        effects: { planning_preference: 14, comfort_need: 8 },
        typeEffects: { stable_planner: 12, slow_healer: 4 }
      }
    ]
  },
  {
    id: "best_memory",
    title: "여행이 끝났을 때 가장 기억에 남았으면 하는 건?",
    scene: "이번 여행의 만족도를 결정하는 장면을 상상해봅니다.",
    options: [
      {
        id: "rested",
        label: "잘 쉬고 온 느낌.",
        effects: { rest_vs_activity: -16, comfort_need: 10 },
        typeEffects: { slow_healer: 18 }
      },
      {
        id: "many_places",
        label: "정말 알차게 많이 보고 온 느낌.",
        effects: { rest_vs_activity: 18 },
        typeEffects: { active_explorer: 18 }
      },
      {
        id: "best_meal",
        label: "아직도 생각나는 한 끼.",
        effects: { food_interest: 18 },
        typeEffects: { food_radar: 18 }
      },
      {
        id: "group_happy",
        label: "같이 간 사람들이 모두 만족한 분위기.",
        effects: { conflict_flexibility: 18 },
        typeEffects: { group_mediator: 18 }
      }
    ]
  }
];

export function scoreQuiz(answers: Record<string, string>): QuizScores {
  const scores = { ...defaultScores };
  for (const question of quizQuestions) {
    const option = question.options.find((item) => item.id === answers[question.id]);
    if (!option) continue;
    for (const [axis, delta] of Object.entries(option.effects) as Array<[QuizAxis, number]>) {
      scores[axis] = clamp(scores[axis] + delta);
    }
  }
  return scores;
}

export function scoreTravelerTypes(answers: Record<string, string>): Record<TravelerTypeId, number> {
  const scores = { ...defaultTypeScores };
  for (const question of quizQuestions) {
    const option = question.options.find((item) => item.id === answers[question.id]);
    if (!option) continue;
    for (const [type, delta] of Object.entries(option.typeEffects) as Array<[TravelerTypeId, number]>) {
      scores[type] = clamp(scores[type] + delta);
    }
  }
  return scores;
}

export function buildTravelTypeResult(answers: Record<string, string>): TravelTypeResult {
  const axisScores = scoreQuiz(answers);
  const typeScores = scoreTravelerTypes(answers);
  const ranked = (Object.entries(typeScores) as Array<[TravelerTypeId, number]>).sort((a, b) => b[1] - a[1]);
  const primaryId = ranked[0]?.[0] || "group_mediator";
  const secondaryId = ranked[1]?.[0] || "stable_planner";
  const primary = travelerTypes[primaryId];
  const secondary = travelerTypes[secondaryId];

  return {
    primaryType: primary.label,
    secondaryType: secondary.label,
    oneLineSummary: `${primary.summary}. 보조 성향으로는 ${secondary.label} 기질도 보입니다.`,
    strengths: [...primary.strengths, secondary.strengths[0]].slice(0, 3),
    riskFactors: [...primary.riskFactors, secondary.riskFactors[0]].slice(0, 2),
    preferredDecisionStyle: primary.decisionStyle,
    typeScores,
    axisScores
  };
}

export function describeScores(scores: QuizScores) {
  const traits: string[] = [];
  traits.push(scores.rest_vs_activity > 65 ? "활동적인 일정 선호" : scores.rest_vs_activity < 40 ? "휴식 중심 선호" : "균형 일정 선호");
  traits.push(scores.food_interest > 65 ? "미식 중요도 높음" : "식사는 동선 우선");
  traits.push(scores.budget_sensitivity > 65 ? "예산 민감" : "경험 가치 지불 가능");
  traits.push(scores.comfort_need > 65 ? "편의와 숙소 컨디션 중시" : "불편함 일부 감수 가능");
  traits.push(scores.planning_preference > 65 ? "계획 선호" : "자유 일정 선호");
  traits.push(scores.local_experience > 65 ? "로컬 경험 선호" : "대표 코스 선호");
  traits.push(scores.photo_mood_importance > 65 ? "사진과 분위기 중시" : "기록보다 경험 중시");
  traits.push(scores.conflict_flexibility > 65 ? "조율과 절충에 강함" : "자기 선호가 분명함");
  return traits;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
