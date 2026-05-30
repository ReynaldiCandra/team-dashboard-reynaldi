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
