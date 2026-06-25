# To-Do 웹 앱 디자인 스펙

**날짜:** 2026-06-25  
**스택:** Next.js 15 (App Router) + TypeScript + Tailwind CSS + SQLite + Prisma

---

## 개요

여러 기기/사람이 공용으로 사용하는 To-Do 보드 웹 앱. 로그인 없이 누구나 접근 가능하며, 할 일 추가/완료/삭제와 함께 우선순위, 마감일, 카테고리, 태그, 검색, 필터 기능을 제공한다.

---

## 아키텍처

```
Next.js 15 App Router (TypeScript)
├── app/
│   ├── page.tsx          ← 메인 보드 (할 일 목록)
│   └── api/todos/
│       ├── route.ts      ← GET (목록), POST (생성)
│       └── [id]/
│           └── route.ts  ← PATCH (수정), DELETE (삭제)
├── components/
│   ├── TodoList.tsx
│   ├── TodoItem.tsx
│   ├── TodoForm.tsx
│   └── FilterBar.tsx
├── lib/
│   └── db.ts             ← Prisma 클라이언트 싱글턴
└── prisma/
    └── schema.prisma
```

- **프론트**: Next.js App Router + Tailwind CSS
- **API**: Next.js Route Handlers
- **DB**: SQLite + Prisma ORM
- **상태관리**: React useState / useEffect (외부 라이브러리 없음)

---

## 데이터 모델

```prisma
model Todo {
  id          Int       @id @default(autoincrement())
  title       String
  description String?
  completed   Boolean   @default(false)
  priority    Priority  @default(MEDIUM)
  dueDate     DateTime?
  category    String?
  tags        String    // JSON 배열 문자열 (예: '["work","urgent"]')
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}
```

---

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | /api/todos | 목록 조회. 쿼리 파라미터: `search`, `category`, `priority`, `completed` |
| POST | /api/todos | 새 할 일 생성 |
| PATCH | /api/todos/[id] | 수정 (완료 토글 포함) |
| DELETE | /api/todos/[id] | 삭제 |

---

## UI 구성

**메인 페이지 레이아웃:**

```
┌─────────────────────────────────────────┐
│  📋 To-Do Board                         │
├─────────────────────────────────────────┤
│  [검색창]  [카테고리▼]  [우선순위▼]  [상태▼] │
├─────────────────────────────────────────┤
│  [+ 새 할 일 추가]                        │
├─────────────────────────────────────────┤
│  ☐ 할 일 제목          HIGH  📅 6/30    │
│    태그: work, urgent                   │
│  ─────────────────────────────────────  │
│  ✅ 완료된 할 일        LOW              │
└─────────────────────────────────────────┘
```

**컴포넌트:**

- `TodoList` — 필터링된 목록 렌더링
- `TodoItem` — 개별 할 일 (완료 토글, 인라인 수정, 삭제)
- `TodoForm` — 추가/수정 폼 (제목, 설명, 우선순위, 마감일, 카테고리, 태그)
- `FilterBar` — 검색 입력 + 카테고리/우선순위/완료 여부 필터

---

## 성공 기준

- 할 일 CRUD가 모두 동작한다
- 검색어로 제목/설명을 필터링할 수 있다
- 카테고리, 우선순위, 완료 여부로 필터링할 수 있다
- 여러 기기에서 접속해도 동일한 데이터를 볼 수 있다
- 페이지 새로고침 후에도 데이터가 유지된다
