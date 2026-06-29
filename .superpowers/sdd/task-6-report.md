# Task 6 Report: TravelContent 탭 UI 연결

**Status:** DONE

**Commits:**
- `e41188b` feat: add map/plan tabs to travel page

**Changes:**
- `TripFormSheet.tsx`: `TripPlace`에 `dayIndex?: number | null` 추가
- `TravelContent.tsx`: `TripPlanTab` import, `activeTab` 상태, 탭 버튼 UI, `handleSelectTrip`에 탭 초기화, 지도 div를 `display` 토글로 DOM 유지

**Concerns:** None.

## Final Review Fixes

- **Fix 1 (assignDay error handling):** Wrapped fetch in try/catch. On error, logs `'장소 배정 실패:'` and skips `onPlacesChange()` to prevent stale state refresh.
- **Fix 2 (unassignedPlaces filter):** Changed `!p.dayIndex` to `p.dayIndex == null` to correctly handle `dayIndex === 0` edge case.
- **Fix 3 (iOS select font size):** Changed day-assign `<select>` fontSize from `'13px'` to `'16px'` to prevent iOS auto-zoom.
- **Fix 4 (TripPlaceWithDay removal):** Removed local `type TripPlaceWithDay` alias and `as TripPlaceWithDay[]` cast. `trip.places` used directly as `TripPlace[]` since `dayIndex?: number | null` already exists on `TripPlace`.
- **Fix 5 (overflowY removed):** Removed `overflowY: 'auto'` from TripPlanTab root div; outer `TravelContent` container handles scrolling.
