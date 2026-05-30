'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export interface Profile {
  id: string
  fullName: string
  role: 'manager' | 'staff'
  team: string
  avatarUrl?: string
  phone?: string
  isOnline: boolean
}

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    fullName: (row.full_name ?? '') as string,
    role: (row.role ?? 'staff') as Profile['role'],
    team: (row.team ?? '') as string,
    avatarUrl: row.avatar_url as string | undefined,
    phone: row.phone as string | undefined,
    isOnline: (row.is_online ?? false) as boolean,
  }
}

// Singleton — session tidak hilang antar render
const supabase = createClient()

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      // Pakai getSession() — baca dari cookie, tidak perlu network call
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (data) setProfile(mapProfile(data as Record<string, unknown>))
      }
      setLoading(false)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (data) setProfile(mapProfile(data as Record<string, unknown>))
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithPassword(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signInWithMagicLink(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` }
    })
    return { error }
  }

  async function signOut() {
    if (user) {
      await supabase.from('profiles').update({ is_online: false }).eq('id', user.id)
    }
    const { error } = await supabase.auth.signOut()
    window.location.href = '/login'
    return { error }
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user) return { error: new Error('Not authenticated') }
    const { error } = await supabase.from('profiles').update({
      full_name: updates.fullName,
      team: updates.team,
      phone: updates.phone,
    }).eq('id', user.id)
    if (!error && profile) setProfile({ ...profile, ...updates })
    return { error }
  }

  return { user, profile, loading, signInWithPassword, signInWithMagicLink, signOut, updateProfile }
}