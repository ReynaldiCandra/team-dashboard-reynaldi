#!/bin/bash
# ============================================================
# Alexandria Dashboard v2 — Setup Script
# Jalankan dari ROOT folder project kamu di terminal Cursor:
#   bash setup-alexandria-v2.sh
# ============================================================

set -e
echo ""
echo "🕌 Alexandria Dashboard v2 — Setup Otomatis"
echo "============================================"
echo ""

# Pastikan dijalankan dari root project
if [ ! -f "package.json" ]; then
  echo "❌ ERROR: Jalankan script ini dari ROOT folder project!"
  echo "   cd /path/to/team-dashboard-reynaldi"
  echo "   bash setup-alexandria-v2.sh"
  exit 1
fi

echo "✅ Root project ditemukan: $(pwd)"
echo ""

# ============================================================
# BUAT FOLDER STRUKTUR
# ============================================================
echo "📁 Membuat struktur folder..."
mkdir -p src/components/pages
mkdir -p src/hooks
echo "   ✓ src/components/pages/"
echo "   ✓ src/hooks/"
echo ""

# ============================================================
# FILE 1: supabase/migration_v2.sql
# ============================================================
echo "📄 [1/8] Membuat supabase/migration_v2.sql..."
cat > supabase/migration_v2.sql << 'SQLEOF'
-- =============================================
-- MIGRATION: Alexandria v2 — Role & Team Structure
-- Jalankan di Supabase SQL Editor
-- =============================================

-- 1. Tambah kolom team ke profiles (jika belum ada)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS team TEXT DEFAULT NULL;

-- 2. Tabel team_members (yang hilang dari schema asli)
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_name TEXT NOT NULL UNIQUE,
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel meeting_projections (Meeting Senin & Kamis)
CREATE TABLE IF NOT EXISTS public.meeting_projections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_date DATE NOT NULL,
  meeting_day TEXT CHECK (meeting_day IN ('monday','thursday')) NOT NULL,
  team_name TEXT NOT NULL,
  presenter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  projected_closings INTEGER DEFAULT 0,
  actual_closings INTEGER DEFAULT 0,
  hot_leads_count INTEGER DEFAULT 0,
  warm_leads_count INTEGER DEFAULT 0,
  cold_leads_count INTEGER DEFAULT 0,
  agenda TEXT,
  notes TEXT,
  follow_up_actions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel rakornas (bulanan)
CREATE TABLE IF NOT EXISTS public.rakornas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  team_name TEXT NOT NULL,
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  total_leads INTEGER DEFAULT 0,
  total_closings INTEGER DEFAULT 0,
  revenue_achievement NUMERIC(15,2) DEFAULT 0,
  target_achievement_pct NUMERIC(5,2) DEFAULT 0,
  highlights TEXT,
  challenges TEXT,
  action_plan TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','submitted','presented')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month, year, team_name)
);

-- 5. Seed 8 tim Alexandria
INSERT INTO public.team_members (team_name) VALUES
  ('A'), ('B'), ('C'), ('D'), ('E'), ('F'), ('G'), ('H')
ON CONFLICT (team_name) DO NOTHING;

-- 6. RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rakornas ENABLE ROW LEVEL SECURITY;

-- head_manager: akses semua
CREATE POLICY IF NOT EXISTS "head_manager_team_members_all"
  ON public.team_members FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'head_manager'
  ));

CREATE POLICY IF NOT EXISTS "head_manager_meetings_all"
  ON public.meeting_projections FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'head_manager'
  ));

CREATE POLICY IF NOT EXISTS "head_manager_rakornas_all"
  ON public.rakornas FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'head_manager'
  ));

-- manager: hanya tim sendiri
CREATE POLICY IF NOT EXISTS "manager_own_meetings"
  ON public.meeting_projections FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'manager' AND team = meeting_projections.team_name
  ));

CREATE POLICY IF NOT EXISTS "manager_own_rakornas"
  ON public.rakornas FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'manager' AND team = rakornas.team_name
  ));

-- staff: baca meeting tim sendiri saja
CREATE POLICY IF NOT EXISTS "staff_read_meetings"
  ON public.meeting_projections FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND team = meeting_projections.team_name
  ));

-- Update timestamp otomatis
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_meeting_projections_updated_at ON public.meeting_projections;
CREATE TRIGGER update_meeting_projections_updated_at
  BEFORE UPDATE ON public.meeting_projections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rakornas_updated_at ON public.rakornas;
CREATE TRIGGER update_rakornas_updated_at
  BEFORE UPDATE ON public.rakornas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
SQLEOF
echo "   ✓ Dibuat — INGAT: jalankan manual di Supabase SQL Editor!"

# ============================================================
# FILE 2: src/hooks/use-auth.ts (PATCH — backup dulu)
# ============================================================
echo "📄 [2/8] Update src/hooks/use-auth.ts..."
if [ -f "src/hooks/use-auth.ts" ]; then
  cp src/hooks/use-auth.ts src/hooks/use-auth.ts.bak
  echo "   ✓ Backup dibuat: use-auth.ts.bak"
fi
cat > src/hooks/use-auth.ts << 'TSEOF'
// src/hooks/use-auth.ts
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// Tiga role Alexandria:
// head_manager = Coach Erwin / Yayasan → lihat semua 8 tim
// manager      = Manager Tim A-H       → lihat tim sendiri + 2 staff
// staff        = Marketing Staff       → input leads tim sendiri
export type Role = 'head_manager' | 'manager' | 'staff'

export interface Profile {
  id: string
  full_name: string
  role: Role
  team: string | null   // 'A'-'H', null untuk head_manager
  email: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) await fetchProfile(session.user.id)
      setLoading(false)
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) await fetchProfile(session.user.id)
        else setProfile(null)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) setProfile(data as Profile)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const isHeadManager = profile?.role === 'head_manager'
  const isManager = profile?.role === 'manager'
  const isStaff = profile?.role === 'staff'
  const canSeeAllTeams = isHeadManager
  const userTeam = profile?.team

  return {
    user, profile, loading, signOut,
    isHeadManager, isManager, isStaff,
    canSeeAllTeams, userTeam,
  }
}
TSEOF
echo "   ✓ src/hooks/use-auth.ts diperbarui"

# ============================================================
# FILE 3: src/hooks/use-meeting.ts (BARU)
# ============================================================
echo "📄 [3/8] Membuat src/hooks/use-meeting.ts..."
cat > src/hooks/use-meeting.ts << 'TSEOF'
// src/hooks/use-meeting.ts
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface MeetingProjection {
  id: string
  meeting_date: string
  meeting_day: 'monday' | 'thursday'
  team_name: string
  presenter_id: string | null
  projected_closings: number
  actual_closings: number
  hot_leads_count: number
  warm_leads_count: number
  cold_leads_count: number
  agenda: string | null
  notes: string | null
  follow_up_actions: string | null
  created_at: string
  updated_at: string
}

export type MeetingInsert = Omit<MeetingProjection, 'id' | 'created_at' | 'updated_at'>

export function useMeeting(teamFilter?: string) {
  const [meetings, setMeetings] = useState<MeetingProjection[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchMeetings = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('meeting_projections')
      .select('*')
      .order('meeting_date', { ascending: false })
      .limit(50)

    if (teamFilter) query = query.eq('team_name', teamFilter)

    const { data, error } = await query
    if (!error && data) setMeetings(data as MeetingProjection[])
    setLoading(false)
  }, [teamFilter])

  useEffect(() => { fetchMeetings() }, [fetchMeetings])

  const addMeeting = async (meeting: MeetingInsert) => {
    const { data, error } = await supabase
      .from('meeting_projections')
      .insert(meeting)
      .select()
      .single()
    if (!error && data) setMeetings(prev => [data as MeetingProjection, ...prev])
    return { data, error }
  }

  const updateMeeting = async (id: string, updates: Partial<MeetingProjection>) => {
    const { data, error } = await supabase
      .from('meeting_projections')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      setMeetings(prev => prev.map(m => m.id === id ? data as MeetingProjection : m))
    }
    return { data, error }
  }

  const projectionAccuracy = meetings
    .filter(m => m.actual_closings > 0 && m.projected_closings > 0)
    .map(m => ({
      ...m,
      accuracy: Math.round((m.actual_closings / m.projected_closings) * 100),
    }))

  const avgAccuracy = projectionAccuracy.length
    ? Math.round(projectionAccuracy.reduce((s, m) => s + m.accuracy, 0) / projectionAccuracy.length)
    : 0

  return { meetings, loading, addMeeting, updateMeeting, projectionAccuracy, avgAccuracy, refetch: fetchMeetings }
}
TSEOF
echo "   ✓ src/hooks/use-meeting.ts dibuat"

# ============================================================
# FILE 4: src/hooks/use-rakornas.ts (BARU)
# ============================================================
echo "📄 [4/8] Membuat src/hooks/use-rakornas.ts..."
cat > src/hooks/use-rakornas.ts << 'TSEOF'
// src/hooks/use-rakornas.ts
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface RakornasEntry {
  id: string
  month: number
  year: number
  team_name: string
  manager_id: string | null
  total_leads: number
  total_closings: number
  revenue_achievement: number
  target_achievement_pct: number
  highlights: string | null
  challenges: string | null
  action_plan: string | null
  status: 'draft' | 'submitted' | 'presented'
  created_at: string
  updated_at: string
}

export type RakornasInsert = Omit<RakornasEntry, 'id' | 'created_at' | 'updated_at'>

export function useRakornas(month?: number, year?: number) {
  const [entries, setEntries] = useState<RakornasEntry[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const currentMonth = month ?? new Date().getMonth() + 1
  const currentYear = year ?? new Date().getFullYear()

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('rakornas')
      .select('*')
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .order('team_name')
    if (!error && data) setEntries(data as RakornasEntry[])
    setLoading(false)
  }, [currentMonth, currentYear])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const upsertEntry = async (entry: RakornasInsert) => {
    const { data, error } = await supabase
      .from('rakornas')
      .upsert(entry, { onConflict: 'month,year,team_name' })
      .select()
      .single()
    if (!error && data) {
      setEntries(prev => {
        const idx = prev.findIndex(e => e.team_name === entry.team_name)
        const next = [...prev]
        if (idx >= 0) next[idx] = data as RakornasEntry
        else next.push(data as RakornasEntry)
        return next
      })
    }
    return { data, error }
  }

  const summary = {
    totalTeams: entries.length,
    submitted: entries.filter(e => e.status !== 'draft').length,
    avgAchievement: entries.length
      ? Math.round(entries.reduce((s, e) => s + e.target_achievement_pct, 0) / entries.length)
      : 0,
    topTeam: [...entries].sort((a, b) => b.target_achievement_pct - a.target_achievement_pct)[0]?.team_name ?? '-',
    totalLeads: entries.reduce((s, e) => s + e.total_leads, 0),
    totalClosings: entries.reduce((s, e) => s + e.total_closings, 0),
  }

  return { entries, loading, upsertEntry, summary, refetch: fetchEntries }
}
TSEOF
echo "   ✓ src/hooks/use-rakornas.ts dibuat"

# ============================================================
# FILE 5: MeetingProjectionPage.tsx (BARU)
# ============================================================
echo "📄 [5/8] Membuat src/components/pages/MeetingProjectionPage.tsx..."
cat > src/components/pages/MeetingProjectionPage.tsx << 'TSXEOF'
// src/components/pages/MeetingProjectionPage.tsx
'use client'
import { useState } from 'react'
import { useMeeting, MeetingProjection, MeetingInsert } from '@/hooks/use-meeting'
import { useAuth } from '@/hooks/use-auth'
import { Calendar, Target, TrendingUp, Plus, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

const TEAMS = ['A','B','C','D','E','F','G','H']
const DAYS = { monday: 'Senin', thursday: 'Kamis' }

const emptyForm = (): Partial<MeetingInsert> => ({
  meeting_date: new Date().toISOString().split('T')[0],
  meeting_day: 'monday',
  projected_closings: 0,
  actual_closings: 0,
  hot_leads_count: 0,
  warm_leads_count: 0,
  cold_leads_count: 0,
  agenda: '',
  notes: '',
  follow_up_actions: '',
})

export default function MeetingProjectionPage() {
  const { profile, isHeadManager } = useAuth()
  const teamFilter = isHeadManager ? undefined : (profile?.team ?? undefined)
  const { meetings, loading, addMeeting, updateMeeting, avgAccuracy } = useMeeting(teamFilter)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<MeetingInsert>>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const f = (key: keyof MeetingInsert, val: string | number) =>
    setForm(p => ({ ...p, [key]: val }))

  const handleSubmit = async () => {
    if (!form.meeting_date || !form.team_name && !isHeadManager && !profile?.team) return
    setSaving(true)
    const payload: MeetingInsert = {
      meeting_date: form.meeting_date!,
      meeting_day: form.meeting_day ?? 'monday',
      team_name: isHeadManager ? (form.team_name ?? TEAMS[0]) : (profile?.team ?? 'A'),
      presenter_id: profile?.id ?? null,
      projected_closings: Number(form.projected_closings ?? 0),
      actual_closings: Number(form.actual_closings ?? 0),
      hot_leads_count: Number(form.hot_leads_count ?? 0),
      warm_leads_count: Number(form.warm_leads_count ?? 0),
      cold_leads_count: Number(form.cold_leads_count ?? 0),
      agenda: form.agenda ?? null,
      notes: form.notes ?? null,
      follow_up_actions: form.follow_up_actions ?? null,
    }
    await addMeeting(payload)
    setForm(emptyForm())
    setShowForm(false)
    setSaving(false)
  }

  const totalProjected = meetings.reduce((s, m) => s + m.projected_closings, 0)
  const totalActual = meetings.reduce((s, m) => s + m.actual_closings, 0)
  const totalHot = meetings.reduce((s, m) => s + m.hot_leads_count, 0)

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meeting Proyeksi Closing</h1>
          <p className="text-sm text-gray-500 mt-0.5">Senin & Kamis — Pipeline & Target Mingguan</p>
        </div>
        {!isHeadManager && (
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Input Meeting Baru
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Akurasi Proyeksi', value: `${avgAccuracy}%`, icon: Target, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Total Meeting', value: meetings.length, icon: Calendar, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Total Proyeksi', value: totalProjected, icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
          { label: 'Realisasi Closing', value: totalActual, icon: CheckCircle, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-transparent`}>
            <div className="flex items-center gap-2 mb-1">
              <s.icon size={16} className={s.color} />
              <span className="text-xs text-gray-500">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Form input */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Input Meeting Baru</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tanggal *</label>
              <input type="date" value={form.meeting_date ?? ''}
                onChange={e => f('meeting_date', e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hari *</label>
              <select value={form.meeting_day ?? 'monday'}
                onChange={e => f('meeting_day', e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="monday">Senin</option>
                <option value="thursday">Kamis</option>
              </select>
            </div>
            {isHeadManager && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tim *</label>
                <select value={form.team_name ?? 'A'}
                  onChange={e => f('team_name', e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {TEAMS.map(t => <option key={t} value={t}>Tim {t}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-500 mb-1">🔥 Hot Leads</label>
              <input type="number" min={0} value={form.hot_leads_count ?? 0}
                onChange={e => f('hot_leads_count', e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">🌤 Warm Leads</label>
              <input type="number" min={0} value={form.warm_leads_count ?? 0}
                onChange={e => f('warm_leads_count', e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">❄ Cold Leads</label>
              <input type="number" min={0} value={form.cold_leads_count ?? 0}
                onChange={e => f('cold_leads_count', e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Proyeksi Closing</label>
              <input type="number" min={0} value={form.projected_closings ?? 0}
                onChange={e => f('projected_closings', e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Realisasi Closing (isi setelah meeting)</label>
              <input type="number" min={0} value={form.actual_closings ?? 0}
                onChange={e => f('actual_closings', e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2 md:col-span-3">
              <label className="block text-xs text-gray-500 mb-1">Agenda Meeting</label>
              <textarea value={form.agenda ?? ''} rows={2}
                onChange={e => f('agenda', e.target.value)}
                placeholder="Topik yang akan dibahas..."
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="col-span-2 md:col-span-3">
              <label className="block text-xs text-gray-500 mb-1">Follow-up Actions</label>
              <textarea value={form.follow_up_actions ?? ''} rows={2}
                onChange={e => f('follow_up_actions', e.target.value)}
                placeholder="Tindak lanjut setelah meeting..."
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSubmit} disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors">
              {saving ? 'Menyimpan...' : 'Simpan Meeting'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Tabel */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Riwayat Meeting</h2>
        </div>
        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Memuat data...</div>
        ) : meetings.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">Belum ada meeting tercatat.<br/>Klik "Input Meeting Baru" untuk mulai.</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {meetings.map(m => {
              const accuracy = m.projected_closings > 0 && m.actual_closings > 0
                ? Math.round((m.actual_closings / m.projected_closings) * 100) : null
              const expanded = expandedId === m.id

              return (
                <div key={m.id}>
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                    onClick={() => setExpandedId(expanded ? null : m.id)}
                  >
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                      m.meeting_day === 'monday' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                    }`}>
                      {DAYS[m.meeting_day]}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">{m.meeting_date}</span>
                    {isHeadManager && (
                      <span className="text-sm font-medium text-gray-900 dark:text-white flex-shrink-0">Tim {m.team_name}</span>
                    )}
                    <div className="flex items-center gap-4 ml-auto text-xs text-gray-500 flex-wrap justify-end">
                      <span>🔥 {m.hot_leads_count}</span>
                      <span>🌤 {m.warm_leads_count}</span>
                      <span className="font-medium text-gray-900 dark:text-white">Proyeksi: {m.projected_closings}</span>
                      {m.actual_closings > 0 && (
                        <span className="font-medium text-green-600">✓ {m.actual_closings}</span>
                      )}
                      {accuracy !== null && (
                        <span className={`font-bold ${accuracy >= 80 ? 'text-green-600' : accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {accuracy}%
                        </span>
                      )}
                    </div>
                    {expanded ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
                  </div>
                  {expanded && (
                    <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50 dark:bg-gray-700/30">
                      {m.agenda && (
                        <div className="md:col-span-1">
                          <p className="text-xs font-medium text-gray-500 mb-1">📋 Agenda</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{m.agenda}</p>
                        </div>
                      )}
                      {m.notes && (
                        <div className="md:col-span-1">
                          <p className="text-xs font-medium text-gray-500 mb-1">📝 Catatan</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{m.notes}</p>
                        </div>
                      )}
                      {m.follow_up_actions && (
                        <div className="md:col-span-1">
                          <p className="text-xs font-medium text-gray-500 mb-1">⚡ Follow-up</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{m.follow_up_actions}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
TSXEOF
echo "   ✓ src/components/pages/MeetingProjectionPage.tsx dibuat"

# ============================================================
# FILE 6: HeadManagerView.tsx (BARU)
# ============================================================
echo "📄 [6/8] Membuat src/components/pages/HeadManagerView.tsx..."
cat > src/components/pages/HeadManagerView.tsx << 'TSXEOF'
// src/components/pages/HeadManagerView.tsx
'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, TrendingUp, Target, Award, RefreshCw } from 'lucide-react'

const TEAMS = ['A','B','C','D','E','F','G','H']
const TEAM_COLORS: Record<string, string> = {
  A: 'bg-red-500', B: 'bg-orange-500', C: 'bg-yellow-500', D: 'bg-green-500',
  E: 'bg-teal-500', F: 'bg-blue-500', G: 'bg-indigo-500', H: 'bg-purple-500',
}

interface TeamSummary {
  team: string
  totalLeads: number
  hotLeads: number
  warmLeads: number
  coldLeads: number
  closings: number
  managerName: string
  staffNames: string[]
}

export default function HeadManagerView() {
  const [teamData, setTeamData] = useState<TeamSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const supabase = createClient()

  const fetchAllTeams = useCallback(async () => {
    setLoading(true)
    const [{ data: leads }, { data: profiles }] = await Promise.all([
      supabase.from('leads').select('team, category, status'),
      supabase.from('profiles').select('team, role, full_name'),
    ])

    const summaries: TeamSummary[] = TEAMS.map(team => {
      const tl = leads?.filter(l => l.team === team) ?? []
      const tp = profiles?.filter(p => p.team === team) ?? []
      return {
        team,
        totalLeads: tl.length,
        hotLeads: tl.filter(l => l.category === 'HOT').length,
        warmLeads: tl.filter(l => l.category === 'WARM').length,
        coldLeads: tl.filter(l => l.category === 'COLD').length,
        closings: tl.filter(l => l.status === 'closed').length,
        managerName: tp.find(p => p.role === 'manager')?.full_name ?? '—',
        staffNames: tp.filter(p => p.role === 'staff').map(p => p.full_name),
      }
    })

    setTeamData(summaries)
    setLastUpdated(new Date())
    setLoading(false)
  }, [])

  useEffect(() => { fetchAllTeams() }, [fetchAllTeams])

  const totalLeads = teamData.reduce((s, t) => s + t.totalLeads, 0)
  const totalClosings = teamData.reduce((s, t) => s + t.closings, 0)
  const totalHot = teamData.reduce((s, t) => s + t.hotLeads, 0)
  const sortedByClosing = [...teamData].sort((a, b) => b.closings - a.closings)
  const topTeam = sortedByClosing[0]

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-3 text-gray-400">
        <RefreshCw size={28} className="animate-spin" />
        <span className="text-sm">Memuat data semua tim...</span>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Head Manager View</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitor 8 Tim Sekaligus — Alexandria Islamic School</p>
        </div>
        <button onClick={fetchAllTeams}
          className="flex items-center gap-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 px-3 py-2 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors self-start sm:self-auto">
          <RefreshCw size={14} />
          Refresh
          {lastUpdated && <span className="text-gray-400 text-xs">{lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>}
        </button>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Leads', value: totalLeads, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Total Closing', value: totalClosings, icon: Award, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Hot Leads (all)', value: totalHot, icon: Target, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'Tim Terbaik', value: topTeam ? `Tim ${topTeam.team}` : '—', icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <s.icon size={15} className={s.color} />
              <span className="text-xs text-gray-500">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Grid 8 tim — kartu */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {teamData.map(team => {
          const convRate = team.totalLeads > 0 ? Math.round((team.closings / team.totalLeads) * 100) : 0
          return (
            <div key={team.team} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
              <div className={`${TEAM_COLORS[team.team]} h-1.5`} />
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">Tim {team.team}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    convRate >= 30 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}>{convRate}%</span>
                </div>
                <p className="text-xs text-gray-500 truncate mb-3">{team.managerName}</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Leads</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{team.totalLeads}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-500">🔥 Hot</span>
                    <span className="font-semibold text-red-600">{team.hotLeads}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-500">🌤 Warm</span>
                    <span className="font-semibold text-orange-500">{team.warmLeads}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 dark:border-gray-700 pt-1.5">
                    <span className="text-green-600 font-medium">✓ Closing</span>
                    <span className="font-bold text-green-600">{team.closings}</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-3 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full ${TEAM_COLORS[team.team]} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(100, convRate)}%` }} />
                </div>
                {team.staffNames.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2 truncate">
                    Staff: {team.staffNames.join(', ')}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabel ranking */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Ranking Tim — {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                {['#','Tim','Manager','Staff','Leads','🔥','🌤','Closing','Conv. Rate'].map(h => (
                  <th key={h} className={`p-3 text-gray-500 dark:text-gray-400 font-medium text-xs ${h === '#' || h === 'Tim' || h === 'Manager' || h === 'Staff' ? 'text-left' : 'text-center'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {sortedByClosing.map((team, idx) => {
                const conv = team.totalLeads > 0 ? Math.round((team.closings / team.totalLeads) * 100) : 0
                const medals = ['🥇','🥈','🥉']
                return (
                  <tr key={team.team} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="p-3 text-lg">{medals[idx] ?? idx + 1}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${TEAM_COLORS[team.team]}`} />
                        <span className="font-bold text-gray-900 dark:text-white">Tim {team.team}</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-700 dark:text-gray-300 max-w-32 truncate">{team.managerName}</td>
                    <td className="p-3 text-gray-500 text-xs max-w-28 truncate">{team.staffNames.join(', ') || '—'}</td>
                    <td className="p-3 text-center font-medium text-gray-900 dark:text-white">{team.totalLeads}</td>
                    <td className="p-3 text-center font-medium text-red-600">{team.hotLeads}</td>
                    <td className="p-3 text-center font-medium text-orange-500">{team.warmLeads}</td>
                    <td className="p-3 text-center font-bold text-green-600">{team.closings}</td>
                    <td className="p-3 text-center">
                      <span className={`font-medium ${conv >= 30 ? 'text-green-600' : conv >= 15 ? 'text-yellow-600' : 'text-gray-400'}`}>
                        {conv}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
TSXEOF
echo "   ✓ src/components/pages/HeadManagerView.tsx dibuat"

# ============================================================
# FILE 7: RakornasPage.tsx (BARU)
# ============================================================
echo "📄 [7/8] Membuat src/components/pages/RakornasPage.tsx..."
cat > src/components/pages/RakornasPage.tsx << 'TSXEOF'
// src/components/pages/RakornasPage.tsx
'use client'
import { useState } from 'react'
import { useRakornas, RakornasInsert } from '@/hooks/use-rakornas'
import { useAuth } from '@/hooks/use-auth'
import { FileText, BarChart2, CheckCircle, Clock, Edit3, X } from 'lucide-react'

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
const TEAMS = ['A','B','C','D','E','F','G','H']

const emptyForm = () => ({
  total_leads: 0, total_closings: 0,
  revenue_achievement: 0, target_achievement_pct: 0,
  highlights: '', challenges: '', action_plan: '',
})

export default function RakornasPage() {
  const { profile, isHeadManager, isManager } = useAuth()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const { entries, loading, upsertEntry, summary } = useRakornas(selectedMonth, selectedYear)

  const [editingTeam, setEditingTeam] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  const openEdit = (teamName: string) => {
    const existing = entries.find(e => e.team_name === teamName)
    setForm({
      total_leads: existing?.total_leads ?? 0,
      total_closings: existing?.total_closings ?? 0,
      revenue_achievement: existing?.revenue_achievement ?? 0,
      target_achievement_pct: existing?.target_achievement_pct ?? 0,
      highlights: existing?.highlights ?? '',
      challenges: existing?.challenges ?? '',
      action_plan: existing?.action_plan ?? '',
    })
    setEditingTeam(teamName)
  }

  const handleSave = async (status: 'draft' | 'submitted') => {
    if (!editingTeam) return
    setSaving(true)
    const payload: RakornasInsert = {
      month: selectedMonth,
      year: selectedYear,
      team_name: editingTeam,
      manager_id: profile?.id ?? null,
      total_leads: Number(form.total_leads),
      total_closings: Number(form.total_closings),
      revenue_achievement: Number(form.revenue_achievement),
      target_achievement_pct: Number(form.target_achievement_pct),
      highlights: form.highlights || null,
      challenges: form.challenges || null,
      action_plan: form.action_plan || null,
      status,
    }
    await upsertEntry(payload)
    setSaving(false)
    setEditingTeam(null)
  }

  const visibleTeams = isHeadManager ? TEAMS : (profile?.team ? [profile.team] : [])

  const statusBadge = (status?: string) => {
    if (!status || status === 'draft') return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">Draft</span>
    if (status === 'submitted') return <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">📤 Submitted</span>
    return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">✓ Dipresentasikan</span>
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rakornas Bulanan</h1>
          <p className="text-sm text-gray-500 mt-0.5">Presentasi & Evaluasi Manager — Per Bulan</p>
        </div>
        <div className="flex gap-2">
          <select value={selectedMonth} onChange={e => setSelectedMonth(+e.target.value)}
            className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select value={selectedYear} onChange={e => setSelectedYear(+e.target.value)}
            className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary (head manager only) */}
      {isHeadManager && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Tim Submit', value: `${summary.submitted}/8`, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
            { label: 'Avg Achievement', value: `${summary.avgAchievement}%`, icon: BarChart2, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Total Closing', value: summary.totalClosings, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            { label: 'Belum Submit', value: 8 - summary.submitted, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
              <div className="flex items-center gap-2 mb-1">
                <s.icon size={15} className={s.color} />
                <span className="text-xs text-gray-500">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Kartu per tim */}
      {loading ? (
        <div className="p-10 text-center text-gray-400 text-sm">Memuat data rakornas...</div>
      ) : (
        <div className={`grid gap-4 ${isHeadManager ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-xl'}`}>
          {visibleTeams.map(teamName => {
            const entry = entries.find(e => e.team_name === teamName)
            const canEdit = isHeadManager || (isManager && profile?.team === teamName)

            return (
              <div key={teamName} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">Tim {teamName}</h3>
                  <div className="flex items-center gap-2">
                    {statusBadge(entry?.status)}
                    {canEdit && (
                      <button onClick={() => openEdit(teamName)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                        <Edit3 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {entry ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Leads', value: entry.total_leads, color: 'text-gray-900 dark:text-white' },
                        { label: 'Closing', value: entry.total_closings, color: 'text-green-600' },
                        { label: 'Target', value: `${entry.target_achievement_pct}%`, color: entry.target_achievement_pct >= 100 ? 'text-green-600' : entry.target_achievement_pct >= 70 ? 'text-yellow-600' : 'text-red-600' },
                      ].map(m => (
                        <div key={m.label} className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-xl">
                          <p className="text-xs text-gray-400 mb-0.5">{m.label}</p>
                          <p className={`font-bold ${m.color}`}>{m.value}</p>
                        </div>
                      ))}
                    </div>
                    {/* Progress bar achievement */}
                    <div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${entry.target_achievement_pct >= 100 ? 'bg-green-500' : entry.target_achievement_pct >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(100, entry.target_achievement_pct)}%` }} />
                      </div>
                    </div>
                    {entry.highlights && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-xs text-gray-700 dark:text-gray-300">
                        <span className="font-semibold text-green-700 dark:text-green-400">✨ Highlight: </span>
                        {entry.highlights}
                      </div>
                    )}
                    {entry.challenges && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 text-xs text-gray-700 dark:text-gray-300">
                        <span className="font-semibold text-yellow-700 dark:text-yellow-400">⚠ Kendala: </span>
                        {entry.challenges}
                      </div>
                    )}
                    {entry.action_plan && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-xs text-gray-700 dark:text-gray-300">
                        <span className="font-semibold text-blue-700 dark:text-blue-400">📋 Action Plan: </span>
                        {entry.action_plan}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    {canEdit ? (
                      <>
                        <p>Belum ada laporan</p>
                        <button onClick={() => openEdit(teamName)}
                          className="mt-2 text-blue-500 hover:underline text-xs">Klik untuk mengisi →</button>
                      </>
                    ) : 'Laporan belum diisi'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal edit */}
      {editingTeam && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 dark:text-white">
                Laporan Rakornas — Tim {editingTeam}<br />
                <span className="text-sm font-normal text-gray-500">{MONTHS[selectedMonth-1]} {selectedYear}</span>
              </h2>
              <button onClick={() => setEditingTeam(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'total_leads', label: 'Total Leads' },
                  { key: 'total_closings', label: 'Total Closing' },
                  { key: 'revenue_achievement', label: 'Revenue (Rp)' },
                  { key: 'target_achievement_pct', label: 'Target Achievement (%)' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                    <input type="number" value={(form as Record<string,number|string>)[f.key] ?? 0}
                      onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))}
                      className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                ))}
              </div>
              {[
                { key: 'highlights', label: '✨ Pencapaian / Highlight', ph: 'Apa yang berhasil dicapai bulan ini?' },
                { key: 'challenges', label: '⚠ Kendala', ph: 'Hambatan atau masalah yang dihadapi?' },
                { key: 'action_plan', label: '📋 Rencana Bulan Depan', ph: 'Strategi dan target bulan berikutnya?' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                  <textarea value={(form as Record<string,string>)[f.key] ?? ''} rows={3}
                    placeholder={f.ph}
                    onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={() => handleSave('draft')} disabled={saving}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
                  {saving ? '...' : 'Simpan Draft'}
                </button>
                <button onClick={() => handleSave('submitted')} disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                  {saving ? 'Menyimpan...' : '📤 Submit ke Head Manager'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
TSXEOF
echo "   ✓ src/components/pages/RakornasPage.tsx dibuat"

# ============================================================
# FILE 8: patch AlexandriaDashboard (tambah routing baru)
# ============================================================
echo "📄 [8/8] Membuat patch helper untuk AlexandriaDashboard..."
cat > _PATCH_INSTRUCTIONS.md << 'MDEOF'
# Patch Manual untuk AlexandriaDashboard.tsx
# ============================================
# Karena AlexandriaDashboard.tsx > 2500 baris dan unik per repo,
# kamu perlu menambahkan 3 hal ini secara manual di Cursor.
# Estimasi waktu: 5 menit.

## Langkah A — Tambahkan import (di bagian PALING ATAS file)

```tsx
import MeetingProjectionPage from './pages/MeetingProjectionPage'
import HeadManagerView from './pages/HeadManagerView'
import RakornasPage from './pages/RakornasPage'
```

## Langkah B — Tambahkan menu di sidebar

Cari array yang berisi item navigasi sidebar (biasanya ada 'Leads', 'Performance', dsb).
Tambahkan item baru:

```tsx
{ id: 'meeting', label: 'Meeting Proyeksi', icon: Calendar },
{ id: 'rakornas', label: 'Rakornas Bulanan', icon: FileText },
```

Untuk Head Manager View — tambahkan di posisi pertama atau sebagai shortcut:
```tsx
{ id: 'head-manager', label: 'All Teams View', icon: LayoutGrid },
```

## Langkah C — Tambahkan routing di fungsi render

Cari bagian yang me-render halaman berdasarkan `activePage` atau `currentPage`.
Biasanya ada pola seperti:
  if (activePage === 'leads') return <LeadsPage />
  atau
  case 'performance': return <PerformancePage />

Tambahkan:
```tsx
case 'meeting':       return <MeetingProjectionPage />
case 'head-manager':  return <HeadManagerView />
case 'rakornas':      return <RakornasPage />
```

## Langkah D — Filter menu berdasarkan role (opsional tapi recommended)

Wrap item menu baru dengan pengecekan role:
```tsx
// Hanya tampil untuk head_manager dan manager
...(profile?.role !== 'staff' ? [
  { id: 'meeting', label: 'Meeting Proyeksi', icon: Calendar },
  { id: 'rakornas', label: 'Rakornas Bulanan', icon: FileText },
] : []),

// Hanya untuk head_manager
...(profile?.role === 'head_manager' ? [
  { id: 'head-manager', label: 'All Teams View', icon: LayoutGrid },
] : []),
```

## TIPS Cursor:
Ketik di Cursor Chat:
"Tambahkan import MeetingProjectionPage, HeadManagerView, dan RakornasPage
dari './pages/...' di AlexandriaDashboard.tsx,
lalu tambahkan routing untuk 'meeting', 'head-manager', dan 'rakornas'
di fungsi render halaman yang sudah ada,
dan tambahkan item menu baru di sidebar navigation array."
MDEOF
echo "   ✓ _PATCH_INSTRUCTIONS.md dibuat"

echo ""
echo "============================================"
echo "✅ SETUP SELESAI! Summary:"
echo "============================================"
echo ""
echo "📁 File baru yang dibuat:"
echo "   supabase/migration_v2.sql"
echo "   src/hooks/use-auth.ts (updated, backup: use-auth.ts.bak)"
echo "   src/hooks/use-meeting.ts"
echo "   src/hooks/use-rakornas.ts"
echo "   src/components/pages/MeetingProjectionPage.tsx"
echo "   src/components/pages/HeadManagerView.tsx"
echo "   src/components/pages/RakornasPage.tsx"
echo "   _PATCH_INSTRUCTIONS.md"
echo ""
echo "⚡ LANGKAH SELANJUTNYA:"
echo ""
echo "   1. Buka Supabase SQL Editor"
echo "      → Paste isi file: supabase/migration_v2.sql"
echo "      → Klik Run"
echo ""
echo "   2. Buka _PATCH_INSTRUCTIONS.md"
echo "      → Ikuti instruksi untuk update AlexandriaDashboard.tsx"
echo "      → Atau ketik di Cursor Chat (lihat TIPS di file tersebut)"
echo ""
echo "   3. Test lokal:"
echo "      npm run dev"
echo ""
echo "   4. Deploy:"
echo "      git add ."
echo '      git commit -m "feat: add meeting projection, head manager view, rakornas pages"'
echo "      git push"
echo "      → Vercel akan auto-deploy"
echo ""
echo "🕌 Alexandria Dashboard v2 siap! Semangat, Reynaldi! 🚀"
echo ""
SQLEOF
