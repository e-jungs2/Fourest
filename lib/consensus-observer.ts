import type { AgentMessage, ConsensusDecision, ResearchArtifact } from "./types";

export async function observeConsensus(_messages: AgentMessage[], _researchArtifacts: ResearchArtifact[]): Promise<ConsensusDecision> {
  return { status: "continue", reason: "Consensus observer is a v1 hook and does not stop the loop yet." };
}

export async function finalizeConsensus(messages: AgentMessage[], researchArtifacts: ResearchArtifact[]): Promise<AgentMessage> {
  return {
    id: `consensus_${Date.now()}`,
    speakerId: "consensus_observer",
    speakerType: "system",
    speechAct: "validate",
    content: "Consensus was detected, so the discussion is moving to a final decision.",
    proposalDelta: `Preparing a final decision from ${messages.length} messages and ${researchArtifacts.length} research artifacts.`,
    researchRefs: researchArtifacts.flatMap((artifact) => artifact.sources.map((source) => source.url).filter(Boolean) as string[]),
    supportLevel: 1,
    concernLevel: 0
  };
}
