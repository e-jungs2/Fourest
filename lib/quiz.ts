import type { QuizAxis, QuizScores } from "./types";

export const defaultScores: QuizScores = {
  rest_vs_activity: 50,
  food_interest: 50,
  budget_sensitivity: 50,
  comfort_need: 50,
  planning_preference: 50,
  local_experience: 50
};

export const quizQuestions: Array<{
  id: string;
  axis: QuizAxis;
  title: string;
  options: Array<{ id: string; label: string; score: number }>;
}> = [
  {
    id: "pace",
    axis: "rest_vs_activity",
    title: "여행 하루가 어떻게 흘러가면 좋나요?",
    options: [
      { id: "rest", label: "자유롭게 쉬는 시간이 꼭 있어야 해요", score: 25 },
      { id: "balanced", label: "핵심 일정과 휴식이 반반이면 좋아요", score: 55 },
      { id: "active", label: "하루를 꽉 채워 움직이고 싶어요", score: 85 }
    ]
  },
  {
    id: "food",
    axis: "food_interest",
    title: "맛집은 여행에서 어느 정도 중요한가요?",
    options: [
      { id: "simple", label: "동선에 맞으면 충분해요", score: 30 },
      { id: "nice", label: "하루 한 끼는 괜찮은 곳이면 좋겠어요", score: 65 },
      { id: "core", label: "맛집이 여행의 핵심이에요", score: 95 }
    ]
  },
  {
    id: "budget",
    axis: "budget_sensitivity",
    title: "예산은 어떻게 쓰고 싶나요?",
    options: [
      { id: "save", label: "가능하면 아끼고 싶어요", score: 90 },
      { id: "balanced", label: "가성비가 좋으면 괜찮아요", score: 60 },
      { id: "spend", label: "만족도가 높다면 더 쓸 수 있어요", score: 25 }
    ]
  },
  {
    id: "comfort",
    axis: "comfort_need",
    title: "이동과 숙소에서 가장 중요한 것은?",
    options: [
      { id: "cheap", label: "저렴하면 조금 불편해도 괜찮아요", score: 25 },
      { id: "clean", label: "깔끔하고 이동이 무난하면 좋아요", score: 60 },
      { id: "easy", label: "편한 동선과 숙소 컨디션이 중요해요", score: 90 }
    ]
  },
  {
    id: "planning",
    axis: "planning_preference",
    title: "일정은 어느 정도 정해져 있으면 좋나요?",
    options: [
      { id: "free", label: "현장에서 자유롭게 정하고 싶어요", score: 25 },
      { id: "outline", label: "큰 흐름만 있으면 좋아요", score: 55 },
      { id: "planned", label: "미리 정리된 일정이 마음 편해요", score: 88 }
    ]
  },
  {
    id: "local",
    axis: "local_experience",
    title: "여행지에서는 어떤 경험을 선호하나요?",
    options: [
      { id: "classic", label: "대표 명소와 안정적인 코스", score: 30 },
      { id: "mix", label: "대표 코스와 로컬 경험을 적당히", score: 65 },
      { id: "local", label: "현지인처럼 골목과 로컬 장소를 즐기기", score: 92 }
    ]
  }
];

export function scoreQuiz(answers: Record<string, string>): QuizScores {
  const scores = { ...defaultScores };
  for (const question of quizQuestions) {
    const option = question.options.find((item) => item.id === answers[question.id]);
    if (option) scores[question.axis] = option.score;
  }
  return scores;
}

export function describeScores(scores: QuizScores) {
  const traits: string[] = [];
  traits.push(scores.rest_vs_activity > 70 ? "활동적인 일정 선호" : scores.rest_vs_activity < 40 ? "휴식 중심 선호" : "균형 일정 선호");
  traits.push(scores.food_interest > 70 ? "미식 중요도가 높음" : "식사는 동선 우선");
  traits.push(scores.budget_sensitivity > 70 ? "예산 민감" : "경험 가치에 지불 가능");
  traits.push(scores.comfort_need > 70 ? "편한 동선과 숙소 컨디션 중시" : "불편함 감수 가능");
  traits.push(scores.planning_preference > 70 ? "계획 선호" : "자유 일정 선호");
  traits.push(scores.local_experience > 70 ? "로컬 경험 선호" : "대표 코스 선호");
  return traits;
}
