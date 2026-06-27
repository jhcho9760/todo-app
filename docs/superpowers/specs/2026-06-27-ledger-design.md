# 데이트 가계부 설계 문서

**날짜:** 2026-06-27  
**상태:** 승인됨

---

## 개요

데이트 달력과 동일한 레이아웃의 월간 달력 기반 가계부. 날짜별 지출을 기록하고, 두 사람 중 누가 결제했는지 추적한다. 두 사람 이름은 설정에서 저장해두고 선택해서 사용한다.

---

## DB 스키마

### 신규 모델: LedgerEntry

```prisma
model LedgerEntry {
  id        Int      @id @default(autoincrement())
  date      String   // "2026-06-27"
  label     String   // 항목명
  amount    Int      // 금액 (원 단위)
  category  String   // "식사"|"카페"|"영화"|"쇼핑"|"숙소"|"기타"
  paidBy    String   // AppConfig에서 가져온 이름
  createdAt DateTime @default(now())
}
```

### AppConfig 키 추가

- `ledger_name_1`: 첫 번째 사람 이름
- `ledger_name_2`: 두 번째 사람 이름

---

## 페이지 구조

### `/ledger` — 메인 가계부 페이지

- **상단 요약 카드**: 이번 달 총액 / 이름1 합계 / 이름2 합계
- **월간 달력**: 지출 있는 날에 총액 표시 (DiaryContent 패턴 동일)
- **날짜 선택 시**: 우측(데스크탑) / 하단(모바일)에 해당 날 지출 목록 + 입력 폼
- **입력 폼 필드**: 항목명, 금액, 카테고리(선택), 결제자(선택)
- **이름 미설정 시**: 설정 페이지 안내 배너 표시

### 카테고리 목록 (고정)

`식사` `카페` `영화` `쇼핑` `숙소` `기타`

---

## API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/ledger?date=YYYY-MM-DD` | 날짜별 지출 목록 |
| POST | `/api/ledger` | 지출 항목 추가 |
| DELETE | `/api/ledger/[id]` | 항목 삭제 |
| GET | `/api/ledger/monthly?month=YYYY-MM` | 월별 날짜별 합계 (달력 표시용) |

---

## 컴포넌트

- `components/LedgerContent.tsx` — 메인 달력 + 지출 목록 (DiaryContent 패턴)
- `app/ledger/page.tsx` — 페이지 래퍼

---

## 네비게이션 변경

### 사이드바 (`Sidebar.tsx`)

- "데이트 달력" 섹션 헤더에 ❤️ 아이콘 추가
- DIARY_ITEMS에 `{ label: '가계부', href: '/ledger' }` 추가

### 모바일 탭바 (`MobileTabBar.tsx`)

- "달력" 탭 아이콘을 하트 SVG로 변경
- "가계부" 탭 추가 (지갑 아이콘)

---

## 마이그레이션

`prisma/migrations/20260627000000_add_ledger/migration.sql`

```sql
CREATE TABLE "LedgerEntry" (
  "id" SERIAL PRIMARY KEY,
  "date" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "category" TEXT NOT NULL,
  "paidBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```
