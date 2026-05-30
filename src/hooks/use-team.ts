import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface TeamMember {
  id: string
  name: string
  role: string
  team: string
  avatar: string
  email: string
  online: boolean
  revenue: number
  leads: number
  closing: number
  score: number
}

function mapRow(r: Record<string, unknown>): TeamMember {
  return {
    id: r.id as string,
    name: r.name as string,
    role: (r.role as string) ?? 'staff',
    team: (r.team as string) ?? 'All',
    avatar: (r.avatar as string) || ((r.name as string)?.charAt(0) ?? 'U'),
    email: (r.email as string) ?? '',
    online: (r.online as boolean) ?? false,
    revenue: (r.revenue as number) ?? 0,
    leads: (r.leads as number) ?? 0,
    closing: (r.closing as number) ?? 0,
    score: (r.score as number) ?? 0,
  }
}

export function useTeams() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) console.error('fetchTeams error:', error.message)
    setMembers((data ?? []).map(r => mapRow(r as Record<string, unknown>)))
    setLoading(false)
  }, [])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  const addMember = async (params: Omit<TeamMember, 'id'>) => {
    const { data, error } = await supabase
      .from('team_members')
      .insert({
        name: params.name,
        role: params.role,
        team: params.team,
        avatar: params.avatar || params.name.charAt(0),
        email: params.email,
        online: false,
        revenue: 0,
        leads: 0,
        closing: 0,
        score: 0,
      })
      .select()
      .single()
    if (!error) await fetchMembers()
    return { data, error }
  }

  const deleteMember = async (id: string) => {
    const { error } = await supabase.from('team_members').delete().eq('id', id)
    if (!error) await fetchMembers()
    return { error }
  }

  return { members, loading, addMember, deleteMember, refetch: fetchMembers }
}
