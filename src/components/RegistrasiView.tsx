"use client";
import { useState, useEffect } from "react";
import { Plus, Download, Search, CheckCircle, XCircle, Eye, RefreshCw, FileText } from "lucide-react";

interface Props {
  dark?: boolean;
  currentUser: { id: string; name: string; role: string; team: string };
}

interface Reg {
  id: string; reg_number: string; verify_hash: string;
  nama_siswa: string; tempat_lahir_siswa: string; tanggal_lahir_siswa: string;
  jenis_kelamin_siswa: string; sekolah_asal: string; status_pendaftaran: string; tahun_ajaran: string;
  nama_ortu: string; tempat_lahir_ortu: string; tanggal_lahir_ortu: string;
  jenis_kelamin_ortu: string; alamat: string; no_hp: string; email: string; catatan: string;
  created_by_name: string; team: string; created_at: string;
}

const STATUS_OPTIONS = [
  "SD Full Day","SD Boarding","SMP Full Day","SMP Boarding","SMA Full Day","SMA Boarding"
];

const EMPTY: Omit<Reg,"id"|"reg_number"|"verify_hash"|"created_by_name"|"team"|"created_at"> = {
  nama_siswa:"", tempat_lahir_siswa:"", tanggal_lahir_siswa:"", jenis_kelamin_siswa:"Laki-laki",
  sekolah_asal:"", status_pendaftaran:"", tahun_ajaran:"2025/2026",
  nama_ortu:"", tempat_lahir_ortu:"", tanggal_lahir_ortu:"", jenis_kelamin_ortu:"Laki-laki",
  alamat:"", no_hp:"", email:"", catatan:"",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" });
}

async function generatePDF(reg: Reg) {
  const { jsPDF } = await import("jspdf");
  const QRCode = await import("qrcode");

  const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
  const W = 210; const margin = 20;

  // Header background
  doc.setFillColor(110, 20, 20);
  doc.rect(0, 0, W, 38, "F");

  // Logo placeholder circle
  doc.setFillColor(255,255,255);
  doc.circle(margin + 8, 19, 8, "F");
  doc.setTextColor(110,20,20);
  doc.setFontSize(5);
  doc.setFont("helvetica","bold");
  doc.text("ALX", margin + 5.2, 20.5);

  // School name
  doc.setTextColor(255,255,255);
  doc.setFontSize(10);
  doc.setFont("helvetica","bold");
  doc.text("SD-SMP-SMA ALEXANDRIA", margin + 20, 14);
  doc.setFontSize(7.5);
  doc.setFont("helvetica","normal");
  doc.text("ISLAMIC BOARDING & FULLDAY SCHOOL", margin + 20, 20);
  doc.setFontSize(6.5);
  doc.text("Yayasan BPLI | alexandriaschool.education", margin + 20, 26);

  // Document title
  doc.setFontSize(13);
  doc.setFont("helvetica","bold");
  doc.setTextColor(255,255,255);
  doc.text("FORMULIR PENDAFTARAN RESMI", W/2, 34, { align:"center" });

  // Nomor registrasi box
  doc.setFillColor(255, 248, 230);
  doc.roundedRect(margin, 44, W - margin*2, 12, 2, 2, "F");
  doc.setDrawColor(200, 150, 50);
  doc.roundedRect(margin, 44, W - margin*2, 12, 2, 2, "S");
  doc.setTextColor(120, 80, 0);
  doc.setFontSize(7);
  doc.setFont("helvetica","normal");
  doc.text("NOMOR REGISTRASI", W/2, 49.5, { align:"center" });
  doc.setFontSize(13);
  doc.setFont("helvetica","bold");
  doc.text(reg.reg_number, W/2, 55.5, { align:"center" });

  // Generate QR Code
  const verifyUrl = `https://team-dashboard-reynaldi.vercel.app/api/registrasi/verify?id=${reg.id}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 80, margin: 1 });

  // QR code
  doc.addImage(qrDataUrl, "PNG", W - margin - 28, 43, 28, 28);
  doc.setTextColor(100,100,100);
  doc.setFontSize(5.5);
  doc.setFont("helvetica","normal");
  doc.text("Scan untuk verifikasi", W - margin - 14, 73, { align:"center" });

  // Sections
  let y = 78;

  const sectionHeader = (title: string) => {
    doc.setFillColor(110, 20, 20);
    doc.rect(margin, y, W - margin*2, 7, "F");
    doc.setTextColor(255,255,255);
    doc.setFontSize(8);
    doc.setFont("helvetica","bold");
    doc.text(title, margin + 3, y + 4.8);
    y += 10;
  };

  const field = (label: string, value: string) => {
    doc.setTextColor(80,80,80);
    doc.setFontSize(7);
    doc.setFont("helvetica","normal");
    doc.text(label, margin + 3, y);
    doc.setTextColor(20,20,20);
    doc.setFont("helvetica","bold");
    doc.text(value || "-", margin + 55, y);
    doc.setDrawColor(220,220,220);
    doc.line(margin, y + 1.5, W - margin, y + 1.5);
    y += 7;
  };

  sectionHeader("DATA CALON SISWA");
  field("Nama Lengkap", reg.nama_siswa);
  field("Tempat / Tgl Lahir", `${reg.tempat_lahir_siswa}, ${reg.tanggal_lahir_siswa}`);
  field("Jenis Kelamin", reg.jenis_kelamin_siswa);
  field("Sekolah Asal", reg.sekolah_asal || "-");
  field("Status Pendaftaran", reg.status_pendaftaran);
  field("Tahun Ajaran", reg.tahun_ajaran);

  y += 3;
  sectionHeader("DATA ORANG TUA / WALI");
  field("Nama Lengkap", reg.nama_ortu);
  field("Tempat / Tgl Lahir", `${reg.tempat_lahir_ortu}, ${reg.tanggal_lahir_ortu}`);
  field("Jenis Kelamin", reg.jenis_kelamin_ortu);
  field("Alamat", reg.alamat);
  field("No. HP / Telepon", reg.no_hp);
  field("Email", reg.email || "-");
  if (reg.catatan) field("Catatan", reg.catatan);

  y += 3;

  // Footer info
  doc.setFillColor(245,245,245);
  doc.rect(margin, y, W - margin*2, 22, "F");
  doc.setTextColor(80,80,80);
  doc.setFontSize(6.5);
  doc.setFont("helvetica","normal");
  doc.text(`Dibuat oleh: ${reg.created_by_name} | Tim: ${reg.team}`, margin + 3, y + 6);
  doc.text(`Tanggal: ${fmtDate(reg.created_at)}`, margin + 3, y + 12);
  doc.setFont("helvetica","bold");
  doc.setTextColor(110,20,20);
  doc.text(`Kode Verifikasi: ${reg.verify_hash}`, margin + 3, y + 18);
  doc.setFont("helvetica","normal");
  doc.setTextColor(80,80,80);
  doc.text(`Scan QR Code atau kunjungi: ${verifyUrl}`, W - margin - 3, y + 18, { align:"right" });

  doc.save(`Registrasi_${reg.reg_number}_${reg.nama_siswa.replace(/\s+/g,"-")}.pdf`);
}

export function RegistrasiView({ dark = false, currentUser }: Props) {
  const [list, setList] = useState<Reg[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({...EMPTY});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<Reg|null>(null);

  const bg   = dark ? "bg-[#0a1020]" : "bg-gray-50";
  const card = dark ? "bg-[#111d35] border-[#1e2d4a]" : "bg-white border-slate-200";
  const tx   = dark ? "text-slate-100" : "text-slate-800";
  const mt   = dark ? "text-slate-400" : "text-slate-500";
  const inp  = dark ? "bg-[#1a2a45] border-[#1e2d4a] text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 text-slate-800";

  useEffect(() => { loadList(); }, []);

  async function loadList() {
    setLoading(true);
    try {
      const res = await fetch("/api/registrasi");
      const json = await res.json();
      setList(json.data ?? []);
    } catch { setList([]); } finally { setLoading(false); }
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3500); }
  function set(k: string, v: string) { setForm(p => ({...p, [k]: v})); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nama_siswa || !form.nama_ortu || !form.no_hp || !form.status_pendaftaran) {
      return showToast("❌ Lengkapi field yang wajib diisi");
    }
    setSaving(true);
    try {
      const res = await fetch("/api/registrasi", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      showToast("✅ Registrasi berhasil! No: " + json.data.reg_number);
      setShowForm(false);
      setForm({...EMPTY});
      loadList();
      setTimeout(() => generatePDF(json.data), 500);
    } catch (e: any) { showToast("❌ " + e.message); }
    finally { setSaving(false); }
  }

  const filtered = list.filter(r =>
    r.nama_siswa.toLowerCase().includes(search.toLowerCase()) ||
    r.reg_number.toLowerCase().includes(search.toLowerCase()) ||
    r.nama_ortu.toLowerCase().includes(search.toLowerCase())
  );

  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-red-500/30 ${inp}`;
  const labelCls = `text-xs font-semibold block mb-1 ${mt}`;

  return (
    <div className={`min-h-screen ${bg} ${tx} p-6`}>
      {toast && <div className="fixed top-4 right-4 z-50 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm">{toast}</div>}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Registrasi Online</h1>
          <p className={`text-sm mt-1 ${mt}`}>Formulir Pendaftaran Resmi · Tim {currentUser.team}</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-sm font-medium transition-colors">
          <Plus size={15} /> Buat Registrasi
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className={`rounded-2xl border w-full max-w-2xl max-h-[90vh] overflow-y-auto ${card}`}>
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b" style={{borderColor: dark ? "#1e2d4a" : "#e2e8f0", background: dark ? "#111d35" : "white"}}>
              <h2 className={`font-bold text-lg ${tx}`}>Formulir Pendaftaran Baru</h2>
              <button onClick={() => setShowForm(false)} className={`text-sm ${mt} hover:${tx}`}>✕ Tutup</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Data Siswa */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-5 bg-red-700 rounded" />
                  <h3 className={`font-semibold text-sm ${tx}`}>Data Calon Siswa</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className={labelCls}>Nama Lengkap Calon Siswa *</label><input className={inputCls} value={form.nama_siswa} onChange={e=>set("nama_siswa",e.target.value)} placeholder="Masukkan nama lengkap" /></div>
                  <div><label className={labelCls}>Tempat Lahir *</label><input className={inputCls} value={form.tempat_lahir_siswa} onChange={e=>set("tempat_lahir_siswa",e.target.value)} placeholder="Kota lahir" /></div>
                  <div><label className={labelCls}>Tanggal Lahir *</label><input type="date" className={inputCls} value={form.tanggal_lahir_siswa} onChange={e=>set("tanggal_lahir_siswa",e.target.value)} /></div>
                  <div>
                    <label className={labelCls}>Jenis Kelamin *</label>
                    <select className={inputCls} value={form.jenis_kelamin_siswa} onChange={e=>set("jenis_kelamin_siswa",e.target.value)}>
                      <option>Laki-laki</option><option>Perempuan</option>
                    </select>
                  </div>
                  <div><label className={labelCls}>Sekolah Asal</label><input className={inputCls} value={form.sekolah_asal} onChange={e=>set("sekolah_asal",e.target.value)} placeholder="Nama sekolah asal" /></div>
                  <div>
                    <label className={labelCls}>Status Pendaftaran *</label>
                    <select className={inputCls} value={form.status_pendaftaran} onChange={e=>set("status_pendaftaran",e.target.value)}>
                      <option value="">Pilih status...</option>
                      {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div><label className={labelCls}>Tahun Ajaran *</label><input className={inputCls} value={form.tahun_ajaran} onChange={e=>set("tahun_ajaran",e.target.value)} placeholder="2025/2026" /></div>
                </div>
              </div>

              {/* Data Ortu */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-5 bg-red-700 rounded" />
                  <h3 className={`font-semibold text-sm ${tx}`}>Data Orang Tua / Wali</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className={labelCls}>Nama Lengkap Orang Tua/Wali *</label><input className={inputCls} value={form.nama_ortu} onChange={e=>set("nama_ortu",e.target.value)} placeholder="Nama orang tua/wali" /></div>
                  <div><label className={labelCls}>Tempat Lahir Orang Tua *</label><input className={inputCls} value={form.tempat_lahir_ortu} onChange={e=>set("tempat_lahir_ortu",e.target.value)} placeholder="Kota lahir" /></div>
                  <div><label className={labelCls}>Tanggal Lahir Orang Tua *</label><input type="date" className={inputCls} value={form.tanggal_lahir_ortu} onChange={e=>set("tanggal_lahir_ortu",e.target.value)} /></div>
                  <div>
                    <label className={labelCls}>Jenis Kelamin Orang Tua *</label>
                    <select className={inputCls} value={form.jenis_kelamin_ortu} onChange={e=>set("jenis_kelamin_ortu",e.target.value)}>
                      <option>Laki-laki</option><option>Perempuan</option>
                    </select>
                  </div>
                  <div className="col-span-2"><label className={labelCls}>Alamat Lengkap *</label><textarea className={inputCls} rows={2} value={form.alamat} onChange={e=>set("alamat",e.target.value)} placeholder="Alamat lengkap" /></div>
                  <div><label className={labelCls}>No. HP / Telepon *</label><input className={inputCls} value={form.no_hp} onChange={e=>set("no_hp",e.target.value)} placeholder="+62 812-xxxx-xxxx" /></div>
                  <div><label className={labelCls}>Email</label><input className={inputCls} value={form.email} onChange={e=>set("email",e.target.value)} placeholder="email@example.com" /></div>
                  <div className="col-span-2"><label className={labelCls}>Catatan Tambahan</label><textarea className={inputCls} rows={2} value={form.catatan} onChange={e=>set("catatan",e.target.value)} placeholder="Catatan atau keterangan tambahan..." /></div>
                </div>
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white font-semibold transition-colors disabled:opacity-50">
                {saving ? "Menyimpan..." : "Simpan & Download PDF"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      <div className={`rounded-xl border ${card}`}>
        <div className="p-4 border-b flex items-center gap-3" style={{borderColor: dark ? "#1e2d4a" : "#e2e8f0"}}>
          <Search size={15} className={mt} />
          <input className={`flex-1 bg-transparent text-sm outline-none ${tx}`} placeholder="Cari nama siswa, nomor registrasi, atau orang tua..."
            value={search} onChange={e=>setSearch(e.target.value)} />
          <button onClick={loadList} className={mt}><RefreshCw size={14} className={loading?"animate-spin":""} /></button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><RefreshCw size={20} className="animate-spin text-blue-400" /></div>
        ) : filtered.length === 0 ? (
          <div className={`text-center py-12 ${mt}`}>
            <FileText size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Belum ada data registrasi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-xs uppercase tracking-wider ${mt} border-b`} style={{borderColor: dark?"#1e2d4a":"#e2e8f0"}}>
                  <th className="text-left px-4 py-3">No. Reg</th>
                  <th className="text-left px-4 py-3">Nama Siswa</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Orang Tua</th>
                  <th className="text-left px-4 py-3">No. HP</th>
                  <th className="text-left px-4 py-3">Dibuat</th>
                  <th className="text-left px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className={`border-b transition-colors ${dark?"hover:bg-white/5 border-white/5":"hover:bg-slate-50 border-slate-100"}`}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-amber-500">{r.reg_number}</span>
                    </td>
                    <td className="px-4 py-3 font-medium">{r.nama_siswa}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${dark?"bg-red-900/40 text-red-300":"bg-red-50 text-red-700"}`}>{r.status_pendaftaran}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">{r.nama_ortu}</td>
                    <td className="px-4 py-3 text-sm">{r.no_hp}</td>
                    <td className={`px-4 py-3 text-xs ${mt}`}>{fmtDate(r.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setPreview(r)} className={`p-1.5 rounded-lg ${dark?"hover:bg-white/10":"hover:bg-slate-100"} ${mt} transition-colors`} title="Detail">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => generatePDF(r)} className={`p-1.5 rounded-lg ${dark?"hover:bg-white/10":"hover:bg-slate-100"} text-blue-400 transition-colors`} title="Download PDF">
                          <Download size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className={`rounded-2xl border w-full max-w-lg ${card}`}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{borderColor: dark?"#1e2d4a":"#e2e8f0"}}>
              <div>
                <p className="font-bold">{preview.nama_siswa}</p>
                <p className={`text-xs font-mono text-amber-500`}>{preview.reg_number}</p>
              </div>
              <button onClick={() => setPreview(null)} className={`text-sm ${mt}`}>✕</button>
            </div>
            <div className={`p-6 space-y-3 text-sm`}>
              {[
                ["Status", preview.status_pendaftaran], ["Tahun Ajaran", preview.tahun_ajaran],
                ["Tgl Lahir Siswa", `${preview.tempat_lahir_siswa}, ${preview.tanggal_lahir_siswa}`],
                ["Sekolah Asal", preview.sekolah_asal||"-"],
                ["Orang Tua", preview.nama_ortu],
                ["No. HP", preview.no_hp], ["Email", preview.email||"-"],
                ["Alamat", preview.alamat],
                ["Kode Verif.", preview.verify_hash],
                ["Dibuat oleh", preview.created_by_name],
              ].map(([l,v]) => (
                <div key={l} className="flex gap-3">
                  <span className={`w-32 shrink-0 text-xs ${mt}`}>{l}</span>
                  <span className={`text-xs font-medium ${tx}`}>{v}</span>
                </div>
              ))}
            </div>
            <div className="px-6 pb-5">
              <button onClick={() => generatePDF(preview)}
                className="w-full py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                <Download size={15} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
