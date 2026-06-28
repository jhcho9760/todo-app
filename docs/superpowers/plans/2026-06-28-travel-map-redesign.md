# Travel Map Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** TravelContent를 사이드바 여행 목록 + 검색 기반 핀 추가 + fit bounds + 사진 포함 상세 패널로 리디자인한다.

**Architecture:** TravelContent.tsx 단일 파일을 수정한다. 데스크톱은 좌측 240px 사이드바(여행 아코디언) + 우측 지도, 모바일은 상단 드롭다운 + 지도 + 바텀시트 장소 목록. 지도 클릭 핀 추가는 제거하고 검색으로만 추가.

**Tech Stack:** Next.js 15 App Router, React, Kakao Maps JS SDK (autoload=false), Tailwind CSS, inline styles (var(--bg-card) 등 CSS 변수)

## Global Constraints

- 카카오맵 초기화: `autoload=false` + `window.kakao.maps.load(() => initMap())` 패턴 유지
- CSS 변수: `var(--bg-card)`, `var(--border)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--bg-hover)` 사용
- API/DB 스키마 변경 없음 — `/api/trips`, `/api/trips/[id]/places` 그대로 사용
- TripFormSheet 컴포넌트 변경 없음
- 모바일 기준: `window.innerWidth < 768` / Tailwind `md:` breakpoint

---

### Task 1: 카카오맵 타입 확장 + 지도 클릭 제거 + fit bounds 추가

**Files:**
- Modify: `components/TravelContent.tsx`

**Interfaces:**
- Produces: `fitBounds(places: TripPlace[], map: KakaoMap)` — 내부 함수

- [ ] **Step 1: KakaoMap / KakaoBounds 타입 확장**

`components/TravelContent.tsx` 상단 인터페이스를 아래로 교체:

```tsx
interface KakaoLatLng { getLat: () => number; getLng: () => number }
interface KakaoMouseEvent { latLng: KakaoLatLng }
interface KakaoBounds { extend: (latlng: KakaoLatLng) => void }
interface KakaoMap {
  setCenter: (latlng: KakaoLatLng) => void
  setBounds: (bounds: KakaoBounds) => void
}
interface KakaoMarker { setMap: (map: KakaoMap | null) => void }
interface KakaoPlace { place_name: string; y: string; x: string; address_name: string }
interface KakaoPlaces { keywordSearch: (q: string, cb: (data: KakaoPlace[], status: string) => void) => void }
```

- [ ] **Step 2: initMap에서 지도 클릭 이벤트 리스너 제거**

`initMap` 콜백에서 아래 블록 전체 삭제:
```tsx
window.kakao.maps.event.addListener(map, 'click', (e: KakaoMouseEvent) => {
  const lat = e.latLng.getLat()
  const lng = e.latLng.getLng()
  previewMarkerRef.current?.setMap(null)
  const marker = new window.kakao.maps.Marker({ position: e.latLng, map })
  previewMarkerRef.current = marker
  setPanel({ type: 'add', lat, lng })
  setForm({ name: '', memo: '', visitedAt: '', photoData: '' })
  setResults([])
})
```

`KakaoMouseEvent` 인터페이스도 더 이상 사용하지 않으므로 삭제.

- [ ] **Step 3: fitBounds 함수 추가**

`drawMarkers` 함수 바로 아래에 추가:

```tsx
const fitBounds = useCallback((places: TripPlace[], map: KakaoMap) => {
  if (places.length === 0) {
    map.setCenter(new window.kakao.maps.LatLng(37.5665, 126.978))
    return
  }
  const bounds = new window.kakao.maps.LatLngBounds()
  places.forEach((p) => bounds.extend(new window.kakao.maps.LatLng(p.lat, p.lng)))
  map.setBounds(bounds)
}, [])
```

- [ ] **Step 4: selectedTripId 변경 시 fitBounds 호출**

기존 `useEffect`(selectedTripId, trips 의존):
```tsx
useEffect(() => {
  if (!mapRef.current) return
  const places = selectedTrip?.places ?? []
  drawMarkers(places, mapRef.current)
}, [selectedTripId, trips, selectedTrip, drawMarkers])
```

아래로 교체:
```tsx
useEffect(() => {
  if (!mapRef.current) return
  const places = selectedTrip?.places ?? []
  drawMarkers(places, mapRef.current)
  fitBounds(places, mapRef.current)
}, [selectedTripId, trips, selectedTrip, drawMarkers, fitBounds])
```

- [ ] **Step 5: 빌드 확인**

```bash
npx tsc --noEmit
```

에러 없으면 진행.

- [ ] **Step 6: 커밋**

```bash
git add components/TravelContent.tsx
git commit -m "feat: 카카오맵 fit bounds 추가, 지도 클릭 핀 추가 제거"
```

---

### Task 2: 데스크톱 사이드바 — 여행 아코디언 목록

**Files:**
- Modify: `components/TravelContent.tsx`

**Interfaces:**
- Consumes: `trips: Trip[]`, `selectedTripId`, `setSelectedTripId`, `fitBounds`, `drawMarkers`
- Produces: 사이드바 JSX (240px 좌측 고정)

- [ ] **Step 1: expandedTripId state 추가**

`TravelContent` 상단 state 목록에 추가:
```tsx
const [expandedTripId, setExpandedTripId] = useState<number | null>(null)
```

- [ ] **Step 2: 여행 선택 핸들러 추가**

```tsx
const handleSelectTrip = useCallback((tripId: number) => {
  setSelectedTripId(tripId)
  setExpandedTripId((prev) => (prev === tripId ? null : tripId))
  setPanel(null)
}, [])
```

- [ ] **Step 3: 장소 클릭 핸들러 추가**

```tsx
const handleSelectPlace = useCallback((place: TripPlace) => {
  if (!mapRef.current) return
  mapRef.current.setCenter(new window.kakao.maps.LatLng(place.lat, place.lng))
  setPanel({ type: 'view', place })
}, [])
```

- [ ] **Step 4: 사이드바 JSX 작성**

기존 `return` 문의 최상위 div를 아래 구조로 교체:

```tsx
return (
  <div style={{ display: 'flex', height: 'calc(100vh - 44px - env(safe-area-inset-top))', overflow: 'hidden' }}>
    {/* 데스크톱 사이드바 */}
    <aside
      className="hidden md:flex flex-col"
      style={{ width: '240px', flexShrink: 0, backgroundColor: 'var(--bg-card)', borderRight: '1px solid var(--border)', overflowY: 'auto' }}
    >
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>나의 여행</span>
        <button
          onClick={() => { setEditingTrip(null); setTripFormOpen(true) }}
          style={{ fontSize: '13px', fontWeight: 600, color: '#0066cc', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          + 새 여행
        </button>
      </div>

      {trips.length === 0 && (
        <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
          + 새 여행을 눌러 시작하세요
        </div>
      )}

      {trips.map((trip) => {
        const isExpanded = expandedTripId === trip.id
        const isSelected = selectedTripId === trip.id
        return (
          <div key={trip.id}>
            <div
              style={{
                display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', gap: '8px',
                backgroundColor: isSelected ? 'rgba(0,102,204,0.06)' : 'transparent',
                borderBottom: '1px solid var(--border)',
              }}
              onClick={() => handleSelectTrip(trip.id)}
            >
              <span style={{ fontSize: '14px' }}>✈️</span>
              <span style={{ flex: 1, fontSize: '14px', fontWeight: isSelected ? 600 : 400, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {trip.name}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setEditingTrip(trip); setTripFormOpen(true) }}
                style={{ fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px' }}
              >✏️</button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteTripById(trip.id) }}
                style={{ fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px' }}
              >🗑</button>
            </div>

            {isExpanded && (
              <div style={{ backgroundColor: 'var(--bg-hover)' }}>
                {trip.places.length === 0 && (
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '10px 24px' }}>장소를 검색해서 추가하세요</p>
                )}
                {trip.places.map((place) => (
                  <div
                    key={place.id}
                    onClick={() => handleSelectPlace(place)}
                    style={{ padding: '8px 24px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>📍</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </aside>

    {/* 지도 영역 */}
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      {/* 기존 지도 + 컨트롤 JSX를 이 div 안으로 이동 */}
    </div>
  </div>
)
```

- [ ] **Step 5: handleDeleteTrip을 handleDeleteTripById로 리팩토링**

기존 `handleDeleteTrip`은 `selectedTripId`를 직접 사용하므로 ID를 파라미터로 받도록 변경:

```tsx
const handleDeleteTripById = async (tripId: number) => {
  if (!confirm('이 여행을 삭제하면 장소도 모두 삭제됩니다. 계속할까요?')) return
  await fetch(`/api/trips/${tripId}`, { method: 'DELETE' })
  if (selectedTripId === tripId) setSelectedTripId(null)
  setExpandedTripId(null)
  fetchTrips()
}
```

기존 `handleDeleteTrip` 함수 삭제.

- [ ] **Step 6: 빌드 확인**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: 커밋**

```bash
git add components/TravelContent.tsx
git commit -m "feat: 여행 목록 데스크톱 사이드바 아코디언 추가"
```

---

### Task 3: 모바일 — 드롭다운 + 바텀시트 장소 목록

**Files:**
- Modify: `components/TravelContent.tsx`

**Interfaces:**
- Consumes: `trips`, `selectedTripId`, `selectedTrip`, `handleSelectTrip`, `handleSelectPlace`

- [ ] **Step 1: 모바일 상단 컨트롤 JSX**

지도 영역 div 안 최상단에 추가 (기존 상단 컨트롤 대체):

```tsx
{/* 모바일 상단 컨트롤 */}
<div className="flex md:hidden" style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', zIndex: 10, gap: '8px', display: 'flex' }}>
  <select
    value={selectedTripId ?? ''}
    onChange={(e) => e.target.value ? handleSelectTrip(Number(e.target.value)) : setSelectedTripId(null)}
    style={{ ...inputStyle, flex: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', appearance: 'none' }}
  >
    <option value="">여행을 선택하세요</option>
    {trips.map((t) => (
      <option key={t.id} value={t.id}>{t.name}</option>
    ))}
  </select>
  <button
    onClick={() => { setEditingTrip(null); setTripFormOpen(true) }}
    style={{ backgroundColor: '#0066cc', color: '#fff', fontSize: '14px', fontWeight: 600, padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
  >
    + 새 여행
  </button>
</div>
```

- [ ] **Step 2: 모바일 검색창 (여행 선택 시만 표시)**

모바일 상단 컨트롤 바로 아래 추가:

```tsx
{selectedTrip && (
  <div className="flex md:hidden" style={{ position: 'absolute', top: '64px', left: '12px', right: '12px', zIndex: 10, display: 'flex', gap: '8px' }}>
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
      placeholder="장소 검색..."
      style={{ ...inputStyle, flex: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
    />
    <button onClick={handleSearch} style={{ backgroundColor: '#0066cc', color: '#fff', fontSize: '14px', fontWeight: 600, padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', flexShrink: 0 }}>검색</button>
  </div>
)}
```

- [ ] **Step 3: 모바일 바텀시트 장소 목록**

패널 JSX 위에 추가:

```tsx
{/* 모바일 바텀시트 — 장소 목록 */}
{selectedTrip && !panel && (
  <div
    className="flex md:hidden flex-col"
    style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      backgroundColor: 'var(--bg-card)',
      borderRadius: '20px 20px 0 0',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
      maxHeight: '40vh', overflowY: 'auto',
      zIndex: 10, padding: '12px 0',
    }}
  >
    <div style={{ width: '36px', height: '4px', backgroundColor: 'var(--border)', borderRadius: '2px', margin: '0 auto 12px' }} />
    {selectedTrip.places.length === 0 ? (
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '8px 20px' }}>장소를 검색해서 추가하세요</p>
    ) : (
      selectedTrip.places.map((place) => (
        <div
          key={place.id}
          onClick={() => handleSelectPlace(place)}
          style={{ padding: '10px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)' }}
        >
          <span>📍</span>
          <div>
            <p style={{ fontSize: '14px', color: 'var(--text-primary)', margin: 0, fontWeight: 500 }}>{place.name}</p>
            {place.visitedAt && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{place.visitedAt}</p>}
          </div>
        </div>
      ))
    )}
  </div>
)}
```

- [ ] **Step 4: 빌드 확인**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: 커밋**

```bash
git add components/TravelContent.tsx
git commit -m "feat: 모바일 드롭다운 + 바텀시트 장소 목록 추가"
```

---

### Task 4: 데스크톱 검색창 + 검색 결과

**Files:**
- Modify: `components/TravelContent.tsx`

**Interfaces:**
- Consumes: `query`, `results`, `handleSearch`, `handleSelectResult`, `selectedTrip`

- [ ] **Step 1: 데스크톱 검색창 JSX**

지도 영역 div 안에 데스크톱 검색창 추가 (모바일 컨트롤과 별도):

```tsx
{/* 데스크톱 검색창 */}
{selectedTrip && (
  <div className="hidden md:flex" style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', zIndex: 10, gap: '8px' }}>
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
      placeholder="장소 검색..."
      style={{ ...inputStyle, flex: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
    />
    <button onClick={handleSearch} style={{ backgroundColor: '#0066cc', color: '#fff', fontSize: '14px', fontWeight: 600, padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', flexShrink: 0 }}>검색</button>
  </div>
)}
```

- [ ] **Step 2: 검색 결과 드롭다운 (데스크톱/모바일 공통)**

```tsx
{results.length > 0 && (
  <div style={{
    position: 'absolute',
    top: selectedTrip ? (typeof window !== 'undefined' && window.innerWidth < 768 ? '110px' : '56px') : '56px',
    left: '12px', right: '12px', zIndex: 10,
    backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', overflow: 'hidden',
  }}>
    {results.map((r, i) => (
      <button key={i} onClick={() => handleSelectResult(r)} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'block' }}>
        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{r.place_name}</p>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', marginBottom: 0 }}>{r.address_name}</p>
      </button>
    ))}
  </div>
)}
```

- [ ] **Step 3: handleSelectResult — 검색 선택 시 add 패널 열기**

기존 `handleSelectResult` 유지 (lat/lng → panel add + 미리보기 핀). 변경 없음.

- [ ] **Step 4: 빌드 확인**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: 커밋**

```bash
git add components/TravelContent.tsx
git commit -m "feat: 데스크톱 검색창 + 검색 결과 드롭다운"
```

---

### Task 5: 핀 상세 패널에 사진 표시

**Files:**
- Modify: `components/TravelContent.tsx`

**Interfaces:**
- Consumes: `panel.type === 'view'`, `TripPlace.photoData`

- [ ] **Step 1: view 패널 JSX에 사진 추가**

기존 `panel.type === 'view'` 섹션에서 사진 블록이 이미 있는지 확인:

```tsx
{panel.place.photoData && (
  <img src={panel.place.photoData} alt={panel.place.name} style={{ width: '100%', borderRadius: '12px', objectFit: 'cover', maxHeight: '180px' }} />
)}
```

없으면 메모 위에 추가. 이미 있으면 이 Step 스킵.

- [ ] **Step 2: 상세 패널 레이아웃 확인**

view 패널 전체가 아래 순서인지 확인하고 필요 시 재정렬:

```tsx
{panel.type === 'view' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    {panel.place.photoData && (
      <img src={panel.place.photoData} alt={panel.place.name}
        style={{ width: '100%', borderRadius: '12px', objectFit: 'cover', maxHeight: '200px' }} />
    )}
    {panel.place.visitedAt && (
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>📅 {panel.place.visitedAt}</p>
    )}
    {panel.place.memo && (
      <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>{panel.place.memo}</p>
    )}
    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
      <button onClick={() => { setPanel({ type: 'edit', place: panel.place }); setForm({ name: panel.place.name, memo: panel.place.memo, visitedAt: panel.place.visitedAt ?? '', photoData: panel.place.photoData ?? '' }) }}
        style={{ flex: 1, padding: '8px', borderRadius: '100px', fontSize: '14px', fontWeight: 600, backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}>수정</button>
      <button onClick={() => handleDelete(panel.place)}
        style={{ flex: 1, padding: '8px', borderRadius: '100px', fontSize: '14px', fontWeight: 600, backgroundColor: 'rgba(255,59,48,0.1)', color: '#ff3b30', border: 'none', cursor: 'pointer' }}>삭제</button>
    </div>
  </div>
)}
```

- [ ] **Step 3: 빌드 확인**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: 커밋**

```bash
git add components/TravelContent.tsx
git commit -m "feat: 핀 상세 패널 사진 표시 정렬"
```

---

### Task 6: 데스크톱 여행 없음 안내 + 배포

**Files:**
- Modify: `components/TravelContent.tsx`

- [ ] **Step 1: 데스크톱에서 여행 미선택 시 지도 중앙 안내 제거**

기존 `!selectedTrip && trips.length > 0` / `trips.length === 0` 안내 오버레이는 모바일에서만 표시되도록 `className="flex md:hidden"` 추가. 데스크톱은 사이드바가 안내 역할을 하므로 불필요.

- [ ] **Step 2: 최종 빌드 확인**

```bash
npx tsc --noEmit
```

에러 없으면 진행.

- [ ] **Step 3: 커밋 + 푸시**

```bash
git add components/TravelContent.tsx
git commit -m "feat: 여행 지도 UI 리디자인 완료"
git push origin master
```
