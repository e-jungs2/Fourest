"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadState, saveState } from "@/lib/storage";
import type { AgentMessage, AppState, Itinerary } from "@/lib/types";

type BusyState = "idle" | "feedback";

export default function ReportPage() {
  const [state, setState] = useState<AppState | null>(null);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState<BusyState>("idle");

  useEffect(() => {
    setState(loadState());
  }, []);

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

      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="section-title">
          <h2>결정 요약</h2>
          <span className="pill green">{state.selectedDestination || itinerary.destination}</span>
        </div>
        <p>{itinerary.consensusSummary}</p>
        <div className="grid three">
          {state.personas.map((persona) => (
            <div className="card" key={persona.id}>
              <strong>{persona.displayName}</strong>
              <p className="muted">{persona.summary}</p>
              <span className="pill">만족도 {itinerary.personaSatisfaction[persona.displayName] ?? 80}%</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="section-title">
          <h2>일자별 일정표</h2>
          <span className="pill orange">직접 편집 가능</span>
        </div>
        <div className="grid">
          {itinerary.days.map((day) => (
            <div className="card day" key={day.day}>
              <strong>
                Day {day.day}. {day.title}
              </strong>
              <div className="day-blocks">
                {(["morning", "afternoon", "evening"] as const).map((key) => (
                  <div className="block" key={key}>
                    <label>{key === "morning" ? "오전" : key === "afternoon" ? "오후" : "저녁"}</label>
                    <textarea value={day[key]} onChange={(event) => updateItinerary(day.day, key, event.target.value)} />
                  </div>
                ))}
              </div>
              <p className="muted">{day.note}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid two">
        <section className="panel">
          <div className="section-title">
            <h2>조율 과정에서 생긴 절충</h2>
          </div>
          <div className="grid">
            {itinerary.tradeoffs.map((tradeoff) => (
              <div className="notice" key={tradeoff}>
                {tradeoff}
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-title">
            <h2>피드백으로 다시 회의하기</h2>
          </div>
          <div className="field">
            <label>피드백</label>
            <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="예: 둘째 날 저녁을 더 조용한 일정으로 바꿔줘" />
          </div>
          <button className="btn warn" onClick={regenerateWithFeedback} disabled={busy !== "idle" || !feedback.trim()}>
            {busy === "idle" ? "재토론 후 보고서 갱신" : "재토론 중..."}
          </button>
        </section>
      </div>
    </main>
  );
}
