'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface KpiStats {
  totalLeads: number
  totalRevenue: number
  totalClosing: number
  conversionRate: number
  leadsThisMonth: number
  revenueThisMonth: number
  closingThisMonth: number
  leadsLastMonth: number
  revenueLastMonth: number
  closingLastMonth: number
  totalKomisiStaff: number
  totalKomisiManager: number
  enrolledLeads: number
  monthlyTrend: { month: string; revenue: number; leads: number; closing: number }[]
  sourceBreakdown: { name: string; value: number; color: string }[]
}

const SOURCE_COLORS: Record<string, string> = {
  Instagram: '#8b5cf6', WhatsApp: '#06b6d4', Referral: '#10b981',
  Facebook: '#3b82f6', Google: '#f59e0b', 'Walk-in': '#f97316', Lainnya: '#94a3b8',
}
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export function useKpiStats(teamFilter?: string, monthFilter?: number, yearFilter?: number) {
  const [stats, setStats] = useState<KpiStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchStats = useCallback(async () => {
    const filterYear = yearFilter ?? new Date().getFullYear()
    const filterMonth = monthFilter ?? new Date().getMonth() + 1
    setLoading(true)
    const now = new Date()
    const thisYear = filterYear
    const thisMonth = filterMonth
    const lastMonth = thisMonth === 1 ? 12 : thisMonth - 1
    const lastMonthYear = thisMonth === 1 ? thisYear - 1 : thisYear
    const pad = (n: number) => String(n).padStart(2, '0')
    const thisMonthStart = `${thisYear}-${pad(thisMonth)}-01`
    const lastMonthStart = `${lastMonthYear}-${pad(lastMonth)}-01`
    const lastMonthEnd = `${thisYear}-${pad(thisMonth)}-01`

    // Ambil leads
    let leadsQ = supabase.from('leads').select('id, status, source, created_at')
    if (teamFilter) leadsQ = leadsQ.eq('team', teamFilter)
    const { data: leadsData } = await leadsQ
    const leads = (leadsData ?? []) as Record<string, unknown>[]

    // Ambil closings (sumber utama revenue & closing count)
    let closingsQ = supabase.from('closings').select('*')
    if (teamFilter) closingsQ = closingsQ.eq('team', teamFilter)
    const { data: closingsData } = await closingsQ
    const closings = (closingsData ?? []) as Record<string, unknown>[]

    // Ambil performances untuk chart trend
    let perfQ = supabase.from('performances').select('leads_in, revenue, closing, record_date').order('record_date', { ascending: true })
    const { data: perfData } = await perfQ
    const perfs = (perfData ?? []) as Record<string, unknown>[]

    // Hitung stats dari leads
    const totalLeads = leads.length
    const enrolledLeads = leads.filter(l => l.status === 'enrolled').length
    const leadsThisMonth = leads.filter(l => (l.created_at as string) >= thisMonthStart).length
    const leadsLastMonth = leads.filter(l => { const d = l.created_at as string; return d >= lastMonthStart && d < lastMonthEnd }).length
    const conversionRate = totalLeads > 0 ? Math.round((enrolledLeads / totalLeads) * 1000) / 10 : 0

    // Hitung stats dari closings (data aktual)
    const totalClosing = closings.length
    const totalRevenue = closings.reduce((s, c) => s + ((c.nominal_bayar as number) ?? 0), 0)
    const totalKomisiStaff = closings.reduce((s, c) => s + ((c.komisi_staff as number) ?? 0), 0)
    const totalKomisiManager = closings.reduce((s, c) => s + ((c.komisi_manager as number) ?? 0), 0)

    const closingsThisMonth = closings.filter(c => (c.created_at as string) >= thisMonthStart)
    const closingsLastMonth = closings.filter(c => { const d = c.created_at as string; return d >= lastMonthStart && d < lastMonthEnd })
    const revenueThisMonth = closingsThisMonth.reduce((s, c) => s + ((c.nominal_bayar as number) ?? 0), 0)
    const closingThisMonth = closingsThisMonth.length
    const revenueLastMonth = closingsLastMonth.reduce((s, c) => s + ((c.nominal_bayar as number) ?? 0), 0)
    const closingLastMonth = closingsLastMonth.length

    // Chart trend dari performances
    const monthlyMap: Record<string, { revenue: number; leads: number; closing: number }> = {}
    perfs.forEach(p => {
      const d = p.record_date as string; if (!d) return
      const key = d.slice(0, 7)
      if (!monthlyMap[key]) monthlyMap[key] = { revenue: 0, leads: 0, closing: 0 }
      monthlyMap[key].revenue += (p.revenue as number) ?? 0
      monthlyMap[key].leads += (p.leads_in as number) ?? 0
      monthlyMap[key].closing += (p.closing as number) ?? 0
    })
    const monthlyTrend = Object.entries(monthlyMap).sort(([a],[b])=>a.localeCompare(b)).slice(-6)
      .map(([key,val])=>({ month:MONTH_LABELS[parseInt(key.slice(5,7))-1], revenue:Math.round(val.revenue/1000000), leads:val.leads, closing:val.closing }))

    // Source breakdown
    const sourceCounts: Record<string, number> = {}
    leads.forEach(l => { const src = (l.source as string)||'Lainnya'; sourceCounts[src]=(sourceCounts[src]??0)+1 })
    const totalSrc = Object.values(sourceCounts).reduce((s,v)=>s+v,0)
    const sourceBreakdown = Object.entries(sourceCounts).sort(([,a],[,b])=>b-a).slice(0,5)
      .map(([name,count])=>({ name, value:totalSrc>0?Math.round((count/totalSrc)*100):0, color:SOURCE_COLORS[name]??'#94a3b8' }))

    setStats({ totalLeads, totalRevenue, totalClosing, conversionRate, leadsThisMonth, revenueThisMonth, closingThisMonth, leadsLastMonth, revenueLastMonth, closingLastMonth, totalKomisiStaff, totalKomisiManager, enrolledLeads, monthlyTrend, sourceBreakdown })
    setLoading(false)
  }, [teamFilter, monthFilter, yearFilter])

  useEffect(() => {
    fetchStats()
    const ch1 = supabase.channel('kpi-leads').on('postgres_changes',{event:'*',schema:'public',table:'leads'},fetchStats).subscribe()
    const ch2 = supabase.channel('kpi-closings').on('postgres_changes',{event:'*',schema:'public',table:'closings'},fetchStats).subscribe()
    const ch3 = supabase.channel('kpi-perf').on('postgres_changes',{event:'*',schema:'public',table:'performances'},fetchStats).subscribe()
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); supabase.removeChannel(ch3) }
  }, [fetchStats])

  const changes = stats ? {
    leadsChange: pctChange(stats.leadsThisMonth, stats.leadsLastMonth),
    revenueChange: pctChange(stats.revenueThisMonth, stats.revenueLastMonth),
    closingChange: pctChange(stats.closingThisMonth, stats.closingLastMonth),
  } : null

  return { stats, changes, loading, refetch: fetchStats }
}
