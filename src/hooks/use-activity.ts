'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

export interface ActivityLog {
  id: string
  userId: string
  userName: string
  action: string
  team: string | null
  createdAt: string
}

export function useActivityLogs(team?: string) {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    if (team) q = q.eq('team', team)
    const { data, error } = await q
    if (error) console.error('activity_logs error:', error.message)
    setLogs((data ?? []).map(r => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name ?? 'Unknown',
      action: r.action,
      team: r.team ?? null,
      createdAt: r.created_at,
    })))
    setLoading(false)
  }, [team])

  useEffect(() => {
    fetch()
    const ch = supabase.channel(`activity-realtime-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, fetch)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [fetch])

  const addLog = async (userId: string, userName: string, action: string, team?: string) => {
    await supabase.from('activity_logs').insert({
      user_id: userId,
      user_name: userName,
      action,
      team: team ?? null,
    })
  }

  return { logs, loading, addLog }
}
