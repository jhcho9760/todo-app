import { NextRequest, NextResponse } from 'next/server'
import { uploadToDrive, deleteFromDrive } from '@/lib/google-drive'
import sharp from 'sharp'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const raw = Buffer.from(await file.arrayBuffer())

  // EXIF 방향 자동 보정 후 JPEG로 변환
  const rotated = await sharp(raw).rotate().jpeg({ quality: 90 }).toBuffer()

  const filename = `${Date.now()}-${file.name.replace(/\.[^.]+$/, '')}.jpg`
  const fileId = await uploadToDrive(rotated, filename, 'image/jpeg')
  return NextResponse.json({ fileId, folderId: process.env.GOOGLE_DRIVE_FOLDER_ID ?? 'NOT SET' })
}

export async function DELETE(req: NextRequest) {
  const { fileId } = await req.json()
  if (!fileId) {
    return NextResponse.json({ error: 'No fileId provided' }, { status: 400 })
  }

  await deleteFromDrive(fileId)
  return NextResponse.json({ ok: true })
}
