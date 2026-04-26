"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { loadState, saveState } from "@/lib/storage";
import type { AgentMessage, AppState, Itinerary } from "@/lib/types";

type BusyState = "idle" | "feedback";
type EditingBlock = { day: number; key: "morning" | "afternoon" | "evening" } | null;

const TIME_LABELS = { morning: "🌅 오전", afternoon: "☀️ 오후", evening: "🌙 저녁" } as const;

function satisfactionColor(score: number): string {
  if (score >= 80) return "var(--accent)";
  if (score >= 65) return "#d97706";
  return "#b42318";
}

export default function ReportPage() {
  const [state, setState] = useState<AppState | null>(null);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState<BusyState>("idle");
  const [editing, setEditing] = useState<EditingBlock>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    if (editing && editRef.current) editRef.current.focus();
  }, [editing]);

  function persist(next: AppState) {
    setState(next);
    saveState(next);
  }

  function updateItinerary(day: number, key: "morning" | "afternoon" | "evening", value: string) {
    if (!state?.itinerary) return;
    const itinerary = {
      ...state.itinerary,
      days: state.itinerary.days.map((item) => (item.day === day ? { ...item, [key]: value } : item))
    };
    persist({ ...state, itinerary });
  }

  async function regenerateWithFeedback() {
    if (!state?.session || !state.itinerary || !feedback.trim()) return;
    setBusy("feedback");
    const response = await fetch("/api/feedback/regenerate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session: state.session, personas: state.personas, itinerary: state.itinerary, feedback })
    });
    const data = (await response.json()) as { messages: AgentMessage[]; itinerary: Itinerary };
    persist({ ...state, messages: [...state.messages, ...data.messages], itinerary: data.itinerary });
    setFeedback("");
    setBusy("idle");
  }

  if (!state) return <main className="shell">불러오는 중...</main>;
  if (!state.session || !state.itinerary) {
    return (
      <main className="shell">
        <section className="panel">
          <p>아직 생성된 보고서가 없습니다.</p>
          <Link className="btn" href="/workspace">
            회의장으로 돌아가기
          </Link>
        </section>
      </main>
    );
  }

  const itinerary = state.itinerary;

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <h1>{itinerary.destination} 여행 의사결정 보고서</h1>
          <p>페르소나 회의 결과를 바탕으로 생성된 일자별 일정표입니다.</p>
        </div>
        <div className="row">
          <Link className="btn secondary" href="/workspace">
            회의 로그 보기
          </Link>
          <Link className="btn" href="/">
            새 세션
          </Link>
        </div>
      </header>

      {/* 결정 요약 + 페르소나별 만족도 */}
      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="section-title">
          <h2>결정 요약</h2>
          <span className="pill green">{state.selectedDestination || itinerary.destination}</span>
        </div>
        <p style={{ margin: "0 0 20px" }}>{itinerary.consensusSummary}</p>

        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>페르소나별 만족도</h3>
        <div className="grid three">
          {state.personas.map((persona) => {
            const score = itinerary.personaSatisfaction[persona.displayName] ?? 80;
            const compromise = persona.decisionPolicy?.canCompromiseOn?.[0];
            return (
              <div className="card" key={persona.id} style={{ display: "grid", gap: 10 }}>
                <div>
                  <strong style={{ display: "block", marginBottom: 4 }}>{persona.displayName}</strong>
                  <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.4 }}>
                    {persona.summary}
                  </p>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>만족도</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: satisfactionColor(score) }}>{score}%</span>
                  </div>
                  <div className="satisfaction-bar">
                    <div
                      className="satisfaction-fill"
                      style={{ width: `${score}%`, background: satisfactionColor(score) }}
                    />
                  </div>
                </div>
                {compromise && (
                  <div className="compromise-note">
                    <span className="compromise-label">양보한 것</span>
                    {compromise}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 일자별 일정표 */}
      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="section-title">
          <h2>일자별 일정표</h2>
          <span className="pill orange">더블클릭으로 편집</span>
        </div>
        <div className="day-grid">
          {itinerary.days.map((day) => (
            <div className="day-card" key={day.day}>
              <div className="day-card-header">
                <span className="day-num">Day {day.day}</span>
                <span className="day-title-text">{day.title}</span>
              </div>
              <div className="day-blocks">
                {(["morning", "afternoon", "evening"] as const).map((key) => {
                  const isEditing = editing?.day === day.day && editing?.key === key;
                  return (
                    <div className="block" key={key}>
                      <label className="block-label">{TIME_LABELS[key]}</label>
                      {isEditing ? (
                        <textarea
                          ref={editRef}
                          className="block-textarea"
                          value={day[key]}
                          onChange={(e) => updateItinerary(day.day, key, e.target.value)}
                          onBlur={() => setEditing(null)}
                        />
                      ) : (
                        <div
                          className="block-view"
                          onDoubleClick={() => setEditing({ day: day.day, key })}
                          title="더블클릭으로 편집"
                        >
                          {day[key] || <span className="muted">미정</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {day.note && <p className="day-note">{day.note}</p>}
            </div>
          ))}
        </div>
      </section>

      <div className="grid two">
        {/* 절충점 */}
        <section className="panel">
          <div className="section-title">
            <h2>조율 과정에서 생긴 절충</h2>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {itinerary.tradeoffs.map((tradeoff, i) => (
              <div className="tradeoff-card" key={i}>
                <span className="tradeoff-icon">⚖️</span>
                <p>{tradeoff}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 피드백 */}
        <section className="panel">
          <div className="section-title">
            <h2>피드백으로 다시 회의하기</h2>
          </div>
          <div className="field">
            <label>피드백</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="예: 둘째 날 저녁을 더 조용한 일정으로 바꿔줘"
            />
          </div>
          <button className="btn warn" onClick={regenerateWithFeedback} disabled={busy !== "idle" || !feedback.trim()}>
            {busy === "idle" ? "재토론 후 보고서 갱신" : "재토론 중..."}
          </button>
        </section>
      </div>
    </main>
  );
}
