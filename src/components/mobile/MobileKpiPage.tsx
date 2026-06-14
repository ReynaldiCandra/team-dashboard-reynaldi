
"use client";

import { useState } from "react";
import { ChevronRight, Target, TrendingUp, Award, BarChart2, RefreshCw, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface MobileKpiPageProps {
  dark?: boolean;
  currentUser: { id: string; name: string; role: string; team: string | null };
  onBack: () => void;
}

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

export function MobileKpiPage({ dark = false, currentUser, onBack }: MobileKpiPageProps) {
  const supabase = createClient();
  const now = new Date();
  const [form, setForm] = useState({
    leadsIn: "", closing: "", revenue: "", notes: "",
    recordDate: now.toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const card = dark ? "bg-[#111d35] border-[#1e2d4a]" : "bg-white border-slate-100";
  const tx   = dark ? "text-slate-100" : "text-slate-800";
  const mt   = dark ? "text-slate-400" : "text-slate-500";
  const inp  = dark ? "bg-[#0a1020] border-[#1e2d4a] text-slate-100" : "bg-white border-slate-200 text-slate-800";
  const bd   = dark ? "border-[#1e2d4a]" : "border-slate-100";

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 2500); }

  async function handleSubmit() {
    if (!form.leadsIn) { showToast("❌ Leads masuk wajib diisi"); return; }
    setSaving(true);
    const { error } = await supabase.from("performances").upsert({
      reporter_id:  currentUser.id,
      reporter_name: currentUser.name,
      team:         currentUser.team,
      record_date:  form.recordDate,
      leads_in:     Number(form.leadsIn) || 0,
      closing:      Number(form.closing) || 0,
      revenue:      Number(form.revenue) || 0,
      notes:      form.notes || null,
    }, { onConflict: "reporter_id,record_date" });
    setSaving(false);
    if (error) { showToast("❌ Gagal: " + error.message); return; }
    setSubmitted(true);
    showToast("✅ Performa berhasil disimpan!");
  }

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] bg-slate-800 text-white text-xs px-4 py-2.5 rounded-full shadow-lg font-medium">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-700 px-5 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white">
            <ChevronRight size={18} className="rotate-180" />
          </button>
          <div>
            <h2 className="text-white font-bold text-lg">Input Performa</h2>
            <p className="texange-200 text-xs">{MONTH_LABELS[now.getMonth()]} {now.getFullYear()} · {currentUser.name}</p>
          </div>
        </div>

        {/* KPI target card */}
        <div className="bg-white/15 rounded-2xl p-4">
          <p className="text-white/70 text-xs mb-2 font-medium">Target KPI Tim</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label:"Target Closing", value:"5/bln", icon:"🎯" },
              { label:"Min DP", value:"Rp 5.5jt", icon:"💰" },
              { label:"Komisi Staff", value:"15%", icon:"🏆" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-xl">{s.icon}</p>
                <p className="text-white font-bold text-sm">{s.value}</p>
                <p className="text-white/60 text-[9px]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Info role */}
        <div className={`${card} rounded-2xl p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <p className={`text-sm font-semibold ${tx}`}>{currentUser.name}</p>
              <p className={`text-xs ${mt}`}>{currentUser.role} · {currentUser.team ?? "—"}</p>
            </div>
          </div>
        </div>

        {/* Form input */}
        {!submitted ? (
          <div className={`${card} border rounded-2xl p-4 space-y-4`}>
            <p className={`text-xs font-bold uppercase tracking-wide ${mt}`}>Input Performa Harian</p>

            <div>
              <label className={`block text-xs font-semibold ${mt} mb-1`}>Tanggal</label>
              <input type="date" value={form.recordDate}
                onChange={e => setForm(p => ({...p, recordDate: e.target.value}))}
             className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none ${inp}`} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-semibold ${mt} mb-1`}>Leads Masuk *</label>
                <input type="number" min="0" value={form.leadsIn}
                  onChange={e => setForm(p => ({...p, leadsIn: e.target.value}))}
                  placeholder="0"
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none ${inp}`} />
              </div>
              <div>
                <label className={`block text-xs font-semibold ${mt} mb-1`}>Closing</label>
                <input type="number" min="0" value={form.closing}
                  onChange={e => setForm(p => ({...p, closing: e.target.value}))}
                  placeholder="0"
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none ${inp}`} />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold ${mt} mb-1`}>Revenue (Rp)</label>
              <input type="number" min="0" value={form.revenue}
                onChange={e => setForm(p => ({...p, revenue: e.target.value}))}
                placeholder="cth. 5500000"
                className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none ${inp}`} />
              {form.revenue && (
                <p className={`text-[10px] ${mt} mt-1`}>
                  = Rp {Number(form.revenue).toLocaleString("id-ID")}
                </p>
              )}
            </div>

            <div>
              <label className={`block text-xs font-semibold ${mt} mb-1`}>Catatan</label>
              <textarea value={form.notes}
                onChange={e => setForm(p => ({...p, notes: e.target.value}))}
                placeholder="Catatan performa hari ini..."
                rows={3}
                className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none resize-none ${inp}`} />
            </div>

            {/* Kalkulasi otomatis komisi */}
            {form.closing && form.revenue && (
              <div className={`p-3 rounded-xl ${dark ? "bg-green-900/20 border border-green-500/20" : "bg-green-50 border border-green-100"}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wide text-green-600 mb-2`}>Estimasi Komisi</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className={`text-xs ${mt}`}>Komisi Staff (15%)</span>
                    <span className="text-xs font-semibold text-green-600">
                      Rp {(Number(form.revenue) * 0.15).toLocaleString("id-ID")}
                    </span>
                  </div>
                  {currentUser.role === "manager" && (
                    <div className="flex justify-between">
                      <span className={`text-xs ${mt}`}>Komisi Manager (2.5%)</span>
                      <span className="text-xs font-semibold text-blue-500">
                        Rp {(Number(form.revenue) * 0.025).toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button onClick={handleSubmit} disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-orange-500 text-white font-semibold rounded-2xl text-sm shadow-lg shadow-orange-500/30 disabled:opacity-60">
              {saving
                ? <><RefreshCw size={15} className="animate-spin" /> Menyimpan...</>
                : <><Check size={15} /> Simpan Performa</>}
            </button>
          </div>
        ) : (
          <div className={`${card} border rounded-2xl p-8 text-center`}>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check size={28} className="text-green-600" />
            </div>
            <p className={`font-bold text-lg ${tx}`}>Berhasil Disimpan!</p>
            <p className={`text-sm ${mt} mt-1`}>Performa tanggal {form.recordDate} telah tersimpan</p>
            <button onClick={() => { setSubmitted(false); setForm(p => ({...p, leadsIn:"", closing:"", revenue:"", notes:""})); }}
              className="mt-4 px-5 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl">
              Input Lagi
            </button>
          </div>
        )}

        {/* Info aturan bisnis */}
        <div className={`${card} border rounded-2xl p-4`}>
          <p className={`text-xs font-bold uppercase tracking-wide ${mt} mb-3`}>Aturan Komisi</p>
          <div className="space-y-2">
            {[
              { label:"Uang Pangkal", value:"Rp 40jt (diskon 50% = Rp 20jt)" },
              { label:"Min DP Closing", value:"Rp 5.5jt" },
              { label:"Komisi Staff", value:"15% dari nominal bayar" },
              { label:"Komisi Manager (staff)", value:"2.5% dari closing staff" },
              { label:"Komisi Manager (self)", value:"15% dari closing sendiri" },
              { label:"Target/Tim/Bulan", value:"5 closing" },
            ].map(r => (
              <div key={r.label} className={`flex items-center justify-between py-1.5 border-b ${bd} last:border-0`}>
                <span className={`text-xs ${mt}`}>{r.label}</span>
                <span className={`text-xs font-semibold ${tx}`}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
