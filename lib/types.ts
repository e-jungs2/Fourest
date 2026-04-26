export type DestinationStatus = "fixed" | "undecided";

export type SpeechAct =
  | "suggest"
  | "agree"
  | "disagree"
  | "counter_proposal"
  | "compromise"
  | "validate"
  | "final_vote";

export type QuizAxis =
  | "rest_vs_activity"
  | "food_interest"
  | "budget_sensitivity"
  | "comfort_need"
  | "planning_preference"
  | "local_experience"
  | "photo_mood_importance"
  | "conflict_flexibility";

export type QuizScores = Record<QuizAxis, number>;

export type TravelerTypeId =
  | "slow_healer"
  | "active_explorer"
  | "food_radar"
  | "mood_collector"
  | "budget_strategist"
  | "stable_planner"
  | "local_diver"
  | "group_mediator";

export type BasicInfo = {
  gender: string;
  ageGroup: string;
  relationship: string;
};

export type TravelTypeResult = {
  primaryType: string;
  secondaryType: string;
  oneLineSummary: string;
  strengths: string[];
  riskFactors: string[];
  preferredDecisionStyle: string;
  typeScores: Record<TravelerTypeId, number>;
  axisScores: QuizScores;
};

export type TravelSettings = {
  maxNegotiationCycles: number;
  candidateCount: number;
};

export type Participant = {
  id: string;
  name: string;
  basicInfo: BasicInfo;
  healthNote: string;
  foodNote: string;
  mobilityNote: string;
  personalRequests: string;
  quizAnswers: Record<string, string>;
  quizScores: QuizScores;
  travelTypeResult: TravelTypeResult | null;
  completed: boolean;
};

export type TravelSession = {
  id: string;
  destinationStatus: DestinationStatus;
  destination: string;
  departureArea: string;
  scope: string;
  duration: string;
  budget: string;
  requirements: string;
  participants: Participant[];
  settings: TravelSettings;
};

export type Persona = {
  id: string;
  participantId: string;
  displayName: string;
  contextMarkdown?: string;
  summary: string;
  preferences: string[];
  constraints: string[];
  priorities: string[];
  decisionPolicy: {
    willSupportIf: string[];
    willObjectIf: string[];
    canCompromiseOn: string[];
  };
  conversationStyle: {
    tone: string;
    assertiveness: number;
    empathy: number;
  };
  representationScore: number;
};

export type AgentMessage = {
  id: string;
  speakerId: string;
  speakerType: "persona" | "expert" | "system";
  replyToId?: string;
  targetId?: string;
  speechAct: SpeechAct;
  content: string;
  proposalDelta?: string;
  researchRefs?: string[];
  researchSummary?: string;
  supportLevel: number;
  concernLevel: number;
};

export type ResearchToolSlot = "map.location" | "places.food" | "transport.route" | "lodging.search";

export type McpToolCall = {
  id: string;
  slot: ResearchToolSlot;
  serverName?: string;
  toolName?: string;
  query: string;
  input: Record<string, unknown>;
};

export type McpToolResult = {
  callId: string;
  ok: boolean;
  title: string;
  summary: string;
  url?: string;
  raw?: unknown;
  error?: string;
};

export type ResearchArtifact = {
  id: string;
  personaId: string;
  roundIndex: number;
  turnIndex: number;
  destination: string;
  query: string;
  toolCalls: McpToolCall[];
  toolResults: McpToolResult[];
  summary: string;
  sources: Array<{ title: string; url?: string; snippet: string }>;
  createdAt: string;
};

export type ConsensusDecision =
  | { status: "continue"; reason: string }
  | { status: "consensus_reached"; reason: string; summary: string };

export type DestinationCandidate = {
  id: string;
  name: string;
  reason: string;
  estimatedBudget: string;
  fitTags: string[];
  pros: string[];
  cons: string[];
  personaScores: Record<string, number>;
};

export type ItineraryDay = {
  day: number;
  title: string;
  morning: string;
  afternoon: string;
  evening: string;
  note: string;
  morningAttribution?: string[];
  afternoonAttribution?: string[];
  eveningAttribution?: string[];
};

export type Itinerary = {
  destination: string;
  days: ItineraryDay[];
  tradeoffs: string[];
  personaSatisfaction: Record<string, number>;
  consensusSummary: string;
};

export type AppState = {
  session: TravelSession | null;
  personas: Persona[];
  candidates: DestinationCandidate[];
  selectedDestination: string;
  researchArtifacts: ResearchArtifact[];
  messages: AgentMessage[];
  itinerary: Itinerary | null;
};
