'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

export interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  team: string
  leads: number
  closing: number
  revenue: number
  score: number
  avatar: string
}

export function useLeaderboard(team?: string) {
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      // Ambil dari profiles + closings + leads
      let q = supabase.from('profiles').select('id, full_name, team, role')
      if (team) q = q.eq('team', team)
      const { data: profiles } = await q

      const entries: LeaderboardEntry[] = []
      for (const p of profiles ?? []) {
        const { count: leadsCount } = await supabase
          .from('leads').select('*', { count: 'exact', head: true })
          .or(`assigned_to.eq.${p.id},team.eq.${p.team ?? ''}`)
        
        const { data: closings } = await supabase
          .from('closings').select('nominal_bayar, komisi_staff')
          .eq('staff_id', p.id)
        
        const revenue = (closings ?? []).reduce((s: number, c: Record<string,number>) => s + (c.nominal_bayar ?? 0), 0)
        const closing = closings?.length ?? 0
        const leads = leadsCount ?? 0
        const score = Math.min(100, Math.round((leads * 0.3) + (closing * 5) + (revenue / 10000000)))

        entries.push({
          rank: 0,
          userId: p.id,
          name: p.full_name ?? 'Unknown',
          team: p.team ?? '',
          leads,
          closing,
          revenue,
          score,
          avatar: (p.full_name ?? 'U').charAt(0).toUpperCase(),
        })
      }

      entries.sort((a, b) => b.score - a.score)
      entries.forEach((e, i) => e.rank = i + 1)
      setData(entries)
      setLoading(false)
    }
    fetch()
  }, [team])

  return { data, loading }
}
