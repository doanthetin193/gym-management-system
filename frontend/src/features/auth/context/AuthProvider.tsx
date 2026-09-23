import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { clearAccessToken, readAccessToken, saveAccessToken } from '../../../shared/lib/authStorage'
import { getCurrentUser, login as loginRequest } from '../api/authApi'
import type { AuthUser } from '../types/auth'
import { AuthContext } from './authContext'
import type { AuthContextValue } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readAccessToken())
  const [user, setUser] = useState<AuthUser | null>(null)
  const [bootstrapping, setBootstrapping] = useState(true)

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

    return () => {
      cancelled = true
    }
  }, [token])

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      token,
      bootstrapping,
      login: async (username, password) => {
        const response = await loginRequest(username, password)
        saveAccessToken(response.accessToken)
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
