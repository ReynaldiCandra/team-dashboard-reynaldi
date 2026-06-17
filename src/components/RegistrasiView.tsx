"use client";
import { useState, useEffect } from "react";
import { Plus, Download, Search, CheckCircle, XCircle, Eye, RefreshCw, FileText, Trash2 } from "lucide-react";

interface Props {
  dark?: boolean;
  currentUser: { id: string; name: string; role: string; team: string };
}

interface Reg {
  id: string; reg_number: string; verify_hash: string;
  nama_siswa: string; tempat_lahir_siswa: string; tanggal_lahir_siswa: string;
  jenis_kelamin_siswa: string; sekolah_asal: string; status_pendaftaran: string; tahun_ajaran: string;
  nama_ortu: string; tempat_lahir_ortu: string; tanggal_lahir_ortu: string;
  jenis_kelamin_ortu: string; alamat: string; no_hp: string; email: string; catatan: string; no_wa_manager?: string;
  created_by_name: string; team: string; created_at: string;
}

const STATUS_OPTIONS = [
  "SD Full Day","SD Boarding","SMP Full Day","SMP Boarding","SMA Full Day","SMA Boarding"
];

const EMPTY: Omit<Reg,"id"|"reg_number"|"verify_hash"|"created_by_name"|"team"|"created_at"> = {
  nama_siswa:"", tempat_lahir_siswa:"", tanggal_lahir_siswa:"", jenis_kelamin_siswa:"Laki-laki",
  sekolah_asal:"", status_pendaftaran:"", tahun_ajaran:"2025/2026",
  nama_ortu:"", tempat_lahir_ortu:"", tanggal_lahir_ortu:"", jenis_kelamin_ortu:"Laki-laki",
  alamat:"", no_hp:"", email:"", catatan:"", no_wa_manager:"",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" });
}

async function generatePDF(reg: Reg) {
  const { jsPDF } = await import("jspdf");
  const QRCode = await import("qrcode");
  const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
  const W = 210; const margin = 18;

  try {
    const logoRes = await fetch(window.location.origin + "/logo-alexandria.jpg");
    const blob = await logoRes.blob();
    const logoB64 = await new Promise<string>((res) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result as string);
      reader.readAsDataURL(blob);
    });
    const logoSize = 22;
    doc.addImage(logoB64, "JPEG", (W - logoSize) / 2, 8, logoSize, logoSize);
  } catch {}

  doc.setTextColor(110, 20, 20);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("YAYASAN BPLI | ALEXANDRIA ISLAMIC SCHOOL", W / 2, 36, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("SD - SMP - SMA | Islamic Boarding & Fullday School", W / 2, 42, { align: "center" });
  doc.setDrawColor(110, 20, 20);
  doc.setLineWidth(0.8);
  doc.line(margin, 45, W - margin, 45);
  doc.setLineWidth(0.3);
  doc.line(margin, 46.5, W - margin, 46.5);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(110, 20, 20);
  doc.text("FORMULIR PENDAFTARAN RESMI", W / 2, 54, { align: "center" });

  doc.setFillColor(255, 248, 230);
  doc.roundedRect((W - 80) / 2, 58, 80, 13, 2, 2, "FD");
  doc.setDrawColor(200, 150, 50);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 80, 0);
  doc.text("NOMOR REGISTRASI", W / 2, 63, { align: "center" });
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(reg.reg_number, W / 2, 69.5, { align: "center" });

  const waNum = (reg.no_wa_manager ?? "").replace(/\D/g, "").replace(/^0/, "62");
  const waMsg = encodeURIComponent("Assalamualaikum, saya ingin menindaklanjuti pendaftaran anak saya.\nNama Siswa: " + reg.nama_siswa + "\nNo. Registrasi: " + reg.reg_number + "\nStatus: " + reg.status_pendaftaran);
  const waUrl = waNum ? "https://wa.me/" + waNum + "?text=" + waMsg : "https://wa.me/";
  const qrDataUrl = await QRCode.toDataURL(waUrl, { width: 72, margin: 1 });
  doc.addImage(qrDataUrl, "PNG", W - margin - 25, 58, 25, 25);
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "normal");
  doc.text("Hubungi Manager", W - margin - 12.5, 85, { align: "center" });
  doc.text("via WhatsApp", W - margin - 12.5, 88.5, { align: "center" });

  let y = 96;

  const sectionHeader = (title: string) => {
    doc.setFillColor(110, 20, 20);
    doc.rect(margin, y, W - margin * 2, 6.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin + 3, y + 4.5);
    y += 9;
  };

  const field = (label: string, value: string) => {
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(label, margin + 3, y);
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.text(value || "-", margin + 58, y);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 1.5, W - margin, y + 1.5);
    y += 7;
  };

  sectionHeader("DATA CALON SISWA");
  field("Nama Lengkap", reg.nama_siswa);
  field("Tempat / Tgl Lahir", reg.tempat_lahir_siswa + ", " + reg.tanggal_lahir_siswa);
  field("Jenis Kelamin", reg.jenis_kelamin_siswa);
  field("Sekolah Asal", reg.sekolah_asal || "-");
  field("Status Pendaftaran", reg.status_pendaftaran);
  field("Tahun Ajaran", reg.tahun_ajaran);

  y += 2;
  sectionHeader("DATA ORANG TUA / WALI");
  field("Nama Lengkap", reg.nama_ortu);
  field("Tempat / Tgl Lahir", reg.tempat_lahir_ortu + ", " + reg.tanggal_lahir_ortu);
  field("Jenis Kelamin", reg.jenis_kelamin_ortu);
  field("Alamat", reg.alamat);
  field("No. HP / Telepon", reg.no_hp);
  field("Email", reg.email || "-");
  if (reg.catatan) field("Catatan", reg.catatan);

  y += 4;
  doc.setDrawColor(110, 20, 20);
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 5;
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.text("Dibuat oleh: " + reg.created_by_name + "  |  Tim: " + reg.team + "  |  Tanggal: " + fmtDate(reg.created_at), margin, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(110, 20, 20);
  doc.text("Kode Verifikasi: " + reg.verify_hash, margin, y);

  doc.save("Registrasi_" + reg.reg_number + "_" + reg.nama_siswa.replace(/\s+/g, "-") + ".pdf");
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
  const [confirmDelete, setConfirmDelete] = useState<Reg|null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(reg: Reg) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/registrasi?id=${reg.id}`, { method: 'DELETE' });
      if (res.ok) {
        setList(prev => prev.filter(r => r.id !== reg.id));
        setConfirmDelete(null);
      } else { alert('Gagal menghapus data.'); }
    } catch { alert('Gagal menghapus data.'); }
    setDeleting(false);
  }

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
                  <div className="col-span-2"><label className={labelCls}>No. WhatsApp Manager (untuk QR)</label><input className={inputCls} value={form.no_wa_manager} onChange={e=>set("no_wa_manager",e.target.value)} placeholder="+62 812-xxxx-xxxx" /></div>
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
                        <button onClick={() => setConfirmDelete(r)} className={`p-1.5 rounded-lg ${dark?"hover:bg-red-500/20":"hover:bg-red-50"} text-red-400 transition-colors`} title="Hapus">
                          <Trash2 size={14} />
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
      {confirmDelete && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`rounded-2xl shadow-2xl p-6 w-80 ${dark?"bg-[#111d35] border border-[#1e2d4a]":"bg-white border border-slate-200"}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <Trash2 size={18} className="text-red-400" />
          </div>
          <div>
            <p className={`font-semibold ${dark?"text-white":"text-slate-800"}`}>Hapus Registrasi</p>
            <p className={`text-xs ${dark?"text-slate-400":"text-slate-500"}`}>{confirmDelete.reg_number}</p>
          </div>
        </div>
        <p className={`text-sm mb-5 ${dark?"text-slate-300":"text-slate-600"}`}>
          Yakin ingin menghapus data <strong>{confirmDelete.nama_siswa}</strong>? Tindakan ini tidak bisa dibatalkan.
        </p>
        <div className="flex gap-2">
          <button onClick={() => setConfirmDelete(null)} className={`flex-1 py-2 rounded-lg text-sm font-medium ${dark?"bg-white/10 text-slate-300 hover:bg-white/20":"bg-slate-100 text-slate-700 hover:bg-slate-200"} transition-colors`}>
            Batal
          </button>
          <button onClick={() => handleDelete(confirmDelete)} disabled={deleting} className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-60">
            {deleting ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  )}

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
