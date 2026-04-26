"use client";

import { useState } from "react";
import type { Persona } from "@/lib/travel";

/* ── Quiz Data ───────────────────────────────────────────── */

const QUESTIONS = [
  {
    id: "q1", num: 1,
    situation: "여행 둘째 날 아침, 친구가 '오늘은 쉬엄쉬엄 가자'고 말한다.",
    context: "어제 많이 걸어서 모두가 살짝 지친 상황입니다.",
    options: [
      "좋아, 카페부터 가고 컨디션 보고 움직이자.",
      "쉬는 건 좋은데 예약해둔 한 곳은 가고 싶어.",
      "여기까지 왔는데 아침부터 움직여야지.",
      "그럼 오전은 각자 자유시간 갖고 점심에 만나자.",
    ],
  },
  {
    id: "q2", num: 2,
    situation: "일정표에 빈 시간이 3시간 생겼다.",
    context: "숙소 체크인 전까지 애매하게 시간이 남았습니다.",
    options: [
      "근처 대표 명소 하나는 찍고 가자.",
      "분위기 좋은 카페나 포토 스팟을 찾자.",
      "관광지 말고 골목을 걸으며 현지 분위기를 보자.",
      "짐도 있고 피곤하니까 근처에서 쉬자.",
    ],
  },
  {
    id: "q3", num: 3,
    situation: "저녁 식당을 정해야 하는데 후보가 갈립니다.",
    context: "한 곳은 유명 맛집이지만 웨이팅이 길고, 한 곳은 숙소 근처입니다.",
    options: [
      "기다려도 유명 맛집은 가볼 가치가 있어.",
      "숙소 근처에서 맛 괜찮은 곳을 찾는 게 낫다.",
      "가격과 평점이 적당한 곳이면 충분하다.",
      "오늘은 가까운 곳, 내일은 유명 맛집으로 나누자.",
    ],
  },
  {
    id: "q4", num: 4,
    situation: "숙소를 고르는 순간, 가격과 위치가 충돌한다.",
    context: "중심가 숙소는 비싸고, 외곽 숙소는 저렴하지만 이동이 깁니다.",
    options: [
      "비싸도 중심가가 편하고 시간을 아낄 수 있어.",
      "숙소는 잠만 자니까 외곽이어도 괜찮아.",
      "가격이 조금 올라가도 환승 적은 중간 지점이 좋다.",
      "숙소 자체가 예쁘거나 특별하면 위치는 감수 가능해.",
    ],
  },
  {
    id: "q5", num: 5,
    situation: "비가 와서 야외 일정이 어려워졌다.",
    context: "원래 가려던 명소 대신 대안을 골라야 합니다.",
    options: [
      "실내 전시나 쇼핑몰로 빠르게 대체하자.",
      "비 오는 분위기도 좋으니 사진 잘 나오는 곳을 찾자.",
      "비 오는 날엔 맛집 투어가 제일 안전하다.",
      "일정을 줄이고 숙소에서 쉬는 것도 여행이다.",
    ],
  },
  {
    id: "q6", num: 6,
    situation: "현지인이 추천한 작은 장소가 있다.",
    context: "평점은 많지 않지만 분위기가 좋아 보입니다.",
    options: [
      "이런 게 여행이지. 가보자.",
      "후기와 동선을 확인하고 괜찮으면 가자.",
      "처음 가는 곳이면 대표 코스가 더 안전해.",
      "다들 끌리면 가고, 아니면 무리하지 말자.",
    ],
  },
  {
    id: "q7", num: 7,
    situation: "한 명이 사진을 오래 찍고 싶어 한다.",
    context: "다음 예약 시간까지 여유가 많지는 않습니다.",
    options: [
      "여행 기억이니까 사진 시간은 충분히 줘야지.",
      "좋은데 15분만 찍고 이동하자.",
      "예약이 더 중요하니까 바로 움직여야 해.",
      "찍고 싶은 사람은 남고, 나머지는 먼저 가도 돼.",
    ],
  },
  {
    id: "q8", num: 8,
    situation: "예상보다 항공권이 15만원 비싸졌다.",
    context: "여행지는 마음에 들지만 예산을 다시 봐야 합니다.",
    options: [
      "예산이 중요하니까 여행지 후보를 다시 보자.",
      "숙소나 식비를 줄여서 맞추면 되지 않을까?",
      "여행지가 확실히 좋다면 그 정도는 쓸 수 있어.",
      "날짜를 바꿔서 가격을 다시 비교하자.",
    ],
  },
  {
    id: "q9", num: 9,
    situation: "출발 전날, 일정표가 아직 느슨하다.",
    context: "대략적인 후보만 있고 예약은 거의 없습니다.",
    options: [
      "불안하니까 동선과 예약을 정리하고 싶어.",
      "큰 방향만 있으면 현장에서 정해도 괜찮아.",
      "그때그때 끌리는 대로 가는 게 더 재밌어.",
      "다른 건 몰라도 맛집 예약은 해두자.",
    ],
  },
  {
    id: "q10", num: 10,
    situation: "한 명은 쇼핑, 한 명은 자연, 한 명은 맛집을 원한다.",
    context: "하루 안에 모두 넣기는 어렵습니다.",
    options: [
      "각자 원하는 걸 하나씩 넣는 균형안이 좋다.",
      "가장 많은 사람이 원하는 걸 우선하자.",
      "오후에는 취향별로 나눠서 움직이자.",
      "이번 여행에서 내가 가장 기대한 일정은 꼭 넣고 싶다.",
    ],
  },
  {
    id: "q11", num: 11,
    situation: "마지막 날 시간이 애매하게 남았다.",
    context: "공항 가기 전 2~3시간 정도 여유가 있습니다.",
    options: [
      "기념품과 쇼핑을 여유롭게 마무리하고 싶어.",
      "마지막 한 끼를 제대로 먹고 가야지.",
      "마지막 사진 남길 수 있는 장소를 가고 싶어.",
      "변수 생기면 싫으니까 공항에 일찍 가자.",
    ],
  },
  {
    id: "q12", num: 12,
    situation: "여행이 끝났을 때 가장 기억에 남았으면 하는 건?",
    context: "이번 여행의 만족도를 결정하는 장면을 상상해봅니다.",
    options: [
      "잘 쉬고 온 느낌.",
      "정말 알차게 많이 보고 온 느낌.",
      "아직도 생각나는 한 끼.",
      "같이 간 사람들이 모두 만족한 분위기.",
    ],
  },
];

/* ── Travel type ─────────────────────────────────────────── */

type TravelType = { label: string; emoji: string; description: string; key: string };

const TRAVEL_TYPES: Record<string, TravelType> = {
  미식: { key: "미식", label: "미식 탐험가", emoji: "🍽️", description: "맛있는 경험이 여행의 핵심. 맛집 리스트는 출발 전에 이미 완성되어 있다." },
  계획: { key: "계획", label: "계획형 여행자", emoji: "📋", description: "동선과 예약이 확실해야 마음이 편하다. 여행 준비 자체도 즐긴다." },
  즉흥: { key: "즉흥", label: "즉흥형 모험가", emoji: "🎲", description: "계획보다 현장 분위기. 예상 밖의 발견이 최고의 여행을 만든다." },
  여유: { key: "여유", label: "여유파 힐러", emoji: "☀️", description: "억지로 많이 보는 것보다 한 곳에서 깊게 쉬는 게 진짜 여행." },
  균형: { key: "균형", label: "균형형 조율자", emoji: "⚖️", description: "누구와 가도 잘 맞춘다. 모두가 만족할 수 있는 중간지점을 찾는 재능." },
};

function determineTravelType(answers: Record<string, number>): TravelType {
  const s = { 미식: 0, 계획: 0, 즉흥: 0, 여유: 0, 균형: 0 };
  const a = answers;

  // Q1 pacing
  if (a.q1 === 0) s.균형++; if (a.q1 === 1) s.계획++; if (a.q1 === 2) s.즉흥++; if (a.q1 === 3) s.여유++;
  // Q2 exploration
  if (a.q2 === 0) s.계획++; if (a.q2 === 1) s.즉흥++; if (a.q2 === 2) s.즉흥++; if (a.q2 === 3) s.여유++;
  // Q3 dining
  if (a.q3 === 0) s.미식++; if (a.q3 === 1) s.여유++; if (a.q3 === 2) s.균형++; if (a.q3 === 3) s.균형++;
  // Q4 accommodation
  if (a.q4 === 0) s.계획++; if (a.q4 === 1) s.여유++; if (a.q4 === 2) s.균형++; if (a.q4 === 3) s.즉흥++;
  // Q5 weather
  if (a.q5 === 0) s.계획++; if (a.q5 === 1) s.즉흥++; if (a.q5 === 2) s.미식++; if (a.q5 === 3) s.여유++;
  // Q6 spontaneity
  if (a.q6 === 0) s.즉흥++; if (a.q6 === 1) s.계획++; if (a.q6 === 2) s.계획++; if (a.q6 === 3) s.균형++;
  // Q7 time
  if (a.q7 === 0) s.균형++; if (a.q7 === 1) s.균형++; if (a.q7 === 2) s.계획++; if (a.q7 === 3) s.즉흥++;
  // Q8 budget
  if (a.q8 === 0) s.계획++; if (a.q8 === 1) s.균형++; if (a.q8 === 2) s.즉흥++; if (a.q8 === 3) s.계획++;
  // Q9 planning
  if (a.q9 === 0) s.계획++; if (a.q9 === 1) s.균형++; if (a.q9 === 2) s.즉흥++; if (a.q9 === 3) s.미식++;
  // Q10 group
  if (a.q10 === 0) s.균형++; if (a.q10 === 1) s.균형++; if (a.q10 === 2) s.즉흥++; if (a.q10 === 3) s.즉흥++;
  // Q11 closure
  if (a.q11 === 0) s.계획++; if (a.q11 === 1) s.미식++; if (a.q11 === 2) s.즉흥++; if (a.q11 === 3) s.계획++;
  // Q12 value
  if (a.q12 === 0) s.여유++; if (a.q12 === 1) s.계획++; if (a.q12 === 2) s.미식++; if (a.q12 === 3) s.균형++;

  const top = (Object.entries(s).sort(([, a], [, b]) => b - a)[0][0]) as keyof typeof TRAVEL_TYPES;
  return TRAVEL_TYPES[top];
}

/* ── Persona builder ─────────────────────────────────────── */

function buildPersona(
  name: string, gender: string, age: string,
  important: string,
  answers: Record<string, number>
): Persona {
  const type = determineTravelType(answers);
  const k = type.key;

  const preferences: string[] = [];
  const isFoodie = [answers.q3, answers.q5, answers.q11, answers.q12].filter((v) => v === 0 || v === 2).length >= 2;
  const isPlanner = [answers.q1, answers.q6, answers.q9].filter((v) => v === 0 || v === 1).length >= 2;
  const isRelaxed = [answers.q1, answers.q2, answers.q12].filter((v) => v === 3).length >= 2;
  if (isFoodie) preferences.push("맛집 탐방");
  if (isPlanner) preferences.push("계획된 동선");
  if (isRelaxed) preferences.push("여유로운 페이스");
  if (preferences.length === 0) preferences.push("균형 잡힌 여행");

  const constraints: string[] = [];
  if ([answers.q4, answers.q8].filter((v) => v === 0 || v === 1).length >= 1) constraints.push("예산 초과 주의");
  if (!constraints.length) constraints.push("특별한 제약 없음");

  const priorities: string[] = [];
  if (important) priorities.push(important);
  if (!priorities.length) priorities.push(`${type.label} 스타일 유지`);

  const decisionPolicies: Record<string, string> = {
    미식: "음식 선택에 있어서는 타협하지 않고, 나머지는 유연하게 조율한다.",
    계획: "사전 예약과 동선을 중시하며 효율적으로 결정한다.",
    즉흥: "현장 분위기와 직감을 따르며, 예상치 못한 선택도 즐긴다.",
    여유: "무리한 일정보다 컨디션을 우선하며 여유 있게 결정한다.",
    균형: "모두의 의견을 고려해 최선의 중간지점을 찾는다.",
  };

  const convStyles: Record<string, string> = {
    미식: "음식 관련 제안엔 적극적으로 의견 제시",
    계획: "근거와 대안을 함께 제시하는 편",
    즉흥: "빠르게 반응하고 새로운 아이디어를 던짐",
    여유: "강하게 주장하기보단 분위기에 맞춤",
    균형: "중재자 역할을 자처하며 조율함",
  };

  const ageLabel = age ? `${age}대 ` : "";
  const genderLabel = gender && gender !== "선택 안 함" ? `${gender} · ` : "";

  return {
    id: `persona-${Date.now()}`,
    participantId: `p-${Date.now()}`,
    displayName: name ? `${name} 페르소나` : `${type.emoji} ${type.label}`,
    summary: `${ageLabel}${genderLabel}${type.label}`,
    preferences: preferences.slice(0, 4),
    constraints: constraints.slice(0, 3),
    priorities: priorities.slice(0, 3),
    decisionPolicy: decisionPolicies[k] ?? decisionPolicies["균형"],
    conversationStyle: convStyles[k] ?? convStyles["균형"],
    representationScore: 68 + Math.min(Object.keys(answers).length * 2, 22),
  };
}

/* ── Component ───────────────────────────────────────────── */

type Props = {
  folderId: string;
  onConfirm: (folderId: string, persona: Persona) => void;
  onClose: () => void;
};

export default function PersonaModal({ folderId, onConfirm, onClose }: Props) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [important, setImportant] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === QUESTIONS.length;
  const travelType = allAnswered ? determineTravelType(answers) : null;

  function handleSubmit() {
    if (!allAnswered) return;
    onConfirm(folderId, buildPersona(name, gender, age, important, answers));
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">

        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">페르소나 만들기</h2>
            <p className="modal-subtitle">답변을 기반으로 여행 페르소나가 생성됩니다.</p>
          </div>
          <button className="modal-close" onClick={onClose} type="button">✕</button>
        </div>

        {/* Body */}
        <div className="modal-body">

          {/* Section 1: Basic Info */}
          <div className="modal-section">
            <p className="modal-section-label">기본 정보</p>
            <div className="modal-grid-3">
              <div className="field">
                <label>이름 / 별칭</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 민준" />
              </div>
              <div className="field">
                <label>성별</label>
                <select className="input modal-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">선택 안 함</option>
                  <option value="남성">남성</option>
                  <option value="여성">여성</option>
                  <option value="기타">기타</option>
                </select>
              </div>
              <div className="field">
                <label>나이대</label>
                <select className="input modal-select" value={age} onChange={(e) => setAge(e.target.value)}>
                  <option value="">선택 안 함</option>
                  <option value="10">10대</option>
                  <option value="20">20대</option>
                  <option value="30">30대</option>
                  <option value="40">40대</option>
                  <option value="50">50대+</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>개인적으로 중요한 것</label>
              <textarea
                className="input"
                value={important}
                onChange={(e) => setImportant(e.target.value)}
                placeholder={"원하는 것 · 피하고 싶은 것 · 양보하고 싶은 것을 자유롭게 적어주세요\n예: 오션뷰 카페는 꼭, 긴 줄 웨이팅은 힘들고, 아침 늦잠은 양보 못해"}
                rows={3}
                style={{ resize: "none" }}
              />
            </div>
          </div>

          <div className="modal-divider" />

          {/* Section 2: Quiz */}
          <div className="modal-section">
            <div className="quiz-header-row">
              <p className="modal-section-label">여행 상황 테스트</p>
              <span className="quiz-count">{answeredCount} / {QUESTIONS.length}</span>
            </div>
            <div className="quiz-progress-wrap">
              <div className="quiz-progress-fill" style={{ width: `${(answeredCount / QUESTIONS.length) * 100}%` }} />
            </div>

            <div className="quiz-list">
              {QUESTIONS.map((q) => {
                const isAnswered = answers[q.id] !== undefined;
                return (
                  <div key={q.id} className={`quiz-question ${isAnswered ? "answered" : ""}`}>
                    <div className="quiz-num">{q.num}</div>
                    <div className="quiz-content">
                      <p className="quiz-situation">{q.situation}</p>
                      <p className="quiz-context">{q.context}</p>
                      <div className="quiz-options">
                        {q.options.map((opt, i) => (
                          <button
                            key={i}
                            className={`quiz-option ${answers[q.id] === i ? "selected" : ""}`}
                            onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: i }))}
                            type="button"
                          >
                            <span className="quiz-option-dot" />
                            <span>{opt}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Result */}
          {travelType && (
            <>
              <div className="modal-divider" />
              <div className="modal-section">
                <p className="modal-section-label">검사 결과</p>
                <p className="quiz-result-hint">문항에 답하면 여행자 타입이 만들어집니다</p>
                <div className="travel-type-card">
                  <div className="travel-type-emoji">{travelType.emoji}</div>
                  <div>
                    <strong className="travel-type-label">{travelType.label}</strong>
                    <p className="travel-type-desc">{travelType.description}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <span className="quiz-footer-count">{answeredCount}/{QUESTIONS.length} 완료</span>
          <div className="button-row">
            <button className="btn btn-secondary" onClick={onClose} type="button">취소</button>
            <button className="btn btn-primary" disabled={!allAnswered} onClick={handleSubmit} type="button">
              내 페르소나 저장
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
