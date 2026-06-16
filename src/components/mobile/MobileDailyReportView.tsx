"use client";
import { useState, useEffect } from "react";
import {
  ArrowLeft, Plus, ChevronDown, TrendingUp, DollarSign,
  Users, Flame, Star, CheckCircle, Calendar, RefreshCw
} from "lucide-react";
import { useDailyReport, DailyReport } from "@/hooks/useDailyReport";

interface Props {
  dark?: boolean;
  onBack: () => void;
  currentUser: { id: string; name: string; role: string; team: string };
}

const TEAMS = ["Tim A","Tim B","Tim C","Tim D","Tim E","Tim F","Tim G","Tim H"];

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}
function getWeekRange(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now); mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const fmt2 = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt2(mon), to: fmt2(sun) };
}

export function MobileDailyReportView({ dark, onBack, currentUser }: Props) {
  const { reports, loading, fetch, submit } = useDailyReport();
  const [weekOffset, setWeekOffset] = useState(0);
  const [filterTeam, setFilterTeam] = useState<string>(
    currentUser.role === "head_manager" ? "" : currentUser.team
  );
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const bg   = dark ? "bg-[#0a1020]"   : "bg-gray-50";
  const card = dark ? "bg-[#111d35] border-[#1e2d4a]" : "bg-white border-slate-100";
  const tx   = dark ? "text-slate-100" : "text-slate-800";
  const mt   = dark ? "text-slate-400" : "text-slate-500";
  const inp  = dark ? "bg-[#1a2a45] border-[#1e2d4a] text-white placeholder-slate-500"
                    : "bg-white border-slate-200 text-slate-800 placeholder-slate-400";

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    report_date: today,
    team: currentUser.role === "head_manager" ? TEAMS[0] : currentUser.team,
    meta_ads_spend: "", google_ads_spend: "",
    meta_ads_leads: "", google_ads_leads: "",
    warms: "", hot_leads: "", closing: "", notes: "",
  });

  const loadData = () => {
    const { from, to } = getWeekRange(weekOffset);
    fetch({ from, to, team: filterTeam || undefined });
  };

  useEffect(() => { loadData(); }, [weekOffset, filterTeam]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleSubmit = async () => {
    if (!form.report_date) return showToast("Pilih tanggal laporan");
    setSaving(true);
    try {
      await submit({
        team: form.team,
        report_date: form.report_date,
        meta_ads_spend:  parseFloat(form.meta_ads_spend  || "0"),
        google_ads_spend: parseFloat(form.google_ads_spend || "0"),
        meta_ads_leads:  parseInt(form.meta_ads_leads  || "0"),
        google_ads_leads: parseInt(form.google_ads_leads || "0"),
        warms:     parseInt(form.warms     || "0"),
        hot_leads: parseInt(form.hot_leads || "0"),
        closing:   parseInt(form.closing   || "0"),
        notes: form.notes,
      });
      showToast("Laporan tersimpan");
      setShowForm(false);
      loadData();
    } catch (e: any) {
      showToast(e.message);
    } finally { setSaving(false); }
  };

  const { from, to } = getWeekRange(weekOffset);
  const weekLabel = weekOffset === 0 ? "Minggu Ini"
    : weekOffset === -1 ? "Minggu Lalu"
    : `${fmtDate(from)} – ${fmtDate(to)}`;

  return (
    <div className={`flex-1 overflow-y-auto pb-24 ${bg}`}>
      {toast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-xs px-4 py-2 rounded-full shadow-lg whitespace-nowrap">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-pure-800 px-4 pt-12 pb-10">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg">Daily Report</h2>
            <p className="text-indigo-200 text-xs">Laporan harian iklan per tim</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/20 rounded-xl text-white text-xs font-semibold">
            <Plus size={14} /> Input
          </button>
        </div>
      </div>

      <div className="px-4 -mt-5 space-y-4">
        {/* Filter bar */}
        <div className={`${card} border rounded-2xl p-3 flex items-center gap-2`}>
          <div className="flex items-center gap-1 flex-1">
            <button onClick={() => setWeekOffset(w => w - 1)}
              className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold">‹</button>
            <span className={`flex-1 text-center text-xs font-semibold ${tx}`}>{weekLabel}</span>
            <button onClick={() => setWeekOffset(w => Math.min(0, w + 1))}
              disabled={weekOffset >= 0}
              className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold disabled:opacity-30">›</button>
          </div>
          {currentUser.role === "head_manager" && (
            <select value={filterTeam}
              onChange={e => setFilterTeam(e.target.value)}
              className={`text-xs border rounded-xl px-2 py-1.5 ${inp}`}>
              <option value="">Semua Tim</option>
              {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          <button onClick={loadData} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
            <RefreshCw size={12} className={loading ? "animate-spin text-indigo-500" : "text-slate-400"} />
          </button>
        </div>

        {/* Reports list */}
        {loading && (
          <div className={`text-center py-8 ${mt} text-sm`}>Memuat data...</div>
        )}
        {!loading && reports.length === 0 && (
          <div className={`text-center py-12 ${mt}`}>
            <TrendingUp size={36} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">Belum ada laporan</p>
            <p className="text-xs mt-1 opacity-70">Tap tombol Input untuk mulai</p>
          </div>
        )}
        {reports.map(r => <ReportCard key={r.id} r={r} card={card} tx={tx} mt={mt} dark={dark} />)}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className={`relative w-full ${dark ? "bg-[#0f1c35]" : "bg-white"} rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto`}>
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-4" />
            <h3 className={`font-bold text-base mb-4 ${tx}`}>Input Daily Report</h3>

            <div className="space-y-3">
              {/* Tanggal & Tim */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-[10px] font-semibold ${mt} mb-1 block`}>TANGGAL</label>
                  <input type="date" value={form.report_date}
                    onChange={e => setForm(f => ({ ...f, report_date: e.target.value }))}
                    className={`w-full border rounded-xl px-3 py-2 text-sm ${inp}`} />
                </div>
                {currentUser.role === "head_manager" ? (
                  <div>
                    <label className={`text-[10px] font-semibold ${mt} mb-1 block`}>TIM</label>
                    <select value={form.team}
                      onChange={e => setForm(f => ({ ...f, team: e.target.value }))}
                      className={`w-full border rounded-xl px-3 py-2 text-sm ${inp}`}>
                      {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className={`text-[10px] font-semibold ${mt} mb-1 block`}>TIM</label>
                    <div className={`border rounded-xl px-3 py-2 text-sm ${inp} opacity-60`}>{form.team}</div>
                  </div>
                )}
              </div>

              {/* Spend Budget */}
              <div className={`rounded-2xl border p-3 ${dark ? "border-[#1e2d4a]" : "border-slate-100"}`}>
                <p className={`text-[10px] font-bold mb-2 ${mt} flex items-center gap-1`}>
                  <DollarSign size={11} /> SPEND BUDGET
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`text-[10px] ${mt} mb-1 block`}>Meta Ads (Rp)</label>
                    <input type="number" placeholder="0" value={form.meta_ads_spend}
                      onChange={e => setForm(f => ({ ...f, meta_ads_spend: e.target.value }))}
                      className={`w-full border rounded-xl px-3 py-2 text-sm ${inp}`} />
                  </div>
                  <div>
                    <label className={`text-[10px] ${mt} mb-1 block`}>Google Ads (Rp)</label>
                    <input type="number" placeholder="0" value={form.google_ads_spend}
                      onChange={e => setForm(f => ({ ...f, google_ads_spend: e.target.value }))}
                      className={`w-full border rounded-xl px-3 py-2 text-sm ${inp}`} />
                  </div>
                </div>
              </div>

              {/* Total Leads */}
              <div className={`rounded-2xl border p-3 ${dark ? "border-[#1e2d4a]" : "border-slate-100"}`}>
                <p className={`text-[10px] font-bold mb-2 ${mt} flex items-center gap-1`}>
                  <Users size={11} /> TOTAL LEADS MASUK
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`text-[10px] ${mt} mb-1 block`}>Meta Ads</label>
                    <input type="number" placeholder="0" value={form.meta_ads_leads}
                      onChange={e => setForm(f => ({ ...f, meta_ads_leads: e.target.value }))}
                      className={`w-full border rounded-xl px-3 py-2 text-sm ${inp}`} />
                  </div>
                  <div>
                    <label className={`text-[10px] ${mt} mb-1 block`}>Google Ads</label>
                    <input type="number" placeholder="0" value={form.google_ads_leads}
                      onChange={e => setForm(f => ({ ...f, google_ads_leads: e.target.value }))}
                      className={`w-full border rounded-xl px-3 py-2 text-sm ${inp}`} />
                  </div>
                </div>
              </div>

              {/* Kualitas Leads */}
              <div className={`rounded-2xl border p-3 ${dark ? "border-[#1e2d4a]" : "border-slate-100"}`}>
                <p className={`text-[10px] font-bold mb-2 ${mt} flex items-center gap-1`}>
                  <Flame size={11} /> KUALITAS LEADS
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "warms",     label: "Warms",     color: "text-orange-500" },
                    { key: "hot_leads", label: "Hot Leads", color: "text-red-500"    },
                    { key: "closing",   label: "Closing",   color: "text-green-600"  },
                  ].map(({ key, label, color }) => (
                    <div key={key}>
                      <label className={`text-[10px] ${color} font-semibold mb-1 block`}>{label}</label>
                      <input type="number" placeholder="0"
                        value={(form as any)[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        className={`w-full border rounded-xl px-3 py-2 text-sm ${inp}`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className={`text-[10px] font-semibold ${mt} mb-1 block`}>CATATAN (opsional)</label>
                <textarea rows={2} placeholder="Kendala, insight, dll..." value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className={`w-full border rounded-xl px-3 py-2 text-sm resize-none ${inp}`} />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-500">
                Batal
              </button>
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-50">
                {saving ? "Menyimpan..." : "Simpan Laporan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportCard({ r, card, tx, mt, dark }: { r: DailyReport; card: string; tx: string; mt: string; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const totalSpend = r.meta_ads_spend + r.google_ads_spend;
  const totalLeads = r.meta_ads_leads + r.google_ads_leads;
  return (
    <div className={`${card} border rounded-2xl overflow-hidden`}>
      <button onClick={() => setOpen(o => !o)} className="w-full p-4 text-left">
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-bold text-sm ${tx}`}>Daily Report — {r.team}</p>
            <p className={`text-xs ${mt} mt-0.5`}>{fmtDate(r.report_date)}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs font-bold text-indigo-600">Rp {fmt(totalSpend)}</p>
              <p className={`text-[10px] ${mt}`}>{totalLeads} leads total</p>
            </div>
            <ChevronDown size={14} className={`${mt} transition-transform ${open ? "rotate-180" : ""}`} />
          </div>
        </div>
      </button>
      {open && (
        <div className={`px-4 pb-4 border-t ${dark ? "border-[#1e2d4a]" : "border-slate-50"}`}>
          <div className="mt-3 space-y-3">
            {/* Spend */}
            <div>
              <p className={`text-[10px] font-bold ${mt} mb-1.5 flex items-center p-1`}>
                <DollarSign size={10} /> SPEND BUDGET
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-50 rounded-xl p-2.5 text-center">
                  <p className="text-xs text-blue-400 mb-0.5">Meta Ads</p>
                  <p className="font-bold text-blue-700 text-sm">Rp {fmt(r.meta_ads_spend)}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-2.5 text-center">
                  <p className="text-xs text-green-400 mb-0.5">Google Ads</p>
                  <p className="font-bold text-green-700 text-sm">Rp {fmt(r.google_ads_spend)}</p>
                </div>
              </div>
            </div>
            {/* Leads */}
            <div>
              <p className={`text-[10px] font-bold ${mt} mb-1.5 flex items-center gap-1`}>
                <Users size={10} /> TOTAL LEADS
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-purple-50 rounded-xl p-2.5 text-center">
                  <p className="text-xs text-purple-400 mb-0.5">Meta Ads</p>
                  <p className="font-bold text-purple-700 text-lg">{r.meta_ads_leads}</p>
                </div>
                <div className="bg-cyan-50 rounded-xl p-2.5 text-center">
                  <p className="text-xs text-cyan-400 mb-0.5">Google Ads</p>
                  <p className="font-bold text-cyan-700 text-lg">{r.google_ads_leads}</p>
                </div>
              </div>
            </div>
            {/* Kualitas */}
            <div>
              <p className={`text-[10px] font-bold ${mt} mb-1.5 flex items-center gap-1`}>
                <Flame size={10} /> KUALITAS LEADS
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-orange-50 rounded-xl p-2.5 text-center">
                  <p className="text-xs text-orange-400 mb-0.5">Warms</p>
                  <p className="font-bold text-orange-600 text-lg">{r.warms}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-2.5 text-center">
                  <p className="text-xs text-red-400 mb-0.5">Hot</p>
                  <p className="font-bold text-red-600 text-lg">{r.hot_leads}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-2.5 text-center">
                  <p className="text-xs text-green-400 mb-0.5">Closing</p>
                  <p className="font-bold text-green-700 text-lg">{r.closing}</p>
                </div>
              </div>
            </div>
            {r.notes && (
              <div className={`rounded-xl p-3 ${dark ? "bg-white/5" : "bg-slate-50"}`}>
                <p className={`text-[10px] font-bold ${mt} mb-1`}>CATATAN</p>
                <p className={`text-xs ${tx}`}>{r.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
