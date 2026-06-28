'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

type User = 'nayun' | 'junhyung' | null

interface AuthContextValue {
  user: User
  userLabel: string
  login: (u: 'nayun' | 'junhyung') => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({ user: null, userLabel: '', login: () => {}, logout: () => {} })

export function useAuth() { return useContext(AuthContext) }

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const stored = localStorage.getItem('currentUser') as User
    const loginAt = localStorage.getItem('loginAt')
    if (stored && loginAt) {
      const elapsed = Date.now() - Number(loginAt)
      if (elapsed > 60 * 60 * 1000) {
        localStorage.removeItem('currentUser')
        localStorage.removeItem('loginAt')
      } else {
        setUser(stored)
      }
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    if (!user && pathname !== '/login') router.replace('/login')
  }, [ready, user, pathname, router])

  const login = useCallback((u: 'nayun' | 'junhyung') => {
    localStorage.setItem('currentUser', u)
    localStorage.setItem('loginAt', String(Date.now()))
    setUser(u)
    router.replace('/')
  }, [router])

  const logout = useCallback(() => {
    localStorage.removeItem('currentUser')
    localStorage.removeItem('loginAt')
    setUser(null)
    router.replace('/login')
  }, [router])

  // 1시간 경과 시 자동 로그아웃 체크
  useEffect(() => {
    if (!user) return
    const loginAt = Number(localStorage.getItem('loginAt') ?? 0)
    const remaining = 60 * 60 * 1000 - (Date.now() - loginAt)
    if (remaining <= 0) { logout(); return }
    const timer = setTimeout(logout, remaining)
    return () => clearTimeout(timer)
  }, [user, logout])

  const userLabel = user === 'nayun' ? '나윤' : user === 'junhyung' ? '준형' : ''

  if (!ready) return null
  if (!user && pathname !== '/login') return null

  return (
    <AuthContext.Provider value={{ user, userLabel, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
