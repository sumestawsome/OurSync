import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { UserProfile } from '../types'

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  activeName: string
  activeId: string
  activeAvatar?: string
  isGoogleUser: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Ambil session aktif saat mount
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const u = session.user
          setUser({
            id: u.id,
            email: u.email,
            name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'User',
            avatarUrl: u.user_metadata?.avatar_url || u.user_metadata?.picture,
            isGuest: false,
          })
        }
      } catch (err) {
        console.warn('Gagal memuat sesi Supabase:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSession()

    // 2. Dengarkan perubahan status autentikasi
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user
        setUser({
          id: u.id,
          email: u.email,
          name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'User',
          avatarUrl: u.user_metadata?.avatar_url || u.user_metadata?.picture,
          isGuest: false,
        })
      } else {
        setUser(null)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
    if (error) {
      console.error('Error saat login Google:', error.message)
      alert(`Gagal login Google: ${error.message}`)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  // Nama & ID aktif (menggunakan akun jika login, atau fallback ke stored nickname/guest ID)
  const storedNickname = typeof window !== 'undefined' ? localStorage.getItem('oursync_nickname') || 'Kamu' : 'Kamu'
  const guestId = typeof window !== 'undefined' ? (localStorage.getItem('oursync_guest_id') || (() => {
    const gid = 'guest_' + Math.random().toString(36).substring(2, 9)
    localStorage.setItem('oursync_guest_id', gid)
    return gid
  })()) : 'guest_default'

  const activeName = user ? user.name : storedNickname
  const activeId = user ? user.id : guestId
  const activeAvatar = user?.avatarUrl

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        logout,
        activeName,
        activeId,
        activeAvatar,
        isGoogleUser: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider')
  }
  return context
}
