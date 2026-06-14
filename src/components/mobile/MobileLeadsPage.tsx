"use client";

import { useState, useMemo } from "react";
import { ChevronRight, Search, X, MessageCircle, Flame, ThumbsUp, Snowflake } from "lucide-react";
import { UrgencyBadge } from "./UrgencyBadge";
import type { Lead } from "@/types/mobile";

interface MobileLeadsPageProps {
  leads: Lead[];
  dark?: boolean;
  onBack: () => void;
  onOpenScript: (lead: Lead) => void;
  currentUser?: { id: string; name: string; role: string; team: string };
  onLeadAdded?: () => void;
}

type Filter = "All" | "HOT" | "WARM" | "COLD";

const CAT_COLOR: Record<string, string> = {
  HOT: "bg-red-100 text-red-600",
  WARM: "bg-orange-100 text-orange-600",
  COLD: "bg-blue-100 text-blue-600",
};
const CAT_ICON: Record<string, React.ReactNode> = {
  HOT: <Flame size={10} />,
  WARM: <ThumbsUp size={10} />,
  COLD: <Snowflake size={10} />,
};

export function MobileLeadsPage({ leads, dark = false, onBack, onOpenScript, currentUser, onLeadAdded }: MobileLeadsPageProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const card = dark ? "bg-[#111d35] border-[#1e2d4a]" : "bg-white border-slate-100";
  const tx = dark ? "text-slate-100" : "text-slate-800";
  const mt = dark ? "text-slate-400" : "text-slate-500";

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
            <h2 className="text-white font-bold text-lg">Leads Saya</h2>
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
            className={`${card} border rounded-2xl p-4 shadow-md hover:shadow-lg transition-all`}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {l.name.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                {/* Name + category */}
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-sm font-semibold ${tx} truncate`}>{l.name}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-1 font-semibold flex-shrink-0 ml-2 ${CAT_COLOR[l.category]}`}>
                    {CAT_ICON[l.category]} {l.category}
                  </span>
                </div>

                <p className={`text-xs ${mt} mb-1.5`}>
                  Anak: {l.child_name} · {l.area}
                </p>

                {/* Urgency badge */}
                <UrgencyBadge lastContactAt={l.last_contact_at} category={l.category} />

                {/* Status + action */}
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${dark ? "bg-white/10 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                    {l.status}
                  </span>
                  <button
                    onClick={() => onOpenScript(l)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 text-green-600 text-[10px] font-medium hover:bg-green-100 active:scale-95 transition-all"
                  >
                    <MessageCircle size={10} /> Script WA
                  </button>
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
