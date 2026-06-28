// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sw = self as any

sw.addEventListener('push', (event: any) => {
  if (!event.data) return
  const { title, body } = event.data.json()
  event.waitUntil(
    sw.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [200, 100, 200],
    })
  )
})

sw.addEventListener('notificationclick', (event: any) => {
  event.notification.close()
  event.waitUntil(
    sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients: any[]) => {
      if (clients.length > 0) return clients[0].focus()
      return sw.clients.openWindow('/')
    })
  )
})
