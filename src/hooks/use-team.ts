import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface TeamMember {
  id: string
  name: string
  role: string
  team: string
  avatar: string
  email: string
  online: boolean
  revenue: number
  leads: number
  closing: number
  score: number
}

export function useTeams(filterTeam?: string) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('profiles').select('id, full_name, role, team, email')
    if (filterTeam) q = q.eq('team', filterTeam)

    const { data: profiles, error } = await q
    if (error) { console.error('fetchTeams error:', error.message); setLoading(false); return }

    const enriched: TeamMember[] = []
    for (const p of profiles ?? []) {
      const { count: leadsCount } = await supabase
        .from('leads').select('*', { count: 'exact', head: true })
        .eq('assigned_to', p.id)

      const { data: perfs } = await supabase
        .from('performances').select('closing, revenue')
        .eq('staff_id', p.id)

      const closing = (perfs ?? []).reduce((s: number, r: Record<string,number>) => s + (r.closing ?? 0), 0)
      const revenue = (perfs ?? []).reduce((s: number, r: Record<string,number>) => s + (r.revenue ?? 0), 0)
      const leads = leadsCount ?? 0
      const score = Math.min(100, Math.round(leads * 0.3 + closing * 5 + revenue / 10000000))

      enriched.push({
        id: p.id,
        name: p.full_name ?? 'Unknown',
        role: p.role ?? 'staff',
        team: p.team ?? '',
        avatar: (p.full_name ?? 'U').charAt(0).toUpperCase(),
        email: p.email ?? '',
        online: false,
        revenue,
        leads,
        closing,
        score,
      })
    }

    setMembers(enriched)
    setLoading(false)
  }, [filterTeam])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  return { members, loading, refetch: fetchMembers }
}
