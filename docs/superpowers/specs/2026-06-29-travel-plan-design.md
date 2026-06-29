# 여행 계획 기능 설계

**날짜:** 2026-06-29  
**상태:** 승인됨

## 개요

기존 여행 지도 화면에 "계획" 탭을 추가한다. 여행 선택 후 "지도" / "계획" 탭으로 전환하며, 계획 탭은 일정·체크리스트·예산 세 섹션으로 구성된다.

## UI 구조

### 탭 전환
- 여행이 선택된 상태에서 상단에 "지도" / "계획" 탭 표시
- 여행 미선택 시 탭 숨김

### 계획 탭 섹션 (세로 스크롤)

#### 1. 날짜별 일정
- 여행 시작일~종료일을 날짜별로 나열 (1일차, 2일차...)
- 각 날짜에 기존 TripPlace를 버튼으로 배정
- 미배정 장소 목록에서 선택해 날짜에 추가
- 배정된 장소 카드에서 제거 버튼으로 미배정으로 복귀
- 날짜 없는 여행(종료일 미설정)은 일정 섹션 숨김

#### 2. 체크리스트
- 카테고리 4개 고정: 준비물 / 예약 / 숙소 / 기타
- 카테고리별 항목 추가(텍스트 입력) / 삭제 / 체크
- 체크된 항목은 취소선 처리

#### 3. 예산
- 날짜별 지출 항목 추가 (항목명 + 금액)
- 날짜 선택은 여행 기간 내 날짜 드롭다운
- 하단에 총 지출 합계 표시
- 항목 삭제 가능

## 데이터 변경

### 기존 TripPlace 수정
- `dayIndex Int?` 추가 (null = 미배정, 1 = 1일차, 2 = 2일차...)

### 새 테이블: TripChecklist
```
id        Int
tripId    Int
category  String  // "준비물" | "예약" | "숙소" | "기타"
text      String
checked   Boolean
```

### 새 테이블: TripExpense
```
id       Int
tripId   Int
date     String  // YYYY-MM-DD
name     String
amount   Int
```

## API 엔드포인트

- `PATCH /api/trips/[id]/places/[placeId]` — dayIndex 업데이트
- `GET/POST /api/trips/[id]/checklists`
- `PATCH/DELETE /api/trips/[id]/checklists/[checklistId]`
- `GET/POST /api/trips/[id]/expenses`
- `DELETE /api/trips/[id]/expenses/[expenseId]`

## 파일 변경 범위

- `prisma/schema.prisma` — TripPlace dayIndex, TripChecklist, TripExpense 추가
- `app/api/trips/[id]/places/[placeId]/route.ts` — PATCH 처리 추가
- `app/api/trips/[id]/checklists/route.ts` — 신규
- `app/api/trips/[id]/checklists/[checklistId]/route.ts` — 신규
- `app/api/trips/[id]/expenses/route.ts` — 신규
- `app/api/trips/[id]/expenses/[expenseId]/route.ts` — 신규
- `components/TravelContent.tsx` — 탭 UI + 계획 탭 렌더링
- `components/TripPlanTab.tsx` — 계획 탭 컴포넌트 (신규)
