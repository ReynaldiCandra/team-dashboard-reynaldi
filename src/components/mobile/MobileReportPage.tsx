"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, FileText, RefreshCw, TrendingUp, Users, DollarSign, Target, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface MobileReportPageProps {
  dark?: boolean;
  currentUser: { id: string; name: string; role: string; team: string | null };
  onBack: () => void;
}

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const TEAMS  = ["A","B","C","D","E","F","G","H"];

function formatRp(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n/1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000)     return `Rp ${(n/1_000_000).toFixed(1)}jt`;
  if (n >= 1_000)         return `Rp ${(n/1_000).toFixed(0)}rb`;
  return `Rp ${n}`;
}

interface ClosingRow {
  id: string;
  student_name: string;
  staff_name: string;
  team: string;
  nominal_bayar: number;
  komisi_staff: number;
  komisi_manager: number;
  created_at: string;
}

interface Summary {
  totalClosing: number;
  totalRevenue: number;
  totalKomisiStaff: number;
  totalKomisiManager: number;
  avgRevenue: number;
}

export function MobileReportPage({ dark = false, currentUser, onBack }: MobileReportPageProps) {
  const supabase = createClient();
  const now = new Date();

  const isHeadRole = ["head_manager","owner","deputi"].includes(currentUser.role);

  const [month, setMonth]       = useState(now.getMonth());
  const [year, setYear]         = useState(now.getFullYear());
  const [teamFilter, setTeamFilter] = useState<string>("All");
  const [closings, setClosings] = useState<ClosingRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<"ringkasan" | "rincian">("ringkasan");

  const bg   = dark ? "bg-[#0a1020]"   : "bg-slate-50";
  const card = dark ? "bg-[#111d35] border-[#1e2d4a]" : "bg-white border-slate-100";
  const tx   = dark ? "text-slate-100" : "text-slate-800";
  const mt   = dark ? "text-slate-400" : "text-slate-500";
  const bd   = dark ? "border-[#1e2d4a]" : "border-slate-100";

  const fetchData = useCallback(async () => {
    setLoading(true);
    const from = `${year}-${String(month+1).padStart(2,"0")}-01`;
    const to   = new Date(year, month+1, 0).toISOString().split("T")[0];

    let q = supabase.from("closings").select("*").gte("created_at", from).lte("created_at", to + "T23:59:59");
    if (!isHeadRole) q = q.eq("team", currentUser.team ?? "");
    else if (teamFilter !== "All") q = q.eq("team", teamFilter);

    const { data } = await q.order("created_at", { ascending: false });
    setClosings((data as ClosingRow[]) ?? []);
    setLoading(false);
  }, [month, year, teamFilter, isHeadRole, currentUser.team, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const summary: Summary = {
    totalClosing:       closings.length,
    totalRevenue:       closings.reduce((s,c) => s + c.nominal_bayar, 0),
    totalKomisiStaff:   closings.reduce((s,c) => s + c.komisi_staff, 0),
    totalKomisiManager: closings.reduce((s,c) => s + c.komisi_manager, 0),
    avgRevenue:         closings.length ? Math.round(closings.reduce((s,c) => s + c.nominal_bayar, 0) / closings.length) : 0,
  };

  // Group by team for ringkasan
  const byTeam: Record<string, { closing: number; revenue: number; komisi: number }> = {};
  for (const c of closings) {
    if (!byTeam[c.team]) byTeam[c.team] = { closing: 0, revenue: 0, komisi: 0 };
    byTeam[c.team].closing += 1;
    byTeam[c.team].revenue += c.nominal_bayar;
    byTeam[c.team].komisi  += c.komisi_staff;
  }
  const teamRows = Object.entries(byTeam).sort((a,b) => b[1].closing - a[1].closing);

  const years = [now.getFullYear() - 1, now.getFullYear()];

  return (
    <div className={`flex flex-col h-full ${bg}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-bold text-lg">📊 Laporan Bulanan</h1>
            <p className="text-white/70 text-xs">{isHeadRole ? "Semua tim" : `Tim ${currentUser.team}`}</p>
          </div>
          <button onClick={fetchData} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Filter bulan & tahun */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <select
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              className="w-full appearance-none bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-xl outline-none pr-7"           >
              {MONTHS.map((m,i) => <option key={i} value={i} className="text-slate-800">{m}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="appearance-none bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-xl outline-none pr-7"
            >
              {years.map(y => <option key={y} value={y} className="text-slate-800">{y}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none" />
          </div>
        </div>

        {/* Filter tim (head role only) */}
        {isHeadRole && (
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-hide">
            {["All", ...TEAMS].map(t => (
              <button
                key={t}
                onClick={() => setTeamFilter(t)}
                className={`shrink-0 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  teamFilter === t ? "bg-white text-purple-600" : "bg-white/20 text-white"
                }`}
              >
                {t === "All" ? "Semua" : `Tim ${t}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 mx-4 mt-4 p-1 rounded-xl ${dark ? "bg-[#111d35]" : "bg-slate-200"}`}>
        {(["ringkasan","rincian"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === t ? dark ? "bg-blue-600 text-white" : "bg-white text-purple-600 shadow" : dark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {t === "ringkasan" ? "📋 Ringkasan" : "📄 Rincian"}
      </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 pb-24 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === "ringkasan" ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label:"Total Closing", value: summary.totalClosing.toString(), icon:"🎯", color:"from-blue-500 to-blue-600" },
                { label:"Total Revenue", value: formatRp(summary.totalRevenue), icon:"💰", color:"from-green-500 to-emerald-600" },
                { label:"Komisi Staff", value: formatRp(summary.totalKomisiStaff), icon:"🏆", color:"from-orange-500 to-amber-600" },
                { label:"Rata-rata/Deal", value: formatRp(summary.avgRevenue), icon:"📈", color:"from-purple-500 to-violet-600" },
      ].map(s => (
                <div key={s.label} className={`${card} border rounded-2xl p-3`}>
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-base mb-2`}>
                    {s.icon}
                  </div>
                  <p className={`text-sm font-bold ${tx}`}>{s.value}</p>
                  <p className={`text-[10px] ${mt} mt-0.5`}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Per Tim (head role only) */}
            {isHeadRole && teamRows.length > 0 && (
              <div className={`${card} border rounded-2xl p-4`}>
                <p className={`text-xs font-bold uppercase tracking-wide ${mt} mb-3`}>Performa Per Tim</p>
                <div className="space-y-2">
                  {teamRows.map(([name, d], i) => (
                    <div key={name} className={`flex items-center gap-3 py-2 border-b ${bd} last:border-0`}>
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        i===0?"bg-yellow-500 text-white":i===1?"bg-slate-400 text-white":i===2?"bg-orange-500 text-white":dark?"bg-[#1e2d4a] text-slate-400":"bg-slate-100 text-slate-500"
                      }`}>{i+1}</span>
                      <span className={`text-xs font-semibold flex-1 ${tx}`}>Tim {name}</span>
                      <span className={`text-xs ${mt}`}>{d.closing}x</span>
                      <span className={`text-xs font-bold text-green-400`}>{formatRp(d.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {closings.length === 0 && (
              <div className={`${card} border rounded-2xl p-8 text-center`}>
                <p className="text-3xl mb-2">📭</p>
                <p className={`text-sm font-semibold ${tx}`}>Tidak ada data</p>
                <p className={`text-xs ${mt} mt-1`}>{MONTHS[month]} {year}</p>
              </div>
            )}
          </>
        ) : (
          <>
            {closings.length === 0 ? (
              <div className={`${card} border rounded-2xl p-8 text-center`}>
                <p className="text-3xl mb-2">📭</p>
                <p className={`text-sm font-semibold ${tx}`}>Tidak ada data closing</p>
                <p className={`text-xs ${mt} mt-1`}>{MONTHS[month]} {year}</p>
              </div>
            ) : (
              closings.map((c, i) => (
                <div key={c.id ?? i} className={`${card} border rounded-2xl p-3`}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {c.student_name.charAt(0).toUpperCase()}
                  </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${tx} truncate`}>{c.student_name}</p>
                      <p className={`text-xs ${mt}`}>{c.staff_name} · Tim {c.team}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-green-400">{formatRp(c.nominal_bayar)}</p>
                      <p className={`text-[10px] ${mt}`}>{new Date(c.created_at).toLocaleDateString("id-ID")}</p>
                    </div>
                  </div>
                  <div className={`flex gap-2 mt-2 pt-2 border-t ${bd}`}>
                    <span className={`text-[10px] ${mt}`}>Komisi staff: <span className="text-orange-400 font-semibold">{formatRp(c.komisi_staff)}</span></span>
                    {c.komisi_manager > 0 && (
                      <span className={`text-[10px] ${mt}`}>· Mgr: <span className="text-blue-400 font-semibold">{formatRp(c.komisi_manager)}</span></span>
                    )}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
