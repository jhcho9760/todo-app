# Calendar View Design

**Date:** 2026-06-26  
**Status:** Approved

## Overview

To-Do Board에 월간/주간/일간 캘린더 뷰를 추가한다. 전역 nav 바에 오늘/다음날/주/월 링크를 배치해 뷰를 전환하고, URL 파라미터로 현재 뷰 상태를 관리한다. 할 일은 `dueDate`를 기준으로 달력에 배치되며, `dueDate`가 없는 항목은 각 뷰 하단 "날짜 미지정" 섹션에 표시된다.

---

## 1. 전역 네비게이션

- 현재 검은 nav 바(`To-Do Board`)에 오른쪽 정렬로 뷰 전환 링크 추가
- 링크: **오늘 | 다음날 | 주 | 월**
- 활성 뷰: `#ffffff` / 비활성: `#7a7a7a`
- URL 파라미터 없을 때 기본값: 월간 뷰

---

## 2. URL 구조

| URL | 뷰 |
|---|---|
| `/?view=month` | 월간 (기본) |
| `/?view=week` | 주간 |
| `/?view=today` | 일간 — 오늘 |
| `/?view=tomorrow` | 일간 — 내일 |
| `/?view=today&date=YYYY-MM-DD` | 일간 — 특정 날짜 (월간에서 날짜 클릭 시) |

---

## 3. 뷰 상세

### 월간 뷰 (`?view=month`)

- 7열 달력 그리드 (일~토)
- 각 날짜 칸: 날짜 숫자 + 해당 날의 할 일 제목 칩 최대 2개
- 초과 시 "+N개 더" 텍스트 표시
- 날짜 칸 클릭 → `?view=today&date=YYYY-MM-DD`로 이동
- 이전/다음 달 이동 버튼
- 오늘 날짜: 파란 원(`#0066cc`) 표시
- 하단: "날짜 미지정" 접힘 섹션

### 주간 뷰 (`?view=week`)

- 7열 컬럼 (일~토)
- 각 컬럼 헤더: 요일 + 날짜
- 컬럼 내 할 일: 제목 카드 형태로 나열
- 오늘 컬럼 헤더: `#0066cc` 파란색 강조
- 이전/다음 주 이동 버튼
- 하단: "날짜 미지정" 접힘 섹션

### 일간 뷰 (`?view=today` / `?view=tomorrow` / `?view=today&date=...`)

- 선택 날짜의 할 일 전체를 TodoItem 카드 리스트로 표시
- "+ 새 할 일" 버튼: 해당 날짜가 `dueDate`로 자동 설정된 폼 열림
- 하단: "날짜 미지정" 접힘 섹션

---

## 4. 공통 동작

- **날짜 미지정 섹션**: 모든 뷰 하단에 위치, 기본 접힘 상태, 클릭으로 펼침
- **할 일 추가**: 각 뷰에서 날짜 칸/버튼 클릭 시 TodoForm이 해당 날짜로 pre-fill
- **할 일 수정/삭제**: 기존 TodoItem 동작 유지

---

## 5. 컴포넌트 구조

### 신규 컴포넌트

| 파일 | 역할 |
|---|---|
| `components/CalendarMonthView.tsx` | 월간 그리드 렌더링 |
| `components/CalendarWeekView.tsx` | 주간 컬럼 렌더링 |
| `components/CalendarDayView.tsx` | 일간 리스트 렌더링 |
| `components/CalendarHeader.tsx` | 이전/다음 이동 버튼 + 현재 날짜/주/월 표시 |

### 수정 파일

| 파일 | 변경 내용 |
|---|---|
| `app/layout.tsx` | nav에 오늘/다음날/주/월 링크 추가 |
| `app/page.tsx` | `?view`, `?date` 파라미터 읽어 뷰 분기 |
| `app/api/todos/route.ts` | `?dateFrom=&dateTo=` 범위 필터 추가 |
| `components/TodoForm.tsx` | `initialDate` prop 추가 |

---

## 6. API 변경

### GET `/api/todos`

기존 파라미터 유지, 아래 파라미터 추가:

| 파라미터 | 설명 |
|---|---|
| `dateFrom` | `dueDate >= dateFrom` 필터 (YYYY-MM-DD) |
| `dateTo` | `dueDate <= dateTo` 필터 (YYYY-MM-DD) |
| `noDate` | `true`면 `dueDate IS NULL` 만 반환 |

---

## 7. 디자인 시스템 적용 (Apple design.md 기준)

- 달력 그리드 셀: `#ffffff` 배경, `#e0e0e0` hairline border
- 할 일 칩: `#f5f5f7` 배경, `#1d1d1f` 텍스트, 8px radius
- 오늘 날짜 원: `#0066cc` 배경, `#ffffff` 텍스트
- 이전/다음 버튼: `button-icon-circular` 스타일 (44×44px, 반투명)
- "날짜 미지정" 섹션 헤더: `#7a7a7a` 텍스트, 14px
