import webpush from 'web-push'
import { prisma } from '@/lib/db'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function sendPush(targetUser: string, title: string, body: string) {
  const subs = await prisma.pushSubscription.findMany({ where: { user: targetUser } })
  const payload = JSON.stringify({ title, body })
  await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
      ).catch(async (err) => {
        // 만료된 구독 자동 삭제
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { endpoint: s.endpoint } }).catch(() => {})
        }
      })
    )
  )
}

export function otherUser(user: string) {
  return user === 'nayun' ? 'junhyung' : 'nayun'
}

export function userLabel(user: string) {
  return user === 'nayun' ? '나윤' : '준형'
}
