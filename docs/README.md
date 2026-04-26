# Team Development Guide

4명이 병렬로 개발할 때는 현재 MVP를 기준 코드로 두고, 아래 4개 역할로 나누어 작업합니다.

## Roles

1. [Input & Quiz](./role-1-input-quiz.md)
2. [Persona Generation](./role-2-persona-generation.md)
3. [Multi-Agent Dialogue](./role-3-multi-agent-dialogue.md)
4. [Report & Itinerary](./role-4-report-itinerary.md)

## Shared Rules

- `lib/types.ts`는 공용 계약입니다. 수정 전 팀원에게 공유하고, 수정 후 관련 담당자에게 알려야 합니다.
- 담당 파일 밖의 변경은 최소화합니다.
- API 응답 구조를 바꾸면 `README` 또는 PR 설명에 반드시 적습니다.
- 각자 브랜치를 나누어 작업합니다.

```bash
git checkout -b feature/input-quiz
git checkout -b feature/persona-generation
git checkout -b feature/agent-dialogue
git checkout -b feature/report-ui
```

## Merge Order

1. Input & Quiz
2. Persona Generation
3. Multi-Agent Dialogue
4. Report & Itinerary

`Participant` 구조가 먼저 안정되어야 페르소나 생성과 보고서가 덜 흔들립니다.
