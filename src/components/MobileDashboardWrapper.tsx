'use client'

import { useMemo } from 'react'
import { MobileLayout } from '@/components/mobile'
import { useLeads } from '@/hooks/use-leads'
import { useAuth } from '@/hooks/use-auth'
import { useLeaderboard } from '@/hooks/use-leaderboard'
import { useNotifications } from '@/hooks/use-notifications'
import { useKpiStats } from '@/hooks/use-kpi-stats'
import { useStreak } from '@/hooks/useStreak'

export default function MobileDashboardWrapper() {
  const { user } = useAuth()

  const { leads: rawLeads, createLead } = useLeads()
  const { data: rawBoard } = useLeaderboard()
  const { notifications: rawNotifs, markAllRead } = useNotifications()
  const { stats } = useKpiStats()
  const { streak } = useStreak(user?.id)

  const leads = useMemo(
    () =>
      (rawLeads ?? []).map((l: any) => ({
        id: l.id ?? '',
        name: l.parent_name ?? l.parentName ?? '',
        phone: l.parent_phone ?? l.parentPhone ?? '',
        child_name: l.child_name ?? l.childName ?? '',
        category: (l.category ?? 'COLD') as 'HOT' | 'WARM' | 'COLD',
        status: l.status ?? 'baru',
        area: l.parent_area ?? l.parentArea ?? '',
        assigned_to: l.assigned_to ?? l.assignedTo ?? '',
        team: l.team ?? null,
        created_at: l.created_at ?? l.createdAt ?? new Date().toISOString(),
        last_contact_at: l.last_contact_at ?? null,
        follow_up_date: l.follow_up_date ?? null,
      })),
    [rawLeads]
  )

  const leaderboard = useMemo(
    () =>
      (rawBoard ?? []).map((e: any) => ({
        id: e.id ?? e.user_id ?? '',
        name: e.name ?? e.staff_name ?? '',
        team: e.team ?? '',
        points: e.points ?? e.score ?? e.closing_count ?? 0,
        closing_count: e.closing_count ?? 0,
      })),
    [rawBoard]
  )

  const notifications = useMemo(
    () =>
      (rawNotifs ?? []).map((n: any) => ({
        id: n.id ?? '',
        message: n.message ?? n.body ?? '',
        created_at: n.created_at ?? new Date().toISOString(),
        read: n.read ?? n.is_read ?? false,
        from: (n.from ?? n.sender_role ?? 'Sistem') as 'Manager' | 'Head Manager' | 'Sistem',
      })),
    [rawNotifs]
  )

  const s = stats as any
  const kpiDone = s?.closing_count ?? s?.closingCount ?? leads.filter(l => l.status === 'closing').length
  const kpiTarget = s?.target ?? s?.kpi_target ?? 10

  const chartData = useMemo(() => {
    const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
    const counts = Array(7).fill(0)
    leads.forEach(l => {
      const d = new Date(l.created_at)
      const idx = (d.getDay() + 6) % 7
      counts[idx]++
    })
    return days.map((day, i) => ({ day, val: counts[i] }))
  }, [leads])

  async function handleAddLead(data: {
    name: string
    child_name: string
    phone: string
    area: string
    category: 'HOT' | 'WARM' | 'COLD'
  }) {
    await (createLead as any)?.({
      parentName: data.name,
      parentPhone: data.phone,
      childName: data.child_name,
      parentArea: data.area,
      status: 'new',
      source: 'WhatsApp',
    })
  }

  const u = user as any

  return (
    <MobileLayout
      userId={user?.id ?? ''}
      userName={u?.name ?? user?.email?.split('@')[0] ?? 'Staff'}
      userRole={u?.role ?? 'Staff Marketing'}
      userTeam={u?.team ?? 'Tim Alexandria'}
      staffName={u?.name ?? 'Staff Marketing'}
      leads={leads}
      leaderboard={leaderboard}
      notifications={notifications}
      kpiDone={kpiDone}
      kpiTarget={kpiTarget}
      chartData={chartData}
      streak={streak}
      onAddLead={handleAddLead}
      onMarkNotifsRead={async () => { await markAllRead?.() }}
      joinedAt={user?.created_at}
    />
  )
}
