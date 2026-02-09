# Coding Convention

## 1. 문법 사용 방식

### TypeScript

- 모든 파일에 TypeScript 사용
- `any` 타입 사용 금지, 불가피한 경우 `unknown` 사용
- 타입 추론이 명확한 경우 명시적 타입 선언 생략
- 인터페이스는 `interface`, 유니온/교차 타입은 `type` 사용

```typescript
// Good
const count = 0;
const [isOpen, setIsOpen] = useState(false);

// Bad
const count: number = 0;
const [isOpen, setIsOpen] = useState<boolean>(false);
```

### 함수 선언

- 컴포넌트: `function` 키워드 사용
- 유틸리티 함수: `function` 키워드 사용
- 콜백/이벤트 핸들러: 화살표 함수 사용

```typescript
// 컴포넌트
function UserProfile({ userId }: UserProfileProps) {
  const handleClick = () => {
    // 이벤트 핸들러는 화살표 함수
  };

  return <div>...</div>;
}

// 유틸리티 함수
function formatDate(date: Date): string {
  return date.toLocaleDateString();
}
```

### Import 순서

1. React 및 라이브러리
2. 절대 경로 import (`@/`)
3. 상대 경로 import (`./`, `../`)
4. 타입 import

```typescript
import { useState, useEffect } from 'react';
import styled from 'styled-components';

import { useAuthStore } from '@/features/auth';
import { Button } from '@/shared/ui';
import type { User } from '@/shared/types';

import { UserAvatar } from './UserAvatar';
import type { UserProfileProps } from './types';
```

---

## 2. 네이밍 컨벤션

### 파일명

| 분류      | 규칙                   | 예시              |
| --------- | ---------------------- | ----------------- |
| 컴포넌트  | PascalCase             | `UserProfile.tsx` |
| 훅        | camelCase (use 접두사) | `useUserData.ts`  |
| 유틸리티  | camelCase              | `formatDate.ts`   |
| 타입 정의 | camelCase              | `types.ts`        |
| 상수      | camelCase              | `constants.ts`    |
| 인덱스    | 소문자                 | `index.ts`        |

### 컴포넌트

- PascalCase 사용
- 명사 또는 명사구로 작성

```typescript
// Good
function UserProfile() {}
function ChatMessageList() {}

// Bad
function renderUserProfile() {}
function chatMessageList() {}
```

### 변수 / 함수

- camelCase 사용
- 동사로 시작하는 명확한 동작 표현

```typescript
// 함수: 동사 + 명사
function getUserById(id: string) {}
function handleSubmit() {}
function formatCurrency(amount: number) {}

// 불리언: is, has, can, should 접두사
const isLoading = true;
const hasPermission = false;
const canEdit = true;
```

### 상수

- UPPER_SNAKE_CASE 사용
- 파일 최상단 또는 `constants.ts`에 정의

```typescript
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_PAGE_SIZE = 20;
```

### 타입 / 인터페이스

- PascalCase 사용
- Props는 `컴포넌트명 + Props` 형식

```typescript
interface User {
  id: string;
  name: string;
}

interface UserProfileProps {
  userId: string;
  onClose: () => void;
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
```

---

## 3. 접두사 컨벤션

### 이벤트 핸들러

- `handle` 접두사: 컴포넌트 내부 핸들러
- `on` 접두사: Props로 전달받는 콜백

```typescript
interface ButtonProps {
  onClick: () => void; // Props: on 접두사
}

function Form({ onSubmit }: FormProps) {
  const handleInputChange = () => {}; // 내부: handle 접두사

  const handleSubmit = () => {
    onSubmit(); // Props 콜백 호출
  };
}
```

### 훅

- `use` 접두사 필수

```typescript
function useUserData(userId: string) {}
function useLocalStorage<T>(key: string) {}
function useDebounce<T>(value: T, delay: number) {}
```

### 불리언 변수

| 접두사   | 용도      | 예시                             |
| -------- | --------- | -------------------------------- |
| `is`     | 상태      | `isLoading`, `isOpen`, `isValid` |
| `has`    | 소유/포함 | `hasError`, `hasPermission`      |
| `can`    | 가능 여부 | `canEdit`, `canDelete`           |
| `should` | 권장 여부 | `shouldUpdate`, `shouldFetch`    |

### Styled Components (Transient Props)

- `$` 접두사: DOM에 전달되지 않는 props

```typescript
const Button = styled.button<{ $isActive: boolean }>`
  background: ${({ $isActive }) => ($isActive ? 'blue' : 'gray')};
`;
```

---

## 4. 코드 순서

### 컴포넌트 내부 순서

```typescript
function UserProfile({ userId, onClose }: UserProfileProps) {
  // 1. 훅 호출 (상태, 스토어, 라우터 등)
  const [isEditing, setIsEditing] = useState(false);
  const { user, isLoading } = useUserData(userId);
  const navigate = useNavigate();

  // 2. 파생 상태 (useMemo)
  const fullName = useMemo(() => {
    return `${user?.firstName} ${user?.lastName}`;
  }, [user]);

  // 3. 부수 효과 (useEffect) - 최소화
  useEffect(() => {
    // 필요한 경우에만
  }, []);

  // 4. 이벤트 핸들러
  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    await saveUser();
    onClose();
  };

  // 5. 조건부 렌더링 (Early return)
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <EmptyState />;
  }

  // 6. 메인 렌더링
  return (
    <ProfileContainer>
      ...
    </ProfileContainer>
  );
}

// 7. 스타일 정의 (파일 하단)
const ProfileContainer = styled.div`
  ...
`;
```

### 파일 내 전체 순서

```typescript
// 1. Import 문

// 2. 타입 정의
interface UserProfileProps {
  userId: string;
}

// 3. 상수 정의
const MAX_NAME_LENGTH = 50;

// 4. 헬퍼 함수
function formatUserName(user: User): string {
  return `${user.firstName} ${user.lastName}`;
}

// 5. 메인 컴포넌트
export function UserProfile({ userId }: UserProfileProps) {
  ...
}

// 6. 서브 컴포넌트 (필요 시)
function UserAvatar({ src }: { src: string }) {
  ...
}

// 7. 스타일 정의
const ProfileContainer = styled.div`
  ...
`;
```

---

## 5. 스타일 가이드

### 스타일 정의 위치

- **파일 하단**에 정의
- 별도 파일 분리 안함 (단, 공통 스타일이 많은 경우 예외)

### 네이밍 규칙

컴포넌트 구조를 반영하여 HTML 요소 이름을 접미사로 사용:

| 역할          | 접미사                   | 예시                              |
| ------------- | ------------------------ | --------------------------------- |
| 최상위 래퍼   | `Container`              | `ProfileContainer`                |
| 섹션 구분     | `Section`                | `HeaderSection`, `ContentSection` |
| 독립적 영역   | `Article`                | `UserArticle`, `CommentArticle`   |
| 헤더 영역     | `Header`                 | `ModalHeader`, `CardHeader`       |
| 푸터 영역     | `Footer`                 | `ModalFooter`, `CardFooter`       |
| 네비게이션    | `Nav`                    | `SidebarNav`, `TopNav`            |
| 리스트        | `List`                   | `UserList`, `MenuList`            |
| 리스트 아이템 | `Item`                   | `UserItem`, `MenuItem`            |
| 버튼          | `Button`                 | `SubmitButton`, `CloseButton`     |
| 입력          | `Input`                  | `SearchInput`, `NameInput`        |
| 텍스트        | `Text`, `Title`, `Label` | `ErrorText`, `SectionTitle`       |
| 이미지        | `Image`, `Icon`          | `AvatarImage`, `CloseIcon`        |
| 래퍼          | `Wrapper`                | `IconWrapper`, `ButtonWrapper`    |

### 스타일 순서

```typescript
const ProfileContainer = styled.div`
  // 1. 레이아웃 (display, position)
  display: flex;
  flex-direction: column;
  position: relative;

  // 2. 박스 모델 (width, height, padding, margin)
  width: 100%;
  max-width: 600px;
  padding: 16px;
  margin: 0 auto;

  // 3. 시각적 스타일 (background, border, shadow)
  background: var(--color-surface-primary);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  // 4. 타이포그래피 (font, color, text)
  font-size: 14px;
  color: var(--color-text-primary);

  // 5. 기타 (cursor, transition, animation)
  cursor: pointer;
  transition: all 0.2s ease;

  // 6. 가상 선택자
  &:hover {
    background: var(--color-surface-hover);
  }

  &::before {
    content: '';
  }

  // 7. 미디어 쿼리
  @media (max-width: 768px) {
    padding: 12px;
  }
`;
```

---

## 6. 상태 관리 원칙

### 상태 최소화

- 파생 가능한 값은 상태로 만들지 않음
- `useMemo`로 계산

```typescript
// Bad
const [fullName, setFullName] = useState('');

useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// Good
const fullName = useMemo(() => {
  return `${firstName} ${lastName}`;
}, [firstName, lastName]);
```

### useEffect 최소화

- 데이터 패칭, 구독, 외부 시스템 연동에만 사용
- 상태 동기화 목적으로 사용 금지
- 복잡한 로직은 커스텀 훅으로 분리

```typescript
// Bad: 컴포넌트 내 useEffect 남용
function UserProfile({ userId }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetchUser(userId)
      .then(setUser)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [userId]);

  // ...
}

// Good: 커스텀 훅으로 분리
function UserProfile({ userId }: Props) {
  const { user, isLoading, error } = useUserData(userId);
  // ...
}

// hooks/useUserData.ts
function useUserData(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // 패칭 로직
  }, [userId]);

  return { user, isLoading, error };
}
```

### 커스텀 훅 분리 기준

- 재사용 가능한 상태 로직
- 복잡한 부수 효과
- 외부 시스템과의 연동

```typescript
// 데이터 패칭
function useUserData(userId: string) {}
function useConversations() {}

// 브라우저 API
function useLocalStorage<T>(key: string) {}
function useMediaQuery(query: string) {}

// UI 상태
function useModal() {}
function useDropdown() {}
```

---

## 7. FSD 아키텍처 폴더 구조

```
src/
├── app/                    # 앱 설정, 프로바이더, 라우터
├── pages/                  # 페이지 컴포넌트
├── widgets/                # 독립적인 UI 블록
├── features/               # 비즈니스 기능 단위
│   └── feature-name/
│       ├── ui/            # 컴포넌트
│       ├── model/         # 상태, 로직
│       ├── api/           # API 호출
│       └── index.ts       # Public API
├── entities/               # 비즈니스 엔티티
│   └── entity-name/
│       ├── ui/
│       ├── model/
│       └── index.ts
├── shared/                 # 공유 자원
│   ├── api/               # API 클라이언트
│   ├── ui/                # 공통 UI 컴포넌트
│   ├── lib/               # 유틸리티
│   ├── config/            # 설정
│   └── types/             # 공통 타입
└── assets/                 # 정적 자원
```

### 레이어 간 의존성 규칙

- 상위 레이어만 하위 레이어를 import 가능
- `app` → `pages` → `widgets` → `features` → `entities` → `shared`
- 같은 레이어 간 import 금지 (단, `shared`는 예외)

### index.ts (Public API)

- 각 모듈의 공개 인터페이스 정의
- 내부 구현 숨기기

```typescript
// features/auth/index.ts
export { LoginForm } from './ui/LoginForm';
export { useAuthStore } from './model/store';
export type { User, AuthState } from './model/types';

// 내부 구현은 export하지 않음
```
