"use client";
import { useState, useEffect } from "react";
import { useDailyReport, DailyReport } from "@/hooks/useDailyReport";
import { DollarSign, Users, Flame, TrendingUp, RefreshCw, ChevronDown } from "lucide-react";

interface Props {
  dark?: boolean;
  currentUser: { id: string; name: string; role: string; team: string };
}

const TEAMS = ["Tim A","Tim B","Tim C","Tim D","Tim E","Tim F","Tim G","Tim H"];

function fmt(n: number) { return new Intl.NumberFormat("id-ID").format(n); }
function today() { return new Date().toISOString().slice(0, 10); }
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function DailyReportView({ dark = false, currentUser }: Props) {
  const { reports, loading, fetch, submit } = useDailyReport();
  const [form, setForm] = useState({
    report_date: today(),
    team: currentUser.role === "head_manager" ? TEAMS[0] : currentUser.team,
    meta_ads_spend: "", google_ads_spend: "",
    meta_ads_leads: "", google_ads_leads: "",
    warms: "", hot_leads: "", closing: "",
    notes: "", rencana_besok: "",
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [filterTeam, setFilterTeam] = useState(
    currentUser.role === "head_manager" ? "" : currentUser.team
  );

  const bg   = dark ? "bg-[#0a1020]"   : "bg-gray-50";
  const card = dark ? "bg-[#111d35] border-[#1e2d4a]" : "bg-white border-slate-100";
  const tx   = dark ? "text-slate-100" : "text-slate-800";
  const mt   = dark ? "text-slate-400" : "text-slate-500";
  const inp  = dark ? "bg-[#1a2a45] border-[#1e2d4a] text-white placeholder-slate-500"
                    : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400";

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  useEffect(() => { load(); }, [filterTeam]);

  function load() {
    fetch({ team: filterTeam || undefined });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.report_date) return showToast("Pilih tanggal laporan");
    setSaving(true);
    try {
      await submit({
        team: form.team,
        report_date: form.report_date,
        meta_ads_spend:   parseFloat(form.meta_ads_spend  || "0"),
        google_ads_spend: parseFloat(form.google_ads_spend || "0"),
        meta_ads_leads:   parseInt(form.meta_ads_leads  || "0"),
        google_ads_leads: parseInt(form.google_ads_leads || "0"),
        warms:      parseInt(form.warms     || "0"),
        hot_leads:  parseInt(form.hot_leads || "0"),
        closing:    parseInt(form.closing   || "0"),
        notes: form.notes,
        rencana_besok: form.rencana_besok,
      });
      showToast("✅ Daily report tersimpan!");
      setForm(f => ({ ...f, meta_ads_spend:"", google_ads_spend:"", meta_ads_leads:"", google_ads_leads:"", warms:"", hot_leads:"", closing:"", notes:"", rencana_besok:"" }));
      load();
    } catch (e: any) {
      showToast("❌ " + e.message);
    } finally { setSaving(false); }
  }

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  const numInp = (label: string, key: string, prefix?: string, color?: string) => (
    <div>
      <label className={`text-xs font-semibold block mb-1 ${color ?? mt}`}>{label}</label>
      <div className={`flex items-center border rounded-xl overflow-hidden ${dark ? "border-[#1e2d4a]" : "border-slate-200"}`}>
        {prefix && <span className={`px-2 py-2 text-xs ${dark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500"}`}>{prefix}</span>}
        <input type="number" min="0" value={(form as any)[key]} onChange={e => set(key, e.target.value)}
          className={`flex-1 px-3 py-2.5 text-sm outline-none ${inp}`} placeholder="0" />
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${bg}`}>
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-800 text-white xt-sm px-4 py-2.5 rounded-xl shadow-lg">{toast}</div>
      )}

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${tx}`}>Daily Report</h1>
            <p className={`text-sm ${mt}`}>Tim {currentUser.team} · {currentUser.name}</p>
          </div>
          <div className="flex gap-2 items-center">
            {currentUser.role === "head_manager" && (
              <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)}
                className={`px-3 py-2 rounded-xl border text-sm outline-none ${inp}`}>
                <option value="">Semua Tim</option>
                {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
            <button onClick={load} className={`p-2 rounded-xl border ${dark ? "border-[#1e2d4a]" : "border-slate-200"}`}>
              <RefreshCw size={16} className={loading ? `animate-spin text-indigo-500` : mt} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className={`${card} border rounded-2xl p-5`}>
              <h2 className={`font-bold ${tx} mb-4`}>Input Laporan Harian</h2>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className={`text-xs font-semibold ${mt} block mb-1`}>TANGGAL</label>
                  <input type="date" value={form.report_date} max={today()}
                    onChange={e => set("report_date", e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${inp}`} />
                </div>
                {currentUser.role === "head_manager" ? (
                  <div>
                    <label className={`text-xs font-semibold ${mt} block mb-1`}>TIM</label>
                    <select value={form.team} onChange={e => set("team", e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${inp}`}>
                      {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className={`text-xs font-semibold ${mt} block mb-1`}>TIM</label>
                    <div className={`px-3 py-2.5 rounded-xl border text-sm opacity-60 ${inp}`}>{form.team}</div>
                  </div>
                )}
              </div>

              <div className={`rounded-xl border p-3 mb-3 space-y-3 ${dark ? "border-[#1e2d4a]" : "border-slate-100"}`}>
                <p className={`text-[11px] font-bold ${mt} flex items-center gap-1`}><DollarSign size={11}/>SPEND BUDGET</p>
                <div className="grid grid-cols-2 gap-3">
                  {numInp("Meta Ads", "meta_ads_spend", "Rp")}
                  {numInp("Google Ads", "google_ads_spend", "Rp")}
                </div>
              </div>

              <div className={`rounded-xl border p-3 mb-3 space-y-3 ${dark ? "border-[#1e2d4a]" : "border-slate-100"}`}>
                <p className={`text-[11px] font-bold ${mt} flex items-center gap-1`}><Users size={11}/>TOTAL LEADS MASUK</p>
                <div className="grid grid-cols-2 gap-3">
                  {numInp("Meta Ads", "meta_ads_leads")}
                  {numInp("Google Ads", "google_ads_leads")}
                </div>
              </div>

              <div className={`rounded-xl border p-3 mb-3 space-y-3 ${dark ? "border-[#1e2d4a]" : "border-slate-100"}`}>
                <p className={`text-[11px] font-bold ${mt} flex items-center gap-1`}><Flame size={11}/>KUALITAS LEADS</p>
                <div className="grid grid-cols-3 gap-2">
                  {numInp("Warms", "warms", undefined, "text-orange-500")}
                  {numInp("Hot Leads 🔥", "hot_leads", undefined, "text-red-500")}
                {numInp("Closing ✅", "closing", undefined, "text-green-600")}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className={`text-xs font-semibold ${mt} block mb-1`}>CATATAN / KENDALA</label>
                  <textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)}
                    placeholder="Kendala atau insight hari ini..."
                    className={`w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none ${inp}`} />
                </div>
                <div>
                  <label className={`text-xs font-semibold ${mt} block mb-1`}>RENCANA BESOK</label>
                  <textarea rows={2} value={form.rencana_besok} onChange={e => set("rencana_besok", e.target.value)}
                    placeholder="Rencana aktivitas besok..."
                    className={`w-full px-3 py-2 roued-xl border text-sm outline-none resize-none ${inp}`} />
                </div>
              </div>

              {/* Summary */}
              <div className={`rounded-xl p-3 mt-4 ${dark ? "bg-indigo-900/20 border border-indigo-500/20" : "bg-indigo-50"}`}>
                <p className={`text-[10px] font-bold mb-2 ${dark ? "text-indigo-300" : "text-indigo-600"}`}>RINGKASAN</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: "Total Leads", val: (parseInt(form.meta_ads_leads||"0") + parseInt(form.google_ads_leads||"0")) || 0 },
                    { label: "Total Spend", val: `Rp ${fmt((parseFloat(form.meta_ads_spend||"0") + parseFloat(form.google_ads_spend||"0")))}` },
                    { label: "Closing", val: parseInt(form.closing||"0") || 0 },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <p className={`text-lg font-bold ${tx}`}>{val}</p>
                      <p className={`text-[10px] ${mt}`}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={saving}
                className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl disabled:opacity-50 transition-colors">
                {saving ? "Menyimpan..." : "Simpan Daily Report"}
              </button>
            </div>
          </form>

          {/* History */}
          <div className="space-y-3">
            <h2 className={`font-bold ${tx}`}>Riwayat Laporan</h2>
            {loading && <p className={`text-sm ${mt}`}>Memuat...</p>}
            {!loading && reports.length === 0 && (
              <div className={`text-center py-12 ${mt}`}>
                <TrendingUp size={36} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Belum ada laporan</p>
              </div>
            )}
            {reports.map(r => <DesktopReportCard key={r.id} r={r} dark={dark} card={card} tx={tx} mt={mt} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopReportCard({ r, dark, card, tx, mt }: { r: DailyReport; dark: boolean; card: string; tx: string; mt: string }) {
  const [open, setOpen] = useState(false);
  const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className={`${card} border rounded-2xl overflow-hidden`}>
      <button onClick={() => setOpen(o => !o)} className="w-full p-4 text-left">
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-bold text-sm ${tx}`}>Daily Report — {r.team}</p>
            <p className={`text-xs ${mt} mt-0.5`}>{fmtDate(r.report_date)}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="texright">
              <p className="text-xs font-bold text-indigo-600">Rp {fmt(r.meta_ads_spend + r.google_ads_spend)}</p>
              <p className={`text-[10px] ${mt}`}>{r.meta_ads_leads + r.google_ads_leads} leads</p>
            </div>
            <ChevronDown size={14} className={`${mt} transition-transform ${open ? "rotate-180" : ""}`} />
          </div>
        </div>
      </button>
      {open && (
        <div className={`px-4 pb-4 border-t ${dark ? "border-[#1e2d4a]" : "border-slate-50"} space-y-3`}>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className={`rounded-xl p-3 ${dark ? "bg-blue-900/20" : "bg-blue-50"}`}>
              <p className={`text-[10px] ${dark?"text-blue-300":"text-blue-500"} mb-1`}>Meta Ads Spend</p>
              <p className={`font-bold text-sm ${dark?"text-blue-200":"text-blue-700"}`}>Rp {fmt(r.meta_ads_spend)}</p>
              <p className={`text-[10px] ${mt} mt-1`}>{r.meta_ads_leads} leads</p>
            </div>
            <div className={`rounded-xl p-3 ${dark ? "bg-green-900/20" : "bg-green-50"}`}>
              <p className={`text-[10px] ${dark?"text-green-300":"text-green-500"} mb-1`}>Google Ads Spend</p>
              <p className={`font-bold text-sm ${dark?"text-green-200":"text-green-700"}`}>Rp {fmt(r.google_ads_spend)}</p>
              <p className={`text-[10px] ${mt} mt-1`}>{r.google_ads_leads} leads</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className={`rounded-xl p-2.5 text-center ${dark?"bg-orange-900/20":"bg-orange-50"}`}>
              <p className={`text-[10px] ${dark?"text-orange-300":"text-orange-400"} mb-0.5`}>Warms</p>
              <p className={`font-bold text-lg ${dark?"text-orange-200":"text-orange-600"}`}>{r.warms}</p>
            </div>
            <div className={`rounded-xl p-2.5 text-center ${dark?"bg-red-900/20":"bg-red-50"}`}>
              <p className={`text-[10px] ${dark?"text-red-300":"text-red-400"} mb-0.5`}>Hot</p>
              <p className={`font-bold text-lg ${dark?"text-red-200":"text-red-600"}`}>{r.hot_leads}</p>
            </div>
            <div className={`rounded-xl p-2.5 text-center ${dark?"bg-green-900/20":"bg-green-50"}`}>
              <p className={`text-[10px] ${dark?"text-green-300":"text-green-400"} mb-0.5`}>Closing</p>
              <p className={`font-bold text-lg ${dark?"text-green-200":"text-green-700"}`}>{r.closing}</p>
            </div>
          </div>
          {r.notes && (
            <div className={`rounded-xl p-3 ${dark?"bg-white/5":"bg-slate-50"}`}>
              <p className={`text-[10px] font-bold ${mt} mb-1`}>CATATAN</p>
              <p className={`text-xs ${tx}`}>{r.notes}</p>
            </div>
          )}
          {r.rencana_besok && (
            <div className={`rounded-xl p-3 ${dark?"bg-indigo-900/20":"bg-indigo-50"}`}>
              <p className={`text-[10px] font-bold ${dark?"text-indigo-300":"text-indigo-600"} mb-1`}>RENCANA BESOK</p>
              <p className={`text-xs ${tx}`}>{r.rencana_besok}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
