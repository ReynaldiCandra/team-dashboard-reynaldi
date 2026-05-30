// src/hooks/use-rakornas.ts
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface RakornasEntry {
  id: string
  month: number
  year: number
  team_name: string
  manager_id: string | null
  total_leads: number
  total_closings: number
  revenue_achievement: number
  target_achievement_pct: number
  highlights: string | null
  challenges: string | null
  action_plan: string | null
  status: 'draft' | 'submitted' | 'presented'
  created_at: string
  updated_at: string
}

export type RakornasInsert = Omit<RakornasEntry, 'id' | 'created_at' | 'updated_at'>

export function useRakornas(month?: number, year?: number) {
  const [entries, setEntries] = useState<RakornasEntry[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const currentMonth = month ?? new Date().getMonth() + 1
  const currentYear = year ?? new Date().getFullYear()

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('rakornas')
      .select('*')
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .order('team_name')
    if (!error && data) setEntries(data as RakornasEntry[])
    setLoading(false)
  }, [currentMonth, currentYear])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const upsertEntry = async (entry: RakornasInsert) => {
    const { data, error } = await supabase
      .from('rakornas')
      .upsert(entry, { onConflict: 'month,year,team_name' })
      .select()
      .single()
    if (!error && data) {
      setEntries(prev => {
        const idx = prev.findIndex(e => e.team_name === entry.team_name)
        const next = [...prev]
        if (idx >= 0) next[idx] = data as RakornasEntry
        else next.push(data as RakornasEntry)
        return next
      })
    }
    return { data, error }
  }

  const summary = {
    totalTeams: entries.length,
    submitted: entries.filter(e => e.status !== 'draft').length,
    avgAchievement: entries.length
      ? Math.round(entries.reduce((s, e) => s + e.target_achievement_pct, 0) / entries.length)
      : 0,
    topTeam: [...entries].sort((a, b) => b.target_achievement_pct - a.target_achievement_pct)[0]?.team_name ?? '-',
    totalLeads: entries.reduce((s, e) => s + e.total_leads, 0),
    totalClosings: entries.reduce((s, e) => s + e.total_closings, 0),
  }

  return { entries, loading, upsertEntry, summary, refetch: fetchEntries }
}
