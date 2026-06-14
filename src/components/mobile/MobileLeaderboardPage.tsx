"use client";

import { useState } from "react";
import { ArrowLeft, TrendingUp, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useLeaderboard } from "@/hooks/use-leaderboard";

interface MobileLeaderboardPageProps {
  dark?: boolean;
  currentUser: { id: string; name: string; role: string; team: string };
  onBack: () => void;
}

const RANK_ICON = ["🥇", "🥈", "🥉"];
const AV_COLORS = ["bg-yellow-400","bg-slate-400","bg-orange-400","bg-blue-400","bg-green-400","bg-purple-400","bg-pink-400","bg-teal-400"];

function formatRp(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n/1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp ${(n/1_000_000).toFixed(1)}jt`;
  return `Rp ${(n/1_000).toFixed(0)}rb`;
}

export function MobileLeaderboardPage({ dark = false, currentUser, onBack }: MobileLeaderboardPageProps) {
  const isHeadRole = ["head_manager","owner","deputi"].includes(currentUser.role);
  const tear = isHeadRole ? undefined : currentUser.team;
  const { data: entries, loading } = useLeaderboard(tear);
  const [tab, setTab] = useState<"individu" | "tim">("individu");

  const bg   = dark ? "bg-[#0a1020]" : "bg-slate-50";
  const card = dark ? "bg-[#111d35] border-[#1e2d4a]" : "bg-white border-slate-100";
  const tx   = dark ? "text-slate-100" : "text-slate-800";
  const mt   = dark ? "text-slate-400" : "text-slate-500";

  // Group by team for tim tab
  const teamMap: Record<string, { closing: number; leads: number; revenue: number; members: number }> = {};
  for (const e of entries) {
    if (!teamMap[e.team]) teamMap[e.team] = { closing: 0, leads: 0, revenue: 0, members: 0 };
    teamMap[e.team].closing += e.closing;
    teamMap[e.team].leads   += e.leads;
    teamMap[e.team].revenue += e.revenue;
    teamMap[e.team].members += 1;
  }
  const teamList = Object.entries(teamMap)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.closing - a.closing);

  return (
    <div className={`flex flex-col h-full ${bg}`}>
      {/* Header */}
      <div className={`flex items-center gap-3 px-4 py-4 pt-12 ${dark ? "bg-gradient-to-r from-[#0a1020] to-[#111d35]" : "bg-gradient-to-r from-blue-600 to-purple-600"}`}>
        <button onClick={onBack} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold text-lg">🏆 Leaderboard</h1>
          <p className="text-white/70 text-xs">{isHeadRole ? "Sua tim" : `Tim ${currentUser.team}`}</p>
        </div>
        <TrendingUp size={20} className="text-white/60" />
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 mx-4 mt-4 p-1 rounded-xl ${dark ? "bg-[#111d35]" : "bg-slate-200"}`}>
        {(["individu","tim"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === t
                ? dark ? "bg-blue-600 text-white" : "bg-white text-blue-600 shadow"
                : dark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {t === "individu" ? "👤 Individu" : "👥 Tim"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 pb-24">
        {loading ? (
          <div className="flex items-center justify-centy-16">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === "individu" ? (
          entries.length === 0 ? (
            <p className={`text-center py-12 text-sm ${mt}`}>Belum ada data</p>
          ) : (
            entries.map((e, i) => {
              const isMe = e.userId === currentUser.id;
              return (
                <div
                  key={e.userId}
                  className={`${card} border rounded-2xl p-3 flex items-center gap-3 ${
                    isMe ? dark ? "ring-1 ring-blue-500 bg-blue-900/20" : "ring-1 ring-blue-400 bg-blue-50" : ""
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
                    i === 0 ? "bg-yellow-500 text-white" :
                    i === 1 ? "bg-slate-400 text-white" :
                    i === 2 ? "bg-orange-500 text-white" :
                    dark ? "bg-[#1e2d4a] text-slate-400" : "bg-slate-100 text-slate-500"
                  }`}>
                    {i < 3 ? RANK_ICON[i] : i + 1}
                  </div>
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-xl ${AV_COLORS[i % AV_COLORS.length]} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                    {e.avatar}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className={`text-sm font-semibold ${tx} truncate`}>{e.name}</p>
                      {isMe && <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full shrink-0">Kamu</span>}
                    </div>
                    <p className={`text-xs ${mt}`}>{e.team} · {e.leads} leads · {e.closing} closing</p>
                  </div>
                  {/* Score */}
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${tx}`}>{formatRp(e.revenue)}</p>
                    <p className={`text-xs flex items-center justify-end gap-0.5 ${e.score > 50 ? "text-green-400" : "text-orange-400"}`}>
                      {e.score > 50 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                      {e.score} pts
                    </p>
                  </div>
                </div>
              );
            })
          )
        ) : (
          teamList.length === 0 ? (
            <p className={`text-center py-12 text-sm ${mt}`}>Belum ada data tim</p>
          ) : (
            teamList.map((t, i) => (
              <div key={t.name} className={`${card} border rounded-2xl p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm font-bold ${
                      i === 0 ? "bg-yellow-500 text-white" :
                      i === 1 ? "bg-slate-400 text-white" :
                      i === 2 ? "bg-orange-500 text-white" :
                      dark ? "bg-[#1e2d4a] text-slate-400" : "bg-slate-100 text-slate-500"
                    }`}>{i < 3 ? RANK_ICON[i] : `#${i+1}`}</span>
                    <div>
                      <p className={`text-sm font-bold ${tx}`}>Tim {t.name}</p>
                      <p className={`text-xs ${mt}`}>{t.members} anggota</p>
                    </div>
                  </div>
                  <Users size={16} className={mt} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className={`rounded-xl p-2 text-center ${dark ? "bg-[#0a1020]" : "bg-slate-50"}`}>
                    <p className={`text-base font-bold ${tx}`}>{t.closing}</p>
                    <p className={`text-[10px] ${mt}`}>Closing</p>
                  </div>
                  <div className={`rounded-xl p-2 text-center ${dark ? "bg-[#0a1020]" : "bg-slate-50"}`}>
                    <p className={`text-base font-bold ${tx}`}>{t.leads}</p>
                    <p className={`text-[10px] ${mt}`}>Leads</p>
                  </div>
                  <div className={`rounded-xl p-2 text-center ${dark ? "bg-[#0a1020]" : "bg-slate-50"}`}>
                    <p className={`text-base font-bold text-green-400`}>{formatRp(t.revenue)}</p>
                    <p className={`text-[10px] ${mt}`}>Revenue</p>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
