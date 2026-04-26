# Persona Trip Council

페르소나 기반 여행 의사결정 MVP입니다. 참여자별 성향 테스트로 1인 1페르소나를 만들고, 페르소나들이 채팅으로 목적지와 일정을 조율한 뒤 보고서 UI에서 일자별 일정표를 보여줍니다.

## Run

```bash
npm install
npm run dev
```

Gemini를 쓰려면 `.env.local`에 API 키를 넣습니다.

```bash
GEMINI_API_KEY=your_key_here
```

키가 없거나 호출이 실패하면 Mock fallback으로 데모가 계속 진행됩니다.

## Flow

1. `/`에서 여행 세션을 만듭니다.
2. `/workspace`에서 참여자별 테스트 링크를 엽니다.
3. 모든 참여자가 `/participant/[id]` 테스트를 완료합니다.
4. 워크스페이스에서 페르소나 회의를 시작합니다.
5. 채팅이 끝나면 `/report`로 이동해 일정표 보고서를 확인하고 편집합니다.
