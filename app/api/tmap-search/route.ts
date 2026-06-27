import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const q = new URL(request.url).searchParams.get('q') ?? ''
  if (!q) return NextResponse.json([])

  const res = await fetch(
    `https://apis.openapi.sk.com/tmap/pois?version=1&searchKeyword=${encodeURIComponent(q)}&count=10&appKey=${process.env.TMAP_APP_KEY}`
  )
  const data = await res.json()

  const pois = data.searchPoiInfo?.pois?.poi ?? []
  return NextResponse.json(
    pois.map((p: { name: string; noorLat: string; noorLon: string; upperAddrName: string; middleAddrName: string; roadName: string }) => ({
      name: p.name,
      lat: parseFloat(p.noorLat),
      lng: parseFloat(p.noorLon),
      address: `${p.upperAddrName} ${p.middleAddrName} ${p.roadName}`.trim(),
    }))
  )
}
