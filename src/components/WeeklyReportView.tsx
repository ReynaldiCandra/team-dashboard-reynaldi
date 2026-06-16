"use client";
import { useState, useEffect } from "react";
import { TrendingUp, DollarSign, Users, Flame, CheckCircle, AlertCircle, XCircle, RefreshCw, Calendar, Brain, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  dark?: boolean;
  currentUser: { id: string; name: string; role: string; team: string };
}
interface WeeklyReport {
  id: string; team: string; week_start: string; week_end: string;
  total_meta_spend: number; total_google_spend: number; total_spend: number;
  total_meta_leads: number; total_google_leads: number; total_leads: number;
  total_warms: number; total_hot_leads: number; total_closing: number;
  days_reported: number; days_expected: number;
  cpl: number; closing_rate: number; hot_rate: number;
  status: "green" | "yellow" | "red" | "gray"; status_reason: string;
}

function fmt(n: number) { return new Intl.NumberFormat("id-ID").format(Math.round(n || 0)); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short" }); }

const S = {
  green:  { icon: CheckCircle, bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-400", label: "Sesuai Target" },
  yellow: { icon: AlertCircle, bg: "bg-amber-500/15",   text: "text-amber-400",   border: "border-amber-500/30",   dot: "bg-amber-400",   label: "Perlu Perhatian" },
  red:    { icon: XCircle,     bg: "bg-red-500/15",     text: "text-red-400",     border: "border-red-500/30",     dot: "bg-red-400",     label: "Di Bawah Target" },
  gray:   { icon: AlertCircle, bg: "bg-slate-500/15",   text: "text-slate-400",   border: "border-slate-500/30",   dot: "bg-slate-400",   label: "Belum Ada Data" },
};

export function WeeklyReportView({ dark = false, currentUser }: Props) {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WeeklyReport | null>(null);
  const [toast, setToast] = useState("");
  const [aiInsight, setAiInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const isHead = ["head_manager", "owner", "deputi"].includes(currentUser.role);

  const bg   = dark ? "bg-[#0a1020]" : "bg-gray-50";
  const card = dark ? "bg-[#111d35] border-[#1e2d4a]" : "bg-white border-slate-200";
  const tx   = dark ? "text-slate-100" : "text-slate-800";
  const mt   = dark ? "text-slate-400" : "text-slate-500";

  useEffect(() => {
    load();
    // Notification auto-check untuk manager & head
    if (["head_manager","owner","deputi","manager"].includes(currentUser.role)) {
      fetch("/api/notifications/check", { method: "POST" }).catch(() => {});
    }
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/weekly-report?limit=32`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const rows: WeeklyReport[] = json.data ?? [];
      setReports(rows);
      if (!isHead && rows.length > 0) setSelected(rows[0]);
    } catch (e: any) {
      setToast("❌ " + e.message);
      setTimeout(() => setToast(""), 3000);
    } finally { setLoading(false); }
  }

  async function fetchAiInsight() {
    setAiLoading(true);
    setShowAi(true);
    try {
      const res = await fetch("/api/ai-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team: isHead ? undefined : currentUser.team, scope: isHead ? "all" : "team" }),
      });
      const json = await res.json();
      setAiInsight(json.insight ?? json.error ?? "Tidak ada respons.");
    } catch (e: any) {
      setAiInsight("❌ " + e.message);
    } finally { setAiLoading(false); }
  }

  const AiPanel = () => (
    <div className={`rounded-xl border p-4 ${dark ? "bg-violet-950/30 border-violet-500/30" : "bg-violet-50 border-violet-200"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-violet-400" />
          <span className={`text-sm font-semibold ${dark ? "text-violet-300" : "text-violet-700"}`}>AI Insight</span>
        </div>
        <button onClick={() => setShowAi(false)} className={`text-xs ${mt}`}>Tutup</button>
      </div>
      {aiLoading ? (
        <div className="flex items-center gap-2 py-4">
          <RefreshCw size={14} className="animate-spin text-violet-400" />
          <span className={`text-sm ${mt}`}>Menganalisis data...</span>
        </div>
      ) : (
        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${dark ? "text-slate-300" : "text-slate-700"}`}>{aiInsight}</p>
      )}
    </div>
  );

  // ── HEAD MANAGER VIEW ─────────────────────────────────────────────────────
  if (isHead) {
    const byTeam: Record<string, WeeklyReport> = {};
    reports.forEach(r => { if (!byTeam[r.team]) byTeam[r.team] = r; });
    const teams = Object.values(byTeam).sort((a, b) => a.team.localeCompare(b.team));
    const counts = { green: 0, yellow: 0, red: 0, gray: 0 };
    teams.forEach(t => counts[t.status ?? "gray"]++);

    return (
      <div className={`min-h-screen ${bg} ${tx} p-6`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Weekly Report — Semua Tim</h1>
            <p className={`text-sm mt-1 ${mt}`}>{currentUser.name} · Head Manager Overview</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAiInsight} disabled={aiLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
              <Brain size={15} /> AI Insight
            </button>
            <button onClick={load} className={`p-2 rounded-lg border ${card} transition-colors`}>
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 mb-5">
          {(["green","yellow","red","gray"] as const).map(s => (
            <div key={s} className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${S[s].bg} ${S[s].border}`}>
              <span className={`w-2 h-2 rounded-full ${S[s].dot}`} />
              <span className={`text-sm font-semibold ${S[s].text}`}>{counts[s]} Tim</span>
              <span className={`text-xs ${mt}`}>{S[s].label}</span>
            </div>
          ))}
        </div>

        {showAi && <div className="mb-5"><AiPanel /></div>}

        {loading ? (
          <div className="flex justify-center h-40 items-center"><RefreshCw size={24} className="animate-spin text-blue-400" /></div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {teams.map(r => {
              const cfg = S[r.status ?? "gray"]; const Icon = cfg.icon;
              return (
                <div key={r.team} className={`rounded-xl border p-4 ${card}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm">{r.team}</span>
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold ${cfg.bg} ${cfg.text}`}>
                      <Icon size={11} /> {(r.status ?? "gray").toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className={mt}>Leads</span><span className="font-semibold">{r.total_leads}</span></div>
                    <div className="flex justify-between"><span className={mt}>CPL</span><span className="font-semibold">Rp{fmt(r.cpl)}</span></div>
                    <div className="flex justify-between"><span className={mt}>Hot Rate</span><span className="font-semibold">{r.hot_rate}%</span></div>
                    <div className="flex justify-between"><span className={mt}>Closing</span><span className="font-semibold">{r.total_closing} ({r.closing_rate}%)</span></div>
                    <div className="flex justify-between"><span className={mt}>Spend</span><span className="font-semibold">Rp{fmt(r.total_spend)}</span></div>
                  </div>
                  <p className={`text-xs mt-3 pt-3 border-t ${dark ? "border-white/10" : "border-slate-100"} ${mt} line-clamp-2`}>
                    {r.status_reason || "—"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
        {toast && <div className="fixed top-4 right-4 z-50 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">{toast}</div>}
      </div>
    );
  }

  // ── MANAGER VIEW ──────────────────────────────────────────────────────────
  const r = selected;
  const statusCfg = r ? S[r.status ?? "gray"] : S.gray;
  const StatusIcon = statusCfg.icon;

  return (
    <div className={`min-h-screen ${bg} ${tx} p-6`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Weekly Report</h1>
          <p className={`text-sm mt-1 ${mt}`}>Tim {currentUser.team} · {currentUser.name}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAiInsight} disabled={aiLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
            <Brain size={15} /> AI Insight
          </button>
          <button onClick={load} className={`p-2 rounded-lg border ${card} transition-colors`}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {toast && <div className="fixed top-4 right-4 z-50 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">{toast}</div>}

      {showAi && <div className="mb-5"><AiPanel /></div>}

      {loading ? (
        <div className="flex justify-center h-64 items-center"><RefreshCw size={24} className="animate-spin text-blue-400" /></div>
      ) : reports.length === 0 ? (
        <div className={`rounded-xl border ${card} p-12 text-center`}>
          <Calendar size={40} className={`mx-auto mb-3 ${mt}`} />
          <p className={mt}>Belum ada data. Muncul otomatis setelah daily report diisi.</p>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-3 space-y-2">
            <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${mt}`}>Riwayat Minggu</p>
            {reports.map(w => {
              const cfg = S[w.status ?? "gray"]; const isActive = selected?.id === w.id;
              return (
                <button key={w.id} onClick={() => setSelected(w)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${isActive ? `${cfg.bg} ${cfg.border} border` : `${card} hover:opacity-80`}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${isActive ? cfg.text : tx}`}>{fmtDate(w.week_start)} – {fmtDate(w.week_end)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${cfg.bg} ${cfg.text}`}>{(w.status ?? "gray").toUpperCase()}</span>
                  </div>
                  <p className={`text-xs mt-1 ${mt}`}>{w.days_reported}/7 hari · {w.total_leads} leads</p>
                </button>
              );
            })}
          </div>

          {r && (
            <div className="col-span-9 space-y-5">
              <div className={`rounded-xl border p-4 flex items-start gap-3 ${statusCfg.bg} ${statusCfg.border}`}>
                <StatusIcon size={20} className={`mt-0.5 shrink-0 ${statusCfg.text}`} />
                <div><p className={`font-semibold text-sm ${statusCfg.text}`}>{statusCfg.label}</p><p className={`text-xs mt-0.5 ${mt}`}>{r.status_reason || "—"}</p></div>
                <span className={`ml-auto text-xs ${mt}`}>{fmtDate(r.week_start)} – {fmtDate(r.week_end)} · {r.days_reported}/{r.days_expected} hari</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label:"Total Spend", value:"Rp "+fmt(r.total_spend), sub:"Meta Rp"+fmt(r.total_meta_spend)+" + Google Rp"+fmt(r.total_google_spend), icon:DollarSign, color:"text-blue-400" },
                  { label:"Total Leads", value:fmt(r.total_leads), sub:"Meta "+r.total_meta_leads+" + Google "+r.total_google_leads, icon:Users, color:"text-violet-400" },
                  { label:"CPL", value:"Rp "+fmt(r.cpl), sub:"Cost per Lead", icon:TrendingUp, color:"text-cyan-400" },
                  { label:"Warms", value:fmt(r.total_warms), sub:"Leads hangat", icon:Users, color:"text-amber-400" },
                  { label:"Hot Leads", value:fmt(r.total_hot_leads), sub:"Hot rate "+r.hot_rate+"%", icon:Flame, color:"text-orange-400" },
                  { label:"Closing", value:fmt(r.total_closing), sub:"Closing rate "+r.closing_rate+"%", icon:CheckCircle, color:"text-emerald-400" },
                ].map(kpi => (
                  <div key={kpi.label} className={`rounded-xl border p-4 ${card}`}>
                    <div className="flex items-center gap-2 mb-2"><kpi.icon size={16} className={kpi.color} /><span className={`text-xs font-medium ${mt}`}>{kpi.label}</span></div>
                    <p className={`text-xl font-bold ${tx}`}>{kpi.value}</p>
                    <p className={`text-xs mt-1 ${mt}`}>{kpi.sub}</p>
                  </div>
                ))}
              </div>
              <div className={`rounded-xl border p-4 ${card}`}>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${mt}`}>Persentase KPI</p>
                <div className="space-y-4">
                  {[{label:"Hot Rate",value:r.hot_rate,target:20,color:"bg-orange-400"},{label:"Closing Rate",value:r.closing_rate,target:5,color:"bg-emerald-400"}].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className={mt}>{item.label}</span>
                        <span className={`font-semibold ${tx}`}>{item.value}% <span className={mt}>/ target {item.target}%</span></span>
                      </div>
                      <div className={`h-2 rounded-full ${dark ? "bg-white/10" : "bg-slate-100"}`}>
                        <div className={`h-2 rounded-full ${item.color} transition-all duration-500`} style={{width:`${Math.min((item.value/item.target)*100,100)}%`}} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
