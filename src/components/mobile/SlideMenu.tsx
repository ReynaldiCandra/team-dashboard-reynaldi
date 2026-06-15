"use client";
import { X,Home,Users,MessageCircle,CheckSquare,BarChart2,Award,Calendar,Activity,Settings,LogOut,Sun,Moon,Flame } from "lucide-react";
interface P { open:boolean;onClose:()=>void;activeTab:string;onNavigate:(t:string)=>void;dark:boolean;onToggleDark:()=>void;user:{name:string;role:string;team:string};streak?:number;onLogout?:()=>Promise<void>; }
const ITEMS=[{icon:Home,label:"Dashboard",tab:"home"},{icon:Users,label:"Leads",tab:"leads"},{icon:MessageCircle,label:"Script WA",tab:"wa"},{icon:CheckSquare,label:"Tasks",tab:"tasks"},{icon:BarChart2,label:"KPI & Performa",tab:"kpi"},{icon:Award,label:"Leaderboard",tab:"leaderboard"},{icon:Calendar,label:"Jadwal Follow Up",tab:"schedule"},{icon:Activity,label:"Activity Log",tab:"reports"},{icon:Settings,label:"Pengaturan",tab:"profile"}];
function roleLabel(r:string){if(r==="head_manager")return"Head Manager";if(r==="manager")return"Manager";return"Staff Marketing";}
export function SlideMenu({open,onClose,activeTab,onNavigate,dark,onToggleDark,user,streak=0,onLogout}:P){
  if(!open)return null;
  const go=(t:string)=>{onNavigate(t);onClose();};
  async function handleLogout(){onClose();await onLogout?.();}
  return(
    <div className="absolute inset-0 z-40 flex">
      <div className="flex-1 bg-black/40" onClick={onClose}/>
      <div className={`w-72 h-full ${dark?"bg-[#0d1a30]":"bg-white"} shadow-2xl flex flex-col`}>
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 pb-6">
          <div className="flex items-center justify-between mb-4"><span className="text-white text-sm font-semibold opacity-80">Menu</span><button onClick={onClose} className="text-white/70 hover:text-white"><X size={18}/></button></div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg border-2 border-white/30">{user.name.charAt(0)}</div>
            <div><p className="text-white font-semibold text-sm">{user.name}</p><p className="text-white/70 text-xs">{roleLabel(user.role)}</p>{user.team&&<p className="text-white/60 text-[10px]">Tim {user.team}</p>}{streak>0&&<div className="flex items-center gap-1 mt-0.5"><Flame size={10} className="text-orange-300"/><span className="text-orange-300 text-[10px] font-semibold">{streak} hari streak!</span></div>}</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {ITEMS.map(m=>{const Icon=m.icon;const a=activeTab===m.tab;return(<button key={m.tab} onClick={()=>go(m.tab)} className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors ${a?"bg-blue-50 text-blue-600 border-r-2 border-blue-500":dark?"text-slate-300 hover:bg-white/5":"text-slate-700 hover:bg-slate-50"}`}><Icon size={18}/>{m.label}</button>);})}
          <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-5 py-3 text-sm text-red-500 mt-2 border-t ${dark?"border-white/10":"border-slate-100"} hover:bg-red-50 transition-colors`}><LogOut size={18}/>Keluar</button>
        </div>
        <div className={`p-4 border-t ${dark?"border-white/10":"border-slate-100"}`}>
          <button onClick={onToggleDark} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm ${dark?"bg-white/5 text-slate-300":"bg-slate-50 text-slate-700"}`}>
            <span className="flex items-center gap-2">{dark?<Moon size={15}/>:<Sun size={15}/>}{dark?"Mode Gelap":"Mode Terang"}</span>
            <div className={`w-9 h-5 rounded-full relative ${dark?"bg-blue-500":"bg-slate-200"}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow transition-all ${dark?"left-4":"left-0.5"}`}/></div>
          </button>
        </div>
      </div>
    </div>
  );
}
