"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { quizQuestions, scoreQuiz } from "@/lib/quiz";
import { loadState, saveState } from "@/lib/storage";
import type { AppState } from "@/lib/types";

export default function ParticipantPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [state, setState] = useState<AppState | null>(null);
  const participant = state?.session?.participants.find((item) => item.id === params.id);

  useEffect(() => {
    setState(loadState());
  }, []);

  function update(partial: Record<string, string>, type: "answers" | "profile") {
    if (!state?.session) return;
    const participants = state.session.participants.map((item) => {
      if (item.id !== params.id) return item;
      if (type === "answers") {
        const quizAnswers = { ...item.quizAnswers, ...partial };
        return { ...item, quizAnswers, quizScores: scoreQuiz(quizAnswers) };
      }
      return { ...item, ...partial };
    });
    const next = { ...state, session: { ...state.session, participants } };
    setState(next);
    saveState(next);
  }

  function complete() {
    if (!state?.session) return;
    const participants = state.session.participants.map((item) => (item.id === params.id ? { ...item, completed: true } : item));
    const next = { ...state, session: { ...state.session, participants } };
    saveState(next);
    router.push("/workspace");
  }

  if (!state) return <main className="shell">불러오는 중...</main>;
  if (!participant) {
    return (
      <main className="shell">
        <section className="panel">참여자 링크를 찾을 수 없습니다.</section>
      </main>
    );
  }

  const answered = quizQuestions.every((question) => participant.quizAnswers[question.id]);

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <h1>{participant.name}의 여행 성향 테스트</h1>
          <p>이 답변은 {participant.name}을 대표하는 페르소나 에이전트 생성에 사용됩니다.</p>
        </div>
        <button className="btn secondary" onClick={() => router.push("/workspace")}>
          워크스페이스로
        </button>
      </header>

      <div className="grid two">
        <section className="panel">
          <div className="field">
            <label>기본 정보</label>
            <textarea
              value={participant.basicInfo}
              onChange={(event) => update({ basicInfo: event.target.value }, "profile")}
              placeholder="예: 사진 찍는 걸 좋아하고, 오래 걷는 건 조금 힘들어함"
            />
          </div>
          <div className="field">
            <label>개인적으로 원하는 것</label>
            <textarea
              value={participant.personalRequests}
              onChange={(event) => update({ personalRequests: event.target.value }, "profile")}
              placeholder="예: 야경 좋은 곳 하나는 꼭 가고 싶어"
            />
          </div>

          {quizQuestions.map((question, index) => (
            <div className="card" key={question.id} style={{ marginBottom: 12 }}>
              <strong>
                {index + 1}. {question.title}
              </strong>
              {question.options.map((option) => (
                <button
                  className={`quiz-option ${participant.quizAnswers[question.id] === option.id ? "active" : ""}`}
                  key={option.id}
                  onClick={() => update({ [question.id]: option.id }, "answers")}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ))}

          <button className="btn" onClick={complete} disabled={!answered}>
            테스트 완료
          </button>
        </section>

        <aside className="panel">
          <div className="section-title">
            <h3>현재 점수</h3>
          </div>
          {Object.entries(participant.quizScores).map(([key, value]) => (
            <div className="field" key={key}>
              <label>{key}</label>
              <div className="notice">{value} / 100</div>
            </div>
          ))}
        </aside>
      </div>
    </main>
  );
}
