import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface Campaign {
  id: string
  name: string
  status: 'Active' | 'Paused' | 'Completed' | 'Draft'
  leads: number
  closing: number
  revenue: number
  staff: string[]
  start: string
  end: string
  budget: number
  createdAt: string
}

function mapRow(r: Record<string, unknown>): Campaign {
  return {
    id: r.id as string,
    name: r.name as string,
    status: (r.status as Campaign['status']) ?? 'Draft',
    leads: (r.leads as number) ?? 0,
    closing: (r.closing as number) ?? 0,
    revenue: (r.revenue as number) ?? 0,
    staff: (r.staff as string[]) ?? [],
    start: (r.start_date as string) ?? '',
    end: (r.end_date as string) ?? '',
    budget: (r.budget as number) ?? 0,
    createdAt: r.created_at as string,
  }
}

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCampaigns = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) console.error('fetchCampaigns error:', error.message)
    setCampaigns((data ?? []).map(r => mapRow(r as Record<string, unknown>)))
    setLoading(false)
  }, [])

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  const createCampaign = async (params: Omit<Campaign, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        name: params.name,
        status: params.status,
        leads: params.leads ?? 0,
        closing: params.closing ?? 0,
        revenue: params.revenue ?? 0,
        staff: params.staff ?? [],
        start_date: params.start || null,
        end_date: params.end || null,
        budget: params.budget ?? 0,
      })
      .select()
      .single()
    if (!error) await fetchCampaigns()
    return { data, error }
  }

  const updateCampaign = async (id: string, updates: Partial<Campaign>) => {
    const dbUpdates: Record<string, unknown> = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.leads !== undefined) dbUpdates.leads = updates.leads
    if (updates.closing !== undefined) dbUpdates.closing = updates.closing
    if (updates.revenue !== undefined) dbUpdates.revenue = updates.revenue
    if (updates.staff !== undefined) dbUpdates.staff = updates.staff
    if (updates.start !== undefined) dbUpdates.start_date = updates.start
    if (updates.end !== undefined) dbUpdates.end_date = updates.end
    if (updates.budget !== undefined) dbUpdates.budget = updates.budget
    const { error } = await supabase.from('campaigns').update(dbUpdates).eq('id', id)
    if (!error) await fetchCampaigns()
    return { error }
  }

  const deleteCampaign = async (id: string) => {
    const { error } = await supabase.from('campaigns').delete().eq('id', id)
    if (!error) await fetchCampaigns()
    return { error }
  }

  return { campaigns, loading, createCampaign, updateCampaign, deleteCampaign, refetch: fetchCampaigns }
}
