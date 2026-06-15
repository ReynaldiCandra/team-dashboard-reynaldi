"use client";
import { useState } from "react";
import { useKPI } from "@/hooks/useKPI";

type MKey = "leads"|"prospect"|"meeting"|"proposal"|"closing"
  |"revenue_jt"|"followup"|"treat_baru"|"treat_lama";

const M: {key:MKey;label:string;target:number;color:string}[] = [
  {key:"leads",      label:"Leads Masuk",  target:30, color:"#3b82f6"},
  {key:"prospect",   label:"Prospect",     target:20, color:"#8b5cf6"},
  {key:"meeting",    label:"Meeting",      target:10, color:"#06b6d4"},
  {key:"proposal",   label:"Proposal",     target:8,  color:"#f59e0b"},
  {key:"closing",    label:"Closing",      target:5,  color:"#10b981"},
  {key:"revenue_jt", label:"Revenue (jt)", target:50, color:"#f97316"},
  {key:"followup",   label:"Follow-up",    target:50, color:"#ec4899"},
  {key:"treat_baru", label:"Treat. Baru",  target:15, color:"#14b8a6"},
  {key:"treat_lama", label:"Treat. Lama",  target:20, color:"#a855f7"},
];

const tgl = () => new Date().toLocaleDateString("id-ID",
  {weekday:"long",day:"numeric",month:"long",year:"numeric"});

interface Props {dark?:boolean; role?:"manager"|"staff"}

export function KPIManagerView({dark:d=false,role="staff"}:Props) {
  const {values,setValues,loading,saving,saved,error,save} = useKPI();
  const [ci, setCi] = useState(false);
  const bg   = d ? "bg-[#0b1120]"     : "bg-slate-50";
  const card = d ? "bg-[#111d35]"     : "bg-white";
  const tx   = d ? "text-white"       : "text-slate-800";
  const mt   = d ? "text-slate-400"   : "text-slate-500";
  const bd   = d ? "border-[#1e2d4a]" : "border-slate-200";

  if (loading) return (
    <div className={"min-h-full flex items-center justify-center "+bg}>
      <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"/>
    </div>
  );

  return (
    <div className={"min-h-full p-6 "+bg}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={"text-xl font-bold "+tx}>Input KPI Harian</h1>
          <p className={"text-sm "+mt}>{tgl()} — {role==="manager"?"Manager":"Staff"}</p>
        </div>
        <button onClick={()=>setCi(true)}
          className={"px-4 py-2 rounded-xl text-sm font-semibold "+(ci
            ?"bg-green-500/20 text-green-400 border border-green-500/30"
            :"bg-amber-500/20 text-amber-500 border border-amber-500/30")}>
          {ci?"Sudah Check-In":"Belum Check-In"}
        </button>
      </div>

      {/* Banner */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-4 text-white">
        <p className="font-semibold text-sm">Satu closing satu langkah lebih dekat ke target!</p>
        <p className="text-xs opacity-80 mt-0.5">Alexandria Islamic School</p>
      </div>

      {/* Ads Spend */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className={"rounded-2xl border p-4 "+card+" "+bd}>
          <p className={"text-xs font-semibold mb-1 "+mt}>Meta Ads Spend</p>
          <div className="flex items-center gap-1">
            <span className={"text-sm "+mt}>Rp</span>
            <input type="number" min={0} value={values.meta_ads_spend}
              onChange={e=>setValues(p=>({...p,meta_ads_spend:Number(e.target.value)}))}
              className={"flex-1 text-xl font-bold bg-transparent outline-none "+tx}/>
          </div>
        </div>
        <div className={"rounded-2xl border p-4 "+card+" "+bd}>
          <p className={"text-xs font-semibold mb-1 "+mt}>Google Ads Spend</p>
          <div className="flex items-center gap-1">
            <span className={"text-sm "+mt}>Rp</span>
            <input type="number" min={0} value={values.google_ads_spend}
              onChange={e=>setValues(p=>({...p,google_ads_spend:Number(e.target.value)}))}
              className={"flex-1 text-xl font-bold bg-transparent outline-none "+tx}/>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {M.map(m=>{
          const val = values[m.key];
          const pct = Math.min(100,Math.round((val/m.target)*100));
          return (
            <div key={m.key} className={"rounded-2xl border p-4 "+card+" "+bd}>
              <div className="flex items-center justify-between mb-2">
                <span className={"text-xs font-semibold "+tx}>{m.label}</span>
                <span className={"text-xs font-bold px-2 py-0.5 rounded-full "+(pct===0
                  ?"bg-red-500/20 text-red-400":pct<50
                  ?"bg-amber-500/20 text-amber-500"
                  :"bg-green-500/20 text-green-500")}>{pct}%</span>
              </div>
              <div className="flex items-baseline gap-1 my-2">
                <input type="number" min={0} value={val}
                  onChange={e=>setValues(p=>({...p,[m.key]:Number(e.target.value)}))}
                  className={"w-16 text-2xl font-bold bg-transparent outline-none "+tx}/>
                <span className={"text-sm "+mt}>/{m.target}</span>
              </div>
              <div className={"h-1.5 rounded-full mb-1 "+(d?"bg-white/10":"bg-slate-100")}>
                <div className="h-full rounded-full transition-all"
                  style={{width:pct+"%",background:m.color}}/>
              </div>
              <p className={"text-xs "+mt}>Update (saat ini: {val})</p>
            </div>
          );
        })}
      </div>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <button onClick={()=>save({role})} disabled={saving}
        className={"w-full py-3 rounded-2xl font-semibold text-sm "+(saved
          ?"bg-green-500 text-white":saving
          ?"bg-blue-400 text-white"
          :"bg-blue-600 hover:bg-blue-700 text-white")}>
        {saved?"Tersimpan!":saving?"Menyimpan...":"Simpan KPI Hari Ini"}
      </button>

      {/* Daily Report */}
      <div className={"mt-6 rounded-2xl border p-4 "+card+" "+bd}>
        <h2 className={"text-sm font-bold mb-3 "+tx}>
          Daily Report TIM F ({new Date().toLocaleDateString("id-ID")})
        </h2>
        <div className={"text-xs space-y-1 "+mt}>
          <p className="font-semibold">Spend Budget</p>
          <p className="pl-3">Meta Ads : <span className={tx+" font-semibold"}>{values.meta_ads_spend>0?"Rp "+values.meta_ads_spend.toLocaleString("id-ID"):"-"}</span></p>
          <p className="pl-3">Google Ads : <span className={tx+" font-semibold"}>{values.google_ads_spend>0?"Rp "+values.google_ads_spend.toLocaleString("id-ID"):"-"}</span></p>
          <p className="font-semibold mt-2">Total Leads</p>
          <p className="pl-3">Meta Ads: <span className={tx+" font-semibold"}>{values.meta_ads_leads}</span></p>
          <p className="pl-3">Google Ads: <span className={tx+" font-semibold"}>{values.google_ads_leads}</span>
          </p>
          <p className="mt-2">Warms:
            <span className={tx+" font-semibold"}> {values.prospect}</span>
          </p>
          <p>Hot Leads:
            <span className={tx+" font-semibold"}> {values.meeting}</span>
          </p>
          <p>Closing:
            <span className={tx+" font-semibold"}> {values.closing}</span>
          </p>
        </div>
      </div>

    </div>
  );
}
