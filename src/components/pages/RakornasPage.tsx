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
                  <textarea value={(form as Record<string, unknown>)[f.key] as string ?? ''} rows={3}
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
