"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Home, Users, MessageCircle, Calendar, User } from "lucide-react";
import { MobileHomePage } from "./MobileHomePage";
import { MobileLeadsPage } from "./MobileLeadsPage";
import { WAScriptPage } from "./WAScriptPage";
import { SchedulePage } from "./SchedulePage";
import { SlideMenu } from "./SlideMenu";
import { NotifPanel } from "./NotifPanel";
import { FabAddLead } from "./FabAddLead";
import { Confetti } from "./Confetti";
import { MobileProfilePage } from "./MobileProfilePage";

// ── Types ──────────────────────────────────────────────────────────────────
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
  // User info — pass from your session/auth hook
  userId: string;
  userName: string;
  userRole: string;
  userTeam: string;
  staffName?: string;

  // Data — pass from your existing hooks (useLeads, useLeaderboard, etc.)
  leads: Lead[];
  tasks?: Task[];
  leaderboard?: LeaderboardEntry[];
  notifications?: Notification[];

  // KPI data
  kpiDone?: number;
  kpiTarget?: number;

  // Chart data (leads per day, 7 days)
  chartData?: { day: string; val: number }[];

  // Streak count (from useStreak hook)
  streak?: number;

  // Callbacks — wire these to your existing Supabase mutations
  onAddLead: (data: { name: string; child_name: string; phone: string; area: string; category: "HOT" | "WARM" | "COLD" }) => Promise<void>;
  onToggleTask?: (taskId: string, done: boolean) => Promise<void>;
  onMarkNotifsRead?: () => Promise<void>;
  joinedAt?: string;
  onLogout?: () => Promise<void>;
}

// ── Bottom nav config ──────────────────────────────────────────────────────
const NAV_TABS = [
  { tab: "home",     Icon: Home,          label: "Home"      },
  { tab: "leads",    Icon: Users,         label: "Leads"     },
  { tab: "wa",       Icon: MessageCircle, label: "Script WA", center: true },
  { tab: "schedule", Icon: Calendar,      label: "Jadwal"    },
  { tab: "profile",  Icon: User,          label: "Profil"    },
] as const;

type Tab = typeof NAV_TABS[number]["tab"] | string;

// ── Main Component ─────────────────────────────────────────────────────────
export function MobileLayout({
  userId, userName, userRole, userTeam, staffName,
  leads = [], tasks: propTasks = [], leaderboard = [],
  notifications: propNotifs = [],
  kpiDone = 0, kpiTarget = 10, chartData, streak = 0,
  onAddLead, onToggleTask, onMarkNotifsRead, onLogout, joinedAt,
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

  // Sync props → state only when parent data actually changes
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

  return (
    <div className={`relative h-full w-full ${bg} overflow-hidden flex flex-col`}>
      {/* ── Confetti ── */}
      <Confetti active={confetti} />

      {/* ── Toast ── */}
      {toast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[60] bg-slate-800 text-white text-xs px-4 py-2 rounded-full shadow-lg whitespace-nowrap pointer-events-none">
          {toast}
        </div>
      )}

      {/* ── Overlays ── */}
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
      />

      {/* ── Pages ── */}
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

        {/* Placeholder for other tabs */}
        {!["home", "leads", "wa", "schedule", "profile"].includes(activeTab) && (
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
      </div>

      {/* ── FAB ── */}
      {["home", "leads"].includes(activeTab) && !menuOpen && !notifOpen && (
        <FabAddLead dark={dark} onAdd={handleAddLead} />
      )}

      {/* ── Bottom Navigation ── */}
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
