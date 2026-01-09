'use client'

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Session, User } from '@supabase/supabase-js'

export interface StudentUser {
  id: string
  email: string
  enrollmentId?: string
  name?: string
  cohortType?: string
  cohortNumber?: string
}

interface AuthContextType {
  user: StudentUser | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function userToStudent(user: User | null): StudentUser | null {
  if (!user) return null
  return {
    id: user.id,
    email: user.email || '',
    enrollmentId: user.user_metadata?.enrollment_id,
    name: user.user_metadata?.student_name || user.user_metadata?.full_name || user.email?.split('@')[0],
    cohortType: user.user_metadata?.cohort_type,
    cohortNumber: user.user_metadata?.cohort_number
  }
}

function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL_B || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_B) {
    console.warn('Supabase environment variables not set')
    return null
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL_B,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_B
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StudentUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  
  const supabaseB = useMemo(() => getSupabaseClient(), [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !supabaseB) {
      if (mounted && !supabaseB) {
        setLoading(false)
      }
      return
    }

    let isCancelled = false

    // Get initial session with timeout
    const initAuth = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
        
        const sessionPromise = supabaseB.auth.getSession()
        
        const result = await Promise.race([sessionPromise, timeoutPromise]) as any
        
        if (!isCancelled && result?.data?.session) {
          setSession(result.data.session)
          setUser(userToStudent(result.data.session.user))
        }
      } catch (error) {
        console.error('Init auth error:', error)
      } finally {
        if (!isCancelled) {
        setLoading(false)
        }
      }
    }

    initAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabaseB.auth.onAuthStateChange((event, newSession) => {
      if (isCancelled) return
      
      console.log('Auth event:', event)
      setSession(newSession)
      setUser(userToStudent(newSession?.user || null))
      setLoading(false)
    })

    return () => {
      isCancelled = true
      subscription.unsubscribe()
    }
  }, [mounted, supabaseB])

  const signOut = async () => {
    try {
      if (supabaseB) {
      await supabaseB.auth.signOut()
      }
    } catch (error) {
      console.error('Sign out error:', error)
    }
            setUser(null)
            setSession(null)
  }

  const refreshAuth = async () => {
    if (!supabaseB) return
    try {
      const { data } = await supabaseB.auth.getSession()
      if (data.session) {
        setSession(data.session)
        setUser(userToStudent(data.session.user))
          } else {
        setSession(null)
          setUser(null)
        }
    } catch (error) {
      console.error('Refresh auth error:', error)
  }
  }

  if (!mounted) {
    return null
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      isAuthenticated: !!session,
      signOut,
      refreshAuth
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 
