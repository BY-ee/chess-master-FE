---
trigger: always_on
---

# 📂 Chess-Master-FE Specific Instructions
이 파일은 전역 지침(`~/.gemini/GEMINI.md`)을 상속받아, 본 프로젝트에 특화된 기술적 제약을 정의합니다.

## 1. 🛠️ Tech Stack & Context
- **Language:** TypeScript 5.x (Strict Mode essential)
- **Framework:** React 18 + Vite 7
- **Styling:** Tailwind CSS 3.4
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query) v5
- **Routing:** React Router DOM v7
- **Communication:** Socket.io-client, Axios
- **Chess Logic:** chess.js, react-chessboard, stockfish

## 2. 🏛️ Architecture Rules
- **Directory Structure:**
  - `src/pages`: 라우트와 연결된 페이지 단위 컴포넌트
  - `src/components`: 재사용 가능한 UI 컴포넌트
  - `src/store`: Zustand를 이용한 전역 상태 관리
  - `src/api`: REST API 통신 로직
  - `src/socket`: Socket.io 통신 로직 및 이벤트 핸들러
  - `src/engine`: 체스 엔진(Stockfish) 관련 로직
  - `src/hooks`: 커스텀 React Hooks
- **Styling:** Tailwind CSS 유틸리티 클래스를 우선 사용하십시오. 필요한 경우 `index.css` 또는 컴포넌트별 CSS를 사용하되 최소화하십시오.

## 3. 📝 Coding Conventions (Overrides)
- **Components:** 함수형 컴포넌트(Functional Components)와 Hooks 패턴을 사용하십시오.
- **Typing:** Props와 State에 대한 인터페이스/타입을 명시적으로 정의하고, `any` 타입 사용을 지양하십시오.
- **Naming:** 컴포넌트 파일은 PascalCase(`MyComponent.tsx`), 로직/유틸 파일은 camelCase(`gameLogic.ts`)를 따르십시오.
- **Async:** 비동기 작업 시 `Promise` 체이닝보다는 `async/await` 구문을 선호하십시오.

---
**[Maintenance Reminder]**
라이브러리 버전 업데이트 등의 작업 발생 시, 본 파일(프로젝트 지침)의 'Tech Stack' 섹션을 최신화하십시오.