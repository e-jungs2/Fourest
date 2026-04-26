"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { clearState, loadState, saveState } from "@/lib/storage";
import type { AgentMessage, AppState, DestinationCandidate, Itinerary, Persona, ResearchArtifact } from "@/lib/types";

type BusyState = "idle" | "personas" | "candidates" | "dialogue" | "itinerary" | "feedback";
type SseEvent = { event: string; data: string };

export default function WorkspacePage() {
  const router = useRouter();
  const [state, setState] = useState<AppState | null>(null);
  const [busy, setBusy] = useState<BusyState>("idle");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    setState(loadState());
  }, []);

  const session = state?.session;
  const allCompleted = Boolean(session?.participants.length && session.participants.every((item) => item.completed));
  const selectedDestination = state?.selectedDestination || session?.destination || state?.candidates[0]?.name || "";

  const canStart = useMemo(() => {
    if (!session || !allCompleted || busy !== "idle") return false;
    return true;
  }, [session, allCompleted, busy]);

  function persist(next: AppState) {
    setState(next);
    saveState(next);
  }

  async function generatePersonas(current = state): Promise<Persona[]> {
    if (!current?.session) return [];
    setBusy("personas");
    const response = await fetch("/api/personas/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participants: current.session.participants })
    });
    const data = (await response.json()) as { personas: Persona[] };
    const next = { ...current, personas: data.personas, researchArtifacts: [], messages: [], itinerary: null };
    persist(next);
    return data.personas;
  }

  async function generateCandidates(current: AppState, personas: Persona[]): Promise<DestinationCandidate[]> {
    if (!current.session) return [];
    if (current.session.destinationStatus === "fixed") {
      const next = { ...current, candidates: [], selectedDestination: current.session.destination };
      persist(next);
      return [];
    }
    setBusy("candidates");
    const response = await fetch("/api/destinations/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session: current.session, personas })
    });
    const data = (await response.json()) as { candidates: DestinationCandidate[] };
    const next = { ...current, personas, candidates: data.candidates, selectedDestination: data.candidates[0]?.name || "" };
    persist(next);
    return data.candidates;
  }

  async function runDialogue(current: AppState, personas: Persona[], candidates: DestinationCandidate[], destination: string) {
    if (!current.session) return { messages: [] as AgentMessage[], researchArtifacts: [] as ResearchArtifact[] };
    setBusy("dialogue");
    const response = await fetch("/api/dialogue/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session: current.session, personas, candidates, selectedDestination: destination })
    });
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    const messages: AgentMessage[] = [];
    const researchArtifacts: ResearchArtifact[] = [];
    let buffer = "";
    if (!reader) return { messages, researchArtifacts };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() || "";

      for (const event of chunks.map(parseSseEvent)) {
        if (event.event === "research") {
          const artifact = JSON.parse(event.data) as ResearchArtifact;
          researchArtifacts.push(artifact);
          persist({ ...current, personas, candidates, selectedDestination: destination, researchArtifacts: [...researchArtifacts], messages: [...messages], itinerary: null });
        }
        if (event.event === "message") {
          const message = JSON.parse(event.data) as AgentMessage;
          messages.push(message);
          persist({ ...current, personas, candidates, selectedDestination: destination, researchArtifacts: [...researchArtifacts], messages: [...messages], itinerary: null });
        }
        if (event.event === "done") return { messages, researchArtifacts };
      }
    }
    return { messages, researchArtifacts };
  }

  async function generateItinerary(current: AppState, personas: Persona[], messages: AgentMessage[], destination: string) {
    if (!current.session) return;
    setBusy("itinerary");
    const response = await fetch("/api/itinerary/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session: current.session, personas, messages, selectedDestination: destination })
    });
    const data = (await response.json()) as { itinerary: Itinerary };
    persist({ ...current, personas, messages, selectedDestination: destination, itinerary: data.itinerary });
    setBusy("idle");
    router.push("/report");
  }

  async function startCouncil() {
    if (!state?.session) return;
    const activeSession = state.session;
    const clearedState = { ...state, researchArtifacts: [], messages: [], itinerary: null };
    persist(clearedState);
    const personas = clearedState.personas.length ? clearedState.personas : await generatePersonas(clearedState);
    const baseAfterPersona = { ...clearedState, personas };
    const candidates = await generateCandidates(baseAfterPersona, personas);
    const destination = activeSession.destinationStatus === "fixed" ? activeSession.destination : candidates[0]?.name || "";
    const dialogueState = { ...baseAfterPersona, candidates, selectedDestination: destination, researchArtifacts: [], messages: [] };
    const result = await runDialogue(dialogueState, personas, candidates, destination);
    await generateItinerary({ ...dialogueState, messages: result.messages, researchArtifacts: result.researchArtifacts }, personas, result.messages, destination);
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

  function reset() {
    clearState();
    window.location.href = "/";
  }

  if (!state) return <main className="shell">불러오는 중...</main>;
  if (!session) {
    return (
      <main className="shell">
        <section className="panel">
          <p>여행 세션이 없습니다.</p>
          <Link className="btn" href="/">
            세션 만들기
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <h1>Decision Workspace</h1>
          <p>
            {session.destinationStatus === "fixed" ? session.destination : "여행지 미정"} · {session.duration} · {session.budget}
          </p>
        </div>
        <div className="row">
          <button className="btn secondary" onClick={reset}>
            새로 시작
          </button>
          <button className="btn" onClick={startCouncil} disabled={!canStart}>
            {busy === "idle" ? "페르소나 회의 시작" : "진행 중..."}
          </button>
        </div>
      </header>

      {!allCompleted && <div className="notice" style={{ marginBottom: 16 }}>모든 참여자가 성향 테스트를 완료해야 회의를 시작할 수 있습니다.</div>}

      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="section-title">
          <h2>참여자 초대 링크</h2>
          <span className="pill orange">공유 시뮬레이션</span>
        </div>
        <div className="participants">
          {session.participants.map((participant) => (
            <div className="card invite" key={participant.id}>
              <div>
                <strong>{participant.name}</strong>
                <p className="muted" style={{ margin: "4px 0 0" }}>
                  {participant.completed ? "테스트 완료" : "아직 미완료"}
                </p>
              </div>
              <Link className="btn secondary" href={`/participant/${participant.id}`}>
                테스트 링크 열기
              </Link>
            </div>
          ))}
        </div>
      </section>

      <div className="grid two">
        <section className="grid">
          <PersonaPanel personas={state.personas} />
          <CandidatePanel candidates={state.candidates} selected={selectedDestination} onSelect={(name) => persist({ ...state, selectedDestination: name })} />
          <ChatPanel messages={state.messages} personas={state.personas} busy={busy} />
        </section>

        <section className="grid">
          <SettingsPanel state={state} persist={persist} />
          <ResearchStatus artifacts={state.researchArtifacts} />
          {state.itinerary ? (
            <section className="panel">
              <div className="section-title">
                <h2>보고서 준비 완료</h2>
                <span className="pill green">{state.itinerary.destination}</span>
              </div>
              <p>페르소나 회의가 끝났고 일정 보고서가 생성되었습니다.</p>
              <Link className="btn" href="/report">
                보고서 보기
              </Link>
            </section>
          ) : (
            <section className="panel">
              <div className="section-title">
                <h2>보고서 생성 대기</h2>
              </div>
              <p className="muted">채팅이 끝나면 자동으로 보고서 화면으로 넘어가 일정표가 표시됩니다.</p>
            </section>
          )}
          <section className="panel">
            <div className="section-title">
              <h3>피드백으로 재토론</h3>
            </div>
            <div className="field">
              <label>피드백</label>
              <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="예: 둘째 날을 더 자유롭게 바꿔줘" />
            </div>
            <button className="btn warn" onClick={regenerateWithFeedback} disabled={!state.itinerary || busy !== "idle" || !feedback.trim()}>
              피드백으로 일정 재생성
            </button>
          </section>
        </section>
      </div>
    </main>
  );
}

function PersonaPanel({ personas }: { personas: Persona[] }) {
  return (
    <section className="panel">
      <div className="section-title">
        <h2>페르소나</h2>
        <span className="pill">{personas.length}명</span>
      </div>
      <div className="grid">
        {personas.length === 0 && <p className="muted">회의를 시작하면 참여자별 페르소나가 생성됩니다.</p>}
        {personas.map((persona) => (
          <div className="card" key={persona.id}>
            <div className="row">
              <strong>{persona.displayName}</strong>
              <span className="pill green">대표성 {Math.round(persona.representationScore * 100)}%</span>
            </div>
            <p>{persona.summary}</p>
            <p className="muted">{persona.priorities.join(" · ")}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CandidatePanel({
  candidates,
  selected,
  onSelect
}: {
  candidates: DestinationCandidate[];
  selected: string;
  onSelect: (name: string) => void;
}) {
  if (!candidates.length) return null;
  return (
    <section className="panel">
      <div className="section-title">
        <h2>목적지 후보</h2>
        <span className="pill orange">3개 비교</span>
      </div>
      <div className="grid three">
        {candidates.map((candidate) => (
          <button className={`card candidate ${selected === candidate.name ? "selected" : ""}`} key={candidate.id} onClick={() => onSelect(candidate.name)}>
            <strong>{candidate.name}</strong>
            <span className="muted">{candidate.estimatedBudget}</span>
            <p>{candidate.reason}</p>
            <div className="row">
              {candidate.fitTags.map((tag) => (
                <span className="pill" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function ChatPanel({ messages, personas, busy }: { messages: AgentMessage[]; personas: Persona[]; busy: BusyState }) {
  const nameById = Object.fromEntries(personas.map((persona) => [persona.id, persona.displayName]));
  return (
    <section className="panel">
      <div className="section-title">
        <h2>에이전트 채팅</h2>
        {busy === "dialogue" && <span className="pill green">탐색 후 턴별 생성 중</span>}
      </div>
      <div className="chat">
        {messages.length === 0 && <p className="muted">회의를 시작하면 페르소나들이 탐색 결과와 채팅 기록을 참고해 조율합니다.</p>}
        {messages.map((message) => (
          <article className={`message ${message.speakerType === "expert" ? "expert" : ""}`} key={message.id}>
            <div className="message-head">
              <strong>{message.speakerType === "expert" ? "여행 전문가" : nameById[message.speakerId] || message.speakerId}</strong>
              <span className="pill">{message.speechAct}</span>
            </div>
            <p>{message.content}</p>
            {message.proposalDelta && <p className="muted">변경 제안: {message.proposalDelta}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}

function SettingsPanel({ state, persist }: { state: AppState; persist: (next: AppState) => void }) {
  if (!state.session) return null;
  return (
    <section className="panel">
      <div className="section-title">
        <h3>편집 가능한 회의 설정</h3>
      </div>
      <div className="grid two">
        <div className="field">
          <label>최대 협의 라운드 수</label>
          <input
            type="number"
            min={1}
            max={5}
            value={state.session.settings.maxNegotiationCycles}
            onChange={(event) =>
              persist({
                ...state,
                session: {
                  ...state.session!,
                  settings: { ...state.session!.settings, maxNegotiationCycles: Number(event.target.value) }
                }
              })
            }
          />
        </div>
        <div className="field">
          <label>추가 요구사항</label>
          <input
            value={state.session.requirements}
            onChange={(event) =>
              persist({
                ...state,
                session: { ...state.session!, requirements: event.target.value }
              })
            }
          />
        </div>
      </div>
    </section>
  );
}

function ResearchStatus({ artifacts }: { artifacts: ResearchArtifact[] }) {
  return (
    <section className="panel">
      <div className="section-title">
        <h3>탐색 상태</h3>
        <span className="pill">{artifacts.length}건</span>
      </div>
      <p className="muted">탐색 내용은 채팅 생성에만 반영되고, 상세 출처는 보고서에서 종합됩니다.</p>
    </section>
  );
}

function parseSseEvent(chunk: string): SseEvent {
  const event = chunk
    .split("\n")
    .find((line) => line.startsWith("event: "))
    ?.replace("event: ", "")
    .trim();
  const data = chunk
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.replace("data: ", ""))
    .join("\n");
  return { event: event || "message", data };
}
