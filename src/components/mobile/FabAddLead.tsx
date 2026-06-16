"use client";
import { useState } from "react";
import { Plus, X, User, Phone, MapPin, GraduationCap, School, ChevronRight } from "lucide-react";

type Cat = "HOT" | "WARM" | "COLD";
type Jenjang = "SD" | "SMP" | "SMA";

interface LeadData {
  name: string; child_name: string; phone: string; area: string;
  category: Cat; jenjang?: string; sekolah_asal?: string;
}
interface P { dark?: boolean; onAdd: (d: LeadData) => Promise<void>; }

const STEPS = ["Data Orang Tua", "Data Anak", "Kategori"];

export function FabAddLead({ dark = false, onAdd }: P) {
  const [open, setOpen]       = useState(false);
  const [step, setStep]       = useState(0);
  const [loading, setLoading] = useState(false);
  const [cat, setCat]         = useState<Cat>("WARM");
  const [jenjang, setJenjang] = useState<Jenjang>("SMP");
  const [form, setForm]       = useState({ name: "", child_name: "", phone: "", area: "", sekolah_asal: "" });

  const tx  = dark ? "text-slate-100" : "text-slate-800";
  const mt  = dark ? "text-slate-400" : "text-slate-500";
  const inp = dark
    ? "bg-white/5 border-white/10 text-slate-200 placeholder-slate-600"
    : "bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400";

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  function reset() {
    setForm({ name: "", child_name: "", phone: "", area: "", sekolah_asal: "" });
    setCat("WARM"); setJenjang("SMP"); setStep(0); setOpen(false);
  }

  function canNext() {
    if (step === 0) return form.name.trim() !== "" && form.phone.trim() !== "";
    if (step === 1) return form.child_name.trim() !== "";
    return true;
  }

  async function submit() {
    if (!form.name || !form.child_name || !form.phone) return;
    setLoading(true);
    try {
      await onAdd({ name: form.name, child_name: form.child_name, phone: form.phone,
        area: form.area, category: cat, jenjang, sekolah_asal: form.sekolah_asal });
      reset();
    } finally { setLoading(false); }
  }

  const inputCls = `w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:border-blue-400 transition-colors ${inp}`;

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)}
          className="absolute bottom-24 right-5 z-30 w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-xl hover:bg-blue-600 active:scale-90 transition-all">
          <Plus size={22} />
        </button>
      )}

      {open && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <div className="flex-1 bg-black/40" onClick={reset} />
          <div className={`${dark ? "bg-[#111d35]" : "bg-white"} rounded-t-3xl p-5 pb-8`}>
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-base font-bold ${tx}`}>Tambah Lead Baru</h3>
                <p className={`text-xs ${mt}`}>{STEPS[step]} · Langkah {step + 1} dari 3</p>
              </div>
              <button onClick={reset} className={mt}><X size={18} /></button>
            </div>

            <div className={`h-1.5 rounded-full mb-5 ${dark ? "bg-white/10" : "bg-slate-100"}`}>
              <div className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${((step + 1) / 3) * 100}%` }} />
            </div>

            {step === 0 && (
              <div className="space-y-3">
                <div>
                  <label className={`text-xs font-semibold ${mt} flex items-center gap-1 mb-1.5`}>
                    <User size={11} /> NAMA ORANG TUA *
                  </label>
                  <input autoFocus type="text" placeholder="Contoh: Budi Santoso"
                    value={form.name} onChange={e => set("name", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={`text-xs font-semibold ${mt} flex items-center gap-1 mb-1.5`}>
                    <Phone size={11} /> NO. WHATSAPP *
                  </label>
                  <input type="tel" placeholder="08xxxxxxxxxx"
                    value={form.phone} onChange={e => set("phone", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={`text-xs font-semibold ${mt} flex items-center gap-1 mb-1.5`}>
                    <MapPin size={11} /> AREA / KOTA
                  </label>
                  <input type="text" placeholder="Contoh: Depok, Bekasi"
                    value={form.area} onChange={e => set("area", e.target.value)} className={inputCls} />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                <div>
                  <label className={`text-xs font-semibold ${mt} flex items-center gap-1 mb-1.5`}>
                    <User size={11} /> NAMA ANAK *
                  </label>
                  <input autoFocus type="text" placeholder="Contoh: Rafi Ahmad"
                    value={form.child_name} onChange={e => set("child_name", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={`text-xs font-semibold ${mt} flex items-center gap-1 mb-2`}>
                    <GraduationCap size={11} /> JENJANG *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["SD", "SMP", "SMA"] as Jenjang[]).map(j => (
                      <button key={j} onClick={() => setJenjang(j)}
                        className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
                          jenjang === j
                            ? "bg-blue-500 border-blue-500 text-white shadow-md"
                            : dark ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-500 bg-slate-50"
                        }`}>{j}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={`text-xs font-semibold ${mt} flex items-center gap-1 mb-1.5`}>
                    <School size={11} /> SEKOLAH ASAL (opsional)
                  </label>
                  <input type="text" placeholder="Contoh: SDN 01 Depok"
                    value={form.sekolah_asal} onChange={e => set("sekolah_asal", e.target.value)} className={inputCls} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className={`text-xs font-semibold ${mt} block mb-3`}>KATEGORI LEAD</label>
                  <div className="space-y-2">
                    {([
                      { c: "HOT"  as Cat, emoji: "HOT",  label: "HOT",  desc: "Sangat berminat, siap daftar",    active: "bg-red-500 border-red-500 text-white",    inactive: "border-red-200 bg-red-50 text-red-500"       },
                      { c: "WARM" as Cat, emoji: "WARM", label: "WARM", desc: "Berminat, masih pertimbangan",   active: "bg-orange-400 border-orange-400 text-white", inactive: "border-orange-200 bg-orange-50 text-orange-500" },
                      { c: "COLD" as Cat, emoji: "COLD", label: "COLD", desc: "Baru tahu, belum memutuskan",    active: "bg-blue-500 border-blue-500 text-white",   inactive: "border-blue-200 bg-blue-50 text-blue-500"    },
                    ] as const).map(({ c, label, desc, active, inactive }) => (
                      <button key={c} onClick={() => setCat(c)}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${cat === c ? active : inactive}`}>
                        <div className="text-left flex-1">
                          <p className="font-bold text-sm">{label}</p>
                          <p className={`text-[10px] ${cat === c ? "opacity-80" : ""}`}>{desc}</p>
                        </div>
                        {cat === c && <span className="text-sm font-bold">&#10003;</span>}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={`rounded-2xl p-3 ${dark ? "bg-white/5" : "bg-slate-50"}`}>
                  <p className={`text-[10px] font-bold ${mt} mb-2`}>RINGKASAN</p>
                  <div className="space-y-0.5">
                    <p className={`text-xs ${tx}`}><span className={mt}>Ortu: </span>{form.name}</p>
                    <p className={`text-xs ${tx}`}><span className={mt}>Anak: </span>{form.child_name} · {jenjang}</p>
                    <p className={`text-xs ${tx}`}><span className={mt}>WA: </span>{form.phone}</p>
                    {form.area && <p className={`text-xs ${tx}`}><span className={mt}>Area: </span>{form.area}</p>}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-5">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)}
                  className={`flex-1 py-3 rounded-2xl border text-sm font-semibold ${dark ? "border-white/10 text-slate-300" : "border-slate-200 text-slate-500"}`}>
                  Kembali
                </button>
              )}
              {step < 2 ? (
                <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
                  className="flex-1 py-3 bg-blue-500 text-white font-semibold text-sm rounded-2xl disabled:opacity-40 flex items-center justify-center gap-1">
                  Lanjut <ChevronRight size={16} />
                </button>
              ) : (
                <button onClick={submit} disabled={loading}
                  className="flex-1 py-3 bg-blue-500 text-white font-bold text-sm rounded-2xl disabled:opacity-50">
                  {loading ? "Menyimpan..." : "Simpan Lead"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
