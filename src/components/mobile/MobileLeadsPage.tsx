"use client";

import { useState, useMemo } from "react";
import {
  ChevronRight, Search, X, MessageCircle, Flame, ThumbsUp, Snowflake,
  Phone, MapPin, Users, Calendar, ChevronDown, Trash2, Edit3,
  ArrowLeft, Check, AlertTriangle, Tag, FileText
} from "lucide-react";
import { UrgencyBadge } from "./UrgencyBadge";
import type { Lead } from "@/types/mobile";

interface MobileLeadsPageProps {
  leads: Lead[];
  dark?: boolean;
  onBack: () => void;
  onOpenScript: (lead: Lead) => void;
  currentUser?: { id: string; name: string; role: string; team: string };
  onLeadAdded?: () => void;
  onUpdateLead?: (leadId: string, updates: { category?: string; status?: string; notes?: string }) => Promise<void>;
  onDeleteLead?: (leadId: string) => Promise<void>;
}

type Filter = "All" | "HOT" | "WARM" | "COLD";

const CATEGORIES: Array<"HOT" | "WARM" | "COLD"> = ["HOT", "WARM", "COLD"];
const STATUSES = ["new", "contacted", "interested", "enrolled", "lost"];

const STATUS_LABEL: Record<string, string> = {
  new: "Baru",
  contacted: "Dihubungi",
  interested: "Berminat",
  enrolled: "Mendaftar",
  lost: "Tidak Jadi",
};

const CAT_COLOR: Record<string, string> = {
  HOT: "bg-red-100 text-red-600",
  WARM: "bg-orange-100 text-orange-600",
  COLD: "bg-blue-100 text-blue-600",
};

const CAT_ICON: Record<string, React.ReactNode> = {
  HOT:  <Flame size={10} />,
  WARM: <ThumbsUp size={10} />,
  COLD: <Snowflake size={10} />,
};

function formatDate(d?: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Lead Detail Drawer ──────────────────────────────────────────────────────
function LeadDetailDrawer({
  lead,
  dark,
  onClose,
  onOpenScript,
  onUpdateLead,
  onDeleteLead,
}: {
  lead: Lead;
  dark: boolean;
  onClose: () => void;
  onOpenScript: (l: Lead) => void;
  onUpdateLead?: (id: string, u: { category?: string; status?: string; notes?: string }) => Promise<void>;
  onDeleteLead?: (id: string) => Promise<void>;
}) {
  const [editCat, setEditCat]     = useState(false);
  const [editStatus, setEditStatus] = useState(false);
  const [editNotes, setEditNotes]   = useState(false);
  const [notesVal, setNotesVal]     = useState((lead as any).notes ?? "");
  const [confirmDel, setConfirmDel] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState("");

  const bg   = dark ? "bg-[#0a1020]"   : "bg-white";
  const card = dark ? "bg-[#111d35] border-[#1e2d4a]" : "bg-slate-50 border-slate-100";
  const tx   = dark ? "text-slate-100" : "text-slate-800";
  const mt   = dark ? "text-slate-400" : "text-slate-500";
  const bd   = dark ? "border-[#1e2d4a]" : "border-slate-200";

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 2000); }

  async function handleCatChange(cat: string) {
    setSaving(true);
    await onUpdateLead?.(lead.id, { category: cat });
    setSaving(false);
    setEditCat(false);
    showToast("Kategori berhasil diperbarui");
  }

  async function handleStatusChange(st: string) {
    setSaving(true);
    await onUpdateLead?.(lead.id, { status: st });
    setSaving(false);
    setEditStatus(false);
    showToast("Status berhasil diperbarui");
  }

  async function handleSaveNotes() {
    setSaving(true);
    await onUpdateLead?.(lead.id, { notes: notesVal });
    setSaving(false);
    setEditNotes(false);
    showToast("Catatan berhasil disimpan");
  }

  async function handleDelete() {
    setSaving(true);
    await onDeleteLead?.(lead.id);
    setSaving(false);
    onClose();
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col" style={{ background: "inherit" }}>
      {/* Toast */}
      {toast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[80] bg-slate-800 text-white text-xs px-4 py-2 rounded-full shadow-lg whitespace-nowrap">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-5 pt-12 pb-6 shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg truncate">{lead.name}</h2>
            <p className="text-blue-200 text-xs">Detail Lead</p>
          </div>
          <span className={`text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 font-bold ${CAT_COLOR[lead.category]} bg-white`}>
            {CAT_ICON[lead.category]} {lead.category}
          </span>
        </div>
      </div>

      {/* Scroll content */}
      <div className={`flex-1 overflow-y-auto pb-24 ${bg}`}>
        <div className="p-4 space-y-3">

          {/* Info Utama */}
          <div className={`${card} border rounded-2xl p-4 space-y-3`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${mt}`}>Info Orang Tua & Anak</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Nama Ortu", value: lead.name },
                { label: "Nama Anak", value: lead.child_name },
                { label: "No. WA", value: lead.phone || "-", icon: <Phone size={12} /> },
                { label: "Area", value: lead.area || "-", icon: <MapPin size={12} /> },
              ].map(r => (
                <div key={r.label}>
                  <p className={`text-[10px] ${mt} mb-0.5`}>{r.label}</p>
                  <p className={`text-xs font-semibold ${tx} flex items-center gap-1`}>
                    {r.icon}{r.value}
                  </p>
                </div>
              ))}
              {(lead as any).childClass && (
                <div>
                  <p className={`text-[10px] ${mt} mb-0.5`}>Kelas</p>
                  <p className={`text-xs font-semibold ${tx}`}>{(lead as any).childClass}</p>
                </div>
              )}
              {(lead as any).source && (
                <div>
                  <p className={`text-[10px] ${mt} mb-0.5`}>Sumber</p>
                  <p className={`text-xs font-semibold ${tx}`}>{(lead as any).source}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Calendar size={11} className={mt} />
              <p className={`text-xs ${mt}`}>Masuk: {formatDate(lead.created_at)}</p>
              {lead.last_contact_at && (
                <>
                  <span className={mt}>·</span>
                  <p className={`text-xs ${mt}`}>Kontak: {formatDate(lead.last_contact_at)}</p>
                </>
              )}
            </div>
            <UrgencyBadge lastContactAt={lead.last_contact_at} category={lead.category} />
          </div>

          {/* Ubah Kategori */}
          <div className={`${card} border rounded-2xl p-4`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${mt} flex items-center gap-1`}>
                <Tag size={11} /> Kategori Lead
              </p>
              <button
                onClick={() => setEditCat(p => !p)}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 ${
                  dark ? "bg-blue-900/40 text-blue-300" : "bg-blue-50 text-blue-600"
                }`}
              >
                <Edit3 size={11} /> Ubah
              </button>
            </div>
            {!editCat ? (
              <span className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-xl ${CAT_COLOR[lead.category]}`}>
                {CAT_ICON[lead.category]} {lead.category}
              </span>
            ) : (
              <div className="flex gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => handleCatChange(cat)}
                    disabled={saving}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all border-2 ${
                      lead.category === cat
                        ? `border-current ${CAT_COLOR[cat]}`
                        : dark ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-500"
                    }`}
                  >
                    {CAT_ICON[cat]} {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ubah Status */}
          <div className={`${card} border rounded-2xl p-4`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${mt}`}>Status</p>
              <button
                onClick={() => setEditStatus(p => !p)}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 ${
                  dark ? "bg-blue-900/40 text-blue-300" : "bg-blue-50 text-blue-600"
                }`}
              >
                <Edit3 size={11} /> Ubah
              </button>
            </div>
            {!editStatus ? (
              <span className={`inline-block text-xs px-3 py-1.5 rounded-xl font-semibold ${
                dark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-700"
              }`}>
                {STATUS_LABEL[lead.status] ?? lead.status}
              </span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {STATUSES.map(st => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    disabled={saving}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                      lead.status === st
                        ? "bg-blue-600 text-white"
                        : dark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {lead.status === st && <Check size={10} />}
                    {STATUS_LABEL[st]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Catatan */}
          <div className={`${card} border rounded-2xl p-4`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${mt} flex items-center gap-1`}>
                <FileText size={11} /> Catatan
              </p>
              {!editNotes && (
                <button
                  onClick={() => setEditNotes(true)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 ${
                    dark ? "bg-blue-900/40 text-blue-300" : "bg-blue-50 text-blue-600"
                  }`}
                >
                  <Edit3 size={11} /> {(lead as any).notes ? "Edit" : "Tambah"}
                </button>
              )}
            </div>
            {!editNotes ? (
              <p className={`text-xs leading-relaxed ${(lead as any).notes ? tx : mt}`}>
                {(lead as any).notes || "Belum ada catatan"}
              </p>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={notesVal}
                  onChange={e => setNotesVal(e.target.value)}
                  placeholder="Tulis catatan..."
                  rows={4}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none resize-none ${
                    dark ? "bg-[#0a1020] border-[#1e2d4a] text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditNotes(false)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold ${dark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-600"}`}
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    disabled={saving}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white flex items-center justify-center gap-1"
                  >
                    <Check size={12} /> Simpan
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tombol Aksi */}
          <button
            onClick={() => onOpenScript(lead)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-green-500 text-white font-semibold text-sm shadow-lg shadow-green-200"
          >
            <MessageCircle size={16} /> Buka Script WA
          </button>

          {/* Delete */}
          {!confirmDel ? (
            <button
              onClick={() => setConfirmDel(true)}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border-2 ${
                dark ? "border-red-900/50 text-red-400" : "border-red-100 text-red-500"
              }`}
            >
              <Trash2 size={15} /> Hapus Lead Ini
            </button>
          ) : (
            <div className={`${card} border border-red-200 rounded-2xl p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-red-500" />
                <p className={`text-sm font-semibold ${tx}`}>Hapus lead ini?</p>
              </div>
              <p className={`text-xs ${mt} mb-3`}>Data lead <b>{lead.name}</b> akan dihapus permanen.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDel(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-medium ${dark ? "bg-white/10 text-slate-300" : "bg-slate-100"}`}
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-red-500 text-white flex items-center justify-center gap-1"
                >
                  <Trash2 size={12} /> Ya, Hapus
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export function MobileLeadsPage({
  leads, dark = false, onBack, onOpenScript, currentUser, onLeadAdded,
  onUpdateLead, onDeleteLead,
}: MobileLeadsPageProps) {
  const [search, setSearch]           = useState("");
  const [filter, setFilter]           = useState<Filter>("All");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const card = dark ? "bg-[#111d35] border-[#1e2d4a]" : "bg-white border-slate-100";
  const tx   = dark ? "text-slate-100" : "text-slate-800";
  const mt   = dark ? "text-slate-400" : "text-slate-500";

  const filtered = useMemo(
    () =>
      leads.filter((l) => {
        const q = search.toLowerCase();
        const matchSearch =
          l.name.toLowerCase().includes(q) ||
          l.child_name.toLowerCase().includes(q) ||
          l.area.toLowerCase().includes(q);
        const matchCat = filter === "All" || l.category === filter;
        return matchSearch && matchCat;
      }),
    [leads, search, filter]
  );

  const count = (c: Filter) => (c === "All" ? leads.length : leads.filter((l) => l.category === c).length);

  // ✅ Jika ada lead dipilih, tampilkan detail drawer
  if (selectedLead) {
    // Cari versi terbaru dari lead di array (supaya data update terlihat)
    const latestLead = leads.find(l => l.id === selectedLead.id) ?? selectedLead;
    return (
      <div className={`flex-1 overflow-hidden flex flex-col relative ${dark ? "bg-[#0a1020]" : "bg-gray-50"}`}>
        <LeadDetailDrawer
          lead={latestLead}
          dark={dark}
          onClose={() => setSelectedLead(null)}
          onOpenScript={(l) => { setSelectedLead(null); onOpenScript(l); }}
          onUpdateLead={onUpdateLead}
          onDeleteLead={onDeleteLead}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-5 pt-12 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white"
          >
            <ChevronRight size={18} className="rotate-180" />
          </button>
          <div>
            <h2 className="text-white font-bold text-lg">Leads</h2>
            <p className="text-blue-200 text-xs">
              {leads.length} total · {count("HOT")} HOT · {count("WARM")} WARM
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-white/15 border border-white/20 mb-3">
          <Search size={14} className="text-white/60 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, anak, area..."
            className="flex-1 bg-transparent text-white placeholder-white/50 text-sm outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X size={14} className="text-white/60" />
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {(["All", "HOT", "WARM", "COLD"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === f
                  ? "bg-white text-blue-600 shadow"
                  : "bg-white/15 text-white border border-white/20"
              }`}
            >
              {f === "HOT" ? "🔥 HOT" : f === "WARM" ? "🌡️ WARM" : f === "COLD" ? "❄️ COLD" : "Semua"}{" "}
              <span className="opacity-70">({count(f)})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Lead list */}
      <div className="p-4 space-y-3">
        {filtered.map((l) => (
          <div
            key={l.id}
            className={`${card} border rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-all cursor-pointer`}
            onClick={() => setSelectedLead(l)}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {l.name.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-sm font-semibold ${tx} truncate`}>{l.name}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-1 font-semibold flex-shrink-0 ml-2 ${CAT_COLOR[l.category]}`}>
                    {CAT_ICON[l.category]} {l.category}
                  </span>
                </div>

                <p className={`text-xs ${mt} mb-1.5`}>
                  Anak: {l.child_name} · {l.area}
                </p>

                <UrgencyBadge lastContactAt={l.last_contact_at} category={l.category} />

                <div className="flex items-center justify-between mt-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${dark ? "bg-white/10 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                    {STATUS_LABEL[l.status] ?? l.status}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); onOpenScript(l); }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 text-green-600 text-[10px] font-medium hover:bg-green-100 active:scale-95 transition-all"
                    >
                      <MessageCircle size={10} /> Script WA
                    </button>
                    <span className={`text-[10px] ${mt}`}>
                      Detail →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className={`text-center py-12 ${mt}`}>
            <Search size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Tidak ada lead ditemukan</p>
            <p className="text-xs mt-1 opacity-70">Coba ubah filter atau kata kunci</p>
          </div>
        )}
      </div>
    </div>
  );
}
