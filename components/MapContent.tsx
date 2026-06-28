'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void
        Map: new (container: HTMLElement, options: object) => KakaoMap
        LatLng: new (lat: number, lng: number) => KakaoLatLng
        LatLngBounds: new () => KakaoBounds
        Marker: new (options: object) => KakaoMarker
        CustomOverlay: new (options: object) => KakaoOverlay
        event: {
          addListener: (target: object, type: string, handler: (e: KakaoMouseEvent) => void) => void
        }
        services: {
          Places: new () => KakaoPlaces
          Status: { OK: string }
        }
      }
    }
  }
}
interface KakaoLatLng { getLat: () => number; getLng: () => number }
interface KakaoBounds { extend: (latlng: KakaoLatLng) => void }
interface KakaoMouseEvent { latLng: KakaoLatLng }
interface KakaoMap { setCenter: (latlng: KakaoLatLng) => void; setBounds: (bounds: KakaoBounds) => void }
interface KakaoMarker { setMap: (map: KakaoMap | null) => void }
interface KakaoOverlay { setMap: (map: KakaoMap | null) => void }
interface KakaoPlace { place_name: string; y: string; x: string; address_name: string }
interface KakaoPlaces { keywordSearch: (q: string, cb: (data: KakaoPlace[], status: string) => void) => void }

interface DatePlace { id: number; name: string; lat: number; lng: number; memo: string; visitedAt: string | null }

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? ''

export default function MapContent() {
  const mapRef = useRef<KakaoMap | null>(null)
  const overlaysRef = useRef<Map<number, KakaoMarker>>(new Map())
  const previewMarkerRef = useRef<KakaoMarker | null>(null)

  const [places, setPlaces] = useState<DatePlace[]>([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<KakaoPlace[]>([])
  const [panel, setPanel] = useState<
    | { type: 'add'; lat: number; lng: number }
    | { type: 'view'; place: DatePlace }
    | { type: 'edit'; place: DatePlace }
    | null
  >(null)
  const [form, setForm] = useState({ name: '', memo: '', visitedAt: '' })
  const [saving, setSaving] = useState(false)

  const fetchPlaces = useCallback(async () => {
    const res = await fetch('/api/places')
    return (await res.json()) as DatePlace[]
  }, [])

  const addSavedMarkers = useCallback((currentPlaces: DatePlace[], map: KakaoMap) => {
    overlaysRef.current.forEach((m) => m.setMap(null))
    overlaysRef.current.clear()
    currentPlaces.forEach((p) => {
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(p.lat, p.lng),
        map,
      })
      window.kakao.maps.event.addListener(marker, 'click', () => {
        setPanel({ type: 'view', place: p })
        setResults([])
      })
      overlaysRef.current.set(p.id, marker)
    })
  }, [])

  const initMap = useCallback(() => {
    if (!window.kakao?.maps || mapRef.current) return
    const container = document.getElementById('kakaomap')
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
      const marker = new window.kakao.maps.Marker({
        position: e.latLng,
        map,
      })
      previewMarkerRef.current = marker
      setPanel({ type: 'add', lat, lng })
      setForm({ name: '', memo: '', visitedAt: '' })
      setResults([])
    })

    fetchPlaces().then((data) => {
      setPlaces(data)
      addSavedMarkers(data, map)
    })
  }, [fetchPlaces, addSavedMarkers])

  useEffect(() => {
    if (mapRef.current) return
    if (window.kakao?.maps) { window.kakao.maps.load(() => initMap()); return }
    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&libraries=services&autoload=false`
    script.async = true
    script.onload = () => window.kakao.maps.load(() => initMap())
    script.onerror = () => console.error('카카오맵 SDK 로드 실패 — 앱키 확인 필요')
    document.head.appendChild(script)
  }, [initMap])

  useEffect(() => {
    if (mapRef.current && places.length > 0) {
      addSavedMarkers(places, mapRef.current)
    }
  }, [places, addSavedMarkers])

  const handleSearch = () => {
    if (!query.trim() || !window.kakao?.maps?.services) return
    const ps = new window.kakao.maps.services.Places()
    ps.keywordSearch(query, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        setResults(data.slice(0, 8))
      }
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
    setForm({ name: r.place_name, memo: '', visitedAt: '' })
    setResults([])
    setQuery('')
  }

  const handleAdd = async () => {
    if (!panel || panel.type !== 'add' || !form.name) return
    setSaving(true)
    await fetch('/api/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, lat: panel.lat, lng: panel.lng, memo: form.memo, visitedAt: form.visitedAt || null }),
    })
    setSaving(false)
    previewMarkerRef.current?.setMap(null)
    previewMarkerRef.current = null
    setPanel(null)
    fetchPlaces().then((data) => {
      setPlaces(data)
      if (mapRef.current) addSavedMarkers(data, mapRef.current)
    })
  }

  const handleEditSave = async () => {
    if (!panel || panel.type !== 'edit') return
    setSaving(true)
    await fetch(`/api/places/${panel.place.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, lat: panel.place.lat, lng: panel.place.lng, memo: form.memo, visitedAt: form.visitedAt || null }),
    })
    setSaving(false)
    setPanel(null)
    fetchPlaces().then((data) => {
      setPlaces(data)
      if (mapRef.current) addSavedMarkers(data, mapRef.current)
    })
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/places/${id}`, { method: 'DELETE' })
    setPanel(null)
    fetchPlaces().then((data) => {
      setPlaces(data)
      if (mapRef.current) addSavedMarkers(data, mapRef.current)
    })
  }

  const closePanel = () => {
    previewMarkerRef.current?.setMap(null)
    previewMarkerRef.current = null
    setPanel(null)
  }

  const inputStyle: React.CSSProperties = {
    fontSize: '14px',
    backgroundColor: 'var(--bg-hover)',
    color: 'var(--text-primary)',
    borderRadius: '8px',
    padding: '8px 12px',
    width: '100%',
    outline: 'none',
    border: 'none',
  }

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 44px - env(safe-area-inset-top))', overflow: 'hidden' }}>
      {/* 검색창 */}
      <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', zIndex: 10, display: 'flex', gap: '8px' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="장소 검색..."
          style={{ ...inputStyle, flex: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
        />
        <button
          onClick={handleSearch}
          style={{ backgroundColor: '#0066cc', color: '#fff', fontSize: '14px', fontWeight: 600, padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', flexShrink: 0 }}
        >
          검색
        </button>
      </div>

      {/* 검색 결과 */}
      {results.length > 0 && (
        <div style={{ position: 'absolute', top: '56px', left: '12px', right: '12px', zIndex: 10, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => handleSelectResult(r)}
              style={{ width: '100%', textAlign: 'left', padding: '12px 16px', borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'block' }}
            >
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{r.place_name}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', marginBottom: 0 }}>{r.address_name}</p>
            </button>
          ))}
        </div>
      )}

      {/* 지도 */}
      <div id="kakaomap" style={{ width: '100%', height: '100%' }} />

      {/* 패널 */}
      {panel && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'var(--bg-card)', borderRadius: '20px 20px 0 0', boxShadow: '0 -4px 20px rgba(0,0,0,0.12)', maxHeight: '60vh', overflowY: 'auto', zIndex: 10, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {panel.type === 'view' ? panel.place.name : panel.type === 'edit' ? '장소 수정' : '새 장소 추가'}
            </p>
            <button onClick={closePanel} style={{ fontSize: '22px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>

          {panel.type === 'view' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {panel.place.visitedAt && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>📅 {panel.place.visitedAt}</p>}
              {panel.place.memo && <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>{panel.place.memo}</p>}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button onClick={() => { setPanel({ type: 'edit', place: panel.place }); setForm({ name: panel.place.name, memo: panel.place.memo, visitedAt: panel.place.visitedAt ?? '' }) }} style={{ flex: 1, padding: '8px', borderRadius: '100px', fontSize: '14px', fontWeight: 600, backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}>수정</button>
                <button onClick={() => handleDelete(panel.place.id)} style={{ flex: 1, padding: '8px', borderRadius: '100px', fontSize: '14px', fontWeight: 600, backgroundColor: 'rgba(255,59,48,0.1)', color: '#ff3b30', border: 'none', cursor: 'pointer' }}>삭제</button>
              </div>
            </div>
          )}

          {(panel.type === 'add' || panel.type === 'edit') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="장소명" style={inputStyle} />
              <input value={form.memo} onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))} placeholder="메모 (선택)" style={inputStyle} />
              <input value={form.visitedAt} onChange={(e) => setForm((f) => ({ ...f, visitedAt: e.target.value }))} placeholder="방문일 (YYYY-MM-DD, 선택)" style={inputStyle} />
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
    </div>
  )
}
