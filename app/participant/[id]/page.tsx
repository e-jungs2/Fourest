"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { buildTravelTypeResult, quizQuestions, scoreQuiz } from "@/lib/quiz";
import { loadState, saveState } from "@/lib/storage";
import type { AppState, Participant } from "@/lib/types";

const emptyParticipant = (id: string): Participant => ({
  id,
  name: "나",
  basicInfo: {
    gender: "",
    ageGroup: "",
    relationship: "나"
  },
  healthNote: "",
  foodNote: "",
  mobilityNote: "",
  personalRequests: "",
  quizAnswers: {},
  quizScores: scoreQuiz({}),
  travelTypeResult: null,
  completed: false
});

export default function ParticipantPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    const loaded = loadState();
    if (!loaded.session && params.id.startsWith("me_")) {
      const participant = emptyParticipant(params.id);
      const session = {
        id: `profile_${params.id}`,
        destinationStatus: "undecided" as const,
        destination: "",
        departureArea: "",
        scope: "",
        duration: "",
        budget: "",
        requirements: "",
        participants: [participant],
        settings: { maxNegotiationCycles: 5, candidateCount: 3 }
      };
      const next = { ...loaded, session };
      saveState(next);
      setState(next);
      return;
    }
    setState(loaded);
  }, [params.id]);

  const participant = state?.session?.participants.find((item) => item.id === params.id);

  function persistParticipant(updater: (participant: Participant) => Participant) {
    if (!state?.session) return;
    const participants = state.session.participants.map((item) => (item.id === params.id ? updater(item) : item));
    const next = { ...state, session: { ...state.session, participants } };
    setState(next);
    saveState(next);
  }

  function updateBasicInfo(key: keyof Participant["basicInfo"], value: string) {
    persistParticipant((item) => ({
      ...item,
      basicInfo: { ...item.basicInfo, [key]: value }
    }));
  }

  function updateProfile(key: "name" | "healthNote" | "foodNote" | "mobilityNote" | "personalRequests", value: string) {
    persistParticipant((item) => ({ ...item, [key]: value }));
  }

  function answerQuestion(questionId: string, optionId: string) {
    persistParticipant((item) => {
      const quizAnswers = { ...item.quizAnswers, [questionId]: optionId };
      const quizScores = scoreQuiz(quizAnswers);
      return {
        ...item,
        quizAnswers,
        quizScores,
        travelTypeResult: buildTravelTypeResult(quizAnswers)
      };
    });
  }

  function complete() {
    persistParticipant((item) => ({
      ...item,
      travelTypeResult: buildTravelTypeResult(item.quizAnswers),
      completed: true
    }));
    router.push("/workspace");
  }

  if (!state) return <main className="shell">불러오는 중...</main>;
  if (!participant) {
    return (
      <main className="shell">
        <section className="panel">페르소나 테스트 링크를 찾을 수 없습니다.</section>
      </main>
    );
  }

  const answered = quizQuestions.every((question) => participant.quizAnswers[question.id]);
  const basicReady = Boolean(participant.name.trim() && participant.basicInfo.gender && participant.basicInfo.ageGroup && participant.basicInfo.relationship);
  const canComplete = answered && basicReady;
  const result = participant.travelTypeResult;

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <h1>나의 여행 페르소나 만들기</h1>
          <p>이 테스트는 내 페르소나가 여행 회의에서 어떤 기준으로 말할지 정하는 과정입니다.</p>
        </div>
        <button className="btn secondary" onClick={() => router.push("/")}>
          처음으로
        </button>
      </header>

      <div className="grid two">
        <section className="panel">
          <div className="section-title">
            <h2>기본 정보</h2>
            <span className="pill">페르소나 기본값</span>
          </div>
          <div className="grid two">
            <div className="field">
              <label>이름 또는 별칭</label>
              <input value={participant.name} onChange={(event) => updateProfile("name", event.target.value)} placeholder="예: 정연" />
            </div>
            <div className="field">
              <label>성별</label>
              <select value={participant.basicInfo.gender} onChange={(event) => updateBasicInfo("gender", event.target.value)}>
                <option value="">선택</option>
                <option>여성</option>
                <option>남성</option>
                <option>기타</option>
                <option>응답 안 함</option>
              </select>
            </div>
          </div>
          <div className="grid two">
            <div className="field">
              <label>나이대</label>
              <select value={participant.basicInfo.ageGroup} onChange={(event) => updateBasicInfo("ageGroup", event.target.value)}>
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
              <select value={participant.basicInfo.relationship} onChange={(event) => updateBasicInfo("relationship", event.target.value)}>
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

          <div className="section-title" style={{ marginTop: 18 }}>
            <h2>개인적으로 중요한 것</h2>
          </div>
          <div className="field">
            <label>꼭 원하는 것, 피하고 싶은 것, 양보하기 어려운 것</label>
            <textarea
              value={participant.personalRequests}
              onChange={(event) => updateProfile("personalRequests", event.target.value)}
              placeholder="예: 야경 좋은 곳은 꼭 가고 싶고, 너무 이른 아침 일정은 피하고 싶어"
            />
          </div>
          <div className="grid three">
            <div className="field">
              <label>체력/건강</label>
              <textarea value={participant.healthNote} onChange={(event) => updateProfile("healthNote", event.target.value)} placeholder="예: 오래 걷는 건 조금 힘들어" />
            </div>
            <div className="field">
              <label>음식</label>
              <textarea value={participant.foodNote} onChange={(event) => updateProfile("foodNote", event.target.value)} placeholder="예: 매운 음식은 잘 못 먹어" />
            </div>
            <div className="field">
              <label>이동</label>
              <textarea value={participant.mobilityNote} onChange={(event) => updateProfile("mobilityNote", event.target.value)} placeholder="예: 환승 많은 일정은 싫어" />
            </div>
          </div>

          <div className="section-title" style={{ marginTop: 18 }}>
            <h2>여행 성향 검사</h2>
            <span className="pill green">{Object.keys(participant.quizAnswers).length}/{quizQuestions.length}</span>
          </div>
          {quizQuestions.map((question, index) => (
            <div className="card" key={question.id} style={{ marginBottom: 12 }}>
              <strong>
                {index + 1}. {question.title}
              </strong>
              <p className="muted">{question.scene}</p>
              {question.options.map((option) => (
                <button
                  className={`quiz-option ${participant.quizAnswers[question.id] === option.id ? "active" : ""}`}
                  key={option.id}
                  onClick={() => answerQuestion(question.id, option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ))}

          <button className="btn" onClick={complete} disabled={!canComplete}>
            내 페르소나 저장
          </button>
        </section>

        <aside className="panel">
          <div className="section-title">
            <h2>검사 결과</h2>
          </div>
          {!result && <p className="muted">문항에 답하면 여행자 타입이 만들어집니다.</p>}
          {result && (
            <div className="grid">
              <div className="card">
                <span className="pill green">주 타입</span>
                <h3>{result.primaryType}</h3>
                <p>{result.oneLineSummary}</p>
              </div>
              <div className="card">
                <span className="pill">보조 타입</span>
                <h3>{result.secondaryType}</h3>
                <p>{result.preferredDecisionStyle}</p>
              </div>
              <div className="card">
                <strong>강점</strong>
                <p>{result.strengths.join(" / ")}</p>
              </div>
              <div className="card">
                <strong>주의 포인트</strong>
                <p>{result.riskFactors.join(" / ")}</p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
