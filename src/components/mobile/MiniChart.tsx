"use client";
interface D { day:string;val:number; }
const DEF:D[]=[{day:"Sen",val:4},{day:"Sel",val:6},{day:"Rab",val:3},{day:"Kam",val:7},{day:"Jum",val:5},{day:"Sab",val:2},{day:"Min",val:8}];
export function MiniChart({ data=DEF,dark=false }:{ data?:D[];dark?:boolean }) {
  const max=Math.max(...data.map(d=>d.val),1);
  const ti=new Date().getDay()===0?6:new Date().getDay()-1;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-semibold ${dark?"text-slate-100":"text-slate-800"}`}>Leads Masuk (7 Hari)</span>
        <span className={`text-[10px] ${dark?"text-slate-400":"text-slate-500"}`}>Total: {data.reduce((s,d)=>s+d.val,0)}</span>
      </div>
      <div className="flex items-end gap-1.5 h-14">
        {data.map((d,i)=>(
          <div key={d.day} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full rounded-t-md transition-all duration-500" style={{height:`${(d.val/max)*48}px`,background:i===ti?"#3b82f6":dark?"#1e2d4a":"#dbeafe"}}/>
            <span className={`text-[9px] ${i===ti?"text-blue-500 font-semibold":dark?"text-slate-500":"text-slate-400"}`}>{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}