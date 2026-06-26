import { NextRequest, NextResponse } from 'next/server'
import { uploadToDrive, deleteFromDrive } from '@/lib/google-drive'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = `${Date.now()}-${file.name}`

  const fileId = await uploadToDrive(buffer, filename, file.type)
  return NextResponse.json({ fileId })
}

export async function DELETE(req: NextRequest) {
  const { fileId } = await req.json()
  if (!fileId) {
    return NextResponse.json({ error: 'No fileId provided' }, { status: 400 })
  }

  await deleteFromDrive(fileId)
  return NextResponse.json({ ok: true })
}
