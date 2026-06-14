"use client";
import { ChevronRight } from "lucide-react";
interface E { id:string;name:string;team?:string;points?:number;closing_count?:number; }
interface P { entries:E[];currentUserId:string;dark?:boolean;onViewAll?:()=>void; }
const RANK=["🥇","🥈","🥉"];
const AVC=["bg-yellow-400","bg-slate-400","bg-orange-400","bg-blue-400","bg-green-400","bg-purple-400"];
export function LeaderboardMini({entries,currentUserId,dark=false,onViewAll}:P){
  const card=dark?"bg-[#111d35] border-[#1e2d4a]":"bg-white border-slate-100";
  const tx=dark?"text-slate-100":"text-slate-800";
  const mt=dark?"text-slate-400":"text-slate-500";
  return(
    <div className={`${card} border rounded-2xl p-4 shadow-md`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-semibold ${tx}`}>🏆 Leaderboard Tim</span>
        {onViewAll&&<button onClick={onViewAll} className={`text-xs ${dark?"text-blue-400":"text-blue-500"} flex items-center gap-0.5`}>Semua<ChevronRight size={11}/></button>}
      </div>
      {entries.slice(0,5).map((e,i)=>{
        const isMe=e.id===currentUserId;
        const pts=e.points??e.closing_count??0;
        return(
          <div key={e.id || `entry-${i}`} className={`flex items-center gap-3 py-2 px-2 rounded-xl mb-1 last:mb-0 ${isMe?dark?"bg-blue-900/40 border border-blue-700":"bg-blue-50 border border-blue-100":""}`}>
            <span className={`w-5 text-xs font-bold text-center ${i===0?"text-yellow-500":i===1?"text-slate-400":i===2?"text-orange-400":mt}`}>{i<3?RANK[i]:i+1}</span>
            <div className={`w-7 h-7 rounded-full ${AVC[i%AVC.length]} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>{e.name.charAt(0).toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold ${tx} flex items-center gap-1 truncate`}>{e.name}{isMe&&<span className="text-[9px] bg-blue-500 text-white px-1.5 rounded-full">Kamu</span>}</p>
              {e.team&&<p className={`text-[10px] ${mt}`}>{e.team}</p>}
            </div>
            <span className={`text-xs font-bold ${i===0?"text-yellow-500":dark?"text-slate-300":"text-slate-600"}`}>{pts} pts</span>
          </div>
        );
      })}
      {entries.length===0&&<p className={`text-xs text-center py-4 ${mt}`}>Belum ada data</p>}
    </div>
  );
}