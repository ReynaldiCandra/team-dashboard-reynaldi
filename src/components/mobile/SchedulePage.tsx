"use client";

import { useState } from "react";
import { ChevronRight, MessageCircle } from "lucide-react";
import type { Lead } from "@/types/mobile";

interface SchedulePageProps {
  leads?: Lead[];
  dark?: boolean;
  onBack: () => void;
  onOpenScript: (lead: Lead) => void;
}

const DAYS = ["M", "S", "R", "K", "J", "S", "M"];
const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

const DOT_COLOR: Record<string, string> = {
  HOT: "bg-red-500",
  WARM: "bg-orange-400",
  COLD: "bg-blue-400",
};
const LINE_COLOR: Record<string, string> = {
  HOT: "bg-red-500",
  WARM: "bg-orange-400",
  COLD: "bg-blue-400",
};

function isSameDate(dateStr: string, d: Date): boolean {
  const dt = new Date(dateStr);
  return dt.getFullYear() === d.getFullYear() && dt.getMonth() === d.getMonth() && dt.getDate() === d.getDate();
}

export function SchedulePage({ leads = [], dark = false, onBack, onOpenScript }: SchedulePageProps) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const card = dark ? "bg-[#111d35] border-[#1e2d4a]" : "bg-white border-slate-100";
  const tx = dark ? "text-slate-100" : "text-slate-800";
  const mt = dark ? "text-slate-400" : "text-slate-500";

  // Build calendar days for current view month
  const firstDay = new Date(viewYear, viewMonth, 1);
  const startPad = (firstDay.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const calDays = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function getLeadsForDay(day: number): Lead[] {
    const d = new Date(viewYear, viewMonth, day);
    return leads.filter((l) => l.follow_up_date && isSameDate(l.follow_up_date, d));
  }

  // This week's agenda (next 7 days)
  const agenda = leads
    .filter((l) => {
      if (!l.follow_up_date) return false;
      const dt = new Date(l.follow_up_date);
      const diff = dt.getTime() - today.setHours(0, 0, 0, 0);
      return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
    })
    .sort((a, b) =>
      new Date(a.follow_up_date!).getTime() - new Date(b.follow_up_date!).getTime()
    );

  const isToday = (day: number) =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 px-5 pt-12 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white">
            <ChevronRight size={18} className="rotate-180" />
          </button>
          <div>
            <h2 className="text-white font-bold text-lg">Jadwal Follow Up</h2>
            <p className="text-purple-200 text-xs">{MONTHS[viewMonth]} {viewYear}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Calendar */}
        <div className={`${card} border rounded-2xl p-4 shadow-md`}>
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className={`w-8 h-8 rounded-xl ${dark ? "hover:bg-white/10" : "hover:bg-slate-50"} flex items-center justify-center ${mt} transition-colors`}>
              <ChevronRight size={16} className="rotate-180" />
            </button>
            <span className={`text-sm font-semibold ${tx}`}>{MONTHS[viewMonth]} {viewYear}</span>
            <button onClick={nextMonth} className={`w-8 h-8 rounded-xl ${dark ? "hover:bg-white/10" : "hover:bg-slate-50"} flex items-center justify-center ${mt} transition-colors`}>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d, i) => (
              <div key={i} className={`text-center text-[10px] font-semibold py-1 ${mt}`}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {calDays.map((day, i) => {
              if (day === null) return <div key={`pad-${i}`} />;
              const dayLeads = getLeadsForDay(day);
              const today_ = isToday(day);
              return (
                <div
                  key={day}
                  className={`aspect-square flex flex-col items-center justify-center rounded-xl relative cursor-pointer transition-colors
                    ${today_ ? (dark ? "bg-blue-700" : "bg-blue-500") : dark ? "hover:bg-white/5" : "hover:bg-slate-50"}`}
                >
                  <span className={`text-xs font-semibold ${today_ ? "text-white" : tx}`}>{day}</span>
                  {dayLeads.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                      {dayLeads.slice(0, 3).map((l, j) => (
                        <div key={j} className={`w-1.5 h-1.5 rounded-full ${DOT_COLOR[l.category]}`} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
            {(["HOT", "WARM", "COLD"] as const).map((c) => (
              <div key={c} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${DOT_COLOR[c]}`} />
                <span className={`text-[10px] ${mt}`}>{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Agenda */}
        <div>
          <p className={`text-xs font-semibold ${mt} mb-2 px-1`}>AGENDA 7 HARI KE DEPAN</p>
          {agenda.length === 0 && (
            <div className={`${card} border rounded-2xl p-6 text-center shadow-sm`}>
              <p className="text-2xl mb-2">📭</p>
              <p className={`text-xs ${mt}`}>Tidak ada jadwal follow up minggu ini</p>
            </div>
          )}
          {agenda.map((l) => {
            const dt = new Date(l.follow_up_date!);
            const dateStr = dt.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
            return (
              <div key={l.id} className={`${card} border rounded-2xl p-3 mb-2 flex items-center gap-3 shadow-sm`}>
                <div className={`w-1.5 self-stretch rounded-full flex-shrink-0 ${LINE_COLOR[l.category]}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${tx} truncate`}>{l.name}</p>
                  <p className={`text-[10px] ${mt}`}>
                    {l.child_name} · {l.status}
                  </p>
                  <p className={`text-[10px] font-medium mt-0.5 ${l.category === "HOT" ? "text-red-500" : l.category === "WARM" ? "text-orange-400" : "text-blue-400"}`}>
                    📅 {dateStr}
                  </p>
                </div>
                <button
                  onClick={() => onOpenScript(l)}
                  className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center text-green-500 hover:bg-green-100 active:scale-95 transition-all flex-shrink-0"
                >
                  <MessageCircle size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
