import { google } from 'googleapis'
import { Readable } from 'stream'

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!

export function getOAuthClient() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)
}

export function getAuthUrl() {
  const oauth2Client = getOAuthClient()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.file'],
    prompt: 'consent',
  })
}

export async function getDriveClient() {
  const oauth2Client = getOAuthClient()
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  })
  return google.drive({ version: 'v3', auth: oauth2Client })
}

export async function uploadToDrive(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const drive = await getDriveClient()
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

  const stream = Readable.from(buffer)

  const res = await drive.files.create({
    requestBody: {
      name: filename,
      ...(folderId ? { parents: [folderId] } : {}),
    },
    media: { mimeType, body: stream },
    fields: 'id',
  })

  const fileId = res.data.id!

  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
  })

  return fileId
}

export async function deleteFromDrive(fileId: string): Promise<void> {
  const drive = await getDriveClient()
  await drive.files.delete({ fileId })
}

export function getDriveImageUrl(fileId: string): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`
}

async function getOrCreateFolder(drive: ReturnType<typeof google.drive>): Promise<string> {
  const folderName = "나윤's Board"

  const res = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
  })

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!
  }

  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  })

  return folder.data.id!
}
