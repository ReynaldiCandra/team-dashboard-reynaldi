'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export type AttendanceStatus = 'hadir' | 'wfh' | 'izin' | 'alpa' | 'dinas'

export interface AttendanceRecord {
  id?: string
  staffId: string
  attendDate: string
  status: AttendanceStatus
  checkInTime?: string
  checkOutTime?: string
  location?: string
  notes?: string
  approvedBy?: string
  createdAt?: string
}

export interface AttendanceSummary {
  hadir: number
  wfh: number
  izin: number
  alpa: number
  dinas: number
  total: number
}

function mapRecord(row: Record<string, unknown>): AttendanceRecord {
  return {
    id: row.id as string,
    staffId: row.staff_id as string,
    attendDate: row.attend_date as string,
    status: (row.status as AttendanceStatus) ?? 'hadir',
    checkInTime: row.check_in_time as string | undefined,
    checkOutTime: row.check_out_time as string | undefined,
    location: row.location as string | undefined,
    notes: row.notes as string | undefined,
    approvedBy: row.approved_by as string | undefined,
    createdAt: row.created_at as string | undefined,
  }
}

export function useAttendance(staffId?: string) {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null)

  const todayISO = new Date().toISOString().split('T')[0]

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('attendance')
      .select('*')
      .order('attend_date', { ascending: false })
      .limit(60)

    if (staffId) query = query.eq('staff_id', staffId)

    const { data, error } = await query
    if (error) console.error('fetchAttendance error:', error)

    const mapped = (data ?? []).map(r => mapRecord(r as Record<string, unknown>))
    setRecords(mapped)
    setTodayRecord(mapped.find(r => r.attendDate === todayISO && r.staffId === staffId) ?? null)
    setLoading(false)
  }, [staffId, todayISO])

  useEffect(() => {
    fetchRecords()
    const channel = supabase
      .channel('attendance-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, fetchRecords)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchRecords])

  async function checkIn(status: AttendanceStatus = 'hadir', location?: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return { error: new Error('Not authenticated'), time: null }

    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    const { error } = await supabase.from('attendance').upsert({
      staff_id: staffId ?? session.user.id,
      attend_date: todayISO,
      status,
      check_in_time: timeStr,
      location: location ?? null,
    }, { onConflict: 'staff_id,attend_date' })

    if (error) console.error('checkIn error:', error)
    else await fetchRecords()
    return { error, time: timeStr }
  }

  async function checkOut() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return { error: new Error('Not authenticated'), time: null }

    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    const { error } = await supabase.from('attendance').update({
      check_out_time: timeStr,
    }).eq('staff_id', staffId ?? session.user.id).eq('attend_date', todayISO)

    if (error) console.error('checkOut error:', error)
    else await fetchRecords()
    return { error, time: timeStr }
  }

  async function submitAttendance(data: {
    status: AttendanceStatus
    notes?: string
    location?: string
  }) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return { error: new Error('Not authenticated') }

    const { error } = await supabase.from('attendance').upsert({
      staff_id: staffId ?? session.user.id,
      attend_date: todayISO,
      status: data.status,
      notes: data.notes ?? null,
      location: data.location ?? null,
    }, { onConflict: 'staff_id,attend_date' })

    if (error) console.error('submitAttendance error:', error)
    else await fetchRecords()
    return { error }
  }

  // Hitung summary per bulan
  function getMonthlySummary(month?: string): AttendanceSummary {
    const filtered = month
      ? records.filter(r => r.attendDate.startsWith(month))
      : records

    return {
      hadir: filtered.filter(r => r.status === 'hadir').length,
      wfh: filtered.filter(r => r.status === 'wfh').length,
      izin: filtered.filter(r => r.status === 'izin').length,
      alpa: filtered.filter(r => r.status === 'alpa').length,
      dinas: filtered.filter(r => r.status === 'dinas').length,
      total: filtered.length,
    }
  }

  // Untuk manager: ambil semua staff attendance
  const [allRecords, setAllRecords] = useState<(AttendanceRecord & { staffName?: string })[]>([])

  async function fetchAllAttendance(date?: string) {
    const { data, error } = await supabase
      .from('attendance')
      .select(`*, profiles(full_name)`)
      .eq('attend_date', date ?? todayISO)
      .order('created_at', { ascending: false })

    if (error) console.error('fetchAllAttendance error:', error)
    setAllRecords((data ?? []).map(r => ({
      ...mapRecord(r as Record<string, unknown>),
      staffName: ((r as Record<string, unknown>).profiles as Record<string, unknown>)?.full_name as string | undefined,
    })))
  }

  return {
    records,
    todayRecord,
    loading,
    allRecords,
    fetchRecords,
    fetchAllAttendance,
    checkIn,
    checkOut,
    submitAttendance,
    getMonthlySummary,
  }
}
