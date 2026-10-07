import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { clearAccessToken, readAccessToken, saveAccessToken, saveRememberedEmail, saveRememberMePreference } from '../../../shared/lib/authStorage'
import { getCurrentUser, login as loginRequest } from '../api/authApi'
import type { AuthUser } from '../types/auth'
import { AuthContext } from './authContext'
import type { AuthContextValue } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readAccessToken())
  const [user, setUser] = useState<AuthUser | null>(null)
  const [bootstrapping, setBootstrapping] = useState(true)

  useEffect(() => {
    function handleUnauthorized() {
      clearAccessToken()
      setToken(null)
      setUser(null)
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.replace('/login')
      }
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      if (!token) {
        setBootstrapping(false)
        return
      }

      try {
        const currentUser = await getCurrentUser()
        if (!cancelled) {
          setUser(currentUser)
        }
      } catch {
        clearAccessToken()
        if (!cancelled) {
          setToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setBootstrapping(false)
        }
      }
    }

    bootstrap()

    async function checkLiveness() {
      if (!readAccessToken()) return
      try {
        await getCurrentUser()
      } catch {
        clearAccessToken()
        if (!cancelled) {
          setToken(null)
          setUser(null)
        }
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.replace('/login')
        }
      }
    }

    window.addEventListener('focus', checkLiveness)
    const interval = setInterval(checkLiveness, 20000)

    return () => {
      cancelled = true
      window.removeEventListener('focus', checkLiveness)
      clearInterval(interval)
    }
  }, [token])

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      token,
      bootstrapping,
      login: async (email, password, rememberMe = true) => {
        const response = await loginRequest(email, password, rememberMe)
        saveAccessToken(response.accessToken, rememberMe)
        saveRememberMePreference(rememberMe)
        saveRememberedEmail(email, rememberMe)
        setToken(response.accessToken)
        setUser(response.user)
      },
      logout: () => {
        clearAccessToken()
        setToken(null)
        setUser(null)
      },
    }
  }, [bootstrapping, token, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
