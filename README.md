# AI Chat App

OpenAI(GPT-4o)와 Anthropic(Claude Sonnet 4)을 지원하는 브라우저 기반 AI 채팅 애플리케이션입니다.
실시간 스트리밍 응답, 에이전틱 Tool 호출, 대화 요약, 프로젝트 관리, 대화 검색 등을 제공합니다.

---

## 기술 스택

| 분류 | 기술 | 버전 |
|---|---|---|
| **Language** | TypeScript | ~5.9.3 |
| **UI Framework** | React | ^19.2.0 |
| **Build Tool** | Vite | ^7.2.4 |
| **Routing** | React Router DOM | ^7.13.0 |
| **상태 관리** | Zustand | ^5.0.10 |
| **스타일링** | styled-components | ^6.3.8 |
| **DB (영속화)** | Dexie (IndexedDB) | ^4.2.1 |
| **마크다운** | react-markdown + remark-gfm | ^10.1.0 / ^4.0.1 |
| **코드 하이라이트** | react-syntax-highlighter | ^16.1.0 |
| **애니메이션** | lottie-react | ^2.4.1 |
| **단위 테스트** | Jest + Testing Library | ^30.2.0 / ^16.3.2 |
| **E2E 테스트** | Playwright | ^1.58.1 |
| **Lint / Format** | ESLint + Prettier | ^9.39.1 / ^3.8.1 |

---

## 기술적 의사결정

### 아키텍처: Feature-Sliced Design (FSD)

`app > pages > widgets > features > entities > shared` 레이어로 단방향 의존성을 유지합니다.
기능 단위로 코드를 분리하여 각 feature가 독립적으로 개발/테스트 가능합니다.

### 상태 관리: Zustand + IndexedDB

Zustand의 `persist` 미들웨어에 커스텀 IndexedDB 스토리지 어댑터를 연결해 대화 데이터를 자동 영속화합니다.
스트리밍 상태(`streamingStates`)는 `Map`으로 메모리에만 유지하여 불필요한 I/O를 방지했습니다.

### 스트리밍: Fetch + ReadableStream

Fetch API의 `ReadableStream`을 사용해 SSE(Server-Sent Events) 응답을 토큰 단위로 처리합니다.
`requestAnimationFrame` 기반 버퍼링으로 렌더링 성능을 최적화했습니다.

### 대화 요약: Strategy 패턴

메시지가 30개를 초과하면 자동으로 이전 대화를 요약하여 API 컨텍스트를 압축합니다.
Strategy 패턴을 적용해 요약 기준(메시지 수, 토큰 수 등)을 확장할 수 있도록 설계했습니다.

### Tool 시스템: Registry 패턴

Tool Registry에 도구를 등록/실행하는 플러그인 구조로, 새로운 Tool 추가 시 구현체만 작성하면 됩니다.
에이전틱 루프(최대 5회 반복)로 LLM이 필요한 만큼 Tool을 호출한 뒤 최종 응답을 생성합니다.

---

## 설치 및 실행 방법

### 사전 요구사항

- Node.js >= 18
- npm

### 설치

```bash
git clone <repository-url>
cd ai-chat-app
npm install
```

### 환경 변수 설정

`.env.example`을 복사하여 `.env` 파일을 생성하고 API 키를 입력합니다.

```bash
cp .env.example .env
```

```env
# LLM API 키 (최소 하나 필수)
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Tool API 키 (선택 - 미설정 시 해당 Tool 비활성)
VITE_TAVILY_API_KEY=your_tavily_api_key_here
VITE_OPENWEATHERMAP_API_KEY=your_openweathermap_api_key_here
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173`으로 접속합니다.

### 프로덕션 빌드

```bash
npm run build
npm run preview
```

---

## 테스트 실행 방법

### 단위 테스트 (Jest)

```bash
# 전체 테스트 실행
npm test

# Watch 모드
npm run test:watch

# 커버리지 리포트
npm run test:coverage
```

**테스트 파일 목록 (5개 Suite, 95개 Test)**

| 테스트 파일 | 대상 |
|---|---|
| `manage-history/__tests__/store.test.ts` | Zustand 채팅 스토어 CRUD |
| `search-chat/model/__tests__/useConversationSearch.test.ts` | 대화 목록 검색 훅 |
| `search-chat/model/__tests__/useMessageSearch.test.ts` | 메시지 내 키워드 검색 훅 |
| `select-model/ui/__tests__/ModelSelect.test.tsx` | 모델 선택 컴포넌트 |
| `send-message/ui/__tests__/ChatInput.test.tsx` | 채팅 입력 컴포넌트 |

### E2E 테스트 (Playwright)

```bash
# E2E 테스트 실행 (Chromium, Firefox, WebKit)
npm run test:e2e

# UI 모드로 실행
npm run test:e2e:ui

# 리포트 확인
npm run test:e2e:report
```

E2E 테스트는 기본 채팅, 사이드바, 모델 선택, 검색, 반응형 UI, 설정, 접근성을 검증합니다.

### Lint / Format

```bash
npm run lint
npm run format
```

---

## 구현된 기능 목록

### 1. 기본적인 채팅 UI 구현

- 사이드바 + 메인 채팅 영역 레이아웃
- 반응형 디자인 (모바일 768px 이하에서 사이드바 오버레이)
- 마크다운 렌더링 (GFM 지원: 테이블, 체크리스트, 취소선 등)
- 코드 블록 구문 강조 및 복사 버튼
- Lottie 로딩 애니메이션
- 가상 스크롤링으로 대량 메시지 성능 최적화

### 2. 스트리밍 형식의 채팅 기능

- Fetch API `ReadableStream`으로 실시간 토큰 스트리밍
- OpenAI / Anthropic 두 프로바이더의 SSE 응답 파싱
- `requestAnimationFrame` 버퍼링으로 렌더링 최적화
- 스트리밍 중 취소 기능 (`AbortController`)
- 에이전틱 Tool 실행 루프 (웹 검색, 날씨 조회, 현재 시각)
- Tool 실행 상태 표시 (실행 중 인디케이터, 결과 표시)
- 웹 검색 출처 표시 (제목, URL, 스니펫)

### 3. 모델 선택 / 시스템 프롬프트 설정

- GPT-4o (OpenAI), Claude Sonnet 4 (Anthropic) 선택
- 전역 시스템 프롬프트 설정 (설정 모달)
- 프로젝트별 시스템 프롬프트 지정
- 대화별 모델 변경 가능
- 이미지 입력 지원 (Vision 기능)

### 4. 대화 히스토리 저장 / 관리

- IndexedDB 기반 자동 영속화 (Dexie ORM)
- 대화 생성 / 삭제 / 제목 자동 생성
- 프로젝트별 대화 그룹화
- 대화 요약 기능 (30개 메시지 초과 시 자동 요약)
- 사이드바에서 대화 목록 탐색

### 5. 대화 검색 기능

- **대화 목록 검색**: 제목 및 메시지 내용으로 전체 대화 검색 (SearchModal)
- **메시지 내 검색**: 현재 대화에서 Ctrl+F로 키워드 검색
  - 매치 하이라이트 (마크다운, 코드 블록 내부 포함)
  - 이전/다음 매치 이동 (순환)
  - 스크롤바 매치 마커 표시
- 디바운싱 적용 (200~300ms)

### 6. 테스트코드 작성

- **단위 테스트**: Jest + React Testing Library (5개 Suite, 95개 Test)
  - 스토어 CRUD, 검색 훅, UI 컴포넌트 테스트
  - 비동기 상태 변화 검증 (`waitFor`)
  - 모킹 패턴 (React Router, Zustand Store)
- **E2E 테스트**: Playwright (Chromium, Firefox, WebKit)
  - 채팅 흐름, 사이드바, 모델 선택, 반응형 UI, 접근성 검증

---

## 프로젝트 구조

```
src/
├── app/                    앱 진입점 (ThemeProvider, GlobalStyles)
├── pages/                  라우트 페이지
│   ├── home/               /
│   ├── chat/               /chat/:chatId
│   ├── project/            /project/:projectId
│   └── project-chat/       /project/:projectId/chat/:chatId
├── widgets/                복합 UI 블록
│   ├── chat-interface/     채팅 메인 영역 (가상 스크롤, 검색 연동)
│   ├── sidebar/            사이드바 네비게이션
│   └── project-view/       프로젝트 뷰
├── features/               비즈니스 기능 단위
│   ├── send-message/       메시지 전송 + 스트리밍 + 대화 요약
│   ├── render-message/     메시지 렌더링 (마크다운, 코드, 소스)
│   ├── search-chat/        대화 검색 (목록 검색 + 메시지 내 검색)
│   ├── manage-history/     대화 히스토리 관리 (Zustand Store)
│   ├── projects/           프로젝트 관리
│   ├── settings/           설정 관리
│   ├── select-model/       모델 선택
│   └── manage-sidebar/     사이드바 상태 관리
├── entities/               도메인 모델 (Message, Conversation, Project)
└── shared/                 공유 리소스
    ├── api/                LLM 클라이언트, Tool 시스템, 요약 API
    ├── ui/                 공통 컴포넌트 (Modal, Toast, CodeBlock)
    ├── lib/                유틸리티 (DB, IndexedDB Storage)
    ├── hooks/              공통 훅
    ├── config/             테마, 브레이크포인트, 에러 메시지
    └── types/              공통 타입 정의
```
