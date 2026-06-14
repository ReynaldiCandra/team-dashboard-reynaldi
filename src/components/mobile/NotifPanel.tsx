"use client";
import { X } from "lucide-react";
interface N { id:string;message:string;time?:string;created_at?:string;read:boolean;from?:string; }
interface P { notifications:N[];dark?:boolean;onClose:()=>void; }
function timeAgo(d?:string){if(!d)return"";const m=Math.floor((Date.now()-new Date(d).getTime())/60000);if(m<1)return"Baru saja";if(m<60)return`${m} mnt lalu`;const h=Math.floor(m/60);if(h<24)return`${h} jam lalu`;return`${Math.floor(h/24)} hari lalu`;}
function sStyle(from?:string){if(from==="Head Manager")return{bg:"bg-purple-600",badge:"bg-purple-100 text-purple-600"};if(from==="Manager")return{bg:"bg-blue-500",badge:"bg-blue-100 text-blue-600"};return{bg:"bg-slate-400",badge:"bg-slate-100 text-slate-500"};}
export function NotifPanel({notifications,dark=false,onClose}:P){
  const bg=dark?"bg-[#0a1020]":"bg-gray-50";
  const card=dark?"bg-[#111d35] border-[#1e2d4a]":"bg-white border-slate-100";
  const tx=dark?"text-slate-100":"text-slate-800";
  const mt=dark?"text-slate-400":"text-slate-500";
  return(
    <div className={`absolute inset-0 z-50 flex flex-col ${bg}`}>
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-5 pt-12 pb-5">
        <div className="flex items-center justify-between">
          <div><h2 className="text-white font-bold text-lg">Notifikasi</h2><p className="text-blue-200 text-xs">{notifications.filter(n=>!n.read).length} belum dibaca</p></div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white"><X size={18}/></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notifications.length===0&&<div className={`text-center py-12 ${mt}`}><p className="text-3xl mb-2">🔔</p><p className="text-sm">Tidak ada notifikasi</p></div>}
        {notifications.map(n=>{const s=sStyle(n.from);return(
          <div key={n.id} className={`${card} border rounded-2xl p-4 shadow-sm ${n.read?"opacity-60":""}`}>
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${s.bg}`}>{n.from==="Head Manager"?"HM":(n.from??"S").charAt(0)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">{n.from&&<span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.badge}`}>{n.from}</span>}{!n.read&&<div className="w-2 h-2 bg-red-500 rounded-full"/>}</div>
                <p className={`text-xs leading-relaxed ${tx}`}>{n.message}</p>
                <p className={`text-[10px] mt-1 ${mt}`}>{n.time??timeAgo(n.created_at)}</p>
              </div>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}