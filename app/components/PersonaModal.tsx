"use client";

import { useState } from "react";
import { buildTravelTypeResult, describeScores, quizQuestions, scoreQuiz } from "@/lib/quiz";
import type { Persona } from "@/lib/travel";

type Props = {
  folderId: string;
  onConfirm: (folderId: string, persona: Persona) => void;
  onClose: () => void;
};

type BasicInfo = {
  gender: string;
  ageGroup: string;
  relationship: string;
};

type PersonalNotes = {
  personalRequests: string;
  healthNote: string;
  foodNote: string;
  mobilityNote: string;
};

function compactList(values: string[], fallback: string[]) {
  const clean = values.map((value) => value.trim()).filter(Boolean);
  return clean.length ? clean : fallback;
}

function createTestPersona(name: string, basicInfo: BasicInfo, notes: PersonalNotes, quizAnswers: Record<string, string>): Persona {
  const cleanName = name.trim() || "나";
  const quizScores = scoreQuiz(quizAnswers);
  const result = buildTravelTypeResult(quizAnswers);
  const traits = describeScores(quizScores);
  const active = quizScores.rest_vs_activity > 65;
  const budget = quizScores.budget_sensitivity > 65;
  const comfort = quizScores.comfort_need > 65;
  const food = quizScores.food_interest > 65;
  const planning = quizScores.planning_preference > 65;
  const local = quizScores.local_experience > 65;
  const mood = quizScores.photo_mood_importance > 65;
  const mediator = quizScores.conflict_flexibility > 65;

  const constraints = compactList(
    [
      notes.personalRequests && `꼭 반영할 개인 요청: ${notes.personalRequests}`,
      notes.healthNote && `체력/건강: ${notes.healthNote}`,
      notes.foodNote && `음식: ${notes.foodNote}`,
      notes.mobilityNote && `이동: ${notes.mobilityNote}`,
      budget ? "예산 초과에는 근거가 필요함" : "",
      comfort ? "이동과 숙소의 편안함을 중요하게 봄" : ""
    ],
    ["개인 요청과 테스트 결과를 함께 기준으로 삼음"]
  );

  const priorities = compactList(
    [
      notes.personalRequests,
      active ? "알찬 활동 밀도" : "무리 없는 휴식 균형",
      food ? "기억에 남는 식사" : "",
      mood ? "사진과 분위기 좋은 장면" : "",
      local ? "현지 분위기가 느껴지는 장소" : "",
      planning ? "예약과 동선 안정성" : "",
      mediator ? "동행자 모두가 납득하는 균형" : ""
    ],
    ["내 취향이 반영된 여행"]
  ).slice(0, 5);

  return {
    id: `persona-me-${Date.now()}`,
    participantId: `me-${Date.now()}`,
    displayName: cleanName,
    summary: `${cleanName}은 ${result.primaryType}을 주유형, ${result.secondaryType}을 보조유형으로 가진 여행 페르소나입니다. ${result.oneLineSummary}`,
    preferences: compactList([...traits, `${result.primaryType} 주유형`, `${result.secondaryType} 보조유형`], ["여행 만족도"]),
    constraints,
    priorities,
    decisionPolicy: `${result.preferredDecisionStyle} 기본 정보는 ${basicInfo.ageGroup || "나이대 미입력"} ${basicInfo.gender || "성별 미입력"}, 관계는 ${basicInfo.relationship || "나"}로 반영한다. 개인 요청, 체력, 음식, 이동 제약이 충돌하면 개인 요청과 건강/이동 제약을 우선 확인한다.`,
    conversationStyle: mediator
      ? "부드럽게 조율하되 내 핵심 요청은 분명히 말한다."
      : active
        ? "원하는 활동을 솔직하고 빠르게 제안한다."
        : "현실적인 피로도와 만족도를 차분하게 설명한다.",
    representationScore: 92
  };
}

export default function PersonaModal({ folderId, onConfirm, onClose }: Props) {
  const [name, setName] = useState("나");
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({ gender: "", ageGroup: "", relationship: "나" });
  const [notes, setNotes] = useState<PersonalNotes>({
    personalRequests: "",
    healthNote: "",
    foodNote: "",
    mobilityNote: ""
  });
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});

  const answeredCount = Object.keys(quizAnswers).length;
  const result = answeredCount > 0 ? buildTravelTypeResult(quizAnswers) : null;
  const answered = quizQuestions.every((question) => quizAnswers[question.id]);
  const basicReady = Boolean(name.trim() && basicInfo.gender && basicInfo.ageGroup && basicInfo.relationship);
  const canSubmit = answered && basicReady;

  function updateBasicInfo(key: keyof BasicInfo, value: string) {
    setBasicInfo((prev) => ({ ...prev, [key]: value }));
  }

  function updateNotes(key: keyof PersonalNotes, value: string) {
    setNotes((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    if (!canSubmit) return;
    onConfirm(folderId, createTestPersona(name, basicInfo, notes, quizAnswers));
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">내 페르소나 만들기</h2>
            <p className="modal-subtitle">12문항 검사 결과와 개인 정보를 함께 반영합니다.</p>
          </div>
          <button className="modal-close" onClick={onClose} type="button" aria-label="닫기">
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <p className="modal-section-label">기본 정보</p>
            <div className="field">
              <label>이름 또는 별칭</label>
              <input
                className="input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="나"
              />
            </div>
            <div className="modal-grid-3">
              <div className="field">
                <label>성별</label>
                <select className="input modal-select" value={basicInfo.gender} onChange={(event) => updateBasicInfo("gender", event.target.value)}>
                  <option value="">선택</option>
                  <option>여성</option>
                  <option>남성</option>
                  <option>기타</option>
                  <option>응답 안 함</option>
                </select>
              </div>
              <div className="field">
                <label>나이대</label>
                <select className="input modal-select" value={basicInfo.ageGroup} onChange={(event) => updateBasicInfo("ageGroup", event.target.value)}>
                  <option value="">선택</option>
                  <option>10대</option>
                  <option>20대</option>
                  <option>30대</option>
                  <option>40대</option>
                  <option>50대 이상</option>
                </select>
              </div>
              <div className="field">
                <label>관계</label>
                <select className="input modal-select" value={basicInfo.relationship} onChange={(event) => updateBasicInfo("relationship", event.target.value)}>
                  <option value="">선택</option>
                  <option>나</option>
                  <option>친구</option>
                  <option>가족</option>
                  <option>연인</option>
                  <option>동료</option>
                  <option>기타</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-divider" />

          <div className="modal-section">
            <p className="modal-section-label">개인적으로 중요한 것</p>
            <div className="field">
              <label>꼭 원하는 것, 피하고 싶은 것, 양보하기 어려운 것</label>
              <textarea
                className="input"
                value={notes.personalRequests}
                onChange={(event) => updateNotes("personalRequests", event.target.value)}
                placeholder="예: 야경 좋은 곳은 꼭 가고 싶고, 너무 이른 아침 일정은 피하고 싶어"
                rows={3}
                style={{ resize: "vertical" }}
              />
            </div>
            <div className="modal-grid-3">
              <div className="field">
                <label>체력/건강</label>
                <textarea className="input" value={notes.healthNote} onChange={(event) => updateNotes("healthNote", event.target.value)} placeholder="예: 오래 걷는 건 조금 힘들어" rows={3} />
              </div>
              <div className="field">
                <label>음식</label>
                <textarea className="input" value={notes.foodNote} onChange={(event) => updateNotes("foodNote", event.target.value)} placeholder="예: 매운 음식은 잘 못 먹어" rows={3} />
              </div>
              <div className="field">
                <label>이동</label>
                <textarea className="input" value={notes.mobilityNote} onChange={(event) => updateNotes("mobilityNote", event.target.value)} placeholder="예: 환승 많은 일정은 싫어" rows={3} />
              </div>
            </div>
          </div>

          <div className="modal-divider" />

          <div className="modal-section">
            <div className="quiz-header-row">
              <p className="modal-section-label" style={{ margin: 0 }}>여행 성향 검사</p>
              <span className="quiz-count">{answeredCount}/{quizQuestions.length}</span>
            </div>
            <div className="quiz-progress-wrap">
              <div className="quiz-progress-fill" style={{ width: `${(answeredCount / quizQuestions.length) * 100}%` }} />
            </div>
            <div className="quiz-list">
              {quizQuestions.map((question, index) => (
                <div className={`quiz-question ${quizAnswers[question.id] ? "answered" : ""}`} key={question.id}>
                  <div className="quiz-num">{index + 1}</div>
                  <div className="quiz-content">
                    <p className="quiz-situation">{question.title}</p>
                    <p className="quiz-context">{question.scene}</p>
                    <div className="quiz-options">
                      {question.options.map((option) => (
                        <button
                          className={`quiz-option ${quizAnswers[question.id] === option.id ? "selected" : ""}`}
                          key={option.id}
                          onClick={() => setQuizAnswers((prev) => ({ ...prev, [question.id]: option.id }))}
                          type="button"
                        >
                          <span className="quiz-option-dot" />
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-divider" />

          <div className="modal-section">
            <p className="modal-section-label">검사 결과</p>
            {!result && <p className="quiz-result-hint">문항에 답하면 여행자 타입이 만들어집니다.</p>}
            {result && (
              <div className="quiz-result-grid">
                <div className="travel-type-card">
                  <div>
                    <span className="travel-type-label">주유형: {result.primaryType}</span>
                    <p className="travel-type-desc">{result.oneLineSummary}</p>
                  </div>
                </div>
                <div className="travel-type-card travel-type-card-secondary">
                  <div>
                    <span className="travel-type-label">보조유형: {result.secondaryType}</span>
                    <p className="travel-type-desc">{result.preferredDecisionStyle}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <span className="quiz-footer-count">{canSubmit ? "저장 준비 완료" : "기본 정보와 12문항을 완료해 주세요"}</span>
          <div className="button-row">
            <button className="btn btn-secondary" onClick={onClose} type="button">취소</button>
            <button className="btn btn-primary" disabled={!canSubmit} onClick={handleSubmit} type="button">
              내 페르소나 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
