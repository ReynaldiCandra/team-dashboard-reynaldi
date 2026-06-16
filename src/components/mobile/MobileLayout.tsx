"use client";
import { MobileAIMarketing } from "@/components/mobile/MobileAIMarketing";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Home, Users, MessageCircle, Calendar, User, Sparkles } from "lucide-react";
import { MobileHomePage } from "./MobileHomePage";
import { MobileDailyReportView } from "./MobileDailyReportView";
import { MobileLeadsPage } from "./MobileLeadsPage";
import { WAScriptPage } from "./WAScriptPage";
import { SchedulePage } from "./SchedulePage";
import { SlideMenu } from "./SlideMenu";
import { NotifPanel } from "./NotifPanel";
import { FabAddLead } from "./FabAddLead";
import { Confetti } from "./Confetti";
import { MobileProfilePage } from "./MobileProfilePage";
import { MobileLeaderboardPage } from "./MobileLeaderboardPage";
import { MobileReportPage } from "./MobileReportPage";
import { MobileKpiPage } from "./MobileKpiPage";

interface Lead {
  id: string;
  name: string;
  phone: string;
  child_name: string;
  category: "HOT" | "WARM" | "COLD";
  status: string;
  area: string;
  assigned_to: string;
  team: string | null;
  created_at: string;
  last_contact_at?: string | null;
  follow_up_date?: string | null;
}

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

interface Notification {
  id: string;
  message: string;
  created_at: string;
  read: boolean;
  from?: "Manager" | "Head Manager" | "Sistem";
}

interface MobileLayoutProps {
  userId: string;
  userName: string;
  userRole: string;
  userTeam: string;
  staffName?: string;

  leads: Lead[];
  tasks?: Task[];
  leaderboard?: LeaderboardEntry[];
  notifications?: Notification[];

  kpiDone?: number;
  kpiTarget?: number;
  chartData?: { day: string; val: number }[];
  streak?: number;

  onAddLead: (data: { name: string; child_name: string; phone: string; area: string; category: "HOT" | "WARM" | "COLD"; jenjang?: string; sekolah_asal?: string }) => Promise<void>;
  // ✅ Tambah callback update/delete lead
  onUpdateLead?: (leadId: string, updates: { category?: string; status?: string; notes?: string }) => Promise<void>;
  onDeleteLead?: (leadId: string) => Promise<void>;
  onToggleTask?: (taskId: string, done: boolean) => Promise<void>;
  onMarkNotifsRead?: () => Promise<void>;
  joinedAt?: string;
  onLogout?: () => Promise<void>;
}

const NAV_TABS = [
  { tab: "leads",        Icon: Users,    label: "Leads"  },
  { tab: "home",         Icon: Home,     label: "Home",  center: true },
  { tab: "ai-marketing", Icon: Sparkles, label: "AI"     },
  { tab: "profile",      Icon: User,     label: "Profil" },
] as const;

type Tab = typeof NAV_TABS[number]["tab"] | string;

// ✅ Semua tab yang sudah punya halaman nyata

const ROLE_ALLOWED: Record<string, string[]> = {
  head_manager: ["home","leads","wa","schedule","profile","leaderboard","reports","kpi","tasks","broadcast","promo","guide","ai-marketing","daily-report","goals","activity"],
  manager:      ["home","leads","wa","schedule","profile","leaderboard","reports","kpi","tasks","broadcast","promo","guide","ai-marketing","daily-report"],
  staff:        ["home","leads","wa","schedule","profile","kpi","tasks","broadcast","promo","guide","ai-marketing","daily-report"],
};

const HANDLED_TABS = ["home", "leads", "wa", "schedule", "profile", "leaderboard", "reports", "kpi", "tasks", "broadcast", "promo", "guide", "ai-marketing", "daily-report"];

export function MobileLayout({
  userId, userName, userRole, userTeam, staffName,
  leads = [], tasks: propTasks = [], leaderboard = [],
  notifications: propNotifs = [],
  kpiDone = 0, kpiTarget = 10, chartData, streak = 0,
  onAddLead, onUpdateLead, onDeleteLead,
  onToggleTask, onMarkNotifsRead, onLogout, joinedAt,
}: MobileLayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(propTasks);
  const [notifs, setNotifs] = useState<Notification[]>(propNotifs);
  const [confetti, setConfetti] = useState(false);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [scriptLead, setScriptLead] = useState<Lead | null>(null);

  const prevNotifsRef = useRef(propNotifs);
  useEffect(() => {
    if (prevNotifsRef.current !== propNotifs) {
      prevNotifsRef.current = propNotifs;
      setNotifs(propNotifs);
    }
  }, [propNotifs]);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  const go = useCallback((tab: Tab) => {
    setActiveTab(tab);
    setMenuOpen(false);
  }, []);

  const handleOpenNotifs = useCallback(async () => {
    setNotifOpen(true);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    await onMarkNotifsRead?.();
  }, [onMarkNotifsRead]);

  const handleToggleTask = useCallback(async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newDone = !task.done;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done: newDone } : t)));
    if (newDone) {
      showToast("✅ Task selesai!");
      setConfetti(true);
      setTimeout(() => setConfetti(false), 1800);
    }
    await onToggleTask?.(taskId, newDone);
  }, [tasks, onToggleTask, showToast]);

  const handleAddLead = useCallback(async (data: Parameters<typeof onAddLead>[0]) => {
    await onAddLead(data);
    showToast("✅ Lead baru berhasil ditambahkan!");
  }, [onAddLead, showToast]);

  const handleOpenScript = useCallback((lead: Lead) => {
    setScriptLead(lead);
    go("wa");
  }, [go]);

  const searchResults = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.child_name.toLowerCase().includes(q) ||
        l.area.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q)
    );
  }, [search, leads]);

  const bg  = dark ? "bg-[#0a1020]" : "bg-gray-50";
  const nav = dark ? "bg-[#111d35] border-[#1e2d4a]" : "bg-white border-slate-100";
  const mt  = dark ? "text-slate-500" : "text-slate-400";

  const user = { name: userName, role: userRole, team: userTeam };

  // Tasks page sederhana (inline)
  const renderTasksPage = () => (
    <div className="flex-1 overflow-y-auto pb-20">
      <div className="bg-gradient-to-br from-violet-600 to-purple-700 px-5 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => go("home")} className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
          </button>
          <div>
            <h2 className="text-white font-bold text-lg">Tasks</h2>
            <p className="text-white/70 text-xs">{tasks.filter(t => !t.done).length} tugas aktif</p>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {tasks.length === 0 && (
          <div className={`text-center py-12 ${mt}`}>
            <p className="text-sm font-medium">Tidak ada tasks</p>
          </div>
        )}
        {tasks.map((t) => (
          <div key={t.id} className={`${dark ? "bg-[#111d35] border-[#1e2d4a]" : "bg-white border-slate-100"} border rounded-2xl p-4 flex items-center gap-3`}>
            <button
              onClick={() => handleToggleTask(t.id)}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                t.done ? "bg-green-500 border-green-500" : dark ? "border-slate-500" : "border-slate-300"
              }`}
            >
              {t.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>}
            </button>
            <div className="flex-1">
              <p className={`text-sm font-medium ${t.done ? "line-through opacity-50" : dark ? "text-slate-100" : "text-slate-800"}`}>{t.title}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                t.priority === "high" ? "bg-red-100 text-red-600" :
                t.priority === "medium" ? "bg-orange-100 text-orange-600" :
                "bg-slate-100 text-slate-500"
              }`}>{t.priority}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`relative h-[100dvh] w-full ${bg} overflow-hidden flex flex-col`}>
      <Confetti active={confetti} />

      {toast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[60] bg-slate-800 text-white text-xs px-4 py-2 rounded-full shadow-lg whitespace-nowrap pointer-events-none">
          {toast}
        </div>
      )}

      {notifOpen && (
        <NotifPanel
          notifications={notifs as any}
          dark={dark}
          onClose={() => setNotifOpen(false)}
        />
      )}

      <SlideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        activeTab={activeTab}
        onNavigate={go}
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
        user={user}
        streak={streak}
        onLogout={onLogout}
      />

      {/* Pages */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "home" && (
          <MobileHomePage
            user={user}
            leads={leads}
            tasks={tasks}
            leaderboard={leaderboard}
            chartData={chartData}
            currentUserId={userId}
            unreadCount={unreadCount}
            streak={streak}
            kpiDone={kpiDone}
            kpiTarget={kpiTarget}
            dark={dark}
            search={search}
            onSearchChange={setSearch}
            searchResults={searchResults}
            onOpenMenu={() => setMenuOpen(true)}
            onOpenNotifs={handleOpenNotifs}
            onNavigate={go}
            onToggleTask={handleToggleTask}
            onOpenScript={handleOpenScript}
            onAddLeadFab={() => showToast("Gunakan tombol + untuk tambah lead")}
          />
        )}

        {activeTab === "leads" && (
          <MobileLeadsPage
            leads={leads}
            dark={dark}
            currentUser={{ id: userId, name: userName, role: userRole, team: userTeam }}
            onBack={() => go("home")}
            onOpenScript={handleOpenScript}
            onUpdateLead={onUpdateLead}
            onDeleteLead={onDeleteLead}
            onLeadAdded={() => {}}
          />
        )}

        {activeTab === "wa" && (
          <WAScriptPage
            leads={leads}
            initialLead={scriptLead}
            staffName={staffName ?? userName}
            dark={dark}
            onBack={() => go("home")}
            onToast={showToast}
          />
        )}

        {activeTab === "schedule" && (
          <SchedulePage
            leads={leads}
            dark={dark}
            onBack={() => go("home")}
            onOpenScript={handleOpenScript}
          />
        )}

        {activeTab === "reports" && (
          <MobileReportPage
            dark={dark}
            currentUser={{ id: userId, name: userName, role: userRole, team: userTeam }}
            onBack={() => go("home")}
          />
        )}

        {activeTab === "leaderboard" && (
          <MobileLeaderboardPage
            dark={dark}
            currentUser={{ id: userId, name: userName, role: userRole, team: userTeam }}
            onBack={() => go("home")}
          />
        )}

        {/* ✅ KPI & Performa page */}
        {activeTab === "kpi" && (
          <MobileKpiPage
            dark={dark}
            currentUser={{ id: userId, name: userName, role: userRole, team: userTeam }}
            onBack={() => go("home")}
          />
        )}

        {/* ✅ Tasks page */}
        {activeTab === "tasks" && renderTasksPage()}

        {activeTab === "profile" && (
          <MobileProfilePage
            userId={userId}
            userName={userName}
            userRole={userRole}
            userTeam={userTeam}
            totalLeads={leads.length}
            totalClosing={kpiDone}
            totalHot={leads.filter(l => l.category === 'HOT').length}
            streak={streak}
            dark={dark}
            onToggleDark={() => setDark(d => !d)}
            joinedAt={joinedAt}
            onLogout={onLogout}
            onNavigate={go}
          />
        )}

        {/* ✅ Catch-all: hanya untuk tab yang belum dihandle */}
        
        {activeTab === "ai-marketing" && (
          <div className="flex-1 flex flex-col">
            <div className="bg-gradient-to-br from-violet-600 to-purple-700 px-5 pt-12 pb-6 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => go("home")}
                  className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15,18 9,12 15,6"/>
                  </svg>
                </button>
                <div>
                  <h2 className="text-white font-bold text-lg">AI Marketing</h2>
                  <p className="text-white/70 text-xs">Asisten Cerdas Alexandria</p>
                </div>
              </div>
            </div>
            <MobileAIMarketing dark={dark} />
          </div>
        )}

        {activeTab === "daily-report" && (
          <MobileDailyReportView
            dark={dark}
            onBack={() => go("home")}
            currentUser={{ id: userId, name: userName, role: userRole, team: userTeam }}
          />
        )}
        {!HANDLED_TABS.includes(activeTab) && (
          <div className="flex-1 flex flex-col">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-800 px-5 pt-12 pb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => go("home")}
                  className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
                </button>
                <h2 className="text-white font-bold text-lg capitalize">{activeTab}</h2>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className={`text-sm ${mt} font-medium`}>Halaman ini segera hadir</p>
              <button
                onClick={() => go("home")}
                className="mt-4 px-5 py-2.5 bg-blue-500 text-white text-xs font-semibold rounded-xl active:scale-95"
              >
                ← Kembali ke Home
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      {["home", "leads"].includes(activeTab) && !menuOpen && !notifOpen && (
        <FabAddLead dark={dark} onAdd={handleAddLead} />
      )}

      {/* Bottom Navigation */}
      <div className={`${nav} border-t flex items-center justify-around px-2 py-2 flex-shrink-0`}>
        {(NAV_TABS as unknown as any[]).map(({ tab, Icon, label, center }) =>
          center ? (
            <button
              key={tab}
              onClick={() => go(tab)}
              className="flex flex-col items-center gap-0.5 -mt-5"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${
                  activeTab === tab ? "bg-green-500" : "bg-blue-600"
                } text-white`}
              >
                <Icon size={22} />
              </div>
              <span className={`text-[9px] font-medium mt-0.5 ${activeTab === tab ? "text-green-500" : mt}`}>
                {label}
              </span>
            </button>
          ) : (
            <button
              key={tab}
              onClick={() => go(tab)}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
                activeTab === tab ? "text-blue-600" : mt
              }`}
            >
              <div className={`transition-transform ${activeTab === tab ? "scale-110" : ""}`}>
                <Icon size={20} />
              </div>
              <span className="text-[9px] font-medium">{label}</span>
              {activeTab === tab && <div className="w-1 h-1 bg-blue-500 rounded-full" />}
            </button>
          )
        )}
      </div>
    </div>
  );
}
