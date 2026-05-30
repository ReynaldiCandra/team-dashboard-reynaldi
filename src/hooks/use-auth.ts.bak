// src/hooks/use-auth.ts
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// Tiga role Alexandria:
// head_manager = Coach Erwin / Yayasan → lihat semua 8 tim
// manager      = Manager Tim A-H       → lihat tim sendiri + 2 staff
// staff        = Marketing Staff       → input leads tim sendiri
export type Role = 'head_manager' | 'manager' | 'staff'

export interface Profile {
  id: string
  full_name: string
  role: Role
  team: string | null   // 'A'-'H', null untuk head_manager
  email: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) await fetchProfile(session.user.id)
      setLoading(false)
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) await fetchProfile(session.user.id)
        else setProfile(null)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) setProfile(data as Profile)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const isHeadManager = profile?.role === 'head_manager'
  const isManager = profile?.role === 'manager'
  const isStaff = profile?.role === 'staff'
  const canSeeAllTeams = isHeadManager
  const userTeam = profile?.team

  return {
    user, profile, loading, signOut,
    isHeadManager, isManager, isStaff,
    canSeeAllTeams, userTeam,
  }
}
