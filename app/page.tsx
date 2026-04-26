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

/* ── Palette ─────────────────────────────────────────── */

const PERSONA_COLORS = [
  "#10a37f","#3b82f6","#f59e0b","#ef4444",
  "#ec4899","#06b6d4","#84cc16","#f97316",
];
const MY_COLOR = "#7c3aed";

function personaColor(id: string, personas: Persona[], myId: string) {
  if (id === myId) return MY_COLOR;
  const idx = personas.findIndex((p) => p.id === id);
  return PERSONA_COLORS[idx % PERSONA_COLORS.length];
}

/* ── Result types ────────────────────────────────────── */

type Place = {
  name: string;
  category: "맛집" | "카페" | "관광지" | "숙소" | "체험";
  description: string;
  address: string;
  tags: string[];
};

type ResultData = {
  destination: string;
  summary: string;
  places: Place[];
  itinerary: Itinerary;
  budget: { label: string; amount: string }[];
};

const CATEGORY_ICON: Record<Place["category"], string> = {
  맛집: "🍽️", 카페: "☕", 관광지: "🗺️", 숙소: "🏨", 체험: "🎯",
};

function generateResult(situation: string, personas: Persona[]): ResultData {
  const isJapan = /일본|도쿄|오사카|교토/.test(situation);
  const isGangneung = /강릉/.test(situation);
  const dest = isJapan ? "도쿄" : isGangneung ? "강릉" : "여수";

  const placeSets: Record<string, Place[]> = {
    도쿄: [
      { name: "츠키지 시장", category: "맛집", description: "신선한 해산물 덮밥과 꼬치구이로 유명한 도쿄 최대 수산시장", address: "Tsukiji, Chuo City, Tokyo", tags: ["해산물","아침식사","시장"] },
      { name: "이치란 라멘 시부야점", category: "맛집", description: "1인 부스 구조의 진한 돼지뼈 라멘 전문점", address: "Dogenzaka, Shibuya, Tokyo", tags: ["라멘","혼밥","늦은저녁"] },
      { name: "오모테산도 카페 키츠네", category: "카페", description: "패션 브랜드가 운영하는 감각적인 테이크아웃 카페", address: "Jingumae, Shibuya, Tokyo", tags: ["인스타","산책","라테"] },
      { name: "센소지", category: "관광지", description: "도쿄에서 가장 오래된 사원, 나카미세 쇼핑 거리와 연결", address: "Asakusa, Taito City, Tokyo", tags: ["전통","야경","무료입장"] },
      { name: "호텔 그레이스리 신주쿠", category: "숙소", description: "고질라 헤드로 유명한 관광 중심지 신주쿠 위치 호텔", address: "Kabukicho, Shinjuku, Tokyo", tags: ["접근성","관광지근처"] },
    ],
    강릉: [
      { name: "교동반점", category: "맛집", description: "60년 전통 강릉식 짬뽕·짜장. 현지인이 즐겨 찾는 노포", address: "강원 강릉시 교동", tags: ["노포","현지맛집","짬뽕"] },
      { name: "테라로사 경포호점", category: "카페", description: "경포호 뷰가 압도적인 스페셜티 커피 본점", address: "강원 강릉시 구정면", tags: ["오션뷰","스페셜티","사진"] },
      { name: "경포대 해변", category: "관광지", description: "강릉 대표 해변, 일출 명소이자 산책로가 잘 정비됨", address: "강원 강릉시 강문동", tags: ["해변","일출","산책"] },
      { name: "주문진 수산시장", category: "맛집", description: "오징어·회 등 동해 해산물을 저렴하게 즐길 수 있는 재래시장", address: "강원 강릉시 주문진읍", tags: ["시장","해산물","점심"] },
      { name: "씨마크 호텔", category: "숙소", description: "오션뷰 객실과 수영장을 갖춘 강릉 대표 리조트 호텔", address: "강원 강릉시 강문동", tags: ["오션뷰","조식","럭셔리"] },
    ],
    여수: [
      { name: "이순신광장 포장마차 골목", category: "맛집", description: "여수 밤바다를 보며 먹는 돌게장·게장정식 골목", address: "전남 여수시 교동", tags: ["야경","게장","야식"] },
      { name: "하멜등대 카페", category: "카페", description: "돌산도 뷰포인트에 자리한 오션뷰 루프탑 카페", address: "전남 여수시 돌산읍", tags: ["루프탑","오션뷰","일몰"] },
      { name: "향일암", category: "관광지", description: "일출 명소로 유명한 절벽 위 암자, 계단 트레킹 포함", address: "전남 여수시 돌산읍", tags: ["일출","트레킹","사찰"] },
      { name: "여수 낭만포차", category: "체험", description: "여수 밤바다 감성 야시장, 해산물 안주와 칵테일", address: "전남 여수시 수정동", tags: ["야시장","야경","칵테일"] },
      { name: "히든베이 호텔", category: "숙소", description: "여수 앞바다 조망 오션뷰 스위트 호텔", address: "전남 여수시 돌산읍", tags: ["오션뷰","조식포함"] },
    ],
  };

  const session = demoSession();
  session.duration = 3;
  const itinerary = generateItinerary(session, dest);

  return {
    destination: dest,
    summary: isJapan
      ? "도쿄 맛집 탐방과 전통 문화 체험을 균형 있게 배치했습니다. 예산은 1인 80만원 내외로 숙소 2박을 신주쿠에 고정합니다."
      : isGangneung
      ? "경포 해변 중심으로 동선을 최소화하고, 맛집과 카페를 오전·오후로 나눠 여유롭게 다닙니다."
      : "여수 밤바다와 향일암 일출을 핵심 경험으로 잡고, 낮엔 해산물 시장·카페 루프탑으로 채웁니다.",
    places: placeSets[dest] ?? placeSets["여수"],
    itinerary,
    budget: isJapan
      ? [{ label: "항공", amount: "왕복 25만~35만원" }, { label: "숙소", amount: "1박 7만~12만원" }, { label: "식비", amount: "1일 4만~6만원" }, { label: "교통·관광", amount: "1일 2만~3만원" }]
      : [{ label: "교통", amount: "왕복 4만~6만원" }, { label: "숙소", amount: "1박 8만~15만원" }, { label: "식비", amount: "1일 3만~5만원" }, { label: "카페·체험", amount: "1일 1만~2만원" }],
  };
}

/* ── Folder / chat types ─────────────────────────────── */

type Folder = { id: string; name: string; personas: Persona[]; isOpen: boolean };
type SituationItem = { type: "situation"; id: string; content: string };
type AgentItem = AgentMessage & { type: "agent" };
type ChatItem = SituationItem | AgentItem;

const FOLDERS_KEY = "persona-travel-folders";

function initFolders(): Folder[] {
  const personas = generatePersonas(demoSession());
  return [{ id: "demo", name: "친구여행 예시", personas, isOpen: true }];
}

/* ── Component ───────────────────────────────────────── */

export default function Home() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState("");
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

  useEffect(() => {
    const raw = localStorage.getItem(FOLDERS_KEY);
    const loaded: Folder[] = raw ? JSON.parse(raw) : initFolders();
    setFolders(loaded);
    const first = loaded[0];
    if (first) { setActiveFolderId(first.id); setMyPersonaId(first.personas[0]?.id ?? ""); }
  }, []);

  useEffect(() => {
    if (folders.length) localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [items, isStreaming]);

  useEffect(() => { if (addingFolder) newFolderRef.current?.focus(); }, [addingFolder]);

  /* Result: show after streaming ends */
  useEffect(() => {
    if (!isStreaming && items.some((i) => i.type === "agent") && lastSituation) {
      const r = generateResult(lastSituation, activePersonas);
      setResult(r);
      setTimeout(() => setShowResult(true), 400);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming]);

  const activePersonas = folders.find((f) => f.id === activeFolderId)?.personas ?? [];

  /* ── Folder ─────────────────────────────────────── */

  function confirmAddFolder() {
    const name = newFolderName.trim();
    if (!name) { setAddingFolder(false); return; }
    const f: Folder = { id: `folder-${Date.now()}`, name, personas: [], isOpen: true };
    setFolders((prev) => [...prev, f]);
    setActiveFolderId(f.id); setMyPersonaId("");
    setNewFolderName(""); setAddingFolder(false); setItems([]);
    setShowResult(false); setResult(null);
  }

  function toggleFolder(id: string) {
    setFolders((prev) => prev.map((f) => f.id === id ? { ...f, isOpen: !f.isOpen } : f));
  }

  function deleteFolder(id: string) {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    if (activeFolderId === id) {
      setActiveFolderId(""); setMyPersonaId(""); setItems([]); setShowResult(false); setResult(null);
    }
  }

  function deletePersona(folderId: string, personaId: string) {
    setFolders((prev) => prev.map((f) =>
      f.id === folderId ? { ...f, personas: f.personas.filter((p) => p.id !== personaId) } : f
    ));
    if (myPersonaId === personaId) setMyPersonaId("");
  }

  /* ── Persona ─────────────────────────────────────── */

  function handlePersonaConfirm(folderId: string, persona: Persona) {
    setFolders((prev) => prev.map((f) =>
      f.id === folderId ? { ...f, personas: [...f.personas, persona], isOpen: true } : f
    ));
    if (folderId === activeFolderId && !myPersonaId) setMyPersonaId(persona.id);
  }

  /* ── Chat ─────────────────────────────────────────── */

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  function send() {
    if (!input.trim() || isStreaming || activePersonas.length === 0) return;
    const situation = input.trim();
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsStreaming(true);
    setShowResult(false);
    setLastSituation(situation);
    setItems((prev) => [...prev, { type: "situation", id: `sit-${Date.now()}`, content: situation }]);
    const msgs = generateMessages(activePersonas, situation);
    msgs.forEach((msg, i) => {
      setTimeout(() => {
        setItems((prev) => [...prev, { ...msg, type: "agent" }]);
        if (i === msgs.length - 1) setIsStreaming(false);
      }, (i + 1) * 950);
    });
  }

  const SUGGESTIONS = [
    "우리는 일본을 가기로 했는데 도쿄에서 어떤 맛집을 갈지 모르겠어",
    "강릉 2박 3일 일정 어떻게 짜면 좋을까?",
    "예산이 빠듯한데 숙소와 식사 어디서 줄여야 할까?",
  ];

  /* ── Render ───────────────────────────────────────── */

  return (
    <>
    <div className="app-shell">

      {/* ── Sidebar ───────────────────────────────── */}
      <aside className="sidebar">
        <a className="brand" href="/">
          <div className="brand-mark">F</div>
          <span>Fourest</span>
        </a>

        {!addingFolder ? (
          <button className="new-folder-btn" onClick={() => { setAddingFolder(true); setNewFolderName(""); }} type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            새 여행 추가
          </button>
        ) : (
          <div className="cg-input-wrap">
            <input ref={newFolderRef} className="cg-input" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") confirmAddFolder(); if (e.key === "Escape") setAddingFolder(false); }} placeholder="여행 이름…" />
            <div className="cg-input-actions">
              <button className="cg-btn-confirm" onClick={confirmAddFolder} type="button">추가</button>
              <button className="cg-btn-cancel" onClick={() => setAddingFolder(false)} type="button">취소</button>
            </div>
          </div>
        )}

        <div className="folder-divider" />

        <div className="folder-list">
          {folders.map((folder) => (
            <div key={folder.id} className="folder-item">
              <div className={`folder-header ${activeFolderId === folder.id ? "active" : ""}`} onClick={() => { setActiveFolderId(folder.id); toggleFolder(folder.id); if (folder.personas[0]) setMyPersonaId(folder.personas[0].id); setItems([]); setShowResult(false); setResult(null); }}>
                <svg className={`folder-chevron ${folder.isOpen ? "open" : ""}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                <span className="folder-name">{folder.name}</span>
                <button className="folder-add-persona" onClick={(e) => { e.stopPropagation(); setPersonaModalFolderId(folder.id); setFolders((prev) => prev.map((f) => f.id === folder.id ? { ...f, isOpen: true } : f)); }} title="페르소나 추가" type="button">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </button>
                <button className="folder-delete" onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }} title="폴더 삭제" type="button">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                </button>
              </div>

              {folder.isOpen && (
                <div className="persona-tree">
                  {folder.personas.map((p) => {
                    const isMe = p.id === myPersonaId && activeFolderId === folder.id;
                    const color = personaColor(p.id, folder.personas, myPersonaId);
                    return (
                      <button key={p.id} className={`persona-tree-item ${isMe ? "active" : ""}`} onClick={() => { setActiveFolderId(folder.id); setMyPersonaId(p.id); }} type="button">
                        <div className="avatar-xs" style={{ background: isMe ? MY_COLOR : color }}>{p.displayName.slice(0, 1)}</div>
                        <span className="persona-tree-name">{p.displayName}</span>
                        {isMe && <span className="me-badge">나</span>}
                        <button className="persona-delete" onClick={(e) => { e.stopPropagation(); deletePersona(folder.id, p.id); }} title="페르소나 삭제" type="button">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* ── Chat + Result wrapper ──────────────────── */}
      <div className="chat-result-wrapper">

        {/* ── Chat Main ───────────────────────────── */}
        <main className="chat-main">
          {items.length === 0 && (
            <div className="chat-empty">
              <div className="chat-empty-icon">✈️</div>
              <h2 className="chat-empty-title">페르소나들에게 상황을 알려주세요</h2>
              <p className="chat-empty-sub">여행 상황을 입력하면 각 페르소나가 실시간으로 토론합니다.</p>
              <div className="chat-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="suggestion-chip" onClick={() => { setInput(s); textareaRef.current?.focus(); }} type="button">{s}</button>
                ))}
              </div>
            </div>
          )}

          {items.length > 0 && (
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
                const persona = activePersonas.find((p) => p.id === item.speakerId);
                const color = personaColor(item.speakerId, activePersonas, myPersonaId);
                return (
                  <div key={item.id} className={`chat-msg ${isMe ? "chat-msg-right" : "chat-msg-left"}`}>
                    {!isMe && <div className="avatar avatar-chat" style={{ background: color }}>{persona?.displayName.slice(0, 1)}</div>}
                    <div className="chat-bubble-wrap">
                      {!isMe && <span className="chat-name" style={{ color }}>{persona?.displayName}</span>}
                      <div className="chat-bubble" style={isMe ? { background: MY_COLOR, borderColor: MY_COLOR, color: "#fff", borderRadius: "18px 18px 4px 18px" } : {}}>
                        {item.content}
                      </div>
                      <span className={`chat-act ${isMe ? "chat-act-right" : ""}`}>{item.speechAct}</span>
                    </div>
                    {isMe && <div className="avatar avatar-chat" style={{ background: MY_COLOR }}>{persona?.displayName.slice(0, 1)}</div>}
                  </div>
                );
              })}

              {isStreaming && (
                <div className="chat-msg chat-msg-left">
                  <div className="avatar avatar-chat" style={{ background: "#e4e4e7", color: "#71717a" }}>·</div>
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
                <span>✈️</span>
                <strong>{result.destination}</strong> 결론 보기
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          )}

          <div className="composer">
            <div className="composer-box">
              <textarea ref={textareaRef} value={input} rows={1}
                onChange={(e) => { setInput(e.target.value); autoResize(); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={activePersonas.length === 0 ? "왼쪽에서 여행을 추가하고 페르소나를 만들어주세요" : "여행 상황을 입력하세요…"}
                disabled={activePersonas.length === 0}
              />
              <button className="send-btn" onClick={send} disabled={!input.trim() || isStreaming || activePersonas.length === 0} type="button" aria-label="전송">↑</button>
            </div>
            <p className="composer-hint">Enter로 전송 · Shift+Enter로 줄바꿈</p>
          </div>
        </main>

        {/* ── Result Panel ────────────────────────── */}
        <aside className={`result-panel ${showResult ? "open" : ""}`}>
          {result && (
            <div className="result-inner">
              {/* Header */}
              <div className="result-header">
                <div>
                  <p className="result-label">페르소나 합의 결론</p>
                  <h2 className="result-destination">{result.destination}</h2>
                </div>
                <button className="result-close" onClick={() => setShowResult(false)} type="button">✕</button>
              </div>

              {/* Summary */}
              <div className="result-section">
                <p className="result-section-title">합의 요약</p>
                <p className="result-summary">{result.summary}</p>
              </div>

              <div className="result-divider" />

              {/* Places */}
              <div className="result-section">
                <p className="result-section-title">추천 장소</p>
                <div className="place-list">
                  {result.places.map((place) => (
                    <div key={place.name} className="place-card">
                      <div className="place-head">
                        <span className="place-icon">{CATEGORY_ICON[place.category]}</span>
                        <div className="place-meta">
                          <strong className="place-name">{place.name}</strong>
                          <span className="place-category">{place.category}</span>
                        </div>
                      </div>
                      <p className="place-desc">{place.description}</p>
                      <p className="place-address">📍 {place.address}</p>
                      <div className="place-tags">
                        {place.tags.map((t) => <span key={t} className="tag">{t}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="result-divider" />

              {/* Itinerary */}
              <div className="result-section">
                <p className="result-section-title">일자별 일정</p>
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

              {/* Budget */}
              <div className="result-section">
                <p className="result-section-title">예산 가이드 (1인)</p>
                <div className="budget-list">
                  {result.budget.map((b) => (
                    <div key={b.label} className="budget-row">
                      <span className="budget-label">{b.label}</span>
                      <span className="budget-amount">{b.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="result-divider" />

              {/* Persona satisfaction */}
              <div className="result-section">
                <p className="result-section-title">페르소나 만족도</p>
                <div className="satisfaction-list">
                  {activePersonas.map((p, i) => {
                    const color = personaColor(p.id, activePersonas, myPersonaId);
                    const score = 72 + i * 6;
                    return (
                      <div key={p.id} className="satisfaction-row">
                        <div className="avatar-xs" style={{ background: color }}>{p.displayName.slice(0, 1)}</div>
                        <span className="satisfaction-name">{p.displayName}</span>
                        <div className="satisfaction-bar-wrap">
                          <div className="satisfaction-bar" style={{ width: `${score}%`, background: color }} />
                        </div>
                        <span className="satisfaction-score">{score}%</span>
                      </div>
                    );
                  })}
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
