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
