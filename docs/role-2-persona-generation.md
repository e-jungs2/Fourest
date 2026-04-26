# Role 2: Persona Generation

## Goal

참여자 1명당 1개의 페르소나를 만들고, 각 페르소나가 실제 참여자를 잘 대표하도록 프로필, 선호, 제약, 우선순위, 의사결정 정책을 강화하는 역할입니다.

## Owned Areas

- 페르소나 생성 API
- Gemini persona prompt
- Mock fallback persona
- 대표성 점수와 대표성 설명

## Main Files

- `app/api/personas/generate/route.ts`
- `lib/mock.ts`
- `lib/types.ts`

## Key Tasks

- `Participant.basicInfo`의 성별, 나이대, 관계를 페르소나 생성에 반영합니다.
- `personalRequests`를 강한 선호 또는 제약으로 반영합니다.
- 페르소나 결과가 아래 필드를 안정적으로 포함하도록 만듭니다.

```ts
preferences
constraints
priorities
decisionPolicy
conversationStyle
representationScore
```

- 대표성 점수의 근거를 UI에 보여주고 싶다면 `Persona` 타입에 설명 필드를 추가할 수 있습니다.

```ts
representationReason?: string;
```

- Mock fallback 문구를 자연스러운 한국어로 정리합니다.
- Gemini가 JSON을 잘못 반환해도 fallback으로 데모가 깨지지 않게 유지합니다.

## Acceptance Criteria

- 참여자 수와 동일한 개수의 페르소나가 생성됩니다.
- 각 페르소나는 `participantId`로 원래 참여자와 연결됩니다.
- 참여자의 성향 테스트 결과와 개인 요청이 페르소나 요약에 드러납니다.
- Gemini API 키가 없어도 Mock 페르소나가 생성됩니다.

## Notes For Other Roles

- Role 3는 `Persona.id`, `priorities`, `constraints`, `conversationStyle`을 토론 agent prompt에 사용합니다.
- `Persona` 타입을 바꾸면 Role 3, Role 4와 공유해야 합니다.
