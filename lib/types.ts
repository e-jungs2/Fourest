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
  | "local_experience";

export type QuizScores = Record<QuizAxis, number>;

export type TravelSettings = {
  maxNegotiationCycles: number;
  candidateCount: number;
};

export type Participant = {
  id: string;
  name: string;
  basicInfo: string;
  personalRequests: string;
  quizAnswers: Record<string, string>;
  quizScores: QuizScores;
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
  supportLevel: number;
  concernLevel: number;
};

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
  messages: AgentMessage[];
  itinerary: Itinerary | null;
};
