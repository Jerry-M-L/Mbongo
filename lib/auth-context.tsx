'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authClient } from './auth-client'
import type { User } from './types'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

function mapUser(raw: {
  id: string
  name: string | null
  email: string
  role?: string | null
  emailVerified: boolean
  createdAt: Date | string
  updatedAt: Date | string
}): User {
  return {
    id: raw.id,
    name: raw.name ?? '',
    email: raw.email,
    role: (raw.role as User['role']) ?? 'caissier',
    emailVerified: raw.emailVerified,
    createdAt: raw.createdAt instanceof Date ? raw.createdAt.toISOString() : raw.createdAt,
    updatedAt: raw.updatedAt instanceof Date ? raw.updatedAt.toISOString() : raw.updatedAt,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        const { data: session } = await authClient.getSession()
        if (session?.user) {
          setUser(mapUser(session.user))
        }
      } catch {
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await authClient.signIn.email({ email, password })
      if (data?.user && !error) {
        setUser(mapUser(data.user))
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const logout = async () => {
    await authClient.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
