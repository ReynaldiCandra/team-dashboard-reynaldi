'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Performance {
  id?: string
  staffId: string
  campaignId?: string
  recordDate: string
  leadsIn: number
  prospect: number
  meeting: number
  proposal: number
  closing: number
  revenue: number
  followUp: number
  treatmentNew: number
  treatmentOld: number
  attendance: 'hadir' | 'wfh' | 'izin' | 'alpa' | 'dinas'
  checkInTime?: string
  checkOutTime?: string
  notes?: string
  score?: number
}

function mapRow(row: Record<string, unknown>): Performance {
  return {
    id: row.id as string,
    staffId: row.staff_id as string,
    campaignId: row.campaign_id as string | undefined,
    recordDate: row.record_date as string,
    leadsIn: (row.leads_in as number) ?? 0,
    prospect: (row.prospect as number) ?? 0,
    meeting: (row.meeting as number) ?? 0,
    proposal: (row.proposal as number) ?? 0,
    closing: (row.closing as number) ?? 0,
    revenue: (row.revenue as number) ?? 0,
    followUp: (row.follow_up as number) ?? 0,
    treatmentNew: (row.treatment_new as number) ?? 0,
    treatmentOld: (row.treatment_old as number) ?? 0,
    attendance: (row.attendance as Performance['attendance']) ?? 'hadir',
    checkInTime: row.check_in_time as string | undefined,
    checkOutTime: row.check_out_time as string | undefined,
    notes: row.notes as string | undefined,
    score: row.score as number | undefined,
  }
}

// Singleton — session tidak hilang antar render
const supabase = createClient()

export function usePerformance(staffId?: string) {
  const [records, setRecords] = useState<Performance[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecords = useCallback(async () => {
    setLoading(true)

    // Cek session dulu sebelum query
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      setLoading(false)
      return
    }

    let query = supabase
      .from('performances')
      .select('*')
      .order('record_date', { ascending: false })
      .limit(30)

    if (staffId) query = query.eq('staff_id', staffId)

    const { data, error } = await query
    if (error) {
      console.error('fetchPerformance error:', error.message, '| code:', error.code, '| hint:', error.hint)
    }
    setRecords((data ?? []).map(r => mapRow(r as Record<string, unknown>)))
    setLoading(false)
  }, [staffId])

  useEffect(() => {
    fetchRecords()
    const channel = supabase
      .channel(`performance-realtime-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'performances' }, fetchRecords)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchRecords])

  async function upsertPerformance(data: Omit<Performance, 'id' | 'score'>) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return { error: new Error('Not authenticated') }

    const { error } = await supabase.from('performances').upsert({
      staff_id: data.staffId,
      campaign_id: data.campaignId ?? null,
      record_date: data.recordDate,
      leads_in: data.leadsIn,
      prospect: data.prospect,
      meeting: data.meeting,
      proposal: data.proposal,
      closing: data.closing,
      revenue: data.revenue,
      follow_up: data.followUp,
      treatment_new: data.treatmentNew,
      treatment_old: data.treatmentOld,
      attendance: data.attendance,
      check_in_time: data.checkInTime ?? null,
      check_out_time: data.checkOutTime ?? null,
      notes: data.notes ?? null,
    }, { onConflict: 'staff_id,record_date' })

    if (error) { console.error('upsertPerformance error:', error.message, '| code:', error.code); return { error } }
    await fetchRecords()
    return { error: null }
  }

  async function checkIn() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return { error: new Error('Not authenticated'), time: null }

    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`
    const dateStr = now.toISOString().split('T')[0]

    const { error } = await supabase.from('performances').upsert({
      staff_id: session.user.id,
      record_date: dateStr,
      check_in_time: timeStr,
      attendance: 'hadir',
    }, { onConflict: 'staff_id,record_date' })

    if (error) console.error('checkIn error:', error.message, '| code:', error.code)
    else await fetchRecords()
    return { error, time: timeStr }
  }

  return { records, loading, fetchRecords, upsertPerformance, checkIn }
}
