"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { buildTravelTypeResult, defaultScores, scoreQuiz } from "@/lib/quiz";
import { makeId } from "@/lib/mock";
import { emptyState, saveState } from "@/lib/storage";
import type { DestinationStatus, Participant, TravelSession } from "@/lib/types";

type PersonaFriend = {
  id: string;
  name: string;
  avatar: string;
  color: string;
  basicInfo: Participant["basicInfo"];
  healthNote: string;
  foodNote: string;
  mobilityNote: string;
  personalRequests: string;
  quizAnswers: Record<string, string>;
};

const personaFriends: PersonaFriend[] = [
  {
    id: "friend_jimin",
    name: "지민",
    avatar: "지",
    color: "#7c3aed",
    basicInfo: { gender: "여성", ageGroup: "20대", relationship: "친구" },
    healthNote: "체력은 보통이고 너무 이른 아침 일정은 힘들어함",
    foodNote: "디저트와 카페를 좋아함",
    mobilityNote: "도보 이동은 가능하지만 환승 많은 코스는 싫어함",
    personalRequests: "예쁜 사진을 남길 수 있는 장소와 야경을 중요하게 생각함",
    quizAnswers: {
      morning_plan: "keep_one",
      one_empty_slot: "pretty_cafe",
      dinner_choice: "split_food",
      hotel_tradeoff: "unique_stay",
      rainy_day: "rain_photo",
      hidden_place: "check_reviews",
      photo_delay: "photo_time",
      budget_issue: "save_elsewhere",
      planning_style: "rough_plan",
      group_conflict: "one_each",
      souvenir_time: "last_photo",
      best_memory: "group_happy"
    }
  },
  {
    id: "friend_doyoon",
    name: "도윤",
    avatar: "도",
    color: "#3b82f6",
    basicInfo: { gender: "남성", ageGroup: "20대", relationship: "친구" },
    healthNote: "많이 걸어도 괜찮고 활동적인 일정을 선호함",
    foodNote: "현지 맛집과 유명 식당을 중요하게 봄",
    mobilityNote: "이동이 길어도 좋은 경험이면 수용 가능",
    personalRequests: "하루 한 끼는 꼭 기억에 남는 맛집이면 좋겠음",
    quizAnswers: {
      morning_plan: "move_now",
      one_empty_slot: "famous_spot",
      dinner_choice: "wait_food",
      hotel_tradeoff: "middle_hotel",
      rainy_day: "food_tour",
      hidden_place: "try_local",
      photo_delay: "time_limit",
      budget_issue: "worth_it",
      planning_style: "must_book_food",
      group_conflict: "my_pick",
      souvenir_time: "last_food",
      best_memory: "best_meal"
    }
  },
  {
    id: "friend_seoa",
    name: "서아",
    avatar: "서",
    color: "#f59e0b",
    basicInfo: { gender: "여성", ageGroup: "20대", relationship: "친구" },
    healthNote: "무리한 일정은 싫어하고 중간 휴식이 필요함",
    foodNote: "음식은 무난하면 괜찮지만 분위기 좋은 곳을 선호함",
    mobilityNote: "숙소와 관광지 동선이 단순한 것을 선호함",
    personalRequests: "너무 빡빡하지 않고 카페나 쉬는 시간이 있었으면 함",
    quizAnswers: {
      morning_plan: "slow_cafe",
      one_empty_slot: "rest_lobby",
      dinner_choice: "nearby_food",
      hotel_tradeoff: "central_hotel",
      rainy_day: "hotel_rest",
      hidden_place: "ask_group",
      photo_delay: "photo_time",
      budget_issue: "save_elsewhere",
      planning_style: "rough_plan",
      group_conflict: "one_each",
      souvenir_time: "airport_early",
      best_memory: "rested"
    }
  },
  {
    id: "friend_minjun",
    name: "민준",
    avatar: "민",
    color: "#ef4444",
    basicInfo: { gender: "남성", ageGroup: "20대", relationship: "친구" },
    healthNote: "체력은 좋지만 너무 비싼 선택은 부담스러워함",
    foodNote: "비싼 맛집보다 가성비 좋은 로컬 식당 선호",
    mobilityNote: "대중교통 이동은 괜찮지만 택시비 낭비는 싫어함",
    personalRequests: "예산 안에서 최대한 만족도 높은 여행을 원함",
    quizAnswers: {
      morning_plan: "keep_one",
      one_empty_slot: "local_walk",
      dinner_choice: "budget_food",
      hotel_tradeoff: "cheap_hotel",
      rainy_day: "museum",
      hidden_place: "check_reviews",
      photo_delay: "time_limit",
      budget_issue: "change_destination",
      planning_style: "make_plan",
      group_conflict: "vote",
      souvenir_time: "souvenir",
      best_memory: "many_places"
    }
  },
  {
    id: "friend_yongho",
    name: "용호",
    avatar: "용",
    color: "#ec4899",
    basicInfo: { gender: "남성", ageGroup: "20대", relationship: "친구" },
    healthNote: "전체 분위기와 동행자 만족도를 많이 신경 씀",
    foodNote: "못 먹는 음식은 거의 없고 선택을 잘 맞춰줌",
    mobilityNote: "동행자 상태에 맞춰 이동 방식을 조정하는 편",
    personalRequests: "각자 원하는 게 하나씩은 반영되는 여행이면 좋겠음",
    quizAnswers: {
      morning_plan: "free_time",
      one_empty_slot: "pretty_cafe",
      dinner_choice: "split_food",
      hotel_tradeoff: "middle_hotel",
      rainy_day: "museum",
      hidden_place: "ask_group",
      photo_delay: "split_photo",
      budget_issue: "save_elsewhere",
      planning_style: "rough_plan",
      group_conflict: "one_each",
      souvenir_time: "souvenir",
      best_memory: "group_happy"
    }
  }
];

export default function HomePage() {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState(["friend_jimin", "friend_doyoon", "friend_seoa", "friend_minjun"]);
  const [prompt, setPrompt] = useState("우리는 일본을 가기로 했는데 도쿄에서 어떤 맛집을 갈지 모르겠어");
  const [destinationStatus, setDestinationStatus] = useState<DestinationStatus>("undecided");
  const [destination, setDestination] = useState("");
  const [departureArea, setDepartureArea] = useState("서울");
  const [scope, setScope] = useState("해외, 비행 4시간 이내");
  const [duration, setDuration] = useState("3박 4일");
  const [budget, setBudget] = useState("1인당 90만원");
  const [maxCycles, setMaxCycles] = useState(5);

  const selectedFriends = useMemo(() => personaFriends.filter((friend) => selectedIds.includes(friend.id)), [selectedIds]);

  function toggleFriend(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function friendToParticipant(friend: PersonaFriend): Participant {
    const quizScores = scoreQuiz(friend.quizAnswers);
    return {
      id: friend.id,
      name: friend.name,
      basicInfo: friend.basicInfo,
      healthNote: friend.healthNote,
      foodNote: friend.foodNote,
      mobilityNote: friend.mobilityNote,
      personalRequests: friend.personalRequests,
      quizAnswers: friend.quizAnswers,
      quizScores,
      travelTypeResult: buildTravelTypeResult(friend.quizAnswers),
      completed: true
    };
  }

  function startTrip() {
    const participants = selectedFriends.map(friendToParticipant);
    const session: TravelSession = {
      id: makeId("session"),
      destinationStatus,
      destination: destinationStatus === "fixed" ? destination : "",
      departureArea,
      scope,
      duration,
      budget,
      requirements: prompt,
      participants,
      settings: { maxNegotiationCycles: maxCycles, candidateCount: 3 }
    };
    saveState({ ...emptyState, session });
    router.push("/workspace");
  }

  return (
    <main className="app-layout">
      <aside className="sidebar">
        <div className="side-brand">
          <div className="brand-mark">PT</div>
          <strong>Persona Travel</strong>
        </div>
        <button className="side-action" onClick={() => router.push(`/participant/me_${Date.now()}`)}>
          <span>+</span> 내 페르소나 만들기
        </button>

        <div className="side-section">
          <div className="folder-row">▾ 친구여행 예시</div>
          {personaFriends.map((friend) => (
            <button className={`friend-row ${selectedIds.includes(friend.id) ? "active" : ""}`} key={friend.id} onClick={() => toggleFriend(friend.id)}>
              <span className="avatar" style={{ background: friend.color }}>
                {friend.avatar}
              </span>
              <span>{friend.name} 페르소나</span>
              {selectedIds.includes(friend.id) && <span className="me-badge">초대</span>}
            </button>
          ))}
        </div>
      </aside>

      <section className="chat-home">
        <div className="hero-chat">
          <div className="plane">AIR</div>
          <h1>페르소나들에게 상황을 알려주세요</h1>
          <p>초대한 페르소나들이 여행 상황을 듣고 서로 토론합니다.</p>

          <div className="prompt-examples">
            <button onClick={() => setPrompt("우리는 일본을 가기로 했는데 도쿄에서 어떤 맛집을 갈지 모르겠어")}>
              우리는 일본을 가기로 했는데 도쿄에서 어떤 맛집을 갈지 모르겠어
            </button>
            <button onClick={() => setPrompt("강릉 2박 3일 일정 어떻게 짜면 좋을까?")}>강릉 2박 3일 일정 어떻게 짜면 좋을까?</button>
            <button onClick={() => setPrompt("예산이 빠듯한데 숙소와 식사 어디서 줄여야 할까?")}>
              예산이 빠듯한데 숙소와 식사 어디서 줄여야 할까?
            </button>
          </div>
        </div>

        <div className="trip-setup">
          <div className="row">
            <select value={destinationStatus} onChange={(event) => setDestinationStatus(event.target.value as DestinationStatus)}>
              <option value="undecided">여행지 미정</option>
              <option value="fixed">여행지 정함</option>
            </select>
            {destinationStatus === "fixed" && <input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="예: 도쿄" />}
            <input value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="기간" />
            <input value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="예산" />
          </div>
          <div className="row">
            <input value={departureArea} onChange={(event) => setDepartureArea(event.target.value)} placeholder="출발지" />
            <input value={scope} onChange={(event) => setScope(event.target.value)} placeholder="여행 범위" />
            <input type="number" min={1} max={5} value={maxCycles} onChange={(event) => setMaxCycles(Number(event.target.value))} />
          </div>
        </div>

        <div className="bottom-composer">
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="여행 상황을 입력하세요..." />
          <button className="send-btn" onClick={startTrip} disabled={!prompt.trim() || selectedFriends.length === 0 || (destinationStatus === "fixed" && !destination.trim())}>
            ↑
          </button>
        </div>
        <p className="composer-hint">Enter로 전송 · Shift+Enter로 줄바꿈</p>
      </section>
    </main>
  );
}
