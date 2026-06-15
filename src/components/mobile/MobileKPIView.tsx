"use client";
import { useKPI } from "@/hooks/useKPI";

type MK = "leads"|"prospect"|"meeting"|"proposal"|"closing"
  |"revenue_jt"|"followup"|"treat_baru"|"treat_lama";
const M:{key:MK;label:string;target:number;color:string}[]=[
  {key:"leads",      label:"Leads Masuk", target:30,color:"#3b82f6"},
  {key:"prospect",   label:"Prospect",    target:20,color:"#8b5cf6"},
  {key:"meeting",    label:"Meeting",     target:10,color:"#06b6d4"},
  {key:"proposal",   label:"Proposal",    target:8, color:"#f59e0b"},
  {key:"closing",    label:"Closing",     target:5, color:"#10b981"},
  {key:"revenue_jt", label:"Revenue(jt)", target:50,color:"#f97316"},
  {key:"followup",   label:"Follow-up",   target:50,color:"#ec4899"},
  {key:"treat_baru", label:"Treat.Baru",  target:15,color:"#14b8a6"},
  {key:"treat_lama", label:"Treat.Lama",  target:20,color:"#a855f7"},
];

export function MobileKPIView({dark:d=false}:{dark?:boolean}){
  const {values,setValues,loading,saving,saved,error,save}=useKPI();
  const bg=d?"bg-[#0a1020]":"bg-slate-50";
  const card=d?"bg-[#111d35]":"bg-white";
  const tx=d?"text-white":"text-slate-800";
  const mt=d?"text-slate-400":"text-slate-500";
  const bd=d?"border-[#1e2d4a]":"border-slate-200";
  const rp=(v:number)=>v>0?"Rp "+v.toLocaleString("id-ID"):"-";

  if(loading) return(
    <div className={"flex-1 flex items-center justify-center "+bg}>
      <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"/>
    </div>
  );

  return(
    <div className={"flex-1 overflow-y-auto "+bg}>
      <div className="mx-4 mt-4 mb-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-3 text-white">
        <p className="font-semibold text-xs">Satu closing = satu langkah ke target!</p>
        <p className="text-xs opacity-75 mt-0.5">{new Date().toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long"})}</p>
      </div>

      <div className="px-4 grid grid-cols-2 gap-3 mb-3">
        <div className={"rounded-2xl border p-3 "+card+" "+bd}>
          <p className={"text-xs "+mt}>Meta Spend</p>
          <div className="flex items-center gap-0.5">
            <span className={"text-xs "+mt}>Rp</span>
            <input type="number" min={0} value={values.meta_ads_spend}
              onChange={e=>setValues(p=>({...p,meta_ads_spend:Number(e.target.value)}))}
              className={"flex-1 text-base font-bold bg-transparent outline-none "+tx}/>
          </div>
        </div>
        <div className={"rounded-2xl border p-3 "+card+" "+bd}>
          <p className={"text-xs "+mt}>Google Spend</p>
          <div className="flex items-center gap-0.5">
            <span className={"text-xs "+mt}>Rp</span>
            <input type="number" min={0} value={values.google_ads_spend}
              onChange={e=>setValues(p=>({...p,google_ads_spend:Number(e.target.value)}))}
              className={"flex-1 text-base font-bold bg-transparent outline-none "+tx}/>
          </div>
        </div>
      </div>

      <div className="px-4 grid grid-cols-2 gap-3 pb-4">
        {M.map(m=>{
          const val=values[m.key];
          const pct=Math.min(100,Math.round((val/m.target)*100));
          return(
            <div key={m.key} className={"rounded-2xl border p-3 "+card+" "+bd}>
              <div className="flex items-center justify-between mb-1">
                <span className={"text-xs font-semibold "+tx}>{m.label}</span>
                <span className={"text-xs font-bold px-1.5 py-0.5 rounded-full "+(pct===0?"bg-red-500/20 text-red-400":pct<50?"bg-amber-500/20 text-amber-500":"bg-green-500/20 text-green-500")}>{pct}%</span>
              </div>
              <div className="flex items-center gap-1 mb-1.5">
                <input type="number" min={0} value={val}
                  onChange={e=>setValues(p=>({...p,[m.key]:Number(e.target.value)}))}
                  className={"w-12 text-xl font-bold bg-transparent outline-none "+tx}/>
                <span className={"text-xs "+mt}>/{m.target}</span>
              </div>
              <div className={"h-1.5 rounded-full "+(d?"bg-white/10":"bg-slate-100")}>
                <div className="h-full rounded-full" style={{width:pct+"%",background:m.color}}/>
              </div>
            </div>
          );
        })}
      </div>

      <div className={"mx-4 mb-4 rounded-2xl border p-3 "+card+" "+bd}>
        <p className="text-xs font-bold mb-2 text-blue-400">Daily Report — {new Date().toLocaleDateString("id-ID")}</p>
        <div className={"text-xs space-y-0.5 "+mt}>
          <p>Meta: <span className={tx}>{rp(values.meta_ads_spend)}</span></p>
          <p>Google: <span className={tx}>{rp(values.google_ads_spend)}</span></p>
          <p>Leads: <span className={tx}>{values.leads}</span></p>
          <p>Warms: <span className={tx}>{values.prospect}</span></p>
          <p>Hot: <span className={tx}>{values.meeting}</span></p>
          <p>Closing: <span className={tx}>{values.closing}</span></p>
        </div>
      </div>

      {error&&<p className="px-4 text-red-400 text-xs mb-2">{error}</p>}
      <div className="px-4 pb-6">
        <button onClick={()=>save()} disabled={saving}
          className={"w-full py-3 rounded-2xl font-semibold text-sm "+(saved?"bg-green-500 text-white":saving?"bg-blue-400 text-white":"bg-blue-600 text-white")}>
          {saved?"Tersimpan!":saving?"Menyimpan...":"Simpan KPI Hari Ini"}
        </button>
      </div>
    </div>
  );
}
