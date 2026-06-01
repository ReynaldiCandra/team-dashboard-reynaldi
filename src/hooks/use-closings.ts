'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface Closing {
  id: string
  leadId?: string
  staffId: string
  staffName: string
  managerId?: string
  managerName?: string
  team: string
  studentName: string
  studentType: 'full_day' | 'boarding'
  area: string
  uangPangkal: number
  diskon: boolean
  nominalBayar: number
  closedBy: 'staff' | 'manager'
  komisiStaff: number
  komisiManager: number
  waText?: string
  createdAt: string
}

export function buildWAClosing(data: { staffName: string; team: string; studentName: string; studentType: string; area: string; nominalBayar: number; diskon: boolean }): string {
  const tipe = data.studentType === 'full_day' ? 'Full Day' : 'Boarding'
  const nominal = 'Rp ' + (data.nominalBayar / 1000000).toFixed(1) + 'jt'
  const lines = [
    'CLOSING ALERT!',
    '',
    'Tim ' + data.team + ' berhasil closing!',
    '',
    'Staff: ' + data.staffName,
    'Siswa: ' + data.studentName,
    'Program: ' + tipe,
    'Daerah: ' + data.area,
    'Uang Pangkal: ' + nominal,
    '',
    'Alhamdulillah, semangat terus Tim Alexandria!',
    '',
    'Alexandria Islamic School',
  ]
  return lines.join('\n')
}

export function useClosings(teamFilter?: string, staffFilter?: string) {
  const [closings, setClosings] = useState<Closing[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('closings').select('*').order('created_at', { ascending: false })
    if (teamFilter) q = q.eq('team', teamFilter)
    if (staffFilter) q = q.eq('staff_id', staffFilter)
    const { data, error } = await q
    if (error) console.error('fetchClosings:', error.message)
    setClosings((data ?? []).map(r => ({
      id: r.id,
      leadId: r.lead_id,
      staffId: r.staff_id,
      staffName: r.staff_name,
      managerId: r.manager_id,
      managerName: r.manager_name,
      team: r.team,
      studentName: r.student_name,
      studentType: r.student_type,
      area: r.area,
      uangPangkal: r.uang_pangkal,
      diskon: r.diskon,
      nominalBayar: r.nominal_bayar,
      closedBy: r.closed_by,
      komisiStaff: r.komisi_staff,
      komisiManager: r.komisi_manager,
      waText: r.wa_text,
      createdAt: r.created_at,
    })))
    setLoading(false)
  }, [teamFilter, staffFilter])

  useEffect(() => {
    fetchData()
    const ch = supabase.channel('closings-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'closings' }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [fetchData])

  const addClosing = async (data: Omit<Closing, 'id' | 'komisiStaff' | 'komisiManager' | 'waText' | 'createdAt'>) => {
    const komisiStaff = data.closedBy === 'staff' ? Math.round(data.nominalBayar * 0.15) : 0
    const komisiManager = data.closedBy === 'staff' ? Math.round(data.nominalBayar * 0.025) : Math.round(data.nominalBayar * 0.15)
    const waText = buildWAClosing(data)
    const { error } = await supabase.from('closings').insert({
      lead_id: data.leadId ?? null,
      staff_id: data.staffId,
      staff_name: data.staffName,
      manager_id: data.managerId ?? null,
      manager_name: data.managerName ?? null,
      team: data.team,
      student_name: data.studentName,
      student_type: data.studentType,
      area: data.area,
      uang_pangkal: data.uangPangkal,
      diskon: data.diskon,
      nominal_bayar: data.nominalBayar,
      closed_by: data.closedBy,
      komisi_staff: komisiStaff,
      komisi_manager: komisiManager,
      wa_text: waText,
    })
    console.log("addClosing error:", JSON.stringify(error)); if (!error && data.leadId) {
      await supabase.from('leads').update({ status: 'enrolled' }).eq('id', data.leadId)
    }
    if (!error) await fetchData()
    return { error, waText }
  }

  const totalKomisiStaff = closings.reduce((s, c) => s + c.komisiStaff, 0)
  const totalKomisiManager = closings.reduce((s, c) => s + c.komisiManager, 0)
  return { closings, loading, addClosing, totalKomisiStaff, totalKomisiManager }
}
