// src/hooks/use-meeting.ts
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface MeetingProjection {
  id: string
  meeting_date: string
  meeting_day: 'monday' | 'thursday'
  team_name: string
  presenter_id: string | null
  projected_closings: number
  actual_closings: number
  hot_leads_count: number
  warm_leads_count: number
  cold_leads_count: number
  agenda: string | null
  notes: string | null
  follow_up_actions: string | null
  created_at: string
  updated_at: string
}

export type MeetingInsert = Omit<MeetingProjection, 'id' | 'created_at' | 'updated_at'>

export function useMeeting(teamFilter?: string) {
  const [meetings, setMeetings] = useState<MeetingProjection[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchMeetings = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('meeting_projections')
      .select('*')
      .order('meeting_date', { ascending: false })
      .limit(50)

    if (teamFilter) query = query.eq('team_name', teamFilter)

    const { data, error } = await query
    if (!error && data) setMeetings(data as MeetingProjection[])
    setLoading(false)
  }, [teamFilter])

  useEffect(() => { fetchMeetings() }, [fetchMeetings])

  const addMeeting = async (meeting: MeetingInsert) => {
    const { data, error } = await supabase
      .from('meeting_projections')
      .insert(meeting)
      .select()
      .single()
    if (!error && data) setMeetings(prev => [data as MeetingProjection, ...prev])
    return { data, error }
  }

  const updateMeeting = async (id: string, updates: Partial<MeetingProjection>) => {
    const { data, error } = await supabase
      .from('meeting_projections')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      setMeetings(prev => prev.map(m => m.id === id ? data as MeetingProjection : m))
    }
    return { data, error }
  }

  const projectionAccuracy = meetings
    .filter(m => m.actual_closings > 0 && m.projected_closings > 0)
    .map(m => ({
      ...m,
      accuracy: Math.round((m.actual_closings / m.projected_closings) * 100),
    }))

  const avgAccuracy = projectionAccuracy.length
    ? Math.round(projectionAccuracy.reduce((s, m) => s + m.accuracy, 0) / projectionAccuracy.length)
    : 0

  return { meetings, loading, addMeeting, updateMeeting, projectionAccuracy, avgAccuracy, refetch: fetchMeetings }
}
