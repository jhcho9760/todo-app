## Task 1 Report

### 구현 내용 요약
- **Step 1**: `TravelContent.tsx` 상단 인터페이스 교체 — `KakaoBounds` 추가, `KakaoMouseEvent` 제거, `KakaoMap`에 `setBounds` 추가
- **Step 2**: `initMap` 콜백에서 지도 클릭 이벤트 리스너 블록 전체 삭제
- **Step 3**: `drawMarkers` 아래에 `fitBounds` useCallback 추가 — 장소 없으면 서울 중심으로, 있으면 모든 마커를 포함하도록 `LatLngBounds` 사용
- **Step 4**: `selectedTripId` 변경 useEffect에서 `fitBounds` 호출 추가
- **부수 변경**: `MapContent.tsx`의 공유 `declare global` Window 타입에 `KakaoBounds`, `LatLngBounds`, `setBounds` 추가 (TravelContent.tsx가 동일 TS 프로젝트의 글로벌 타입을 공유하므로 필요)

### 변경 파일 목록
- `components/TravelContent.tsx`
- `components/MapContent.tsx` (Window 글로벌 타입 확장)

### 빌드 결과 (npx tsc --noEmit)
```
.next/types/validator.ts(215,39): error TS2307: Cannot find module '../../app/api/tmap-search/route.js' or its corresponding type declarations.
```
이 에러는 작업 전부터 존재하던 pre-existing 에러 (tmap-search API 라우트 관련, 본 태스크와 무관). TravelContent.tsx 관련 타입 에러 없음.

### 커밋 해시
`a56df87` — feat: 카카오맵 fit bounds 추가, 지도 클릭 핀 추가 제거
