"use client";

import { useState } from "react";
import {
  Menu, Bell, Flame, ChevronRight, CheckSquare, Plus,
  BarChart2, Award, Calendar, Activity, FileText, Phone,
  Gift, BookOpen, Target, TrendingUp, MessageCircle,
  Star, Users,
} from "lucide-react";
import { KpiRing } from "./KpiRing";
import { MiniChart } from "./MiniChart";
import { LeaderboardMini } from "./LeaderboardMini";
import { UrgencyBadge } from "./UrgencyBadge";
import type { Lead } from "@/types/mobile";

interface Task {
  id: string;
  title: string;
  done: boolean;
  priority: "high" | "medium" | "low";
}

interface LeaderboardEntry {
  id: string;
  name: string;
  team?: string;
  points?: number;
  closing_count?: number;
}

interface ChartData {
  day: string;
  val: number;
}

interface MobileHomePageProps {
  user: { name: string; role: string; team: string };
  leads: Lead[];
  tasks: Task[];
  leaderboard: LeaderboardEntry[];
  chartData?: ChartData[];
  currentUserId: string;
  unreadCount: number;
  streak: number;
  kpiDone: number;
  kpiTarget: number;
  dark?: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  searchResults: Lead[];
  onOpenMenu: () => void;
  onOpenNotifs: () => void;
  onNavigate: (tab: string) => void;
  onToggleTask: (id: string) => void;
  onOpenScript: (lead: Lead) => void;
  onAddLeadFab: () => void;
}

const CAT_COLOR: Record<string, string> = {
  HOT: "bg-red-100 text-red-600",
  WARM: "bg-orange-100 text-orange-600",
  COLD: "bg-blue-100 text-blue-600",
};
const PRI_COLOR: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-orange-400",
  low: "bg-blue-400",
};
const MENU_ITEMS = [
  { icon: CheckSquare, label: "Tasks",       color: "bg-purple-500", tab: "tasks" },
  { icon: BarChart2,   label: "KPI",         color: "bg-orange-500", tab: "kpi" },
  { icon: Target,      label: "Goals",       color: "bg-indigo-500", tab: "kpi" },
  { icon: Award,       label: "Ranking",     color: "bg-yellow-500", tab: "leaderboard" },
  { icon: Calendar,    label: "Jadwal",      color: "bg-pink-500",   tab: "schedule" },
  { icon: Activity,    label: "Aktivitas",   color: "bg-teal-500",   tab: "reports" },
  { icon: FileText,    label: "Laporan",     color: "bg-blue-400",   tab: "reports" },
  { icon: Phone,       label: "Broadcast",   color: "bg-rose-500",   tab: "broadcast" },
  { icon: Gift,        label: "Promo",       color: "bg-green-400",  tab: "promo" },
  { icon: BookOpen,    label: "Panduan",     color: "bg-cyan-500",   tab: "guide" },
];

export function MobileHomePage(props: MobileHomePageProps) {
  const {
    user, leads, tasks, leaderboard, chartData, currentUserId,
    unreadCount, streak, kpiDone, kpiTarget, dark = false,
    search, onSearchChange, searchResults,
    onOpenMenu, onOpenNotifs, onNavigate, onToggleTask,
    onOpenScript, onAddLeadFab,
  } = props;

  const card = dark ? "bg-[#111d35] border-[#1e2d4a]" : "bg-white border-slate-100";
  const tx   = dark ? "text-slate-100" : "text-slate-800";
  const mt   = dark ? "text-slate-400" : "text-slate-500";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Selamat Pagi" : hour < 15 ? "Selamat Siang" : hour < 18 ? "Selamat Sore" : "Selamat Malam";

  const doneTasks = tasks.filter((t) => t.done).length;
  const progress  = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const hotCount  = leads.filter((l) => l.category === "HOT").length;

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-5 pt-12 pb-12">
        <div className="flex items-center justify-between mb-5">
          <button onClick={onOpenMenu} className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-colors">
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            {streak > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-400/20 border border-orange-400/30">
                <Flame size={13} className="text-orange-300" />
                <span className="text-orange-200 text-xs font-semibold">{streak}</span>
              </div>
            )}
            <button onClick={onOpenNotifs} className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white relative hover:bg-white/25 transition-colors">
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            <button onClick={onOpenMenu} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm border-2 border-white/30">
              {user.name.charAt(0)}
            </button>
          </div>
        </div>
        <div>
          <p className="text-blue-200 text-sm">{greeting}, 👋</p>
          <h1 className="text-white font-bold text-xl">{user.name}</h1>
          <p className="text-blue-200 text-xs">{user.role} · {user.team}</p>
        </div>
      </div>

      {/* Floating stats card */}
      <div className="px-4 -mt-7 relative z-20">
        <div className={`${card} border rounded-3xl shadow-xl shadow-blue-900/10 p-4`}>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <KpiRing done={kpiDone} target={kpiTarget} size={68} />
            </div>
            <div className={`w-px self-stretch ${dark ? "bg-white/10" : "bg-slate-100"}`} />
            <div className="flex-1 grid grid-cols-3 gap-2">
              {[
                { label: "Total Leads", value: leads.length, icon: <Users size={14} />, color: "bg-blue-50 text-blue-500" },
                { label: "HOT 🔥",      value: hotCount,     icon: <Flame size={14} />, color: "bg-red-50 text-red-500" },
                { label: "Closing",     value: kpiDone,      icon: <Star size={14} />,  color: "bg-yellow-50 text-yellow-500" },
              ].map((s) => (
                <div key={s.label} className={`${s.color} rounded-2xl p-2 text-center`}>
                  <div className="flex justify-center mb-1">{s.icon}</div>
                  <p className="font-bold text-base leading-none">{s.value}</p>
                  <p className="text-[9px] mt-0.5 opacity-70 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mt-4">
        <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl border ${dark ? "bg-[#111d35] border-[#1e2d4a]" : "bg-white border-slate-200"} shadow-sm`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={dark ? "#64748b" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari leads, nama anak, area, kategori..."
            className={`flex-1 bg-transparent text-sm outline-none ${dark ? "text-slate-100 placeholder-slate-600" : "text-slate-700 placeholder-slate-400"}`}
          />
          {search && (
            <button onClick={() => onSearchChange("")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={dark ? "#64748b" : "#94a3b8"} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>
        {search && (
          <div className={`mt-2 ${card} border rounded-2xl overflow-hidden shadow-lg`}>
            {searchResults.length === 0 ? (
              <div className={`text-center py-5 text-xs ${mt}`}>Tidak ditemukan</div>
            ) : (
              searchResults.map((l) => (
                <button
                  key={l.id}
                  onClick={() => { onSearchChange(""); onNavigate("leads"); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-b last:border-0 ${dark ? "border-white/5 hover:bg-white/5" : "border-slate-50 hover:bg-slate-50"} transition-colors text-left`}
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                    {l.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-semibold ${tx}`}>{l.name}</p>
                    <p className={`text-[10px] ${mt}`}>{l.child_name} · {l.area}</p>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${CAT_COLOR[l.category]}`}>{l.category}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Mini Chart */}
      <div className="px-4 mt-4">
        <div className={`${card} border rounded-2xl p-4 shadow-md`}>
          <MiniChart data={chartData} dark={dark} />
        </div>
      </div>

      {/* Menu Lengkap */}
      <div className="px-4 mt-4">
        <div className={`${card} border rounded-2xl p-4 shadow-md`}>
          <p className={`text-xs font-semibold ${mt} mb-3`}>MENU LENGKAP</p>
          <div className="grid grid-cols-5 gap-2">
            {MENU_ITEMS.map((m) => {
              const Icon = m.icon;
              return (
                <button key={m.tab} onClick={() => onNavigate(m.tab)} className="flex flex-col items-center gap-1 group">
                  <div className={`w-11 h-11 rounded-2xl ${m.color} flex items-center justify-center text-white shadow-md transition-all group-hover:scale-110 group-active:scale-95`}>
                    <Icon size={18} />
                  </div>
                  <span className={`text-[9px] font-medium ${mt} leading-tight text-center`}>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Leaderboard Mini */}
      <div className="px-4 mt-4">
        <LeaderboardMini
          entries={leaderboard}
          currentUserId={currentUserId}
          dark={dark}
          onViewAll={() => onNavigate("leaderboard")}
        />
      </div>

      {/* Tasks */}
      <div className="px-4 mt-4">
        <div className={`${card} border rounded-2xl p-4 shadow-md`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckSquare size={14} className="text-blue-500" />
              <span className={`text-sm font-semibold ${tx}`}>Task Hari Ini</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${mt}`}>{doneTasks}/{tasks.length}</span>
              <button
                onClick={onAddLeadFab}
                className="w-6 h-6 rounded-lg bg-blue-500 flex items-center justify-center hover:bg-blue-600 transition-colors"
              >
                <Plus size={12} className="text-white" />
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mb-3">
            <div className={`h-1.5 rounded-full ${dark ? "bg-white/10" : "bg-slate-100"} overflow-hidden`}>
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className={`text-[10px] ${mt}`}>Progress</span>
              <span className={`text-[10px] font-semibold ${progress === 100 ? "text-green-500" : "text-blue-500"}`}>{progress}%</span>
            </div>
          </div>
          {tasks.map((t) => (
            <button
              key={t.id}
              onClick={() => onToggleTask(t.id)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${dark ? "hover:bg-white/5" : "hover:bg-slate-50"}`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${t.done ? "bg-blue-500 border-blue-500" : dark ? "border-slate-600" : "border-slate-300"}`}>
                {t.done && <span className="text-white text-[10px]">✓</span>}
              </div>
              <p className={`flex-1 text-xs leading-tight ${t.done ? `line-through ${mt}` : tx}`}>{t.title}</p>
              <div className={`w-1.5 h-4 rounded-full flex-shrink-0 ${PRI_COLOR[t.priority]}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Leads aktif */}
      <div className="px-4 mt-4">
        <div className={`${card} border rounded-2xl p-4 shadow-md`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-green-500" />
              <span className={`text-sm font-semibold ${tx}`}>Leads Aktif</span>
            </div>
            <button onClick={() => onNavigate("leads")} className={`text-xs ${dark ? "text-blue-400" : "text-blue-500"} flex items-center gap-0.5`}>
              Lihat Semua <ChevronRight size={11} />
            </button>
          </div>
          {leads.slice(0, 4).map((l) => (
            <div key={l.id} className={`flex items-start gap-3 p-2.5 rounded-xl border mb-2 last:mb-0 transition-all ${dark ? "border-white/5 hover:bg-white/5" : "border-slate-50 hover:bg-slate-50 hover:shadow-sm"} group cursor-pointer`}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {l.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${tx} truncate`}>{l.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${CAT_COLOR[l.category]}`}>{l.category}</span>
                  <UrgencyBadge lastContactAt={l.last_contact_at} category={l.category} />
                </div>
              </div>
              <button
                onClick={() => onOpenScript(l)}
                className="w-7 h-7 rounded-xl bg-green-50 flex items-center justify-center text-green-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <MessageCircle size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
