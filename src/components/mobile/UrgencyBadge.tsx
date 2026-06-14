interface UrgencyBadgeProps { lastContactAt?:string|null;category:string; }
function daysSince(d?:string|null){if(!d)return 999;return Math.floor((Date.now()-new Date(d).getTime())/(1000*60*60*24));}
export function UrgencyBadge({ lastContactAt,category }:UrgencyBadgeProps) {
  const days=daysSince(lastContactAt);
  if(category==="HOT"&&days>=2) return <span className="text-[9px] px-1.5 py-0.5 bg-red-500 text-white rounded-full font-semibold animate-pulse">⚠️ {days}h tdk follow up</span>;
  if(category==="WARM"&&days>=4) return <span className="text-[9px] px-1.5 py-0.5 bg-orange-400 text-white rounded-full font-semibold">⏰ {days}h idle</span>;
  if(days>=6) return <span className="text-[9px] px-1.5 py-0.5 bg-slate-400 text-white rounded-full font-semibold">{days}h idle</span>;
  return null;
}