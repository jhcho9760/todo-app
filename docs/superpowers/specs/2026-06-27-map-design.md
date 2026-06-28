# 데이트 장소 지도 설계 문서

**날짜:** 2026-06-27  
**상태:** 승인됨

---

## 개요

커플이 함께 다녀온 데이트 장소를 지도에 핀으로 저장하고, 메모와 방문일을 기록하는 기능. T맵 JavaScript SDK 사용.

---

## DB 스키마

### 신규 모델: DatePlace

```prisma
model DatePlace {
  id        Int      @id @default(autoincrement())
  name      String
  lat       Float
  lng       Float
  memo      String   @default("")
  visitedAt String?  // "YYYY-MM-DD"
  createdAt DateTime @default(now())
}
```

---

## 페이지 구조

### `/map` — 메인 지도 페이지

- **상단 검색창**: 장소명 입력 → `/api/tmap-search` 호출 → 결과 목록 드롭다운 → 선택 시 지도 이동 + 미리보기 핀
- **지도**: T맵 전체화면. 저장된 장소에 핀 표시
- **지도 탭/클릭**: 해당 좌표에 새 장소 추가 폼 슬라이드업 (모바일) / 사이드 패널 (데스크탑)
- **핀 클릭**: 장소 카드 표시 (이름, 메모, 방문일, 수정/삭제)
- **추가 폼 필드**: 장소명, 메모(선택), 방문일(선택)

---

## API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/places` | 전체 장소 목록 |
| POST | `/api/places` | 장소 추가 (`{ name, lat, lng, memo, visitedAt }`) |
| PUT | `/api/places/[id]` | 장소 수정 |
| DELETE | `/api/places/[id]` | 장소 삭제 |
| GET | `/api/tmap-search?q=검색어` | T맵 POI 검색 프록시 |

---

## T맵 연동

- 환경변수: `TMAP_APP_KEY` (Vercel + 로컬 `.env`에 설정)
- SDK 로드: Next.js `Script` 컴포넌트 (`strategy="afterInteractive"`)
  ```html
  <script src="https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=..."></script>
  ```
- 지도 초기화: `new window.Tmap.Map({ div: 'map', zoom: 14, center: { lat, lng } })`
- 마커: `new window.Tmap.Marker({ position, map })`
- POI 검색: T맵 POI API (`https://apis.openapi.sk.com/tmap/pois`)를 서버 라우트에서 호출

---

## 컴포넌트

- `components/MapContent.tsx` — 지도 + 검색 + 핀 관리 메인 컴포넌트
- `app/map/page.tsx` — 페이지 래퍼

---

## 네비게이션

### 사이드바 (`Sidebar.tsx`)
- ❤️ 섹션 DIARY_ITEMS에 `{ label: '지도', href: '/map' }` 추가

### 모바일 탭바 (`MobileTabBar.tsx`)
- 지도 아이콘 탭 추가 (6번째)

---

## 마이그레이션

`prisma/migrations/20260627000001_add_date_place/migration.sql`

```sql
CREATE TABLE "DatePlace" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "lat" DOUBLE PRECISION NOT NULL,
  "lng" DOUBLE PRECISION NOT NULL,
  "memo" TEXT NOT NULL DEFAULT '',
  "visitedAt" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```
