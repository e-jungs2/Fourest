# CLAUDE.md

이 저장소에서 작업하는 에이전트를 위한 간단한 가이드입니다.

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Environment

Gemini API를 사용하려면 `.env.local`을 만들고 다음 값을 추가합니다.

```bash
GEMINI_API_KEY=your_key_here
```

키가 없거나 호출이 실패하면 `lib/mock.ts`의 fallback 데이터로 앱이 계속 동작합니다.

## Architecture

- 상태는 `lib/types.ts`의 `AppState` 형태로 `localStorage`에 저장합니다.
- `lib/gemini.ts`는 `@google/genai`를 감싸고, 실패 시 호출자가 넘긴 fallback 값을 반환합니다.
- `lib/agent-dialogue.ts`는 페르소나 에이전트 협의를 라운드 단위로 생성합니다.
- `/api/dialogue/stream`은 각 턴이 생성되는 즉시 SSE `message` 이벤트로 전송하고, 마지막에 `done` 이벤트를 보냅니다.
- `/workspace`는 스트림 메시지를 받는 즉시 화면과 `localStorage`에 반영합니다.

## Main Flow

1. `/`에서 `TravelSession`과 참여자를 생성합니다.
2. `/participant/[id]`에서 참여자별 프로필과 퀴즈 결과를 저장합니다.
3. `/workspace`에서 페르소나, 후보지, 대화 스트림, 일정을 순서대로 생성합니다.
4. `/report`에서 최종 일정을 확인하고 피드백으로 다시 생성할 수 있습니다.
