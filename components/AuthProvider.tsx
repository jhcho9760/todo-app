'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

type User = 'nayun' | 'junhyung' | null

interface AuthContextValue {
  user: User
  userLabel: string
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({ user: null, userLabel: '', logout: () => {} })

export function useAuth() { return useContext(AuthContext) }

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const stored = localStorage.getItem('currentUser') as User
    setUser(stored)
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    if (!user && pathname !== '/login') router.replace('/login')
  }, [ready, user, pathname, router])

  const logout = useCallback(() => {
    localStorage.removeItem('currentUser')
    setUser(null)
    router.replace('/login')
  }, [router])

  const userLabel = user === 'nayun' ? '나윤' : user === 'junhyung' ? '준형' : ''

  if (!ready) return null
  if (!user && pathname !== '/login') return null

  return (
    <AuthContext.Provider value={{ user, userLabel, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
