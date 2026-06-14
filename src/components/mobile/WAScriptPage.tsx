"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, ChevronUp, Copy, Send, MessageCircle, X } from "lucide-react";
import { WA_SCRIPTS } from "@/data/waScripts";
import type { Lead } from "@/types/mobile";

interface WAScriptPageProps {
  leads?: Lead[];
  initialLead?: Lead | null;
  staffName?: string;
  dark?: boolean;
  onBack: () => void;
  onToast: (msg: string) => void;
}

export function WAScriptPage({
  leads = [],
  initialLead = null,
  staffName = "Staff Marketing",
  dark = false,
  onBack,
  onToast,
}: WAScriptPageProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(initialLead);
  const [openScript, setOpenScript] = useState<string | null>(null);
  const [bubbleMode, setBubbleMode] = useState(false);

  const card = dark ? "bg-[#111d35] border-[#1e2d4a]" : "bg-white border-slate-100";
  const tx = dark ? "text-slate-100" : "text-slate-800";
  const mt = dark ? "text-slate-400" : "text-slate-500";

  const totalScripts = WA_SCRIPTS.reduce((s, g) => s + g.scripts.length, 0);

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    onToast("✅ Script tersalin! Paste ke WhatsApp");
  }

  function handleSendWA(phone: string, text: string) {
    const clean = phone.replace(/\D/g, "");
    const wa = clean.startsWith("0") ? "62" + clean.slice(1) : clean;
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 px-5 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white"
          >
            <ChevronRight size={18} className="rotate-180" />
          </button>
          <div>
            <h2 className="text-white font-bold text-lg">Script WhatsApp</h2>
            <p className="text-green-200 text-xs">{totalScripts} template · {WA_SCRIPTS.length} kategori</p>
          </div>
        </div>

        {/* Lead selector */}
        <div className="bg-white/15 rounded-2xl p-3 mb-3">
          <p className="text-white/80 text-xs mb-2 font-medium">
            📌 Pilih Lead — script otomatis dipersonalisasi:
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedLead(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                !selectedLead ? "bg-white text-green-700" : "bg-white/20 text-white"
              }`}
            >
              Manual
            </button>
            {leads.map((l) => (
              <button
                key={l.id}
                onClick={() => setSelectedLead(l)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  selectedLead?.id === l.id ? "bg-white text-green-700" : "bg-white/20 text-white"
                }`}
              >
                {l.name.split(" ")[0]}
              </button>
            ))}
          </div>
          {selectedLead && (
            <p className="text-white/70 text-[10px] mt-2">
              ✅ Untuk{" "}
              <strong className="text-white">{selectedLead.name}</strong> · anak{" "}
              <strong className="text-white">{selectedLead.child_name}</strong>
            </p>
          )}
        </div>

        {/* Bubble toggle */}
        <button
          onClick={() => setBubbleMode(!bubbleMode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            bubbleMode ? "bg-white text-green-700" : "bg-white/20 text-white border border-white/20"
          }`}
        >
          <MessageCircle size={13} />
          {bubbleMode ? "Mode Bubble WA Aktif" : "Preview Bubble WA"}
        </button>
      </div>

      {/* Script categories */}
      <div className="p-4 space-y-4">
        {WA_SCRIPTS.map((group) => (
          <div key={group.category} className={`${card} border rounded-2xl overflow-hidden shadow-md`}>
            {/* Category header */}
            <div className="flex items-center gap-3 p-4 pb-3">
              <div className={`w-9 h-9 rounded-xl ${group.color} flex items-center justify-center text-base`}>
                {group.icon}
              </div>
              <div>
                <p className={`text-sm font-semibold ${tx}`}>{group.category}</p>
                <p className={`text-[10px] ${mt}`}>{group.scripts.length} template</p>
              </div>
            </div>

            <div className={`border-t ${dark ? "border-white/5" : "border-slate-50"}`}>
              {group.scripts.map((s, i) => {
                const key = `${group.category}-${i}`;
                const isOpen = openScript === key;
                const namaOrtu = selectedLead?.name ?? "[Nama Orang Tua]";
                const namaAnak = selectedLead?.child_name ?? "[Nama Anak]";
                const text = s.text(namaOrtu, namaAnak, staffName);

                return (
                  <div key={i} className={`border-b last:border-0 ${dark ? "border-white/5" : "border-slate-50"}`}>
                    {/* Toggle */}
                    <button
                      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                        dark ? "hover:bg-white/5" : "hover:bg-slate-50"
                      }`}
                      onClick={() => setOpenScript(isOpen ? null : key)}
                    >
                      <div>
                        <p className={`text-xs font-semibold ${tx}`}>{s.title}</p>
                        <p className={`text-[10px] ${mt}`}>{s.tag}</p>
                      </div>
                      {isOpen ? (
                        <ChevronUp size={14} className={mt} />
                      ) : (
                        <ChevronDown size={14} className={mt} />
                      )}
                    </button>

                    {/* Expanded content */}
                    {isOpen && (
                      <div className="px-4 pb-4">
                        {bubbleMode ? (
                          /* WhatsApp bubble preview */
                          <div className="rounded-2xl overflow-hidden border border-slate-200">
                            <div className="flex items-center gap-2 bg-[#075E54] px-3 py-2">
                              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">
                                {staffName.charAt(0)}
                              </div>
                              <div>
                                <p className="text-white text-xs font-semibold">{staffName}</p>
                                <p className="text-white/70 text-[9px]">Alexandria School</p>
                              </div>
                            </div>
                            <div className="bg-[#e5ddd5] p-3">
                              <div className="bg-white rounded-2xl rounded-tl-sm p-3 max-w-[90%] shadow-sm">
                                <p className="text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap">
                                  {text}
                                </p>
                                <p className="text-[9px] text-slate-400 text-right mt-1">✓✓</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`rounded-2xl p-3 text-xs leading-relaxed whitespace-pre-wrap ${
                              dark
                                ? "bg-white/5 border border-white/10 text-slate-300"
                                : "bg-slate-50 border border-slate-100 text-slate-600"
                            }`}
                          >
                            {text}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleCopy(text)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 active:scale-95 transition-all"
                          >
                            <Copy size={13} /> Salin
                          </button>
                          {selectedLead && (
                            <button
                              onClick={() => handleSendWA(selectedLead.phone, text)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-500 text-white text-xs font-semibold hover:bg-green-600 active:scale-95 transition-all"
                            >
                              <Send size={13} /> Kirim WA
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
