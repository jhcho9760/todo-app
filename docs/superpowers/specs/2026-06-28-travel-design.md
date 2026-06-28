# 여행 탭 설계

**날짜:** 2026-06-28  
**상태:** 승인됨

## 개요

여행 탭(`/travel`)에 여행 단위로 방문 장소를 지도에 핀으로 기록하는 기능을 추가한다.  
기존 데이트 장소 지도(`/map`, `DatePlace`)는 건드리지 않고 완전히 분리된 데이터 모델로 구현한다.

## UI 구조

지도가 메인 화면이며, 상단 드롭다운으로 여행을 전환한다.

```
[지도 전체화면]
┌─────────────────────────────────┐
│ [제주도 여행 ▼]  [+ 새 여행]    │  ← 상단 고정
│                                 │
│         카카오맵                │
│    (선택된 여행의 핀들 표시)    │
│                                 │
└─────────────────────────────────┘
```

- 드롭다운에서 여행 선택 → 해당 여행의 장소 핀만 지도에 표시
- 지도 클릭 또는 상단 검색으로 장소 추가 (기존 /map과 동일한 UX)
- 핀 클릭 → 바텀시트로 장소 상세 보기 / 수정 / 삭제
- 장소 추가 시 사진 업로드 가능, 그 중 하나를 해당 여행의 커버로 지정

## 데이터 모델

### Trip

| 필드 | 타입 | 설명 |
|------|------|------|
| id | Int | PK |
| name | String | 여행 이름 (예: 제주도 여행) |
| startDate | String | 시작일 (YYYY-MM-DD) |
| endDate | String? | 종료일 (선택) |
| memo | String | 한 줄 메모 (기본값 "") |
| coverPlaceId | Int? | 커버로 사용할 TripPlace ID |
| createdAt | DateTime | 생성일 |

### TripPlace

| 필드 | 타입 | 설명 |
|------|------|------|
| id | Int | PK |
| tripId | Int | Trip FK |
| name | String | 장소명 |
| lat | Float | 위도 |
| lng | Float | 경도 |
| memo | String | 메모 (기본값 "") |
| visitedAt | String? | 방문일 (YYYY-MM-DD) |
| photoUrl | String? | 사진 URL |
| createdAt | DateTime | 생성일 |

## API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/trips | 전체 여행 목록 |
| POST | /api/trips | 새 여행 생성 |
| PUT | /api/trips/[id] | 여행 수정 (이름/날짜/메모/커버) |
| DELETE | /api/trips/[id] | 여행 삭제 (장소도 cascade) |
| GET | /api/trips/[id]/places | 특정 여행의 장소 목록 |
| POST | /api/trips/[id]/places | 장소 추가 |
| PUT | /api/trips/[id]/places/[placeId] | 장소 수정 |
| DELETE | /api/trips/[id]/places/[placeId] | 장소 삭제 |

사진 업로드는 `/api/trips/[id]/places` POST 시 `multipart/form-data`로 처리하거나,  
별도 `/api/upload` 엔드포인트에서 URL을 먼저 받아 사용한다.  
→ 기존 프로젝트에 업로드 인프라가 없으므로 **Base64로 DB 저장** 방식으로 단순화한다 (photoUrl 대신 photoData 컬럼).

## 컴포넌트 구조

```
app/travel/page.tsx          — Suspense 래퍼
components/
  TravelContent.tsx          — 메인: 카카오맵 + 드롭다운 + 패널 통합
  TripFormSheet.tsx          — 새 여행 만들기 / 수정 바텀시트
```

카카오맵 SDK 로딩, 검색, 마커 관리는 기존 `MapContent.tsx` 패턴을 그대로 따른다.

## 구현 순서

1. Prisma 스키마에 `Trip`, `TripPlace` 모델 추가 + 마이그레이션
2. API 라우트 구현 (`/api/trips`, `/api/trips/[id]`, `/api/trips/[id]/places`, `/api/trips/[id]/places/[placeId]`)
3. `TripFormSheet.tsx` — 여행 생성/수정 바텀시트
4. `TravelContent.tsx` — 지도 + 드롭다운 + 장소 추가/보기 패널
5. `app/travel/page.tsx` — 기존 placeholder 교체

## 범위 외

- 여행 공유 기능
- 여행 통계/분석
- 오프라인 지원
- 기존 `/map` (DatePlace) 수정
