
"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronRight, Plus, X, Check, RefreshCw, CreditCard, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface MobileClosingPageProps {
  dark?: boolean;
  currentUser: { id: string; name: string; role: string; team: string | null };
  onBack: () => void;
}

interface Closing {
  id: string;
  student_name: string;
  parent_name: string;
  nominal_bayar: number;
  komisi_staff: number;
  komisi_manager: number;
  staff_id: string;
  staff_name: string;
  team: string;
  created_at: string;
  catatan?: string;
}

function formatRp(n: number) {
  if (n >= 1_000_000) return `Rp ${(n/1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n/1_000).toFixed(0)}rb`;
  return `Rp ${n}`;
}

export function MobileClosingPage({ dark = false, currentUser, onBack }: MobileClosingPageProps) {
  const supabase = createClient();
  const [closings, setClosings] = useState<Closing[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState("");
  const [form, setForm]         = useState({
    studentName: "", parentName: "", nominalBayar: "", catatan: "",
  });

  const isHeadRole = ["head_manager","owner","deputi"].includes(currentUser.role);

  const card = dark ? "bg-[#111d35] border-[#1e2d4a]" : "bg-white border-slate-100";
  const tx   = dark ? "text-slate-100" : "text-slate-800";
  const mt   = dark ? "text-slate-400" : "text-slate-500";
  const inp  = dark ? "bg-[#0a1020] border-[#1e2d4a] text-slate-100" : "bg-white border-slate-200 text-slate-800";
  const bd   = dark ? "border-[#1e2d4a]" : "border-slate-100";

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 2500); }

  const fetchClosings = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("closings").select("*").order("created_at", { ascending: false });
    if (!isHeadRole) {
      q = q.eq("staff_id", currentUser.id);
    } else if (currentUser.role === "manager" && currentUser.team) {
      q = q.eq("team", currentUser.team);
    }
    const { data, error } = await q.limit(50);
    if (!error && data) setClosings(data as Closing[]);
    setLoading(false);
  }, [currentUser, isHeadRole]);

  useEffect(() => { fetchClosings(); }, [fetchClosings]);

  const nominal = Number(form.nominalBayar) || 0;
  const komisiStaff   = Math.round(nominal * 0.15);
  const komisiManager = currentUser.role === "manager" ? Math.round(nominal * 0.15) : Math.round(nominal * 0.025);

  async function handleSubmit() {
    if (!form.studentName.trim()) { showToast("❌ Nama siswa wajib diisi"); return; }
    if (nominal < 5_500_000)     { showToast("❌ Nominal min Rp 5.5jt untuk closing"); return; }
    setSaving(true);
    const { error } = await supabase.from("closings").insert({
      student_name:   form.studentName,
      parent_name:     form.parentName,
      nominal_bayar:   nominal,
      komisi_staff:    komisiStaff,
      komisi_manager:  komisiManager,
      staff_id:        currentUser.id,
      staff_name:      currentUser.name,
      team:            currentUser.team,
      catatan:         form.catatan || null,
    });
    setSaving(false);
    if (error) { showToast("❌ Gagal: " + error.message); return; }
    setShowAdd(false);
    setForm({ studentName:"", parentName:"", nominalBayar:"", catatan:"" });
    showToast("✅ Closing berhasil dicatat!");
    fetchClosings();
  }

  // Summary
  const totalRevenue = closings.reduce((s,c) => s+c.nominal_bayar, 0);
  const totalKomisi  = closings.reduce((s,c) => s+(isHeadRole ? c.komisi_manager : c.komisi_staff), 0);
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const monthClosings = closings.filter(c => c.created_at.startsWith(thisMonth));

  return (
    <div className="flex-1rflow-y-auto pb-20">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] bg-slate-800 text-white text-xs px-4 py-2.5 rounded-full shadow-lg font-medium whitespace-nowrap">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white">
              <ChevronRight size={18} className="rotate-180" />
            </button>
            <div>
              <h2 className="text-white font-bold text-lg">Closing & Komisi</h2>
              <p className="text-green-200 text-xs">{closings.length} total · {monthClosings.length} bulan ini</p>
            </div>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white">
            <Plus size={18} />
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/15 rounded-2xl p-3">
            <p className="text-white/70 text-[10px] font-medium">Total Revenue</p>
            <p className="text-white font-bold text-lg">{formatRp(totalRevenue)}</p>
            <p className="text-white/60 text-[9px]">{closings.length} closing</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-3">
            <p className="text-white/70 text-[10px] font-medium">Total Komisi Saya</p>
            <p className="text-white font-bold text-lg">{formatRp(totalKomisi)}</p>
            <p className="text-white/60 text-[9px]">{isHeadRole ? "Manager rate" : "Staff 15%"}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Bulan ini highlight */}
        {monthClosings.length > 0 && (
          <div className={`${card} border rounded-2xl p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-green-500" />
              <span className={`text-sm font-semibold ${tx}`}>Bulan Ini</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${dark ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"} font-semibold ml-auto`}>
                {monthClosings.length}/5 target
              </span>
            </div>
            {/* Progress bar target */}
            <div className={`h-2 rounded-full ${dark ? "bg-white/10" : "bg-slate-100"} overflow-hidden mb-1`}>
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, (monthClosings.length/5)*100)}%` }}
              />
            </div>
            <p className={`text-[10px] ${mt}`}>{monthClosings.length} dari 5 target closing bulan ini</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={20} className="animate-spin text-green-500" />
          </div>
        ) : closings.length === 0 ? (
          <div className={`${card} border rounded-2xl p-10 text-center`}>
            <p className="text-3xl mb-2">💰</p>
            <p className={`text-sm font-semibold ${tx}`}>Belum ada closing</p>
            <p className={`text-xs ${mt} mt-1`}>Tap + untuk catat closing baru</p>
          </div>
        ) : (
          closings.map(c => (
            <div key={c.id} className={`${card} border rounded-2xl p-4 shadow-sm`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${tx} truncate`}>{c.student_name}</p>
                  <p className={`text-xs ${mt}`}>{c.parent_name || "—"}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-sm font-bold text-green-500">{formatRp(c.nominal_bayar)}</p>
                  <p className={`text-[10px] ${mt}`}>{new Date(c.created_at).toLocaleDateString("id-ID")}</p>
                </div>
              </div>
              <div className={`flex items-center gap-3 pt-2 border-t ${bd}`}>
                <div className="flex-1">
                  <p className={`text-[10px] ${mt}`}>Komisi Staff</p>
                  <p className={`text-xs font-semibold ${dark ? "text-blue-400" : "text-blue-600"}`}>{formatRp(c.komisi_staff)}</p>
                </div>
                <div className="flex-1">
                  <p className={`text-[10px] ${mt}`}>Komisi Manager</p>
                  <p className={`text-xs font-semibold ${dark ? "text-purple-400" : "text-purple-600"}`}>{formatRp(c.komisi_manager)}</p>
                </div>
                {c.team && (
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${dark ? "bg-white/10 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                    {c.team}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Add Closing Modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/60">
          <div className="flex-1" onClick={() => setShowAdd(false)} />
          <div className={`${dark ? "bg-[#0f1729]" : "bg-white"} rounded-t-3xl flex flex-col max-h-[85vh]`}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1">
              <div className={`w-10 h-1 rounded-full ${dark ? "bg-white/20" : "bg-slate-200"}`} />
            </div>
            <div className={`px-5 py-3 flex items-center justify-between border-b ${bd}`}>
              <p className={`font-bold text-sm ${tx}`}>Catat Closing Baru</p>
              <button onClick={() => setShowAdd(false)}
        className={`w-7 h-7 rounded-xl flex items-center justify-center ${dark ? "bg-[#1e2d4a] text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                <X size={14} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1">
              <div>
                <label className={`block text-xs font-semibold ${mt} mb-1`}>Nama Siswa *</label>
                <input value={form.studentName} onChange={e => setForm(p=>({...p,studentName:e.target.value}))}
                  placeholder="Nama calon siswa"
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none ${inp}`} />
              </div>
              <div>
                <label className={`block text-xs font-semibold ${mt} mb-1`}>Nama Orang Tua</label>
                <input value={form.parentName} onChange={e => setForm(p=>({...p,parentName:e.target.value}))}
                  placeholder="Nama orang tua"
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none ${inp}`} />
              </div>
              <div>
                <label className={`block text-xs font-semibold ${mt} mb-1`}>Nominal Bayar (Rp) *</label>
                <input type="number" min="0" value={form.nominalBayar}
                  onChange={e => setForm(p=>({...p,nominalBayar:e.target.value}))}
                  placeholder="Min. 5500000"
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none ${inp}`} />
                {nominal > 0 && (
                  <p className={`text-[10px] ${mt} mt-1`}>= Rp {nominal.toLocaleString("id-ID")}</p>
                )}
                {nominal > 0 && nominal < 5_500_000 && (
                  <p className="text-[10px] text-red-500 mt-1">⚠ Minimal Rp 5.5jt untuk dihitung sebagai closing</p>
                )}
              </div>

              {/* Preview komisi */}
              {nominal >= 5_500_000 && (
                <div className={`p-3 rounded-xl ${dark ? "bg-green-900/20 border rder-green-500/20" : "bg-green-50 border border-green-100"}`}>
                  <p className="text-[10px] font-bold text-green-600 mb-2">Preview Komisi</p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className={`text-xs ${mt}`}>Komisi Staff (15%)</span>
                      <span className="text-xs font-semibold text-green-600">{formatRp(komisiStaff)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-xs ${mt}`}>Komisi Manager ({currentUser.role==="manager"?"15%":"2.5%"})</span>
                      <span className="text-xs font-semibold text-purple-500">{formatRp(komisiManager)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className={`block text-xs font-semibold ${mt} mb-1`}>Catatan</label>
                <textarea value={form.catatan} onChange={e => setForm(p=>({...p,catatan:e.target.value}))}
                  placeholder="Catatan tambahan..." rows={2}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none resize-none ${inp}`} />
              </div>
            </div>

            <div className={`px-5 py-4 border-t ${bd} flex gap-3`}>
              <button onClick={() => setShowAdd(false)}
                className={`flex-1 py-3 rounded-xl text-xs font-semibold border ${dark ? "border-[#1e2d4a] text-slate-400" : "border-slate-200 text-slate-500"}`}>
                Batal
              </button>
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-green-500/30 disabled:opacity-60">
                {saving ? <><RefreshCw size={13} className="animate-spin"/>Menyimpan...</> : <><Check size={13}/>Simpan Closing</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
