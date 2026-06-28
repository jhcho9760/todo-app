'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import TripFormSheet, { Trip, TripPlace } from './TripFormSheet'

interface KakaoLatLng { getLat: () => number; getLng: () => number }
interface KakaoBounds { extend: (latlng: KakaoLatLng) => void }
interface KakaoMap {
  setCenter: (latlng: KakaoLatLng) => void
  setBounds: (bounds: KakaoBounds) => void
}
interface KakaoMarker { setMap: (map: KakaoMap | null) => void }
interface KakaoPlace { place_name: string; y: string; x: string; address_name: string }
interface KakaoPlaces { keywordSearch: (q: string, cb: (data: KakaoPlace[], status: string) => void) => void }
interface KakaoRegion { region_1depth_name: string; region_2depth_name: string; region_3depth_name: string; region_type: string }
interface KakaoGeocoder { coord2RegionCode: (lng: number, lat: number, cb: (data: KakaoRegion[], status: string) => void) => void }

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
  const [expandedTripId, setExpandedTripId] = useState<number | null>(null)
  const [placeRegion, setPlaceRegion] = useState<string>('')
  const [calendarMonth, setCalendarMonth] = useState<{ year: number; month: number }>(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

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

  const fitBounds = useCallback((places: TripPlace[], map: KakaoMap) => {
    if (places.length === 0) {
      map.setCenter(new window.kakao.maps.LatLng(37.5665, 126.978))
      return
    }
    const bounds = new window.kakao.maps.LatLngBounds()
    places.forEach((p) => bounds.extend(new window.kakao.maps.LatLng(p.lat, p.lng)))
    map.setBounds(bounds)
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
  }, [])

  useEffect(() => {
    if (mapRef.current) return
    if (window.kakao?.maps) { window.kakao.maps.load(() => initMap()); return }
    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&libraries=services&autoload=false`
    script.async = true
    script.onload = () => window.kakao.maps.load(() => initMap())
    document.head.appendChild(script)
  }, [initMap])

  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  useEffect(() => {
    if (!mapRef.current) return
    const places = selectedTrip?.places ?? []
    drawMarkers(places, mapRef.current)
    fitBounds(places, mapRef.current)
  }, [selectedTripId, trips, selectedTrip, drawMarkers, fitBounds])

  useEffect(() => {
    if (panel?.type !== 'view') { setPlaceRegion(''); return }
    if (!window.kakao?.maps?.services) return
    const gc = new (window.kakao.maps.services as unknown as { Geocoder: new () => KakaoGeocoder }).Geocoder()
    gc.coord2RegionCode(panel.place.lng, panel.place.lat, (data, status) => {
      if (status !== 'OK') return
      const b = data.find((r) => r.region_type === 'B')
      if (!b) return
      const parts = [b.region_2depth_name, b.region_3depth_name].filter(Boolean)
      setPlaceRegion(parts.join(' '))
    })
  }, [panel])

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

  const handleSelectTrip = useCallback((tripId: number) => {
    setSelectedTripId(tripId)
    setExpandedTripId((prev) => (prev === tripId ? null : tripId))
    setPanel(null)
  }, [])

  const handleSelectPlace = useCallback((place: TripPlace) => {
    if (!mapRef.current) return
    mapRef.current.setCenter(new window.kakao.maps.LatLng(place.lat, place.lng))
    setPanel({ type: 'view', place })
  }, [])

  const handleDeleteTripById = async (tripId: number) => {
    if (!confirm('이 여행을 삭제하면 장소도 모두 삭제됩니다. 계속할까요?')) return
    await fetch(`/api/trips/${tripId}`, { method: 'DELETE' })
    if (selectedTripId === tripId) setSelectedTripId(null)
    setExpandedTripId(null)
    fetchTrips()
  }

  const closePanel = () => {
    previewMarkerRef.current?.setMap(null)
    previewMarkerRef.current = null
    setPanel(null)
  }

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
        {/* 상단 컨트롤 */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', zIndex: 10, display: 'flex', gap: '8px', flexDirection: 'column' }}>
          {/* 모바일 여행 선택 + 버튼 (md 이상에서는 숨김) */}
          <div className="flex md:hidden" style={{ gap: '8px' }}>
            <select
              value={selectedTripId ?? ''}
              onChange={(e) => e.target.value ? handleSelectTrip(Number(e.target.value)) : setSelectedTripId(null)}
              style={{ ...inputStyle, flex: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', appearance: 'none', paddingRight: '32px', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23999\' d=\'M6 8L1 3h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
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

          {/* 모바일 장소 검색 (여행 선택 시만) */}
          {selectedTrip && (
            <div className="flex md:hidden" style={{ gap: '8px' }}>
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

          {/* 데스크톱 장소 검색 (여행 선택됐을 때) */}
          {selectedTrip && (
            <div className="hidden md:flex" style={{ gap: '8px' }}>
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
        </div>

        {/* 검색 결과 */}
        {results.length > 0 && (
          <div style={{ position: 'absolute', top: selectedTrip ? '130px' : '68px', left: '12px', right: '12px', zIndex: 10, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', overflowY: 'auto', maxHeight: '40vh' }}>
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

        {/* 선택된 여행 없을 때 안내 (모바일만 — 데스크톱은 사이드바가 안내) */}
        {!selectedTrip && trips.length > 0 && (
          <div className="flex md:hidden" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '20px 28px', textAlign: 'center', zIndex: 5, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>위에서 여행을 선택하세요</p>
          </div>
        )}
      </div>

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

      {/* 장소 패널 */}
      {panel && selectedTrip && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'var(--bg-card)', borderRadius: '20px 20px 0 0', boxShadow: '0 -4px 20px rgba(0,0,0,0.12)', maxHeight: '60vh', overflowY: 'auto', zIndex: 10, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {panel.type === 'view' ? panel.place.name : panel.type === 'edit' ? '장소 수정' : '새 장소 추가'}
            </p>
            <button onClick={closePanel} style={{ fontSize: '22px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>

          {panel.type === 'view' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {panel.place.photoData && (
                <img src={panel.place.photoData} alt={panel.place.name} style={{ width: '100%', borderRadius: '12px', objectFit: 'cover', maxHeight: '200px' }} />
              )}
              {placeRegion && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>📍 {placeRegion}</p>}
              {panel.place.visitedAt && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>📅 {panel.place.visitedAt}</p>}
              {panel.place.memo && <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>{panel.place.memo}</p>}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button onClick={() => { setPanel({ type: 'edit', place: panel.place }); setForm({ name: panel.place.name, memo: panel.place.memo, visitedAt: panel.place.visitedAt ?? '', photoData: panel.place.photoData ?? '' }) }} style={{ flex: 1, padding: '8px', borderRadius: '100px', fontSize: '14px', fontWeight: 600, backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}>수정</button>
                <button onClick={() => handleDelete(panel.place)} style={{ flex: 1, padding: '8px', borderRadius: '100px', fontSize: '14px', fontWeight: 600, backgroundColor: 'rgba(255,59,48,0.1)', color: '#ff3b30', border: 'none', cursor: 'pointer' }}>삭제</button>
              </div>
            </div>
          )}

          {(panel.type === 'add' || panel.type === 'edit') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="장소명" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
              <input value={form.memo} onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))} placeholder="메모 (선택)" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
              {/* 인라인 달력 */}
              {(() => {
                const { year, month } = calendarMonth
                const firstDay = new Date(year, month, 1).getDay()
                const daysInMonth = new Date(year, month + 1, 0).getDate()
                const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
                const monthLabel = `${year}년 ${month + 1}월`
                const DAYS = ['일', '월', '화', '수', '목', '금', '토']
                return (
                  <div style={{ backgroundColor: 'var(--bg-hover)', borderRadius: '10px', padding: '10px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <button type="button" onClick={() => setCalendarMonth(({ year: y, month: m }) => m === 0 ? { year: y - 1, month: 11 } : { year: y, month: m - 1 })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '16px', padding: '0 4px' }}>‹</button>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{monthLabel}</span>
                      <button type="button" onClick={() => setCalendarMonth(({ year: y, month: m }) => m === 11 ? { year: y + 1, month: 0 } : { year: y, month: m + 1 })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '16px', padding: '0 4px' }}>›</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
                      {DAYS.map((d) => <div key={d} style={{ color: 'var(--text-secondary)', fontSize: '11px', padding: '2px 0' }}>{d}</div>)}
                      {cells.map((day, i) => {
                        if (!day) return <div key={i} />
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                        const isSelected = form.visitedAt === dateStr
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, visitedAt: isSelected ? '' : dateStr }))}
                            style={{ padding: '4px 0', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: isSelected ? 700 : 400, backgroundColor: isSelected ? '#0066cc' : 'transparent', color: isSelected ? '#fff' : 'var(--text-primary)', fontSize: '13px' }}
                          >{day}</button>
                        )
                      })}
                    </div>
                    {form.visitedAt && (
                      <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>📅 {form.visitedAt}</p>
                    )}
                  </div>
                )
              })()}
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
