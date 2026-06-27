'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Script from 'next/script'

declare global {
  interface Window {
    Tmap: {
      Map: new (options: { div: string; zoom: number; center: { lat: number; lng: number } }) => TmapMapInstance
      Marker: new (options: { position: { lat: number; lng: number }; map: TmapMapInstance; iconHTML?: string }) => TmapMarkerInstance
    }
  }
}
interface TmapMapInstance {
  on: (event: string, cb: (e: { latlng: { lat: () => number; lng: () => number } }) => void) => void
  setCenter: (c: { lat: number; lng: number }) => void
}
interface TmapMarkerInstance {
  setMap: (map: TmapMapInstance | null) => void
  on: (event: string, cb: () => void) => void
}

interface DatePlace { id: number; name: string; lat: number; lng: number; memo: string; visitedAt: string | null }
interface SearchResult { name: string; lat: number; lng: number; address: string }

const TMAP_APP_KEY = process.env.NEXT_PUBLIC_TMAP_APP_KEY ?? ''

export default function MapContent() {
  const mapRef = useRef<TmapMapInstance | null>(null)
  const markersRef = useRef<Map<number, TmapMarkerInstance>>(new Map())
  const previewMarkerRef = useRef<TmapMarkerInstance | null>(null)

  const [places, setPlaces] = useState<DatePlace[]>([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
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
    setPlaces(await res.json())
  }, [])

  useEffect(() => { fetchPlaces() }, [fetchPlaces])

  const initMap = useCallback(() => {
    if (!window.Tmap || mapRef.current) return
    const map = new window.Tmap.Map({
      div: 'tmap',
      zoom: 13,
      center: { lat: 37.5665, lng: 126.978 },
    })
    mapRef.current = map

    map.on('click', (e) => {
      const lat = e.latlng.lat()
      const lng = e.latlng.lng()
      previewMarkerRef.current?.setMap(null)
      const marker = new window.Tmap.Marker({ position: { lat, lng }, map })
      previewMarkerRef.current = marker
      setPanel({ type: 'add', lat, lng })
      setForm({ name: '', memo: '', visitedAt: '' })
      setResults([])
    })
  }, [])

  useEffect(() => {
    if (!mapRef.current || places.length === 0) return
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current.clear()
    places.forEach((p) => {
      if (!mapRef.current) return
      const marker = new window.Tmap.Marker({
        position: { lat: p.lat, lng: p.lng },
        map: mapRef.current,
        iconHTML: `<div style="background:#0066cc;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(0,0,102,0.3)">📍</div>`,
      })
      marker.on('click', () => {
        setPanel({ type: 'view', place: p })
        setResults([])
      })
      markersRef.current.set(p.id, marker)
    })
  }, [places])

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    const res = await fetch(`/api/tmap-search?q=${encodeURIComponent(query)}`)
    setResults(await res.json())
    setSearching(false)
  }

  const handleSelectResult = (r: SearchResult) => {
    mapRef.current?.setCenter({ lat: r.lat, lng: r.lng })
    previewMarkerRef.current?.setMap(null)
    if (mapRef.current) {
      const marker = new window.Tmap.Marker({ position: { lat: r.lat, lng: r.lng }, map: mapRef.current })
      previewMarkerRef.current = marker
    }
    setPanel({ type: 'add', lat: r.lat, lng: r.lng })
    setForm({ name: r.name, memo: '', visitedAt: '' })
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
    fetchPlaces()
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
    fetchPlaces()
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/places/${id}`, { method: 'DELETE' })
    setPanel(null)
    fetchPlaces()
  }

  const openEdit = (place: DatePlace) => {
    setPanel({ type: 'edit', place })
    setForm({ name: place.name, memo: place.memo, visitedAt: place.visitedAt ?? '' })
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
    <>
      <Script
        src={`https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${TMAP_APP_KEY}`}
        strategy="afterInteractive"
        onLoad={initMap}
      />

      <div style={{ position: 'relative', height: 'calc(100vh - 44px - env(safe-area-inset-top))', overflow: 'hidden' }}>
        {/* 검색창 */}
        <div className="absolute top-3 left-3 right-3 z-10 flex gap-2" style={{ zIndex: 10 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="장소 검색..."
            style={{ ...inputStyle, flex: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            style={{ backgroundColor: '#0066cc', color: '#fff', fontSize: '14px', fontWeight: 600, padding: '8px 16px', borderRadius: '8px', flexShrink: 0, border: 'none', cursor: 'pointer' }}
          >
            {searching ? '...' : '검색'}
          </button>
        </div>

        {/* 검색 결과 드롭다운 */}
        {results.length > 0 && (
          <div
            className="absolute left-3 right-3"
            style={{ top: '56px', zIndex: 10, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', overflow: 'hidden' }}
          >
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => handleSelectResult(r)}
                className="w-full text-left"
                style={{ padding: '12px 16px', borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'block' }}
              >
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{r.name}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', marginBottom: 0 }}>{r.address}</p>
              </button>
            ))}
          </div>
        )}

        {/* 지도 */}
        <div id="tmap" style={{ width: '100%', height: '100%' }} />

        {/* 패널 */}
        {panel && (
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{ backgroundColor: 'var(--bg-card)', borderRadius: '20px 20px 0 0', boxShadow: '0 -4px 20px rgba(0,0,0,0.12)', maxHeight: '60vh', overflowY: 'auto', zIndex: 10, padding: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {panel.type === 'view' ? panel.place.name : panel.type === 'edit' ? '장소 수정' : '새 장소 추가'}
              </p>
              <button onClick={closePanel} style={{ fontSize: '22px', color: 'var(--text-secondary)', lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
            </div>

            {panel.type === 'view' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {panel.place.visitedAt && (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>📅 {panel.place.visitedAt}</p>
                )}
                {panel.place.memo && (
                  <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>{panel.place.memo}</p>
                )}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button
                    onClick={() => openEdit(panel.place)}
                    style={{ flex: 1, padding: '8px', borderRadius: '100px', fontSize: '14px', fontWeight: 600, backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(panel.place.id)}
                    style={{ flex: 1, padding: '8px', borderRadius: '100px', fontSize: '14px', fontWeight: 600, backgroundColor: 'rgba(255,59,48,0.1)', color: '#ff3b30', border: 'none', cursor: 'pointer' }}
                  >
                    삭제
                  </button>
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
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '100px',
                    fontSize: '14px',
                    fontWeight: 600,
                    backgroundColor: form.name ? '#0066cc' : 'var(--bg-hover)',
                    color: form.name ? '#fff' : '#b0b0b5',
                    border: 'none',
                    cursor: form.name ? 'pointer' : 'default',
                    marginTop: '4px',
                  }}
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
