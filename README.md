# Persona Trip Council

참여자별 여행 성향 테스트를 바탕으로 페르소나 에이전트를 생성하고, 에이전트들이 실시간으로 협의하며 여행지와 일정을 정하는 MVP입니다.

## Run

```bash
npm install
npm run dev
```

Gemini를 사용하려면 `.env.local`에 API 키를 추가합니다.

```bash
GEMINI_API_KEY=your_key_here
```

API 키가 없거나 Gemini 호출에 실패하면 mock fallback 데이터로 동일한 흐름을 실행합니다.

## Flow

1. `/`에서 여행 세션과 참여자를 만듭니다.
2. `/workspace`에서 참여자별 테스트 링크를 엽니다.
3. 각 참여자가 `/participant/[id]`에서 성향 테스트를 완료합니다.
4. 워크스페이스에서 페르소나 회의를 시작합니다.
5. 페르소나 에이전트가 라운드별로 실시간 협의하고, 마지막에 여행 전문가 에이전트가 정리합니다.
6. `/report`에서 일자별 일정표와 조율 결과를 확인하고 수정합니다.
