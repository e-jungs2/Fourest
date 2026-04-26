"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createDemoSession, makeId } from "@/lib/mock";
import { emptyState, saveState } from "@/lib/storage";
import { defaultScores } from "@/lib/quiz";
import type { DestinationStatus, Participant, TravelSession } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [destinationStatus, setDestinationStatus] = useState<DestinationStatus>("undecided");
  const [destination, setDestination] = useState("");
  const [departureArea, setDepartureArea] = useState("서울");
  const [scope, setScope] = useState("해외, 비행 4시간 이내");
  const [duration, setDuration] = useState("3박 4일");
  const [budget, setBudget] = useState("1인당 90만원");
  const [requirements, setRequirements] = useState("맛집, 사진, 자유시간이 적당히 있고 너무 빡빡하지 않은 여행");
  const [participantCount, setParticipantCount] = useState(4);
  const [names, setNames] = useState(["민아", "준호", "소라", "해린"]);
  const [maxCycles, setMaxCycles] = useState(5);

  const participantInputs = useMemo(() => Array.from({ length: participantCount }, (_, index) => names[index] || ""), [participantCount, names]);

  function updateName(index: number, value: string) {
    const next = [...names];
    next[index] = value;
    setNames(next);
  }

  function createSession() {
    const participants: Participant[] = participantInputs.map((name, index) => ({
      id: makeId("participant"),
      name: name || `참여자 ${index + 1}`,
      basicInfo: "",
      personalRequests: "",
      quizAnswers: {},
      quizScores: defaultScores,
      completed: false
    }));
    const session: TravelSession = {
      id: makeId("session"),
      destinationStatus,
      destination: destinationStatus === "fixed" ? destination : "",
      departureArea,
      scope,
      duration,
      budget,
      requirements,
      participants,
      settings: { maxNegotiationCycles: maxCycles, candidateCount: 3 }
    };
    saveState({ ...emptyState, session });
    router.push("/workspace");
  }

  function loadDemo() {
    saveState({ ...emptyState, session: createDemoSession() });
    router.push("/workspace");
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <h1>Persona Trip Council</h1>
          <p>참여자별 성향 테스트로 페르소나를 만들고, AI 회의로 여행지를 정합니다.</p>
        </div>
        <button className="btn secondary" onClick={loadDemo}>
          친구여행 예시 불러오기
        </button>
      </header>

      <div className="grid two">
        <section className="panel">
          <div className="section-title">
            <h2>여행 세션 만들기</h2>
            <span className="pill green">MVP</span>
          </div>

          <div className="field">
            <label>여행지 상태</label>
            <div className="segmented">
              <button className={`segment ${destinationStatus === "undecided" ? "active" : ""}`} onClick={() => setDestinationStatus("undecided")}>
                <strong>아직 미정</strong>
                <br />
                <span className="muted">페르소나들이 후보지부터 토론</span>
              </button>
              <button className={`segment ${destinationStatus === "fixed" ? "active" : ""}`} onClick={() => setDestinationStatus("fixed")}>
                <strong>이미 정함</strong>
                <br />
                <span className="muted">정해진 목적지에서 일정 조율</span>
              </button>
            </div>
          </div>

          {destinationStatus === "fixed" && (
            <div className="field">
              <label>정해진 여행지</label>
              <input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="예: 오사카" />
            </div>
          )}

          <div className="grid two">
            <div className="field">
              <label>출발지</label>
              <input value={departureArea} onChange={(event) => setDepartureArea(event.target.value)} />
            </div>
            <div className="field">
              <label>여행 범위</label>
              <input value={scope} onChange={(event) => setScope(event.target.value)} />
            </div>
          </div>

          <div className="grid two">
            <div className="field">
              <label>기간</label>
              <input value={duration} onChange={(event) => setDuration(event.target.value)} />
            </div>
            <div className="field">
              <label>예산</label>
              <input value={budget} onChange={(event) => setBudget(event.target.value)} />
            </div>
          </div>

          <div className="field">
            <label>전체 요구사항</label>
            <textarea value={requirements} onChange={(event) => setRequirements(event.target.value)} />
          </div>

          <div className="grid two">
            <div className="field">
              <label>참여자 수</label>
              <input type="number" min={1} max={8} value={participantCount} onChange={(event) => setParticipantCount(Number(event.target.value))} />
            </div>
            <div className="field">
              <label>최대 조율 횟수</label>
              <input type="number" min={1} max={5} value={maxCycles} onChange={(event) => setMaxCycles(Number(event.target.value))} />
            </div>
          </div>

          <div className="participants">
            {participantInputs.map((name, index) => (
              <div className="field" key={index}>
                <label>참여자 {index + 1}</label>
                <input value={name} onChange={(event) => updateName(index, event.target.value)} placeholder={`참여자 ${index + 1}`} />
              </div>
            ))}
          </div>

          <button className="btn" onClick={createSession} disabled={destinationStatus === "fixed" && !destination.trim()}>
            세션 생성하기
          </button>
        </section>

        <aside className="panel">
          <div className="section-title">
            <h3>데모 흐름</h3>
          </div>
          <div className="grid">
            <div className="card">1. 여행 기본 조건과 참여자를 입력합니다.</div>
            <div className="card">2. 참여자별 초대 링크처럼 보이는 테스트를 진행합니다.</div>
            <div className="card">3. 각 사람을 대표하는 페르소나가 생성됩니다.</div>
            <div className="card">4. 페르소나들이 목적지와 일정을 턴별로 조율합니다.</div>
            <div className="card">5. 최종 일자별 일정표를 편집하고 피드백으로 재토론합니다.</div>
          </div>
        </aside>
      </div>
    </main>
  );
}
