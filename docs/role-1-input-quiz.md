# Role 1: Input & Quiz

## Goal

사용자와 참여자 정보를 정확히 수집하고, 6문항 여행 성향 테스트를 통해 페르소나 생성에 필요한 입력 데이터를 안정적으로 만드는 역할입니다.

## Owned Areas

- 세션 생성 화면
- 참여자별 초대 링크 느낌의 테스트 화면
- 여행 성향 테스트 문항/점수화
- 참여자 입력 완료 상태

## Main Files

- `app/page.tsx`
- `app/participant/[id]/page.tsx`
- `lib/quiz.ts`
- `lib/types.ts`

## Key Tasks

- `basicInfo: string`을 구조화합니다.

```ts
basicInfo: {
  gender: string;
  ageGroup: string;
  relationship: string;
}
```

- 참여자 테스트 화면에서 성별, 나이대, 관계를 각각 입력받습니다.
- `personalRequests`는 화면에서 "개인적으로 중요한 것"으로 보여줍니다.
- 이 필드에는 꼭 원하는 것, 원하지 않는 것, 양보하기 어려운 것을 함께 입력받습니다.
- 6문항 테스트가 아래 6축을 모두 점수화하는지 확인합니다.

```ts
rest_vs_activity
food_interest
budget_sensitivity
comfort_need
planning_preference
local_experience
```

- 테스트 완료 조건을 명확히 합니다.
  - 기본정보 입력 완료
  - 개인 요청은 선택
  - 6문항 답변 완료
- 점수 결과를 사용자가 이해할 수 있는 짧은 설명으로 보여줍니다.

## Acceptance Criteria

- 참여자별로 성별, 나이대, 관계가 저장됩니다.
- 모든 참여자가 필수 정보를 입력하고 테스트를 끝내야 회의 시작 버튼이 활성화됩니다.
- 새로고침해도 `localStorage`에서 입력값이 유지됩니다.
- `Participant` 타입 변경 후 다른 파일에서 타입 에러가 나지 않습니다.

## Notes For Other Roles

- `basicInfo` 구조를 바꾸면 Role 2가 페르소나 생성 프롬프트에 반영해야 합니다.
- 테스트 점수 축 이름은 바꾸지 않는 것을 권장합니다.
