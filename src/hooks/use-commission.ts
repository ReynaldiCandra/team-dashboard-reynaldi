'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface CommissionSettings {
  uangBangunanNormal: number    // 40.000.000
  uangBangunanDiskon: number    // 20.000.000
  dpMinimal: number             // 5.500.000
  rateStaffClosing: number      // 15%
  rateManagerSelf: number       // 15%
  rateManagerFromStaff: number  // 2.5%
}

export interface Closing {
  id: string
  leadId?: string
  staffId: string
  managerId?: string
  studentName: string
  parentName: string
  childClass?: string
  uangBangunan: number
  dpAmount: number
  remainingAmount: number
  isDpOnly: boolean
  closingBy: 'staff' | 'manager_self'
  komisiStaff: number
  komisiManager: number
  isPaidStaff: boolean
  isPaidManager: boolean
  closingDate: string
  notes?: string
  createdAt: string
}

export interface StaffCommission {
  staffId: string
  staffName: string
  periodMonth: string
  totalClosing: number
  totalUangBangunan: number
  komisiRate: number
  komisiStaff: number
  bonusAmount: number
  grandTotal: number
  isPaid: boolean
}

export interface ManagerCommission {
  managerId: string
  periodMonth: string
  selfClosingCount: number
  selfClosingRevenue: number
  komisiSelf: number
  staffClosingCount: number
  staffClosingRevenue: number
  komisiFromStaff: number
  grandTotal: number
  isPaid: boolean
}

function mapClosing(row: Record<string, unknown>): Closing {
  return {
    id: row.id as string,
    leadId: row.lead_id as string | undefined,
    staffId: row.staff_id as string,
    managerId: row.manager_id as string | undefined,
    studentName: row.student_name as string,
    parentName: row.parent_name as string,
    childClass: row.child_class as string | undefined,
    uangBangunan: (row.uang_bangunan as number) ?? 20000000,
    dpAmount: (row.dp_amount as number) ?? 0,
    remainingAmount: (row.remaining_amount as number) ?? 0,
    isDpOnly: (row.is_dp_only as boolean) ?? false,
    closingBy: (row.closing_by as 'staff' | 'manager_self') ?? 'staff',
    komisiStaff: (row.komisi_staff as number) ?? 0,
    komisiManager: (row.komisi_manager as number) ?? 0,
    isPaidStaff: (row.is_paid_staff as boolean) ?? false,
    isPaidManager: (row.is_paid_manager as boolean) ?? false,
    closingDate: row.closing_date as string,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
  }
}

export function useCommissionSettings() {
  const [settings, setSettings] = useState<CommissionSettings>({
    uangBangunanNormal: 40000000,
    uangBangunanDiskon: 20000000,
    dpMinimal: 5500000,
    rateStaffClosing: 15,
    rateManagerSelf: 15,
    rateManagerFromStaff: 2.5,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('commission_settings').select('*').limit(1).single()
      if (data) {
        const row = data as Record<string, unknown>
        setSettings({
          uangBangunanNormal: (row.uang_bangunan_normal as number) ?? 40000000,
          uangBangunanDiskon: (row.uang_bangunan_diskon as number) ?? 20000000,
          dpMinimal: (row.dp_minimal as number) ?? 5500000,
          rateStaffClosing: (row.rate_staff_closing as number) ?? 15,
          rateManagerSelf: (row.rate_manager_self as number) ?? 15,
          rateManagerFromStaff: (row.rate_manager_from_staff as number) ?? 2.5,
        })
      }
      setLoading(false)
    }
    fetch()
  }, [])

  return { settings, loading }
}

export function useClosings(staffId?: string, periodMonth?: string) {
  const [closings, setClosings] = useState<Closing[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClosings = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('closings').select('*').order('closing_date', { ascending: false })
    if (staffId) query = query.eq('staff_id', staffId)
    if (periodMonth) query = query.gte('closing_date', `${periodMonth}-01`).lte('closing_date', `${periodMonth}-31`)

    const { data, error } = await query
    if (error) console.error('fetchClosings error:', error)
    setClosings((data ?? []).map(r => mapClosing(r as Record<string, unknown>)))
    setLoading(false)
  }, [staffId, periodMonth])

  useEffect(() => {
    fetchClosings()
    const channel = supabase
      .channel(`closings-realtime-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'closings' }, fetchClosings)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchClosings])

  async function addClosing(data: {
    leadId?: string
    staffId: string
    managerId?: string
    studentName: string
    parentName: string
    childClass?: string
    uangBangunan?: number
    dpAmount?: number
    isDpOnly?: boolean
    closingBy: 'staff' | 'manager_self'
    notes?: string
    settings: CommissionSettings
  }) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return { error: new Error('Not authenticated') }

    const ub = data.uangBangunan ?? data.settings.uangBangunanDiskon
    const dp = data.dpAmount ?? 0
    const komisiStaff = Math.round(ub * (data.settings.rateStaffClosing / 100))
    const komisiManager = data.closingBy === 'manager_self'
      ? Math.round(ub * (data.settings.rateManagerSelf / 100))
      : Math.round(ub * (data.settings.rateManagerFromStaff / 100))

    const { error } = await supabase.from('closings').insert({
      lead_id: data.leadId ?? null,
      staff_id: data.staffId,
      manager_id: data.managerId ?? null,
      student_name: data.studentName,
      parent_name: data.parentName,
      child_class: data.childClass ?? null,
      uang_bangunan: ub,
      dp_amount: dp,
      remaining_amount: ub - dp,
      is_dp_only: data.isDpOnly ?? dp < ub,
      closing_by: data.closingBy,
      komisi_staff: komisiStaff,
      komisi_manager: komisiManager,
      notes: data.notes ?? null,
    })

    if (error) { console.error('addClosing error:', error); return { error } }
    await fetchClosings()
    return { error: null }
  }

  // Hitung komisi agregat per staff per bulan
  function calcStaffCommission(targetStaffId: string, month: string): StaffCommission | null {
    const monthClosings = closings.filter(c =>
      c.staffId === targetStaffId &&
      c.closingDate.startsWith(month)
    )
    if (monthClosings.length === 0) return null

    const totalUB = monthClosings.reduce((sum, c) => sum + c.uangBangunan, 0)
    const totalKomisi = monthClosings.reduce((sum, c) => sum + c.komisiStaff, 0)
    const achieved = monthClosings.length >= 1 // target 1 siswa/bulan

    return {
      staffId: targetStaffId,
      staffName: '',
      periodMonth: month,
      totalClosing: monthClosings.length,
      totalUangBangunan: totalUB,
      komisiRate: 15,
      komisiStaff: totalKomisi,
      bonusAmount: achieved ? 500000 : 0, // bonus jika capai target
      grandTotal: totalKomisi + (achieved ? 500000 : 0),
      isPaid: false,
    }
  }

  function calcManagerCommission(mgrId: string, month: string): ManagerCommission | null {
    const selfClosings = closings.filter(c =>
      c.managerId === mgrId &&
      c.closingBy === 'manager_self' &&
      c.closingDate.startsWith(month)
    )
    const staffClosings = closings.filter(c =>
      c.managerId === mgrId &&
      c.closingBy === 'staff' &&
      c.closingDate.startsWith(month)
    )

    const selfRevenue = selfClosings.reduce((s, c) => s + c.uangBangunan, 0)
    const staffRevenue = staffClosings.reduce((s, c) => s + c.uangBangunan, 0)
    const komisiSelf = selfClosings.reduce((s, c) => s + c.komisiManager, 0)
    const komisiFromStaff = staffClosings.reduce((s, c) => s + c.komisiManager, 0)

    return {
      managerId: mgrId,
      periodMonth: month,
      selfClosingCount: selfClosings.length,
      selfClosingRevenue: selfRevenue,
      komisiSelf,
      staffClosingCount: staffClosings.length,
      staffClosingRevenue: staffRevenue,
      komisiFromStaff,
      grandTotal: komisiSelf + komisiFromStaff,
      isPaid: false,
    }
  }

  return { closings, loading, fetchClosings, addClosing, calcStaffCommission, calcManagerCommission }
}
