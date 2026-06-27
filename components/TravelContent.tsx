'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import TripFormSheet, { Trip, TripPlace } from './TripFormSheet'

declare global {
  interface Window {
    kakao: {
      maps: {
        Map: new (container: HTMLElement, options: object) => KakaoMap
        LatLng: new (lat: number, lng: number) => KakaoLatLng
        Marker: new (options: object) => KakaoMarker
        event: { addListener: (target: object, type: string, handler: (e: KakaoMouseEvent) => void) => void }
        services: { Places: new () => KakaoPlaces; Status: { OK: string } }
      }
    }
  }
}
interface KakaoLatLng { getLat: () => number; getLng: () => number }
interface KakaoMouseEvent { latLng: KakaoLatLng }
interface KakaoMap { setCenter: (latlng: KakaoLatLng) => void }
interface KakaoMarker { setMap: (map: KakaoMap | null) => void }
interface KakaoPlace { place_name: string; y: string; x: string; address_name: string }
interface KakaoPlaces { keywordSearch: (q: string, cb: (data: KakaoPlace[], status: string) => void) => void }

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? ''

const inputStyle: React.CSSProperties = {
  fontSize: '14px',
  backgroundColor: 'var(--bg-hover)',
  color: 'var(--text-primary)',
  borderRadius: '8px',
  padding: '8px 12px',
  outline: 'none',
  border: 'none',
}

export default function TravelContent() {
  const mapRef = useRef<KakaoMap | null>(null)
  const markersRef = useRef<Map<number, KakaoMarker>>(new Map())
  const previewMarkerRef = useRef<KakaoMarker | null>(null)

  const [trips, setTrips] = useState<Trip[]>([])
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<KakaoPlace[]>([])
  const [panel, setPanel] = useState<
    | { type: 'add'; lat: number; lng: number }
    | { type: 'view'; place: TripPlace }
    | { type: 'edit'; place: TripPlace }
    | null
  >(null)
  const [form, setForm] = useState({ name: '', memo: '', visitedAt: '', photoData: '' })
  const [saving, setSaving] = useState(false)
  const [tripFormOpen, setTripFormOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)

  const selectedTrip = trips.find((t) => t.id === selectedTripId) ?? null

  const fetchTrips = useCallback(async () => {
    const res = await fetch('/api/trips')
    const data: Trip[] = await res.json()
    setTrips(data)
    return data
  }, [])

  const drawMarkers = useCallback((places: TripPlace[], map: KakaoMap) => {
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current.clear()
    places.forEach((p) => {
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(p.lat, p.lng),
        map,
      })
      window.kakao.maps.event.addListener(marker, 'click', () => {
        setPanel({ type: 'view', place: p })
        setResults([])
      })
      markersRef.current.set(p.id, marker)
    })
  }, [])

  const initMap = useCallback(() => {
    if (!window.kakao?.maps || mapRef.current) return
    const container = document.getElementById('travelmap')
    if (!container) return
    const map = new window.kakao.maps.Map(container, {
      center: new window.kakao.maps.LatLng(37.5665, 126.978),
      level: 5,
    })
    mapRef.current = map
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
  }, [])

  useEffect(() => {
    if (mapRef.current) return
    if (window.kakao?.maps) { initMap(); return }
    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&libraries=services`
    script.async = true
    script.onload = () => initMap()
    document.head.appendChild(script)
  }, [initMap])

  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  useEffect(() => {
    if (!mapRef.current) return
    const places = selectedTrip?.places ?? []
    drawMarkers(places, mapRef.current)
  }, [selectedTripId, trips, selectedTrip, drawMarkers])

  const handleSearch = () => {
    if (!query.trim() || !window.kakao?.maps?.services) return
    const ps = new window.kakao.maps.services.Places()
    ps.keywordSearch(query, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) setResults(data.slice(0, 8))
    })
  }

  const handleSelectResult = (r: KakaoPlace) => {
    const lat = parseFloat(r.y)
    const lng = parseFloat(r.x)
    if (mapRef.current && window.kakao) {
      const latlng = new window.kakao.maps.LatLng(lat, lng)
      mapRef.current.setCenter(latlng)
      previewMarkerRef.current?.setMap(null)
      const marker = new window.kakao.maps.Marker({ position: latlng, map: mapRef.current })
      previewMarkerRef.current = marker
    }
    setPanel({ type: 'add', lat, lng })
    setForm({ name: r.place_name, memo: '', visitedAt: '', photoData: '' })
    setResults([])
    setQuery('')
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm((f) => ({ ...f, photoData: reader.result as string }))
    reader.readAsDataURL(file)
  }

  const handleAdd = async () => {
    if (!panel || panel.type !== 'add' || !form.name || !selectedTripId) return
    setSaving(true)
    const res = await fetch(`/api/trips/${selectedTripId}/places`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, lat: panel.lat, lng: panel.lng, memo: form.memo, visitedAt: form.visitedAt || null, photoData: form.photoData || null }),
    })
    const newPlace: TripPlace = await res.json()
    setSaving(false)
    previewMarkerRef.current?.setMap(null)
    previewMarkerRef.current = null
    setPanel(null)
    setTrips((prev) => prev.map((t) => t.id === selectedTripId ? { ...t, places: [...t.places, newPlace] } : t))
  }

  const handleEditSave = async () => {
    if (!panel || panel.type !== 'edit' || !selectedTripId) return
    setSaving(true)
    const res = await fetch(`/api/trips/${selectedTripId}/places/${panel.place.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, memo: form.memo, visitedAt: form.visitedAt || null, photoData: form.photoData || null }),
    })
    const updated: TripPlace = await res.json()
    setSaving(false)
    setPanel(null)
    setTrips((prev) => prev.map((t) => t.id === selectedTripId
      ? { ...t, places: t.places.map((p) => p.id === updated.id ? updated : p) }
      : t
    ))
  }

  const handleDelete = async (place: TripPlace) => {
    if (!selectedTripId) return
    await fetch(`/api/trips/${selectedTripId}/places/${place.id}`, { method: 'DELETE' })
    setPanel(null)
    setTrips((prev) => prev.map((t) => t.id === selectedTripId
      ? { ...t, places: t.places.filter((p) => p.id !== place.id) }
      : t
    ))
  }

  const handleSetCover = async (placeId: number) => {
    if (!selectedTripId) return
    await fetch(`/api/trips/${selectedTripId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coverPlaceId: placeId }),
    })
    setTrips((prev) => prev.map((t) => t.id === selectedTripId ? { ...t, coverPlaceId: placeId } : t))
  }

  const handleDeleteTrip = async () => {
    if (!selectedTripId) return
    if (!confirm('이 여행을 삭제하면 장소도 모두 삭제됩니다. 계속할까요?')) return
    await fetch(`/api/trips/${selectedTripId}`, { method: 'DELETE' })
    setSelectedTripId(null)
    fetchTrips()
  }

  const closePanel = () => {
    previewMarkerRef.current?.setMap(null)
    previewMarkerRef.current = null
    setPanel(null)
  }

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 44px - env(safe-area-inset-top))', overflow: 'hidden' }}>
      {/* 상단 컨트롤 */}
      <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', zIndex: 10, display: 'flex', gap: '8px', flexDirection: 'column' }}>
        {/* 여행 선택 + 버튼 */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            value={selectedTripId ?? ''}
            onChange={(e) => setSelectedTripId(e.target.value ? Number(e.target.value) : null)}
            style={{ ...inputStyle, flex: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', appearance: 'none', paddingRight: '32px', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23999\' d=\'M6 8L1 3h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
          >
            <option value="">여행을 선택하세요</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>{t.name} ({t.startDate})</option>
            ))}
          </select>
          <button
            onClick={() => { setEditingTrip(null); setTripFormOpen(true) }}
            style={{ backgroundColor: '#0066cc', color: '#fff', fontSize: '14px', fontWeight: 600, padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          >
            + 새 여행
          </button>
        </div>

        {/* 여행 선택됐을 때: 장소 검색 + 여행 수정/삭제 */}
        {selectedTrip && (
          <>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="장소 검색..."
                style={{ ...inputStyle, flex: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              />
              <button onClick={handleSearch} style={{ backgroundColor: '#0066cc', color: '#fff', fontSize: '14px', fontWeight: 600, padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', flexShrink: 0 }}>검색</button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setEditingTrip(selectedTrip); setTripFormOpen(true) }} style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>수정</button>
              <button onClick={handleDeleteTrip} style={{ fontSize: '12px', color: '#ff3b30', background: 'rgba(255,59,48,0.08)', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>삭제</button>
              {selectedTrip.memo && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, alignSelf: 'center' }}>{selectedTrip.memo}</p>}
            </div>
          </>
        )}
      </div>

      {/* 검색 결과 */}
      {results.length > 0 && (
        <div style={{ position: 'absolute', top: selectedTrip ? '130px' : '68px', left: '12px', right: '12px', zIndex: 10, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
          {results.map((r, i) => (
            <button key={i} onClick={() => handleSelectResult(r)} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'block' }}>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{r.place_name}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', marginBottom: 0 }}>{r.address_name}</p>
            </button>
          ))}
        </div>
      )}

      {/* 지도 */}
      <div id="travelmap" style={{ width: '100%', height: '100%' }} />

      {/* 선택된 여행 없을 때 안내 */}
      {!selectedTrip && trips.length > 0 && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '20px 28px', textAlign: 'center', zIndex: 5, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>위에서 여행을 선택하세요</p>
        </div>
      )}
      {trips.length === 0 && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '20px 28px', textAlign: 'center', zIndex: 5, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
          <p style={{ fontSize: '32px', margin: '0 0 8px' }}>✈️</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>+ 새 여행을 눌러 첫 여행을 만들어보세요</p>
        </div>
      )}

      {/* 장소 패널 */}
      {panel && selectedTrip && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'var(--bg-card)', borderRadius: '20px 20px 0 0', boxShadow: '0 -4px 20px rgba(0,0,0,0.12)', maxHeight: '65vh', overflowY: 'auto', zIndex: 10, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {panel.type === 'view' ? panel.place.name : panel.type === 'edit' ? '장소 수정' : '새 장소 추가'}
            </p>
            <button onClick={closePanel} style={{ fontSize: '22px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>

          {panel.type === 'view' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {panel.place.photoData && (
                <img src={panel.place.photoData} alt={panel.place.name} style={{ width: '100%', borderRadius: '12px', objectFit: 'cover', maxHeight: '180px' }} />
              )}
              {panel.place.visitedAt && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>📅 {panel.place.visitedAt}</p>}
              {panel.place.memo && <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>{panel.place.memo}</p>}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                <button onClick={() => { setPanel({ type: 'edit', place: panel.place }); setForm({ name: panel.place.name, memo: panel.place.memo, visitedAt: panel.place.visitedAt ?? '', photoData: panel.place.photoData ?? '' }) }} style={{ flex: 1, padding: '8px', borderRadius: '100px', fontSize: '14px', fontWeight: 600, backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}>수정</button>
                <button onClick={() => handleDelete(panel.place)} style={{ flex: 1, padding: '8px', borderRadius: '100px', fontSize: '14px', fontWeight: 600, backgroundColor: 'rgba(255,59,48,0.1)', color: '#ff3b30', border: 'none', cursor: 'pointer' }}>삭제</button>
                {panel.place.photoData && selectedTrip.coverPlaceId !== panel.place.id && (
                  <button onClick={() => handleSetCover(panel.place.id)} style={{ width: '100%', padding: '8px', borderRadius: '100px', fontSize: '13px', fontWeight: 500, backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}>이 사진을 커버로 설정</button>
                )}
                {selectedTrip.coverPlaceId === panel.place.id && (
                  <p style={{ width: '100%', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>✓ 커버 사진</p>
                )}
              </div>
            </div>
          )}

          {(panel.type === 'add' || panel.type === 'edit') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="장소명" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
              <input value={form.memo} onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))} placeholder="메모 (선택)" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
              <input value={form.visitedAt} onChange={(e) => setForm((f) => ({ ...f, visitedAt: e.target.value }))} placeholder="방문일 (YYYY-MM-DD, 선택)" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 6px' }}>사진 (선택)</p>
                <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ fontSize: '13px', color: 'var(--text-secondary)' }} />
                {form.photoData && <img src={form.photoData} alt="preview" style={{ marginTop: '8px', width: '100%', borderRadius: '8px', objectFit: 'cover', maxHeight: '120px' }} />}
              </div>
              <button
                onClick={panel.type === 'add' ? handleAdd : handleEditSave}
                disabled={saving || !form.name}
                style={{ width: '100%', padding: '10px', borderRadius: '100px', fontSize: '14px', fontWeight: 600, backgroundColor: form.name ? '#0066cc' : 'var(--bg-hover)', color: form.name ? '#fff' : '#b0b0b5', border: 'none', cursor: form.name ? 'pointer' : 'default', marginTop: '4px' }}
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 여행 생성/수정 시트 */}
      {tripFormOpen && (
        <TripFormSheet
          trip={editingTrip}
          onSave={(saved) => {
            setTripFormOpen(false)
            fetchTrips().then(() => setSelectedTripId(saved.id))
          }}
          onClose={() => setTripFormOpen(false)}
        />
      )}
    </div>
  )
}
