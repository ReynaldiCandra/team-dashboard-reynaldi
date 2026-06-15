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
  const { user, profile } = useAuth()

  const userRole = profile?.role ?? 'staff'
  const userTeam = profile?.team ?? null
  const userId   = user?.id ?? ''
  const userName = profile?.full_name ?? user?.email?.split('@')?.[0] ?? 'Staff'

  const assignedToFilter = (userRole === 'staff' && userId) ? userId : undefined
  const teamFilterVal    = userRole === 'manager' ? (userTeam ?? undefined) : undefined

  const { leads: rawLeads, createLead, updateLead, deleteLead } = useLeads(assignedToFilter, teamFilterVal)
  const { data: rawBoard }  = useLeaderboard(userRole === 'head_manager' ? undefined : userTeam ?? undefined)
  const { notifications: rawNotifs, markAllRead } = useNotifications(userId)
  const { stats } = useKpiStats(userRole === 'head_manager' ? undefined : teamFilterVal)
  const { streak } = useStreak(userId)
  const { tasks, toggleTask } = useTasks(userId)
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const leads = useMemo(
    () =>
      (rawLeads ?? []).map((l: any) => ({
        id:              l.id ?? '',
        name:            l.parent_name ?? l.parentName ?? '',
        phone:           l.parent_phone ?? l.parentPhone ?? '',
        child_name:      l.child_name ?? l.childName ?? '',
        category:        ((l.lead_category ?? l.leadCategory ?? l.category ?? 'COLD') as 'HOT' | 'WARM' | 'COLD'),
        leadCategory:    (l.lead_category ?? l.leadCategory ?? l.category ?? 'COLD'),
        status:          l.status ?? 'new',
        area:            l.parent_area ?? l.parentArea ?? '',
        assigned_to:     l.assigned_to ?? l.assignedTo ?? '',
        team:            l.team ?? null,
        created_at:      l.created_at ?? l.createdAt ?? new Date().toISOString(),
        last_contact_at: l.last_contact_at ?? null,
        follow_up_date:  l.follow_up_date ?? null,
        childGender:     l.child_gender ?? l.childGender ?? '',
        childClass:      l.child_class ?? l.childClass ?? '',
        hasSibling:      l.has_sibling ?? l.hasSibling ?? false,
        source:          l.source ?? '',
        interestRating:  l.interest_rating ?? l.interestRating ?? 0,
        notes:           l.notes ?? '',
      })),
    [rawLeads]
  )

  const leaderboard = useMemo(
    () =>
      (rawBoard ?? []).map((e: any) => ({
        id:            e.userId ?? e.id ?? e.user_id ?? '',
        name:          e.name ?? e.full_name ?? e.staff_name ?? '',
        team:          e.team ?? '',
        points:        e.score ?? e.points ?? e.closing_count ?? 0,
        closing_count: e.closing ?? e.closing_count ?? 0,
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
      parentName:   data.name,
      parentPhone:  data.phone,
      childName:    data.child_name,
      parentArea:   data.area,
      leadCategory: data.category,
      status:       'new',
      source:       'WhatsApp',
      team:         userTeam,
      assignedTo:   userId,
      handlerName:  userName,
      handlerRole:  userRole,
    })
  }

  async function handleUpdateLead(leadId: string, updates: { category?: string; status?: string; notes?: string }) {
    await (updateLead as any)?.(leadId, {
      leadCategory: updates.category,
      status: updates.status as any,
      notes: updates.notes,
    })
  }

  async function handleDeleteLead(leadId: string) {
    await (deleteLead as any)?.(leadId)
  }

  return (
    <MobileLayout
      userId={userId}
      userName={userName}
      userRole={userRole}
      userTeam={userTeam ?? 'Tim Alexandria'}
      staffName={userName}
      leads={leads as any}
      leaderboard={leaderboard}
      notifications={notifications}
      kpiDone={kpiDone}
      kpiTarget={kpiTarget}
      chartData={chartData}
      streak={streak}
      onAddLead={handleAddLead}
      onUpdateLead={handleUpdateLead}
      onDeleteLead={handleDeleteLead}
      tasks={tasks}
      onToggleTask={toggleTask}
      onLogout={handleLogout}
      onMarkNotifsRead={async () => { await markAllRead?.() }}
      joinedAt={user?.created_at}
    />
  )
}
