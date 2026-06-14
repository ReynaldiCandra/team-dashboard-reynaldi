"use client";
interface KpiRingProps { done:number;target:number;size?:number;label?:string; }
export function KpiRing({ done,target,size=68,label="Target Closing" }:KpiRingProps) {
  const r=(size-10)/2,circ=2*Math.PI*r,offset=circ*(1-Math.min(done/target,1));
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center" style={{width:size,height:size}}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} strokeWidth={8} fill="none" className="stroke-blue-100"/>
          <circle cx={size/2} cy={size/2} r={r} strokeWidth={8} fill="none" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} className="stroke-blue-500 transition-all duration-700"/>
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-base font-bold text-blue-600 leading-none">{done}</span>
          <span className="text-[8px] text-slate-400">/{target}</span>
        </div>
      </div>
      <p className="text-[9px] text-slate-400 mt-1 text-center">{label}</p>
    </div>
  );
}