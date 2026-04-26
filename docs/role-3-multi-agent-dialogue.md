# Role 3: Multi-Agent Dialogue

## Goal

각 페르소나를 각각의 독립 agent가 담당하게 하고, 페르소나 agent들이 이전 발언을 보고 동의, 반대, 절충하며 여행 의사결정을 진행하도록 만드는 역할입니다.

## Owned Areas

- 페르소나별 독립 agent 호출
- 턴 기반 대화 생성
- reply/target 관계
- 전문가 agent 검증
- 채팅 UI 표시 품질

## Main Files

- `lib/agent-dialogue.ts`
- `app/api/dialogue/stream/route.ts`
- `app/workspace/page.tsx`

## Current Architecture

현재 구조는 단일 agent가 전체 대화를 쓰는 방식이 아니라, 아래 순서로 동작합니다.

```text
Persona A agent call
↓
Persona B agent call with previous messages
↓
Persona C agent call with previous messages
↓
Persona D agent call with previous messages
↓
Travel Expert Agent call
```

핵심 함수:

```ts
runPersonaAgents()
generatePersonaTurn()
generateExpertTurn()
```

## Key Tasks

- 각 페르소나 agent가 자기 페르소나 정보만 대표하도록 프롬프트를 강화합니다.
- 이전 메시지의 `replyToId`, `targetId`가 자연스럽게 연결되도록 개선합니다.
- `speechAct`를 상황에 맞게 선택하도록 개선합니다.

```ts
suggest
agree
disagree
counter_proposal
compromise
validate
final_vote
```

- 강한 충돌이 있을 때 절충안을 만들도록 합니다.
- 마지막 전문가 agent가 동선, 예산, 일정 밀도 관점에서 검증하게 합니다.
- 워크스페이스 채팅 UI에서 누가 누구에게 답장했는지 더 잘 보이게 개선합니다.

## Acceptance Criteria

- 각 페르소나마다 별도 Gemini 호출이 발생합니다.
- 각 agent는 이전 대화 맥락을 보고 다음 발언을 생성합니다.
- UI에서 페르소나별 발언자가 명확히 구분됩니다.
- 전문가 agent는 사람을 대표하지 않고 현실성 검증만 담당합니다.
- Gemini API 키가 없어도 fallback 메시지로 채팅이 진행됩니다.

## Notes For Other Roles

- Role 2의 `Persona` 품질이 토론 품질을 크게 좌우합니다.
- Role 4는 최종 보고서에서 `AgentMessage` 로그를 활용해 “양보/절충”을 보여줄 수 있습니다.
