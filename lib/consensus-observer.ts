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
    content: "합의가 감지되어 결론 단계로 이동합니다.",
    proposalDelta: `메시지 ${messages.length}개와 탐색 결과 ${researchArtifacts.length}개를 바탕으로 결론을 준비합니다.`,
    researchRefs: researchArtifacts.flatMap((artifact) => artifact.sources.map((source) => source.url).filter(Boolean) as string[]),
    supportLevel: 1,
    concernLevel: 0
  };
}
