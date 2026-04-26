"use client";

import { useEffect, useRef, useState } from "react";
import PersonaModal from "@/app/components/PersonaModal";
import {
  AgentMessage,
  demoSession,
  generateItinerary,
  generateMessages,
  generatePersonas,
  Itinerary,
  Persona
} from "@/lib/travel";

const PERSONA_COLORS = ["#10a37f", "#3b82f6", "#f59e0b", "#ef4444", "#06b6d4"];
const MY_COLOR = "#7c3aed";
const FOLDERS_KEY = "triper-folders-v2";
const DEFAULT_FRIEND_PERSONAS = generatePersonas(demoSession());

type Folder = { id: string; name: string; personas: Persona[]; isOpen: boolean };
type SituationItem = { type: "situation"; id: string; content: string };
type AgentItem = AgentMessage & { type: "agent" };
type ChatItem = SituationItem | AgentItem;
type Place = { name: string; category: string; description: string; address: string; tags: string[] };
type ResultData = {
  destination: string;
  summary: string;
  personaDecisions: { name: string; stance: string }[];
  opinionShares: { personaId: string; name: string; percent: number; evidence: string[] }[];
  places: Place[];
  itinerary: Itinerary;
  budget: { label: string; amount: string }[];
};

function initFolders(): Folder[] {
  return [{
    id: "friends",
    name: "친구",
    personas: DEFAULT_FRIEND_PERSONAS,
    isOpen: true
  }];
}

function normalizeFolders(folders: Folder[]) {
  return folders.map((folder) => ({
    ...folder,
    name: folder.id === "friends" && folder.name === "친구 여행" ? "친구" : folder.name
  }));
}

function findMyPersonaId(personas: Persona[]) {
  return personas.find((persona) => persona.participantId.startsWith("me-"))?.id ?? "";
}

function personaColor(id: string, personas: Persona[], myId: string) {
  if (id === myId) return MY_COLOR;
  const idx = Math.max(0, personas.findIndex((persona) => persona.id === id));
  return PERSONA_COLORS[idx % PERSONA_COLORS.length];
}

function clonePersonaForFolder(persona: Persona): Persona {
  return { ...persona, preferences: [...persona.preferences], constraints: [...persona.constraints], priorities: [...persona.priorities] };
}

function inferDestination(situation: string) {
  if (/일본|도쿄|오사카|교토/.test(situation)) return "도쿄";
  if (/강릉/.test(situation)) return "강릉";
  if (/부산/.test(situation)) return "부산";
  return "여수";
}

function summarizePersonaDecision(persona: Persona, messages: AgentMessage[]) {
  const ownMessages = messages.filter((message) => message.speakerId === persona.id);
  const finalMessage = ownMessages.at(-1);
  if (finalMessage?.content) return finalMessage.content;
  return `${persona.priorities[0]}을 우선 반영하는 조건으로 합의에 참여했습니다.`;
}

function generateConsensusSummary(destination: string, personas: Persona[], messages: AgentMessage[]) {
  const finalVote = messages.findLast((message) => message.speechAct === "final_vote");
  const compromise = messages.findLast((message) => message.speechAct === "compromise" || message.speechAct === "agree");
  const anchor = finalVote?.content || compromise?.content || messages.at(-1)?.content;
  const priorities = personas
    .map((persona) => persona.priorities[0])
    .filter(Boolean)
    .slice(0, 4)
    .join(", ");

  if (anchor) {
    return `${destination}로 가는 쪽으로 기울었고, 대화에서 나온 "${anchor}" 흐름에 맞춰 ${priorities}을 일정에 나눠 넣었습니다.`;
  }
  return `${destination}로 가는 쪽으로 정리했고, ${priorities}을 일정에 나눠 넣었습니다.`;
}

function reflectionEvidence(persona: Persona, resultText: string) {
  const profile = [...persona.preferences, ...persona.priorities, ...persona.constraints].join(" ");
  const rules: Array<{ pattern: RegExp; result: RegExp; label: string }> = [
    { pattern: /맛집|식사|음식|미식|저녁/, result: /맛집|식사|저녁|포차|시장|순두부|초밥|해산물/, label: "먹을 곳" },
    { pattern: /카페|사진|분위기|야경|예쁜|감성/, result: /카페|사진|야경|전망|바다|오션뷰/, label: "사진/분위기" },
    { pattern: /로컬|골목|시장|현지|탐방/, result: /로컬|골목|시장|마을|산책/, label: "로컬 코스" },
    { pattern: /동선|이동|숙소|환승|편한|편의/, result: /숙소|근처|짧은 동선|이동|귀가|가벼운/, label: "이동/숙소" },
    { pattern: /예산|가성비|비용|비싼|가격/, result: /예산|왕복|만원|가성비|비싼/, label: "예산" },
    { pattern: /휴식|여유|쉬|피곤|무리|체력/, result: /휴식|여유|가벼운|무리|자유시간|쉬/, label: "휴식" }
  ];

  return rules
    .filter((rule) => rule.pattern.test(profile) && rule.result.test(resultText))
    .map((rule) => rule.label);
}

function calculateOpinionShares(personas: Persona[], messages: AgentMessage[], resultText: string) {
  const raw = personas.map((persona) => {
    const ownMessages = messages.filter((message) => message.speakerId === persona.id);
    const last = ownMessages.at(-1);
    const evidence = reflectionEvidence(persona, resultText);
    const support = typeof last?.supportLevel === "number" ? last.supportLevel : 72;
    const concern = typeof last?.concernLevel === "number" ? last.concernLevel : 24;
    const score = 10 + evidence.length * 7 + Math.max(0, support - concern) * 0.18 + Math.min(4, ownMessages.length);
    return { personaId: persona.id, name: persona.displayName, score, evidence };
  });
  const total = raw.reduce((sum, item) => sum + item.score, 0) || 1;
  const rounded = raw.map((item) => ({ ...item, percent: Math.max(5, Math.round((item.score / total) * 100)) }));
  const drift = 100 - rounded.reduce((sum, item) => sum + item.percent, 0);
  if (rounded[0]) rounded[0].percent += drift;
  return rounded.map(({ personaId, name, percent, evidence }) => ({
    personaId,
    name,
    percent,
    evidence: evidence.length ? evidence : ["기본 선호"]
  }));
}

function generateResult(situation: string, personas: Persona[], messages: AgentMessage[]): ResultData {
  const session = demoSession();
  const destination = inferDestination(situation);
  const summary = generateConsensusSummary(destination, personas, messages);
  const itinerary = {
    ...generateItinerary(session, destination),
    consensusSummary: summary,
    personaSatisfaction: Object.fromEntries(personas.map((persona) => {
      const last = messages.findLast((message) => message.speakerId === persona.id);
      const support = last ? last.supportLevel : 75;
      const concern = last ? last.concernLevel : 20;
      return [persona.id, Math.max(50, Math.min(98, Math.round(support - concern * 0.25)))];
    }))
  };
  const places: Record<string, Place[]> = {
    도쿄: [
      { name: "츠키지 장외시장", category: "맛집", description: "초밥, 해산물, 간식까지 한 번에 둘러보기 좋은 시장", address: "Tsukiji, Tokyo", tags: ["해산물", "시장", "아침"] },
      { name: "오모테산도 카페 거리", category: "카페", description: "사진과 휴식을 동시에 챙기기 좋은 카페 밀집 지역", address: "Jingumae, Tokyo", tags: ["카페", "사진", "휴식"] },
      { name: "아사쿠사", category: "관광", description: "전통 분위기와 산책 코스를 함께 즐길 수 있는 대표 명소", address: "Asakusa, Tokyo", tags: ["전통", "산책", "명소"] }
    ],
    강릉: [
      { name: "경포해변", category: "관광", description: "바다 산책과 사진을 모두 챙기기 좋은 강릉 대표 코스", address: "강원 강릉시", tags: ["바다", "사진", "산책"] },
      { name: "안목 커피거리", category: "카페", description: "오션뷰 카페가 많아 쉬어가기 좋음", address: "강원 강릉시 창해로", tags: ["카페", "오션뷰", "휴식"] },
      { name: "초당 순두부마을", category: "맛집", description: "부담 없이 함께 먹기 좋은 로컬 식사 코스", address: "강원 강릉시 초당동", tags: ["로컬", "식사", "가성비"] }
    ],
    부산: [
      { name: "흰여울문화마을", category: "관광", description: "바다 전망과 골목 산책이 좋은 사진 명소", address: "부산 영도구", tags: ["사진", "바다", "산책"] },
      { name: "광안리", category: "관광", description: "저녁 야경과 식사를 묶기 좋은 코스", address: "부산 수영구", tags: ["야경", "맛집", "해변"] },
      { name: "전포 카페거리", category: "카페", description: "개성 있는 카페와 편집숍이 모인 지역", address: "부산 부산진구", tags: ["카페", "로컬", "쇼핑"] }
    ],
    여수: [
      { name: "낭만포차 거리", category: "맛집", description: "저녁 식사와 바다 분위기를 함께 즐기기 좋은 곳", address: "전남 여수시", tags: ["맛집", "야경", "바다"] },
      { name: "오동도", category: "관광", description: "가볍게 걷기 좋은 대표 산책 코스", address: "전남 여수시 수정동", tags: ["산책", "자연", "사진"] },
      { name: "고소동 벽화마을", category: "관광", description: "언덕길에서 바다 전망과 사진을 챙길 수 있는 코스", address: "전남 여수시 고소동", tags: ["사진", "전망", "골목"] }
    ]
  };
  const resultText = [
    summary,
    ...places[destination].flatMap((place) => [place.name, place.category, place.description, ...place.tags]),
    ...itinerary.days.flatMap((day) => [day.morning, day.afternoon, day.evening]),
    ...itinerary.tradeoffs,
    ...itinerary.days.map((day) => day.morning + day.afternoon + day.evening),
    "예산 왕복 만원 숙소 식비 카페 체험"
  ].join(" ");

  return {
    destination,
    summary,
    personaDecisions: personas.map((persona) => ({
      name: persona.displayName,
      stance: summarizePersonaDecision(persona, messages)
    })),
    opinionShares: calculateOpinionShares(personas, messages, resultText),
    places: places[destination],
    itinerary,
    budget: [
      { label: "교통", amount: destination === "도쿄" ? "왕복 25만~40만원" : "왕복 4만~8만원" },
      { label: "숙소", amount: "1박 8만~15만원" },
      { label: "식비", amount: "1일 3만~6만원" },
      { label: "카페/체험", amount: "1일 1만~3만원" }
    ]
  };
}

export default function Home() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState("");
  const [lastTravelFolderId, setLastTravelFolderId] = useState("");
  const [myPersonaId, setMyPersonaId] = useState("");
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [personaModalFolderId, setPersonaModalFolderId] = useState<string | null>(null);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [result, setResult] = useState<ResultData | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastSituation, setLastSituation] = useState("");
  const feedRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const newFolderRef = useRef<HTMLInputElement>(null);

  const activePersonas = folders.find((folder) => folder.id === activeFolderId)?.personas ?? [];
  const targetTravelFolderId = activeFolderId !== "friends" ? activeFolderId : lastTravelFolderId || folders.find((folder) => folder.id !== "friends")?.id || "";
  const targetTravelFolder = folders.find((folder) => folder.id === targetTravelFolderId);

  useEffect(() => {
    const raw = localStorage.getItem(FOLDERS_KEY);
    const loaded: Folder[] = normalizeFolders(raw ? JSON.parse(raw) : initFolders());
    setFolders(loaded);
    setActiveFolderId(loaded[0]?.id ?? "");
    setLastTravelFolderId(loaded.find((folder) => folder.id !== "friends")?.id ?? "");
    setMyPersonaId(findMyPersonaId(loaded[0]?.personas ?? []));
  }, []);

  useEffect(() => {
    if (folders.length) localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [items, isStreaming]);

  useEffect(() => {
    if (addingFolder) newFolderRef.current?.focus();
  }, [addingFolder]);

  useEffect(() => {
    if (!isStreaming && items.some((item) => item.type === "agent") && lastSituation) {
      const agentMessages = items.filter((item): item is AgentItem => item.type === "agent");
      setResult(generateResult(lastSituation, activePersonas, agentMessages));
      window.setTimeout(() => setShowResult(true), 300);
    }
  }, [activePersonas, isStreaming, items, lastSituation]);

  function confirmAddFolder() {
    const name = newFolderName.trim();
    if (!name) {
      setAddingFolder(false);
      return;
    }
    const folder: Folder = { id: `folder-${Date.now()}`, name, personas: [], isOpen: true };
    setFolders((prev) => [...prev, folder]);
    setActiveFolderId(folder.id);
    setLastTravelFolderId(folder.id);
    setMyPersonaId("");
    setNewFolderName("");
    setAddingFolder(false);
    setItems([]);
    setResult(null);
    setShowResult(false);
  }

  function handlePersonaConfirm(folderId: string, persona: Persona) {
    setFolders((prev) => prev.map((folder) =>
      folder.id === folderId
        ? { ...folder, personas: [...folder.personas, persona], isOpen: true }
        : folder
    ));
    setActiveFolderId(folderId);
    setMyPersonaId(persona.id);
  }

  function addFriendToFolder(folderId: string, persona: Persona) {
    if (!folderId) return;
    setFolders((prev) => prev.map((folder) =>
      folder.id === folderId && !folder.personas.some((item) => item.id === persona.id)
        ? { ...folder, personas: [...folder.personas, clonePersonaForFolder(persona)], isOpen: true }
        : folder
    ));
    setActiveFolderId(folderId);
    setLastTravelFolderId(folderId);
    setItems([]);
    setResult(null);
    setShowResult(false);
  }

  function deletePersona(folderId: string, personaId: string) {
    setFolders((prev) => prev.map((folder) =>
      folder.id === folderId
        ? { ...folder, personas: folder.personas.filter((persona) => persona.id !== personaId) }
        : folder
    ));
    if (myPersonaId === personaId) setMyPersonaId("");
  }

  function deleteFolder(folderId: string) {
    if (folderId === "friends") return;
    setFolders((prev) => {
      const next = prev.filter((folder) => folder.id !== folderId);
      const nextActive = activeFolderId === folderId ? (next[0]?.id ?? "") : activeFolderId;
      setActiveFolderId(nextActive);
      setLastTravelFolderId(next.find((folder) => folder.id !== "friends")?.id ?? "");
      setMyPersonaId(findMyPersonaId(next.find((folder) => folder.id === nextActive)?.personas ?? []));
      return next;
    });
    setItems([]);
    setResult(null);
    setShowResult(false);
  }

  async function send() {
    if (!input.trim() || isStreaming || activePersonas.length === 0) return;
    const situation = input.trim();
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsStreaming(true);
    setShowResult(false);
    setLastSituation(situation);
    setItems((prev) => [...prev, { type: "situation", id: `sit-${Date.now()}`, content: situation }]);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personas: activePersonas, situation })
      });
      if (!response.ok) throw new Error("Gemini chat failed");
      const data = (await response.json()) as { messages: AgentMessage[] };
      const messages = data.messages.length ? data.messages : generateMessages(activePersonas, situation);
      messages.forEach((message, index) => {
        window.setTimeout(() => {
          setItems((prev) => [...prev, { ...message, type: "agent" }]);
          if (index === messages.length - 1) setIsStreaming(false);
        }, (index + 1) * 350);
      });
    } catch {
      const messages = generateMessages(activePersonas, situation);
      messages.forEach((message, index) => {
        window.setTimeout(() => {
          setItems((prev) => [...prev, { ...message, type: "agent" }]);
          if (index === messages.length - 1) setIsStreaming(false);
        }, (index + 1) * 350);
      });
    }
  }

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  const suggestions = [
    "우리 네 명이 강릉으로 2박 3일 가면 어떻게 짜면 좋을까?",
    "부산에서 맛집과 사진 명소를 둘 다 챙기고 싶어.",
    "예산은 아끼고 싶은데 숙소는 너무 불편하지 않았으면 좋겠어."
  ];

  return (
    <>
      <div className="app-shell">
        <aside className="sidebar">
          <a className="brand" href="/">
            <div className="brand-mark">T</div>
            <span>triper</span>
          </a>

          {!addingFolder ? (
            <button className="new-folder-btn" onClick={() => setAddingFolder(true)} type="button">
              <span>＋</span>
              새 여행 추가
            </button>
          ) : (
            <div className="cg-input-wrap">
              <input
                ref={newFolderRef}
                className="cg-input"
                value={newFolderName}
                onChange={(event) => setNewFolderName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") confirmAddFolder();
                  if (event.key === "Escape") setAddingFolder(false);
                }}
                placeholder="여행 이름"
              />
              <div className="cg-input-actions">
                <button className="cg-btn-confirm" onClick={confirmAddFolder} type="button">추가</button>
                <button className="cg-btn-cancel" onClick={() => setAddingFolder(false)} type="button">취소</button>
              </div>
            </div>
          )}

          <button
            className="new-folder-btn"
            onClick={() => setPersonaModalFolderId(activeFolderId || folders[0]?.id || "friends")}
            type="button"
          >
            <span>＋</span>
            내 페르소나 만들기
          </button>

          <div className="folder-divider" />

          <div className="folder-list">
            {folders.map((folder) => (
              <div key={folder.id} className="folder-item">
                <div
                  className={`folder-header ${activeFolderId === folder.id ? "active" : ""}`}
                  onClick={() => {
                    setActiveFolderId(folder.id);
                    if (folder.id !== "friends") setLastTravelFolderId(folder.id);
                    setFolders((prev) => prev.map((item) => item.id === folder.id ? { ...item, isOpen: !item.isOpen } : item));
                    setMyPersonaId(findMyPersonaId(folder.personas));
                    setItems([]);
                    setResult(null);
                    setShowResult(false);
                  }}
                >
                  <span className={`folder-chevron ${folder.isOpen ? "open" : ""}`}>›</span>
                  <span className="folder-name">{folder.name}</span>
                  {folder.id !== "friends" && (
                    <button
                      className="folder-delete"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteFolder(folder.id);
                      }}
                      title="여행 삭제"
                      type="button"
                    >
                      ×
                    </button>
                  )}
                  <button
                    className="folder-add-persona"
                    onClick={(event) => {
                      event.stopPropagation();
                      setPersonaModalFolderId(folder.id);
                    }}
                    title="내 페르소나 만들기"
                    type="button"
                  >
                    ＋
                  </button>
                </div>

                {folder.isOpen && (
                  <div className="persona-tree">
                    {folder.personas.map((persona) => {
                      const isMe = persona.id === myPersonaId && activeFolderId === folder.id;
                      const color = personaColor(persona.id, folder.personas, myPersonaId);
                      return (
                        <button
                          key={persona.id}
                          className={`persona-tree-item ${isMe ? "active" : ""}`}
                          onClick={() => {
                            setActiveFolderId(folder.id);
                            if (folder.id !== "friends") setLastTravelFolderId(folder.id);
                            setMyPersonaId(persona.participantId.startsWith("me-") ? persona.id : findMyPersonaId(folder.personas));
                          }}
                          type="button"
                        >
                          <div className="avatar-xs" style={{ background: color }}>{persona.displayName.slice(0, 1)}</div>
                          <span className="persona-tree-name">{persona.displayName}</span>
                          {isMe && <span className="me-badge">나</span>}
                          {folder.id === "friends" && persona.participantId.startsWith("p-") && targetTravelFolderId && (
                            targetTravelFolder?.personas.some((item) => item.id === persona.id) ? (
                              <span className="friend-added-mark" title={`${targetTravelFolder.name}에 추가됨`}>✓</span>
                            ) : (
                              <span
                                className="friend-inline-add"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  addFriendToFolder(targetTravelFolderId, persona);
                                }}
                                title={`${targetTravelFolder?.name ?? "여행"}에 추가`}
                              >
                                +
                              </span>
                            )
                          )}
                          {(folder.id !== "friends" || !persona.participantId.startsWith("p-")) && (
                            <span
                              className="persona-delete"
                              onClick={(event) => {
                                event.stopPropagation();
                                deletePersona(folder.id, persona.id);
                              }}
                              title="페르소나 삭제"
                            >
                              ×
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        <div className="chat-result-wrapper">
          <main className="chat-main">
            {items.length === 0 ? (
              <div className="chat-empty">
                <div className="chat-empty-icon">✈️</div>
                <h2 className="chat-empty-title">여행에서 고민되는 상황을 알려주세요!</h2>
                <p className="chat-empty-sub">친구의 취향을 반영한 페르소나들이 각자 취향에 맞춰 의견을 냅니다.</p>
                <div className="chat-suggestions">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      className="suggestion-chip"
                      onClick={() => {
                        setInput(suggestion);
                        textareaRef.current?.focus();
                      }}
                      type="button"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="chat-feed-full" ref={feedRef}>
                {items.map((item) => {
                  if (item.type === "situation") {
                    return (
                      <div key={item.id} className="chat-situation">
                        <span className="chat-situation-text">{item.content}</span>
                      </div>
                    );
                  }
                  const isMe = item.speakerId === myPersonaId;
                  const persona = activePersonas.find((candidate) => candidate.id === item.speakerId);
                  const color = personaColor(item.speakerId, activePersonas, myPersonaId);
                  return (
                    <div key={item.id} className={`chat-msg ${isMe ? "chat-msg-right" : "chat-msg-left"}`}>
                      {!isMe && <div className="avatar avatar-chat" style={{ background: color }}>{persona?.displayName.slice(0, 1)}</div>}
                      <div className="chat-bubble-wrap">
                        {!isMe && <span className="chat-name" style={{ color }}>{persona?.displayName}</span>}
                        <div className={isMe ? "chat-bubble chat-bubble-mine" : "chat-bubble"}>{item.content}</div>
                      </div>
                      {isMe && <div className="avatar avatar-chat avatar-mine">{persona?.displayName.slice(0, 1)}</div>}
                    </div>
                  );
                })}
                {isStreaming && (
                  <div className="chat-msg chat-msg-left">
                    <div className="avatar avatar-chat" style={{ background: "#e4e4e7", color: "#71717a" }}>…</div>
                    <div className="chat-bubble typing-bubble">
                      <span className="dot" /><span className="dot" /><span className="dot" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {result && !showResult && (
              <div className="result-reopen-bar">
                <button className="result-reopen-btn" onClick={() => setShowResult(true)} type="button">
                  <strong>{result.destination}</strong> 결과 보기
                </button>
              </div>
            )}

            <div className="composer">
              <div className="composer-box">
                <textarea
                  ref={textareaRef}
                  value={input}
                  rows={1}
                  onChange={(event) => {
                    setInput(event.target.value);
                    autoResize();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      send();
                    }
                  }}
                  placeholder={activePersonas.length === 0 ? "내 페르소나를 먼저 만들어 주세요" : "여행 상황을 입력하세요"}
                  disabled={activePersonas.length === 0}
                />
                <button className="send-btn" onClick={send} disabled={!input.trim() || isStreaming || activePersonas.length === 0} type="button" aria-label="전송">
                  ↑
                </button>
              </div>
              <p className="composer-hint">Enter로 전송 · Shift+Enter로 줄바꿈</p>
            </div>
          </main>

          <aside className={`result-panel ${showResult ? "open" : ""}`}>
            {result && (
              <div className="result-inner">
                <div className="result-header">
                  <div>
                    <p className="result-label">페르소나 합의 결과</p>
                    <h2 className="result-destination">{result.destination}</h2>
                  </div>
                  <button className="result-close" onClick={() => setShowResult(false)} type="button">×</button>
                </div>

                <div className="result-section">
                  <p className="result-section-title">요약</p>
                  <p className="result-summary">{result.summary}</p>
                  <div className="opinion-share-list">
                    {result.opinionShares.map((share) => {
                      const color = personaColor(share.personaId, activePersonas, myPersonaId);
                      return (
                        <div className="opinion-share-row" key={share.personaId}>
                          <div className="opinion-share-head">
                            <span className="opinion-share-name">{share.name}</span>
                            <span className="opinion-share-percent">{share.percent}%</span>
                          </div>
                          <div className="opinion-share-bar-wrap">
                            <div className="opinion-share-bar" style={{ width: `${share.percent}%`, background: color }} />
                          </div>
                          <p className="opinion-share-evidence">{share.evidence.join(" · ")}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="consensus-list">
                    {result.personaDecisions.map((decision) => (
                      <p key={decision.name} className="consensus-item">
                        <strong>{decision.name}</strong>
                        <span>{decision.stance}</span>
                      </p>
                    ))}
                  </div>
                </div>
                <div className="result-divider" />

                <div className="result-section">
                  <p className="result-section-title">추천 장소</p>
                  <div className="place-list">
                    {result.places.map((place) => (
                      <div key={place.name} className="place-card">
                        <div className="place-head">
                          <span className="place-icon">{place.category === "맛집" ? "🍽" : place.category === "카페" ? "☕" : "📍"}</span>
                          <div className="place-meta">
                            <strong className="place-name">{place.name}</strong>
                            <span className="place-category">{place.category}</span>
                          </div>
                        </div>
                        <p className="place-desc">{place.description}</p>
                        <p className="place-address">{place.address}</p>
                        <div className="place-tags">
                          {place.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="result-divider" />

                <div className="result-section">
                  <p className="result-section-title">일정</p>
                  <div className="result-days">
                    {result.itinerary.days.map((day) => (
                      <div key={day.day} className="result-day">
                        <p className="result-day-label">Day {day.day}</p>
                        <div className="result-slots">
                          <div className="result-slot"><span className="slot-label">오전</span><span className="slot-text">{day.morning}</span></div>
                          <div className="result-slot"><span className="slot-label">오후</span><span className="slot-text">{day.afternoon}</span></div>
                          <div className="result-slot"><span className="slot-label">저녁</span><span className="slot-text">{day.evening}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="result-divider" />

                <div className="result-section">
                  <p className="result-section-title">예산</p>
                  <div className="budget-list">
                    {result.budget.map((item) => (
                      <div key={item.label} className="budget-row">
                        <span className="budget-label">{item.label}</span>
                        <span className="budget-amount">{item.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {personaModalFolderId && (
        <PersonaModal
          folderId={personaModalFolderId}
          onConfirm={handlePersonaConfirm}
          onClose={() => setPersonaModalFolderId(null)}
        />
      )}
    </>
  );
}
