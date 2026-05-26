'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export type LeadCategory = 'HOT' | 'COLD' | 'WARM' | 'FREEZE'

export interface Lead {
  id: string
  parentName: string
  parentPhone?: string
  parentArea?: string
  childName: string
  childGender?: 'L' | 'P'
  childClass?: string
  hasSibling?: boolean
  source?: string
  assignedTo?: string
  assignedStaffName?: string
  leadCategory?: LeadCategory
  interestRating?: number
  status: 'new' | 'contacted' | 'interested' | 'enrolled' | 'lost'
  campaignId?: string
  team?: string
  notes?: string
  handlerName?: string
  handlerRole?: string
  createdAt: string
  updatedAt: string
}

export interface LeadNote {
  id: string
  leadId: string
  authorId?: string
  authorName?: string
  note: string
  result?: string
  newStatus?: string
  createdAt: string
}

function mapLead(row: Record<string, unknown>): Lead {
  return {
    id: row.id as string,
    parentName: row.parent_name as string,
    parentPhone: row.parent_phone as string | undefined,
    parentArea: row.parent_area as string | undefined,
    childName: row.child_name as string,
    childGender: row.child_gender as 'L' | 'P' | undefined,
    childClass: row.child_class as string | undefined,
    hasSibling: (row.has_sibling ?? false) as boolean,
    source: row.source as string | undefined,
    assignedTo: row.assigned_to as string | undefined,
    assignedStaffName: row.assigned_staff_name as string | undefined,
    leadCategory: row.lead_category as LeadCategory | undefined,
    interestRating: row.interest_rating as number | undefined,
    status: (row.status ?? 'new') as Lead['status'],
    campaignId: row.campaign_id as string | undefined,
    team: row.team as string | undefined,
    notes: row.notes as string | undefined,
    handlerName: row.handler_name as string | undefined,
    handlerRole: row.handler_role as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

// Singleton agar session tidak hilang antar render
const supabase = createClient()

export function useLeads(assignedTo?: string) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (assignedTo) query = query.eq('assigned_to', assignedTo)

    const { data, error } = await query
    if (error) console.error('fetchLeads error:', error)
    setLeads((data ?? []).map(r => mapLead(r as Record<string, unknown>)))
    setLoading(false)
  }, [assignedTo]) // eslint-disable-line

  useEffect(() => {
    fetchLeads()
    const channel = supabase
      .channel('leads-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchLeads)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchLeads]) // eslint-disable-line

  async function createLead(data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) {
    // Gunakan getSession() — lebih reliable untuk client-side
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return { error: new Error('Not authenticated') }

    const { error } = await supabase.from('leads').insert({
      parent_name: data.parentName,
      parent_phone: data.parentPhone ?? null,
      parent_area: data.parentArea ?? null,
      child_name: data.childName,
      child_gender: data.childGender ?? null,
      child_class: data.childClass ?? null,
      has_sibling: data.hasSibling ?? false,
      source: data.source ?? null,
      assigned_to: data.assignedTo ?? null,
      assigned_staff_name: data.assignedStaffName ?? null,
      lead_category: data.leadCategory ?? null,
      interest_rating: data.interestRating ?? null,
      status: data.status,
      campaign_id: data.campaignId ?? null,
      team: data.team ?? null,
      notes: data.notes ?? null,
      handler_name: data.handlerName ?? null,
      handler_role: data.handlerRole ?? null,
    })

    if (error) { console.error('createLead error:', error); return { error } }
    await fetchLeads()
    return { error: null }
  }

  async function updateLead(leadId: string, updates: Partial<Lead>) {
    const payload: Record<string, unknown> = {}
    if (updates.status !== undefined) payload.status = updates.status
    if (updates.leadCategory !== undefined) payload.lead_category = updates.leadCategory
    if (updates.interestRating !== undefined) payload.interest_rating = updates.interestRating
    if (updates.notes !== undefined) payload.notes = updates.notes
    if (updates.assignedTo !== undefined) payload.assigned_to = updates.assignedTo
    if (updates.assignedStaffName !== undefined) payload.assigned_staff_name = updates.assignedStaffName

    // OPTIMISTIC UPDATE — update local state immediately so UI responds instantly
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, .updates } : l))

    const { error } = await supabase.from('leads').update(payload).eq('id', leadId)
    if (error) {
      console.error('updateLead error:', error)
      await fetchLeads() // revert on error
    } else {
      await fetchLeads() // confirm with server data
    }
    return { error }
  }

  async function updateLeadStatus(leadId: string, status: Lead['status']) {
    return updateLead(leadId, { status })
  }

  async function deleteLead(leadId: string) {
    const { error } = await supabase.from('leads').delete().eq('id', leadId)
    if (error) console.error('deleteLead error:', error)
    else await fetchLeads()
    return { error }
  }

  async function addNote(leadId: string, note: string, result?: string) {
    // Gunakan getSession() — lebih reliable untuk client-side
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return { error: new Error('Not authenticated') }

    const user = session.user
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()

    const { error } = await supabase.from('lead_notes').insert({
      lead_id: leadId,
      author_id: user.id,
      author_name: (profile as Record<string, unknown>)?.full_name ?? 'Unknown',
      note,
      result: result ?? null,
    })

    if (error) console.error('addNote error:', error)
    return { error }
  }

  async function fetchNotes(leadId: string): Promise<LeadNote[]> {
    const { data, error } = await supabase
      .from('lead_notes')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
    if (error) { console.error('fetchNotes error:', error); return [] }
    return (data ?? []).map(r => ({
      id: (r as Record<string, unknown>).id as string,
      leadId: (r as Record<string, unknown>).lead_id as string,
      authorId: (r as Record<string, unknown>).author_id as string | undefined,
      authorName: (r as Record<string, unknown>).author_name as string | undefined,
      note: (r as Record<string, unknown>).note as string,
      result: (r as Record<string, unknown>).result as string | undefined,
      newStatus: (r as Record<string, unknown>).new_status as string | undefined,
      createdAt: (r as Record<string, unknown>).created_at as string,
    }))
  }

  return { leads, loading, fetchLeads, createLead, updateLead, updateLeadStatus, deleteLead, addNote, fetchNotes }
}

export function exportLeadsCSV(leads: Lead[]) {
  const BOM = '\uFEFF'
  const headers = [
    'No','Tanggal','Nama Orang Tua','WhatsApp','Daerah',
    'Nama Calon Siswa','Jenis Kelamin','Kelas','Kakak/Adik di Sekolah',
    'Sumber','Assign Staff','Kategori Lead','Rating Ketertarikan',
    'Catatan','Status','Nama Handler','Role Handler','Team','Campaign ID'
  ]
  const rows = leads.map((l, i) => [
    i + 1,
    new Date(l.createdAt).toLocaleDateString('id-ID'),
    l.parentName,
    l.parentPhone ?? '',
    l.parentArea ?? '',
    l.childName,
    l.childGender === 'L' ? 'Laki-laki' : l.childGender === 'P' ? 'Perempuan' : '',
    l.childClass ?? '',
    l.hasSibling ? 'Ya' : 'Tidak',
    l.source ?? '',
    l.assignedStaffName ?? '',
    l.leadCategory ?? '',
    l.interestRating ?? '',
    l.notes ?? '',
    l.status,
    l.handlerName ?? '',
    l.handlerRole ?? '',
    l.team ?? '',
    l.campaignId ?? '',
  ])
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n')
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `leads_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function buildWABroadcast(leads: Lead[]): string {
  const hotWarm = leads.filter(l => l.leadCategory === 'HOT' || l.leadCategory === 'WARM')
  if (hotWarm.length === 0) return 'Tidak ada leads HOT atau WARM saat ini.'
  const lines = [
    `📢 *BROADCAST LEADS HOT & WARM*`,
    `📅 ${new Date().toLocaleDateString('id-ID', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}`,
    `Total: ${hotWarm.length} leads\n`,
  ]
  hotWarm.forEach((l, i) => {
    const cat = l.leadCategory === 'HOT' ? '🔥 HOT' : '🌤 WARM'
    lines.push(`${i+1}. ${cat} | *${l.childName}*`)
    lines.push(`   👨‍👩‍👦 Ortu: ${l.parentName}`)
    if (l.parentPhone) lines.push(`   📱 WA: ${l.parentPhone}`)
    if (l.parentArea) lines.push(`   📍 Daerah: ${l.parentArea}`)
    if (l.childClass) lines.push(`   🎒 Kelas: ${l.childClass}`)
    if (l.assignedStaffName) lines.push(`   👤 PIC: ${l.assignedStaffName}`)
    lines.push('')
  })
  lines.push(`_Dikirim otomatis dari Alexandria Dashboard_`)
  return lines.join('\n')
}

export function buildWAIndividual(lead: Lead): string {
  const staffName = lead.assignedStaffName ?? 'Tim Alexandria'
  return [
    `Assalamu'alaikum, Bapak/Ibu *${lead.parentName}* 🙏`,
    ``,
    `Perkenalkan, saya *${staffName}* dari *Alexandria Islamic School*.`,
    ``,
    `Kami menghubungi Bapak/Ibu terkait minat putra/putri Bapak/Ibu untuk bergabung bersama kami.`,
    ``,
    `📚 *Alexandria Islamic School* merupakan sekolah Islam terpadu yang berfokus pada pembentukan karakter dan prestasi akademik.`,
    ``,
    `Boleh kami berbagi informasi lebih lanjut mengenai program dan pendaftaran untuk *${lead.childName}*?`,
    ``,
    `Terima kasih, Bapak/Ibu. Semoga hari ini menyenangkan 😊`,
    ``,
    `Wassalamu'alaikum Wr. Wb.`,
    ``,
    `_Alexandria Islamic School_`,
    `_📱 Tim Marketing_`,
  ].join('\n')
}
