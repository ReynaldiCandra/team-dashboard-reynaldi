"use client";
import { useState, useEffect } from "react";
import { useDailyReport, DailyReport } from "@/hooks/useDailyReport";
import { Plus, X, TrendingUp, Users, Flame, CheckCircle, RefreshCw, ChevronDown } from "lucide-react";

interface Props { dark: boolean; currentUser: { role: string; team: string; full_name?: string; name?: string; }; }

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");
const fmtDate = (s: string) => new Date(s).toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
const today = () => new Date().toISOString().split("T")[0];
const EMPTY = { report_date: today(), team: "", meta_ads_spend: 0, google_ads_spend: 0, meta_ads_leads: 0, google_ads_leads: 0, warms: 0, hot_leads: 0, closing: 0, notes: "", rencana_besok: "" };

export function DailyReportView({ dark, currentUser }: Props) {
  const { reports, loading, fetch, submit } = useDailyReport();
  const role = currentUser.role;
  const team = currentUser.team;
  const userName = currentUser.full_name || currentUser.name || "";
  const isHead = ["head_manager","owner","deputi"].includes(role);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY, team: team });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [filterTeam, setFilterTeam] = useState(isHead ? "" : team);
  const [expanded, setExpanded] = useState<string | null>(null);

  const bg = dark ? "bg-[#0a1020]" : "bg-gray-50";
  const card = dark ? "bg-[#111d35] border-[#1e2d4a]" : "bg-white border-slate-200";
  const txt = dark ? "text-white" : "text-slate-800";
  const sub = dark ? "text-slate-400" : "text-slate-500";
  const inp = dark ? "bg-[#0d1829] border-[#1e2d4a] text-white placeholder:text-slate-600 focus:border-blue-500" : "bg-white border-slate-200 text-slate-800 focus:border-blue-500";
  const teams = ["Tim A","Tim B","Tim C","Tim D","Tim E","Tim F","Tim G","Tim H"];

  useEffect(() => { fetch({ team: filterTeam || undefined }); }, [filterTeam]);

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  const num = (k: string, v: string) => set(k, parseInt(v) || 0);

  async function handleSubmit() {
    setSaving(true);
    const ok = await submit(form);
    setSaving(false);
    if (ok) {
      setToast("Laporan berhasil disimpan!");
      setShowModal(false);
      setForm({ ...EMPTY, team: team });
      fetch({ team: filterTeam || undefined });
      setTimeout(() => setToast(""), 3000);
    } else setToast("Gagal menyimpan laporan.");
  }

  const totalSpend = (r: DailyReport) => (r.meta_ads_spend || 0) + (r.google_ads_spend || 0);
  const totalLeads = (r: DailyReport) => (r.meta_ads_leads || 0) + (r.google_ads_leads || 0);

  return (
    <div className={`min-h-screen ${bg} p-4 md:p-6`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${txt}`}>Daily Report</h1>
          <p className={`text-sm ${sub} mt-0.5`}>{isHead ? "Semua Tim" : team} · {userName}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetch({ team: filterTeam || undefined })} className={`p-2 rounded-lg border ${card} ${sub} hover:text-blue-400 transition-colors`}><RefreshCw size={16} /></button>
          <button onClick={() => { setShowModal(true); setForm({ ...EMPTY, team: team }); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/20 transition-all">
            <Plus size={16} /> Input Hari Ini
          </button>
        </div>
      </div>

      {isHead && (
        <div className="flex gap-2 flex-wrap mb-5">
          <button onClick={() => setFilterTeam("")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${filterTeam === "" ? "bg-blue-600 border-blue-600 text-white" : `${card} ${sub} border`}`}>Semua</button>
          {teams.map(t => <button key={t} onClick={() => setFilterTeam(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${filterTeam === t ? "bg-blue-600 border-blue-600 text-white" : `${card} ${sub} border`}`}>{t}</button>)}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : reports.length === 0 ? (
        <div className={`rounded-2xl border ${card} p-12 text-center`}>
          <div className="text-4xl mb-3">📋</div>
          <p className={`font-semibold ${txt}`}>Belum ada laporan</p>
          <p className={`text-sm ${sub} mt-1`}>Klik "Input Hari Ini" untuk mulai</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {reports.map((r) => {
            const isOpen = expanded === r.id;
            const spend = totalSpend(r);
            const leads = totalLeads(r);
            const cpl = leads > 0 ? Math.round(spend / leads) : 0;
            return (
              <div key={r.id} className={`rounded-2xl border ${card} overflow-hidden`}>
                <button onClick={() => setExpanded(isOpen ? null : r.id)} className="w-full text-left p-4 md:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${dark ? "bg-blue-500/20 text-blue-400" : "bg-blue-50 text-blue-600"}`}>{r.team || team}</span>
                        <span className={`text-xs ${sub}`}>{fmtDate(r.report_date)}</span>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-1.5"><TrendingUp size={14} className="text-blue-400" /><span className={`text-sm font-bold ${txt}`}>{fmt(spend)}</span><span className={`text-xs ${sub}`}>spend</span></div>
                        <div className="flex items-center gap-1.5"><Users size={14} className="text-green-400" /><span className={`text-sm font-bold ${txt}`}>{leads}</span><span className={`text-xs ${sub}`}>leads</span></div>
                        <div className="flex items-center gap-1.5"><Flame size={14} className="text-orange-400" /><span className={`text-sm font-bold ${txt}`}>{r.hot_leads || 0}</span><span className={`text-xs ${sub}`}>hot</span></div>
                        <div className="flex items-center gap-1.5"><CheckCircle size={14} className="text-emerald-400" /><span className="text-sm font-bold text-emerald-400">{r.closing || 0}</span><span className={`text-xs ${sub}`}>closing</span></div>
                      </div>
                    </div>
                    <ChevronDown size={16} className={(sub + " mt-1 transition-transform shrink-0" + (isOpen ? " rotate-180" : ""))} />
                  </div>
                </button>
                {isOpen && (
                  <div className={`px-4 md:px-5 pb-5 border-t ${dark ? "border-[#1e2d4a]" : "border-slate-100"}`}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      {[
                        { label:"Meta Ads Spend", val: fmt(r.meta_ads_spend||0), color:"text-blue-400" },
                        { label:"Google Ads Spend", val: fmt(r.google_ads_spend||0), color:"text-yellow-400" },
                        { label:"Leads Meta", val: String(r.meta_ads_leads||0), color:"text-blue-300" },
                        { label:"Leads Google", val: String(r.google_ads_leads||0), color:"text-yellow-300" },
                        { label:"Warms 🟡", val: String(r.warms||0), color:"text-orange-300" },
                        { label:"Hot Leads 🔥", val: String(r.hot_leads||0), color:"text-orange-400" },
                        { label:"Closing ✅", val: String(r.closing||0), color:"text-emerald-400" },
                        { label:"CPL", val: cpl > 0 ? fmt(cpl) : "-", color:"text-purple-400" },
                      ].map(item => (
                        <div key={item.label} className={`rounded-xl p-3 ${dark ? "bg-[#0d1829]" : "bg-slate-50"}}`}>
                          <p className={`text-xs ${sub} mb-1`}>{item.label}</p>
                          <p className={`font-bold text-sm ${item.color}`}>{item.val}</p>
                        </div>
                      ))}
                    </div>
                    {r.notes && <div className={`mt-3 rounded-xl p-3 ${dark ? "bg-[#0d1829]" : "bg-slate-50"}`}><p className={`text-xs font-semibold ${sub} mb-1`}>CATATAN</p><p className={`text-sm ${txt}`}>{r.notes}</p></div>}
                    {r.rencana_besok && <div className={`mt-2 rounded-xl p-3 ${dark ? "bg-[#0d1829]" : "bg-slate-50"}`}><p className={`text-xs font-semibold ${sub} mb-1`}>RENCANA BESOK</p><p className={`text-sm ${txt}`}>{r.rencana_besok}</p></div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {toast && <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl z-50 ${toast.includes("berhasil") ? "bg-emerald-500" : "bg-red-500"} text-white`}>{toast}</div>}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
          <div className={`rounded-t-3xl md:rounded-2xl shadow-2xl w-full md:max-w-lg max-h-[90vh] overflow-y-auto ${dark ? "bg-[#111d35]" : "bg-white"}`}>
            <div className={`sticky top-0 flex items-center justify-between px-5 pt-5 pb-4 border-b ${dark ? "border-[#1e2d4a] bg-[#111d35]" : "border-slate-100 bg-white"} z-10`}>
              <h2 className={`text-lg font-bold ${txt}`}>Input Laporan Harian</h2>
              <button onClick={() => setShowModal(false)} className={`p-2 rounded-lg ${dark ? "hover:bg-white/10" : "hover:bg-slate-100"} ${sub}`}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={`block text-xs font-semibold ${sub} mb-1.5 uppercase tracking-wider`}>Tanggal</label><input type="date" value={form.report_date} onChange={e => set("report_date", e.target.value)} className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-colors ${inp}`} /></div>
                <div><label className={`block text-xs font-semibold ${sub} mb-1.5 uppercase tracking-wider`}>Tim</label>
                  {isHead ? <select value={form.team} onChange={e => set("team", e.target.value)} className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none ${inp}`}><option value="">Pilih Tim</option>{teams.map(t => <option key={t}>{t}</option>)}</select>
                  : <input value={team} readOnly className={`w-full border rounded-xl px-3 py-2.5 text-sm ${inp} opacity-60`} />}
                </div>
              </div>
              <div><p className={`text-xs font-bold ${sub} mb-2 uppercase tracking-wider`}>💰 Spend Budget</p>
                <div className="grid grid-cols-2 gap-3">
                  {[["meta_ads_spend","Meta Ads"],["google_ads_spend","Google Ads"]].map(([k,l]) => (
                    <div key={k}><label className={`block text-xs ${sub} mb-1.5`}>{l}</label>
                      <div className="relative"><span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs ${sub}`}>Rp</span>
                        <input type="number" value={(form as Record<string,unknown>)[k] as number} onChange={e => num(k, e.target.value)} className={`w-full border rounded-xl pl-8 pr-3 py-2.5 text-sm outline-none ${inp}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div><p className={`text-xs font-bold ${sub} mb-2 uppercase tracking-wider`}>👥 Total Leads Masuk</p>
                <div className="grid grid-cols-2 gap-3">
                  {[["meta_ads_leads","Meta Ads"],["google_ads_leads","Google Ads"]].map(([k,l]) => (
                    <div key={k}><label className={`block text-xs ${sub} mb-1.5`}>{l}</label><input type="number" value={(form as Record<string,unknown>)[k] as number} onChange={e => num(k, e.target.value)} className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none ${inp}`} /></div>
                  ))}
                </div>
              </div>
              <div><p className={`text-xs font-bold ${sub} mb-2 uppercase tracking-wider`}>🔥 Kualitas Leads</p>
                <div className="grid grid-cols-3 gap-3">
                  {[["warms","Warms 🟡"],["hot_leads","Hot 🔥"],["closing","Closing ✅"]].map(([k,l]) => (
                    <div key={k}><label className={`block text-xs ${sub} mb-1.5`}>{l}</label><input type="number" value={(form as Record<string,unknown>)[k] as number} onChange={e => num(k, e.target.value)} className={`w-full border rounded-xl-2.5 text-sm outline-none ${inp}`} /></div>
                  ))}
                </div>
              </div>
              <div><label className={`block text-xs font-semibold ${sub} mb-1.5 uppercase tracking-wider`}>Catatan / Kendala</label><textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Kendala atau insight hari ini..." className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none resize-none ${inp}`} /></div>
              <div><label className={`block text-xs font-semibold ${sub} mb-1.5 uppercase tracking-wider`}>Rencana Besok</label><textarea rows={2} value={form.rencana_besok} onChange={e => set("rencana_besok", e.target.value)} placeholder="Rencana aktivitas besok..." className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none resize-none ${inp}`} /></div>
              <button onClick={handleSubmit} disabled={saving} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20">
                {saving ? "Menyimpan..." : "Simpan Laporan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}