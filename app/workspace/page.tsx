"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createDemoSession } from "@/lib/mock";
import { emptyState, loadState, saveState } from "@/lib/storage";
import type { AgentMessage, AppState, DestinationCandidate, Itinerary, Persona, ResearchArtifact } from "@/lib/types";

type BusyState = "idle" | "boot" | "personas" | "candidates" | "dialogue" | "itinerary" | "feedback";
type SlotKey = "morning" | "afternoon" | "evening";

const SLOT_LABELS: Record<SlotKey, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening"
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`${url} failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function readDialogueStream(
  body: unknown,
  onMessage: (message: AgentMessage) => void,
  onResearch: (artifact: ResearchArtifact) => void
) {
  const response = await fetch("/api/dialogue/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok || !response.body) {
    throw new Error(`dialogue stream failed with ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const messages: AgentMessage[] = [];
  const researchArtifacts: ResearchArtifact[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const eventName = event
        .split("\n")
        .find((line) => line.startsWith("event: "))
        ?.slice(7);
      const dataLine = event.split("\n").find((line) => line.startsWith("data: "));
      if (!dataLine || dataLine === "data: {}") continue;
      const data = JSON.parse(dataLine.slice(6)) as unknown;
      if (eventName === "research") {
        const artifact = data as ResearchArtifact;
        researchArtifacts.push(artifact);
        onResearch(artifact);
      }
      if (!eventName || eventName === "message") {
        const message = data as AgentMessage;
        messages.push(message);
        onMessage(message);
      }
    }
  }

  return { messages, researchArtifacts };
}

function asPercent(value: number) {
  const normalized = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

function personaInitial(persona?: Persona) {
  return (persona?.displayName || "A").charAt(0);
}

export default function WorkspacePage() {
  const [state, setState] = useState<AppState | null>(null);
  const [busy, setBusy] = useState<BusyState>("boot");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const session = state?.session ?? null;
  const completedCount = useMemo(
    () => session?.participants.filter((participant) => participant.completed).length ?? 0,
    [session]
  );
  const allCompleted = Boolean(session && completedCount === session.participants.length);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const loaded = loadState();
      const initial: AppState = loaded.session
        ? loaded
        : {
            ...emptyState,
            session: createDemoSession()
          };

      if (cancelled) return;
      persist(initial);
      await generateWorkspace(initial, initial.selectedDestination);
    }

    boot().catch((err: unknown) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : "Workspace generation failed.");
        setBusy("idle");
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function persist(next: AppState) {
    setState(next);
    saveState(next);
  }

  async function generateWorkspace(baseState: AppState, destinationOverride?: string) {
    const activeSession = baseState.session;
    if (!activeSession) return;

    let next = baseState;
    setError("");

    if (next.personas.length === 0) {
      setBusy("personas");
      const data = await postJson<{ personas: Persona[] }>("/api/personas/generate", {
        participants: activeSession.participants
      });
      next = { ...next, personas: data.personas };
      persist(next);
    }

    if (activeSession.destinationStatus === "undecided" && next.candidates.length === 0) {
      setBusy("candidates");
      const data = await postJson<{ candidates: DestinationCandidate[] }>("/api/destinations/generate", {
        session: activeSession,
        personas: next.personas
      });
      next = { ...next, candidates: data.candidates };
      persist(next);
    }

    const selectedDestination =
      destinationOverride ||
      next.selectedDestination ||
      activeSession.destination ||
      next.candidates[0]?.name ||
      "";

    next = { ...next, selectedDestination, researchArtifacts: [], messages: [] };
    persist(next);

    setBusy("dialogue");
    const streamed = await readDialogueStream(
      {
        session: activeSession,
        personas: next.personas,
        candidates: next.candidates,
        selectedDestination
      },
      (message) => {
        setState((current) => {
          if (!current) return current;
          return { ...current, messages: [...current.messages, message] };
        });
      },
      (artifact) => {
        setState((current) => {
          if (!current) return current;
          return { ...current, researchArtifacts: [...current.researchArtifacts, artifact] };
        });
      }
    );

    next = { ...next, messages: streamed.messages, researchArtifacts: streamed.researchArtifacts };
    persist(next);

    setBusy("itinerary");
    const data = await postJson<{ itinerary: Itinerary }>("/api/itinerary/generate", {
      session: activeSession,
      personas: next.personas,
      messages: next.messages,
      researchArtifacts: next.researchArtifacts,
      selectedDestination
    });
    next = { ...next, itinerary: data.itinerary };
    persist(next);
    setBusy("idle");
  }

  async function regenerate(destination = state?.selectedDestination || "") {
    if (!state || busy !== "idle") return;
    await generateWorkspace({ ...state, selectedDestination: destination, itinerary: null, messages: [] }, destination);
  }

  async function regenerateWithFeedback() {
    if (!state?.session || !state.itinerary || !feedback.trim() || busy !== "idle") return;

    setBusy("feedback");
    setError("");
    try {
      const data = await postJson<{ messages: AgentMessage[]; itinerary: Itinerary }>("/api/feedback/regenerate", {
        session: state.session,
        personas: state.personas,
        itinerary: state.itinerary,
        feedback
      });
      persist({
        ...state,
        messages: [...state.messages, ...data.messages],
        itinerary: data.itinerary
      });
      setFeedback("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Feedback regeneration failed.");
    } finally {
      setBusy("idle");
    }
  }

  function updateDay(day: number, slot: SlotKey, value: string) {
    if (!state?.itinerary) return;
    const itinerary = {
      ...state.itinerary,
      days: state.itinerary.days.map((item) => (item.day === day ? { ...item, [slot]: value } : item))
    };
    persist({ ...state, itinerary });
  }

  if (!state || !session) {
    return <main className="shell">Loading workspace...</main>;
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <h1>{state.selectedDestination || "Travel decision workspace"}</h1>
          <p>
            {session.departureArea || "Departure"} / {session.duration || "Duration"} / {session.budget || "Budget"}
          </p>
        </div>
        <div className="row">
          <Link className="btn secondary" href={`/participant/${session.participants[0]?.id ?? "me"}`}>
            Participant test
          </Link>
          <Link className="btn secondary" href="/">
            Setup
          </Link>
          <Link className="btn" href="/report">
            Report
          </Link>
        </div>
      </header>

      {error && <section className="notice" style={{ marginBottom: 16 }}>{error}</section>}

      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="section-title">
          <h2>Session status</h2>
          <span className="pill green">
            {completedCount}/{session.participants.length} completed
          </span>
        </div>
        {!allCompleted && (
          <p className="muted">
            Some participants have not completed their persona test yet. You can still preview with the available data.
          </p>
        )}
        <div className="row">
          <button className="btn" disabled={busy !== "idle"} onClick={() => regenerate()}>
            {busy === "idle" ? "Run negotiation" : `Generating ${busy}...`}
          </button>
          <span className="muted">Max turns: {session.settings.maxNegotiationCycles}</span>
          <span className="muted">Research artifacts: {state.researchArtifacts.length}</span>
        </div>
      </section>

      <div className="grid three" style={{ marginBottom: 16 }}>
        {state.personas.map((persona) => (
          <article className="card" key={persona.id}>
            <div className="section-title">
              <h3>{persona.displayName}</h3>
              <span className="pill">{asPercent(persona.representationScore)}%</span>
            </div>
            <p className="muted">{persona.summary}</p>
            <div className="tag-row">
              {persona.preferences.slice(0, 3).map((preference) => (
                <span className="tag green" key={preference}>
                  {preference}
                </span>
              ))}
            </div>
            <div className="compromise-note" style={{ marginTop: 10 }}>
              <span className="compromise-label">Compromise</span>
              <span>{persona.decisionPolicy.canCompromiseOn.slice(0, 2).join(" / ")}</span>
            </div>
          </article>
        ))}
      </div>

      {session.destinationStatus === "undecided" && (
        <section className="panel" style={{ marginBottom: 16 }}>
          <div className="section-title">
            <h2>Destination candidates</h2>
            <span className="pill">{state.candidates.length}</span>
          </div>
          <div className="grid three">
            {state.candidates.map((candidate) => (
              <button
                className={`card candidate ${state.selectedDestination === candidate.name ? "selected" : ""}`}
                key={candidate.id}
                onClick={() => regenerate(candidate.name)}
                type="button"
                disabled={busy !== "idle"}
                style={{ textAlign: "left" }}
              >
                <div className="section-title">
                  <h3>{candidate.name}</h3>
                  <span className="pill">{candidate.estimatedBudget}</span>
                </div>
                <p>{candidate.reason}</p>
                <div className="tag-row">
                  {candidate.fitTags.map((tag) => (
                    <span className="tag amber" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="grid two">
        <section className="panel">
          <div className="section-title">
            <h2>Agent dialogue</h2>
            <span className="pill">{state.messages.length}</span>
          </div>
          <div className="chat">
            {state.messages.length === 0 && <p className="muted">Dialogue will appear here after generation starts.</p>}
            {state.messages.map((message) => {
              const persona = state.personas.find((item) => item.id === message.speakerId);
              return (
                <article className={`message ${message.speakerType === "expert" ? "expert" : ""}`} key={message.id}>
                  <div className="message-head">
                    <strong>{message.speakerType === "expert" ? "Travel expert" : persona?.displayName ?? "System"}</strong>
                    <span className="pill">{message.speechAct}</span>
                  </div>
                  <p>{message.content}</p>
                  {message.researchSummary && (
                    <div className="notice" style={{ marginTop: 10 }}>
                      <strong>Research</strong>
                      <p style={{ margin: "6px 0 0" }}>{message.researchSummary}</p>
                    </div>
                  )}
                  <div className="row">
                    <span className="muted">Support {asPercent(message.supportLevel)}%</span>
                    <span className="muted">Concern {asPercent(message.concernLevel)}%</span>
                    {message.researchRefs?.slice(0, 2).map((ref) => (
                      <span className="pill" key={ref}>
                        {ref.startsWith("mock://") ? "mock source" : "source"}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="panel">
          <div className="section-title">
            <h2>Itinerary</h2>
            <span className="pill orange">{state.itinerary?.destination || state.selectedDestination || "Pending"}</span>
          </div>

          <div className="day-grid">
            {state.itinerary?.days.map((day) => (
              <article className="day-card" key={day.day}>
                <div className="day-card-header">
                  <span className="day-num">Day {day.day}</span>
                  <span className="day-title-text">{day.title}</span>
                </div>
                <div className="day-blocks">
                  {(["morning", "afternoon", "evening"] as const).map((slot) => (
                    <label className="block" key={slot}>
                      <span className="block-label">{SLOT_LABELS[slot]}</span>
                      <textarea
                        className="block-textarea"
                        value={day[slot]}
                        onChange={(event) => updateDay(day.day, slot, event.target.value)}
                      />
                    </label>
                  ))}
                </div>
                {day.note && <p className="day-note">{day.note}</p>}
              </article>
            ))}
          </div>

          {state.itinerary && (
            <div className="notice" style={{ marginTop: 16 }}>
              <strong>Consensus</strong>
              <p>{state.itinerary.consensusSummary}</p>
              <div className="tag-row">
                {state.itinerary.tradeoffs.map((tradeoff) => (
                  <span className="tag amber" key={tradeoff}>
                    {tradeoff}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="field" style={{ marginTop: 16 }}>
            <label>Feedback</label>
            <textarea
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder="Ask the agents to adjust the itinerary."
            />
          </div>
          <button className="btn warn" onClick={regenerateWithFeedback} disabled={busy !== "idle" || !feedback.trim()}>
            Apply feedback
          </button>
        </section>
      </div>
    </main>
  );
}
