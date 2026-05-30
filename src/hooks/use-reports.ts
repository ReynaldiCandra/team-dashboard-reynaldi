'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface DailyReport {
  id?: string
  reporterId: string
  reportDate: string
  spendBudget: number
  totalLeads: number
  hotLeads: number
  warmLeads: number
  coldLeads: number
  closingToday: number
  notes?: string
  sentTo?: string
  isSubmitted: boolean
  submittedAt?: string
  createdAt?: string
}

export interface WeeklyReport {
  id?: string
  reporterId: string
  weekStart: string
  weekEnd: string
  totalSpend: number
  totalLeads: number
  hotLeads: number
  warmLeads: number
  coldLeads: number
  freezeLeads: number
  totalClosing: number
  totalRevenue: number
  visitors: number
  impressions: number
  ctr: number
  cpl: number
  cac: number
  meetingHeld: boolean
  meetingNotes?: string
  highlights?: string
  challenges?: string
  nextWeekPlan?: string
  sentTo?: string
  sentToEmail?: string
  isSubmitted: boolean
  submittedAt?: string
  createdAt?: string
}

function mapDaily(row: Record<string, unknown>): DailyReport {
  return {
    id: row.id as string,
    reporterId: row.reporter_id as string,
    reportDate: row.report_date as string,
    spendBudget: (row.spend_budget as number) ?? 0,
    totalLeads: (row.total_leads as number) ?? 0,
    hotLeads: (row.hot_leads as number) ?? 0,
    warmLeads: (row.warm_leads as number) ?? 0,
    coldLeads: (row.cold_leads as number) ?? 0,
    closingToday: (row.closing_today as number) ?? 0,
    notes: row.notes as string | undefined,
    sentTo: row.sent_to as string | undefined,
    isSubmitted: (row.is_submitted as boolean) ?? false,
    submittedAt: row.submitted_at as string | undefined,
    createdAt: row.created_at as string | undefined,
  }
}

function mapWeekly(row: Record<string, unknown>): WeeklyReport {
  return {
    id: row.id as string,
    reporterId: row.reporter_id as string,
    weekStart: row.week_start as string,
    weekEnd: row.week_end as string,
    totalSpend: (row.total_spend as number) ?? 0,
    totalLeads: (row.total_leads as number) ?? 0,
    hotLeads: (row.hot_leads as number) ?? 0,
    warmLeads: (row.warm_leads as number) ?? 0,
    coldLeads: (row.cold_leads as number) ?? 0,
    freezeLeads: (row.freeze_leads as number) ?? 0,
    totalClosing: (row.total_closing as number) ?? 0,
    totalRevenue: (row.total_revenue as number) ?? 0,
    visitors: (row.visitors as number) ?? 0,
    impressions: (row.impressions as number) ?? 0,
    ctr: (row.ctr as number) ?? 0,
    cpl: (row.cpl as number) ?? 0,
    cac: (row.cac as number) ?? 0,
    meetingHeld: (row.meeting_held as boolean) ?? false,
    meetingNotes: row.meeting_notes as string | undefined,
    highlights: row.highlights as string | undefined,
    challenges: row.challenges as string | undefined,
    nextWeekPlan: row.next_week_plan as string | undefined,
    sentTo: row.sent_to as string | undefined,
    sentToEmail: row.sent_to_email as string | undefined,
    isSubmitted: (row.is_submitted as boolean) ?? false,
    submittedAt: row.submitted_at as string | undefined,
    createdAt: row.created_at as string | undefined,
  }
}

export function useDailyReports(reporterId?: string) {
  const [reports, setReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [todayReport, setTodayReport] = useState<DailyReport | null>(null)

  const todayISO = new Date().toISOString().split('T')[0]

  const fetchReports = useCallback(async () => {
    if (!reporterId) { setLoading(false); return }
    setLoading(true)

    const { data, error } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('reporter_id', reporterId)
      .order('report_date', { ascending: false })
      .limit(30)

    if (error) console.error('fetchDailyReports error:', error)
    const mapped = (data ?? []).map(r => mapDaily(r as Record<string, unknown>))
    setReports(mapped)
    setTodayReport(mapped.find(r => r.reportDate === todayISO) ?? null)
    setLoading(false)
  }, [reporterId, todayISO])

  useEffect(() => {
    fetchReports()
    const channel = supabase
      .channel('daily-reports-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_reports' }, fetchReports)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchReports])

  async function saveDailyReport(data: Omit<DailyReport, 'id' | 'createdAt' | 'isSubmitted'>) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return { error: new Error('Not authenticated') }

    const { error } = await supabase.from('daily_reports').upsert({
      reporter_id: data.reporterId,
      report_date: data.reportDate,
      spend_budget: data.spendBudget,
      total_leads: data.totalLeads,
      hot_leads: data.hotLeads,
      warm_leads: data.warmLeads,
      cold_leads: data.coldLeads,
      closing_today: data.closingToday,
      notes: data.notes ?? null,
      sent_to: data.sentTo ?? null,
    }, { onConflict: 'reporter_id,report_date' })

    if (error) { console.error('saveDailyReport error:', error); return { error } }
    await fetchReports()
    return { error: null }
  }

  async function submitDailyReport(reportId: string) {
    const { error } = await supabase.from('daily_reports').update({
      is_submitted: true,
      submitted_at: new Date().toISOString(),
    }).eq('id', reportId)
    if (error) console.error('submitDailyReport error:', error)
    else await fetchReports()
    return { error }
  }

  return { reports, loading, todayReport, saveDailyReport, submitDailyReport, fetchReports }
}

export function useWeeklyReports(reporterId?: string) {
  const [reports, setReports] = useState<WeeklyReport[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReports = useCallback(async () => {
    if (!reporterId) { setLoading(false); return }
    setLoading(true)

    const { data, error } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('reporter_id', reporterId)
      .order('week_start', { ascending: false })
      .limit(12)

    if (error) console.error('fetchWeeklyReports error:', error)
    setReports((data ?? []).map(r => mapWeekly(r as Record<string, unknown>)))
    setLoading(false)
  }, [reporterId])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  // Hitung tanggal minggu ini (Senin - Minggu)
  function getCurrentWeekRange(): { start: string; end: string } {
    const now = new Date()
    const day = now.getDay() // 0 = Minggu
    const diffToMonday = day === 0 ? -6 : 1 - day
    const monday = new Date(now)
    monday.setDate(now.getDate() + diffToMonday)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0],
    }
  }

  async function saveWeeklyReport(data: Omit<WeeklyReport, 'id' | 'createdAt' | 'isSubmitted'>) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return { error: new Error('Not authenticated') }

    const { error } = await supabase.from('weekly_reports').upsert({
      reporter_id: data.reporterId,
      week_start: data.weekStart,
      week_end: data.weekEnd,
      total_spend: data.totalSpend,
      total_leads: data.totalLeads,
      hot_leads: data.hotLeads,
      warm_leads: data.warmLeads,
      cold_leads: data.coldLeads,
      freeze_leads: data.freezeLeads,
      total_closing: data.totalClosing,
      total_revenue: data.totalRevenue,
      visitors: data.visitors,
      impressions: data.impressions,
      ctr: data.ctr,
      cpl: data.cpl,
      cac: data.cac,
      meeting_held: data.meetingHeld,
      meeting_notes: data.meetingNotes ?? null,
      highlights: data.highlights ?? null,
      challenges: data.challenges ?? null,
      next_week_plan: data.nextWeekPlan ?? null,
      sent_to: data.sentTo ?? null,
      sent_to_email: data.sentToEmail ?? null,
    }, { onConflict: 'reporter_id,week_start' })

    if (error) { console.error('saveWeeklyReport error:', error); return { error } }
    await fetchReports()
    return { error: null }
  }

  async function submitWeeklyReport(reportId: string) {
    const { error } = await supabase.from('weekly_reports').update({
      is_submitted: true,
      submitted_at: new Date().toISOString(),
    }).eq('id', reportId)
    if (error) console.error('submitWeeklyReport error:', error)
    else await fetchReports()
    return { error }
  }

  return { reports, loading, saveWeeklyReport, submitWeeklyReport, fetchReports, getCurrentWeekRange }
}
