'use client'

import { useMemo } from 'react'
import { MobileLayout } from '@/components/mobile'
import { useLeads } from '@/hooks/use-leads'
import { useAuth } from '@/hooks/use-auth'
import { useLeaderboard } from '@/hooks/use-leaderboard'
import { useNotifications } from '@/hooks/use-notifications'
import { useKpiStats } from '@/hooks/use-kpi-stats'
import { useStreak } from '@/hooks/useStreak'
import { useTasks } from '@/hooks/use-tasks'
import { createClient } from '@/lib/supabase/client'


export default function MobileDashboardWrapper() {
  const { user } = useAuth()
  const u = user as any

  const userRole = u?.role ?? 'staff'
  const userTeam = u?.team ?? null
  const userId   = user?.id ?? ''

  // Filter leads sesuai role
  const teamFilter = userRole === 'head_manager' ? undefined : userTeam ?? undefined
  const { leads: rawLeads, createLead } = useLeads(teamFilter)
  const { data: rawBoard } = useLeaderboard(userRole === 'head_manager' ? undefined : userTeam ?? undefined)
  const { notifications: rawNotifs, markAllRead } = useNotifications(userId)
  const { stats } = useKpiStats(teamFilter)
  const { streak } = useStreak(userId)
  const { tasks, toggleTask } = useTasks(userId)
  const supabase = createClient()
  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const leads = useMemo(
    () =>
      (rawLeads ?? [])
        .filter((l: any) => {
          // staff hanya lihat lead milik sendiri
          if (userRole === 'staff') return (l.assigned_to ?? l.assignedTo) === userId
          // manager lihat semua lead timnya (sudah difilter by teamFilter di useLeads)
          return true
        })
        .map((l: any) => ({
          id:             l.id ?? '',
          name:           l.parent_name ?? l.parentName ?? '',
          phone:          l.parent_phone ?? l.parentPhone ?? '',
          child_name:     l.child_name ?? l.childName ?? '',
          category:       ((l.lead_category ?? l.leadCategory ?? l.category ?? 'COLD') as 'HOT' | 'WARM' | 'COLD' | 'FREEZE'),
          leadCategory:   (l.lead_category ?? l.leadCategory ?? l.category ?? 'COLD'),
          status:         l.status ?? 'baru',
          area:           l.parent_area ?? l.parentArea ?? '',
          assigned_to:    l.assigned_to ?? l.assignedTo ?? '',
          team:           l.team ?? null,
          created_at:     l.created_at ?? l.createdAt ?? new Date().toISOString(),
          last_contact_at: l.last_contact_at ?? null,
          follow_up_date: l.follow_up_date ?? null,
          // Data tambahan untuk detail view
          childGender:    l.child_gender ?? l.childGender ?? '',
          childClass:     l.child_class ?? l.childClass ?? '',
          hasSibling:     l.has_sibling ?? l.hasSibling ?? false,
          source:         l.source ?? '',
          interestRating: l.interest_rating ?? l.interestRating ?? 0,
          notes:          l.notes ?? '',
        })),
    [rawLeads, userId, userRole]
  )

  const leaderboard = useMemo(
    () =>
      (rawBoard ?? []).map((e: any) => ({
        id:            e.id ?? e.user_id ?? e.userId ?? '',
        name:          e.name ?? e.full_name ?? e.staff_name ?? '',
        team:          e.team ?? '',
        points:        e.points ?? e.score ?? e.closing_count ?? 0,
        closing_count: e.closing_count ?? e.closing ?? 0,
      })),
    [rawBoard]
  )

  const notifications = useMemo(
    () =>
      (rawNotifs ?? []).map((n: any) => ({
        id:         n.id ?? '',
        message:    n.message ?? n.body ?? '',
        created_at: n.created_at ?? new Date().toISOString(),
        read:       n.read ?? n.is_read ?? false,
        from:       (n.from ?? n.sender_role ?? 'Sistem') as 'Manager' | 'Head Manager' | 'Sistem',
      })),
    [rawNotifs]
  )

  const s = stats as any
  const kpiDone   = s?.closingThisMonth ?? s?.closing_count ?? s?.closingCount ?? leads.filter(l => l.status === 'closing').length
  const kpiTarget = s?.target ?? s?.kpi_target ?? 5

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
    name: string; child_name: string; phone: string; area: string; category: 'HOT' | 'WARM' | 'COLD'
  }) {
    await (createLead as any)?.({
      parentName:  data.name,
      parentPhone: data.phone,
      childName:   data.child_name,
      parentArea:  data.area,
      leadCategory: data.category,
      status:      'new',
      source:      'WhatsApp',
      team:        userTeam,
      assignedTo:  userId,
    })
  }

  return (
    <MobileLayout
      userId={userId}
      userName={u?.name ?? u?.full_name ?? user?.email?.split('@')?.[0] ?? 'Staff'}
      userRole={userRole}
      userTeam={userTeam ?? 'Tim Alexandria'}
      staffName={u?.name ?? u?.full_name ?? 'Staff Marketing'}
      leads={leads as any}
      leaderboard={leaderboard}
      notifications={notifications}
      kpiDone={kpiDone}
      kpiTarget={kpiTarget}
      chartData={chartData}
      streak={streak}
      onAddLead={handleAddLead}
      tasks={tasks}
      onToggleTask={toggleTask}
      onLogout={handleLogout}
      onMarkNotifsRead={async () => { await markAllRead?.() }}
      joinedAt={user?.created_at}
    />
  )
}
