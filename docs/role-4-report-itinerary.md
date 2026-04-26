# Role 4: Report & Itinerary

## Goal

페르소나 채팅이 끝난 뒤 사용자가 “회의 결과가 보고서로 정리되었다”고 느끼도록, 목적지 결정 근거와 일자별 일정표를 보기 좋게 구성하는 역할입니다.

## Owned Areas

- 보고서 UI
- 일자별 일정표 생성
- 일정 블록 편집
- 피드백 후 재토론/보고서 갱신
- 만족도와 절충 결과 표시

## Main Files

- `app/report/page.tsx`
- `app/api/itinerary/generate/route.ts`
- `app/api/feedback/regenerate/route.ts`

## Key Tasks

- 채팅 종료 후 `/report`에서 보고서가 생성된 느낌을 강화합니다.
- 일정표는 Day 1~N, 오전/오후/저녁 블록을 유지합니다.
- 각 일정 블록은 텍스트 편집 가능 상태를 유지합니다.
- 보고서에 아래 정보를 표시합니다.
  - 선택된 목적지
  - 결정 요약
  - 일자별 일정표
  - 페르소나별 만족도
  - 조율 과정에서 생긴 trade-off
  - 사용자 피드백 후 변경된 내용
- 피드백 입력 시 짧은 재토론 후 새 일정표로 갱신합니다.

## Acceptance Criteria

- 워크스페이스 채팅이 끝나면 `/report`로 이동합니다.
- 보고서에서 일정표를 직접 수정하고 저장할 수 있습니다.
- 피드백을 입력하면 일정표가 재생성됩니다.
- 보고서만 봐도 “왜 이 여행지가 선택됐는지” 이해할 수 있습니다.

## Notes For Other Roles

- Role 3의 `AgentMessage` 로그를 활용하면 더 설득력 있는 보고서가 됩니다.
- Role 2가 `representationReason` 같은 필드를 추가하면 보고서에 보여줄 수 있습니다.
