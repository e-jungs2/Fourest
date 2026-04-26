"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AgentMessage,
  DestinationCandidate,
  demoSession,
  generateCandidates,
  generateItinerary,
  generateMessages,
  generatePersonas,
  Itinerary,
  Persona,
  SESSION_KEY,
  TravelSession
} from "@/lib/travel";

export default function WorkspacePage() {
  const [session, setSession] = useState<TravelSession | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [candidates, setCandidates] = useState<DestinationCandidate[]>([]);
  const [selectedDestination, setSelectedDestination] = useState("");
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    const loaded = raw ? (JSON.parse(raw) as TravelSession) : demoSession();
    setSession(loaded);
    const nextPersonas = generatePersonas(loaded);
    setPersonas(nextPersonas);
    const nextCandidates = loaded.destinationStatus === "undecided" ? generateCandidates(nextPersonas) : [];
    setCandidates(nextCandidates);
    const destination = loaded.destinationStatus === "fixed" ? loaded.destination : nextCandidates[0]?.name || "강릉";
    setSelectedDestination(destination);
    setMessages(generateMessages(nextPersonas, destination));
    setItinerary(generateItinerary(loaded, destination));
  }, []);

  const completedCount = useMemo(() => session?.participants.filter((participant) => participant.completed).length ?? 0, [session]);
  const allCompleted = Boolean(session && completedCount === session.participants.length);

  function persistSession(nextSession: TravelSession) {
    setSession(nextSession);
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
  }

  function regenerate(destination = selectedDestination) {
    if (!session) return;
    const nextMessages = generateMessages(personas, destination);
    setMessages(
      feedback
        ? [
            ...nextMessages,
            {
              id: `feedback-${Date.now()}`,
              speakerId: "system",
              speakerType: "system",
              speechAct: "validate",
              content: `피드백 반영: "${feedback}" 요청을 기준으로 일정 밀도와 식사 배치를 다시 조정했습니다.`,
              supportLevel: 82,
              concernLevel: 18
            }
          ]
        : nextMessages
    );
    setItinerary(generateItinerary(session, destination));
    setFeedback("");
  }

  function updateDay(day: number, slot: "morning" | "afternoon" | "evening", value: string) {
    if (!itinerary) return;
    setItinerary({
      ...itinerary,
      days: itinerary.days.map((item) => (item.day === day ? { ...item, [slot]: value } : item))
    });
  }

  if (!session) {
    return <main className="page">Loading...</main>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">F</div>
          <span>Fourest</span>
        </div>
        <div className="sidebar-card">
          <div className="nav-list">
            <Link className="nav-item" href="/">
              ＋ 새 여행 세션
            </Link>
            <span className="nav-item active">▣ 워크스페이스</span>
          </div>
        </div>
        <div className="sidebar-card">
          <div className="grid-2">
            <div className="mini-stat">
              <span className="hint">참여자</span>
              <strong>{completedCount}/{session.participants.length}</strong>
            </div>
            <div className="mini-stat">
              <span className="hint">기간</span>
              <strong>{session.duration}일</strong>
            </div>
          </div>
        </div>
        <div className="sidebar-card">
          <div className="field" style={{ marginBottom: 10 }}>
            <label htmlFor="cycles">최대 조율 횟수</label>
            <input
              id="cycles"
              className="input"
              type="number"
              min="1"
              max="8"
              value={session.settings.maxNegotiationCycles}
              onChange={(event) =>
                persistSession({
                  ...session,
                  settings: { maxNegotiationCycles: Number(event.target.value) }
                })
              }
            />
          </div>
          <p className="hint">UI에는 라운드를 과하게 드러내지 않고 자연스러운 대화로 보여줍니다.</p>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <strong>{selectedDestination || "목적지 조율 중"}</strong>
            <span className="hint"> · {session.budget} · {session.departureArea} 출발</span>
          </div>
          <div className="button-row">
            <Link className="pill" href={`/participant/${session.participants[0]?.id ?? "p-1"}`}>
              테스트 링크
            </Link>
            <button className="btn btn-primary" disabled={!allCompleted} onClick={() => regenerate()}>
              조율 실행
            </button>
          </div>
        </div>

        <div className="workspace">
          <section className="workspace-column">
            <div className="section-title">
              <h2>페르소나</h2>
              <span className="pill">{personas.length}</span>
            </div>
            <div className="persona-list">
              {personas.map((persona, index) => (
                <article className="persona-card" key={persona.id}>
                  <div className="persona-head">
                    <div className="avatar">{persona.displayName.slice(0, 1)}</div>
                    <div>
                      <strong>{persona.displayName}</strong>
                      <p>{persona.summary}</p>
                    </div>
                  </div>
                  <p>{persona.decisionPolicy}</p>
                  <div className="tag-row">
                    {persona.preferences.slice(0, 3).map((preference) => (
                      <span className="tag" key={preference}>{preference}</span>
                    ))}
                    <span className="tag">대표성 {persona.representationScore + index}%</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="chat-column">
            <div className="chat-feed">
              <div className="section-title">
                <h1>에이전트 채팅</h1>
                <span className="pill">{allCompleted ? "준비 완료" : "테스트 대기"}</span>
              </div>
              {!allCompleted ? (
                <div className="bubble">
                  모든 참여자가 테스트를 완료해야 토론을 시작할 수 있습니다. 지금은 완료된 참여자 기준으로 미리보기를 표시합니다.
                </div>
              ) : null}
              {messages.map((message) => {
                const persona = personas.find((item) => item.id === message.speakerId);
                return (
                  <article className="message" key={message.id}>
                    <div className="avatar" style={{ background: message.speakerType === "system" ? "var(--accent)" : "var(--brand)" }}>
                      {message.speakerType === "system" ? "S" : persona?.displayName.slice(0, 1)}
                    </div>
                    <div className="bubble">
                      <div className="bubble-meta">
                        <strong>{message.speakerType === "system" ? "시스템" : persona?.displayName}</strong>
                        <span className="speech-act">{message.speechAct}</span>
                        <span>지지 {message.supportLevel}%</span>
                        <span>우려 {message.concernLevel}%</span>
                      </div>
                      {message.content}
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="composer">
              <div className="composer-box">
                <textarea
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  placeholder="피드백을 입력하면 짧게 재토론하고 일정표를 다시 생성합니다."
                />
                <button className="btn btn-primary" onClick={() => regenerate()} disabled={!feedback.trim()}>
                  반영
                </button>
              </div>
            </div>
          </section>

          <section className="workspace-column">
            {session.destinationStatus === "undecided" ? (
              <>
                <div className="section-title">
                  <h2>목적지 후보</h2>
                  <span className="pill">3개</span>
                </div>
                <div className="candidate-list">
                  {candidates.map((candidate) => (
                    <button
                      className={`candidate-card ${selectedDestination === candidate.name ? "active" : ""}`}
                      key={candidate.id}
                      onClick={() => {
                        setSelectedDestination(candidate.name);
                        regenerate(candidate.name);
                      }}
                      type="button"
                    >
                      <div className="section-title">
                        <strong>{candidate.name}</strong>
                        <span className="hint">{candidate.estimatedBudget}</span>
                      </div>
                      <p>{candidate.reason}</p>
                      <div className="tag-row">
                        {candidate.fitTags.map((tag) => (
                          <span className="tag" key={tag}>{tag}</span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            <div className="section-title" style={{ marginTop: session.destinationStatus === "undecided" ? 22 : 0 }}>
              <h2>일자별 일정표</h2>
              <span className="pill">{itinerary?.destination}</span>
            </div>
            <div className="itinerary-list">
              {itinerary?.days.map((day) => (
                <article className="day-card" key={day.day}>
                  <h3>Day {day.day}</h3>
                  {(["morning", "afternoon", "evening"] as const).map((slot) => (
                    <label className="time-block" key={slot}>
                      <span className="label">{slot === "morning" ? "오전" : slot === "afternoon" ? "오후" : "저녁"}</span>
                      <textarea
                        className="editable-block"
                        value={day[slot]}
                        onChange={(event) => updateDay(day.day, slot, event.target.value)}
                      />
                    </label>
                  ))}
                </article>
              ))}
            </div>
            {itinerary ? (
              <div className="candidate-card" style={{ marginTop: 10 }}>
                <strong>합의 요약</strong>
                <p style={{ marginTop: 6 }}>{itinerary.consensusSummary}</p>
                <div className="tag-row">
                  {itinerary.tradeoffs.map((tradeoff) => (
                    <span className="tag" key={tradeoff}>{tradeoff}</span>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}
