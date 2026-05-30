import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface OkrGoal {
  id: string
  title: string
  description: string
  target: number
  current: number
  unit: string
  deadline: string
  owner: string
  priority: 'high' | 'medium' | 'low'
  status: 'on-track' | 'at-risk' | 'behind' | 'completed'
  createdAt: string
}

function mapRow(r: Record<string, unknown>): OkrGoal {
  return {
    id: r.id as string,
    title: r.title as string,
    description: (r.description as string) ?? '',
    target: (r.target as number) ?? 0,
    current: (r.current_value as number) ?? 0,
    unit: (r.unit as string) ?? '',
    deadline: (r.deadline as string) ?? '',
    owner: (r.owner as string) ?? '',
    priority: (r.priority as OkrGoal['priority']) ?? 'medium',
    status: (r.status as OkrGoal['status']) ?? 'on-track',
    createdAt: r.created_at as string,
  }
}

export function useGoals() {
  const [goals, setGoals] = useState<OkrGoal[]>([])
  const [loading, setLoading] = useState(true)

  const fetchGoals = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('okr_goals')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) console.error('fetchGoals error:', error.message)
    setGoals((data ?? []).map(r => mapRow(r as Record<string, unknown>)))
    setLoading(false)
  }, [])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  const createGoal = async (params: Omit<OkrGoal, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase.from('okr_goals').insert({
      title: params.title,
      description: params.description,
      target: params.target,
      current_value: params.current,
      unit: params.unit,
      deadline: params.deadline || null,
      owner: params.owner,
      priority: params.priority,
      status: params.status,
    }).select().single()
    if (!error) await fetchGoals()
    return { data, error }
  }

  const deleteGoal = async (id: string) => {
    const { error } = await supabase.from('okr_goals').delete().eq('id', id)
    if (!error) await fetchGoals()
    return { error }
  }

  return { goals, loading, createGoal, deleteGoal, refetch: fetchGoals }
}
