"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";
type Cat="HOT"|"WARM"|"COLD";
interface P { dark?:boolean;onAdd:(d:{name:string;child_name:string;phone:string;area:string;category:Cat})=>Promise<void>; }
export function FabAddLead({dark=false,onAdd}:P){
  const [open,setOpen]=useState(false);
  const [loading,setLoading]=useState(false);
  const [cat,setCat]=useState<Cat>("WARM");
  const [form,setForm]=useState({name:"",child_name:"",phone:"",area:""});
  const tx=dark?"text-slate-100":"text-slate-800";
  const mt=dark?"text-slate-400":"text-slate-500";
  async function submit(){
    if(!form.name||!form.child_name||!form.phone)return;
    setLoading(true);
    try{await onAdd({...form,category:cat});setForm({name:"",child_name:"",phone:"",area:""});setCat("WARM");setOpen(false);}
    finally{setLoading(false);}
  }
  return(
    <>
      {!open&&<button onClick={()=>setOpen(true)} className="absolute bottom-24 right-5 z-30 w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-xl hover:bg-blue-600 active:scale-90 transition-all"><Plus size={22}/></button>}
      {open&&(
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <div className="flex-1 bg-black/40" onClick={()=>setOpen(false)}/>
          <div className={`${dark?"bg-[#111d35]":"bg-white"} rounded-t-3xl p-5 pb-8`}>
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-4"/>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-base font-bold ${tx}`}>Tambah Lead Baru</h3>
              <button onClick={()=>setOpen(false)} className={mt}><X size={18}/></button>
            </div>
            {[{k:"name",l:"Nama Orang Tua",p:"Contoh: Budi Santoso"},{k:"child_name",l:"Nama Anak",p:"Contoh: Rafi"},{k:"phone",l:"No. WhatsApp",p:"08xxxxxxxxxx",t:"tel"},{k:"area",l:"Area / Kota",p:"Contoh: Depok"}].map(f=>(
              <div key={f.k} className="mb-3">
                <label className={`text-xs font-semibold ${mt} block mb-1`}>{f.l}</label>
                <input type={f.t??"text"} placeholder={f.p} value={form[f.k as keyof typeof form]} onChange={e=>setForm(pr=>({...pr,[f.k]:e.target.value}))} className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${dark?"bg-white/5 border-white/10 text-slate-200 placeholder-slate-600":"bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400"}`}/>
              </div>
            ))}
            <div className="mb-5">
              <label className={`text-xs font-semibold ${mt} block mb-2`}>Kategori</label>
              <div className="flex gap-2">
                {(["HOT","WARM","COLD"] as Cat[]).map(c=>(
                  <button key={c} onClick={()=>setCat(c)} className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${cat===c?c==="HOT"?"bg-red-500 border-red-500 text-white":c==="WARM"?"bg-orange-400 border-orange-400 text-white":"bg-blue-500 border-blue-500 text-white":c==="HOT"?"border-red-200 bg-red-50 text-red-500":c==="WARM"?"border-orange-200 bg-orange-50 text-orange-500":"border-blue-200 bg-blue-50 text-blue-500"}`}>
                    {c==="HOT"?"🔥 HOT":c==="WARM"?"🌡️ WARM":"❄️ COLD"}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={submit} disabled={loading||!form.name||!form.child_name||!form.phone} className="w-full py-3 bg-blue-500 text-white font-semibold text-sm rounded-2xl hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50">
              {loading?"Menyimpan...":"Simpan Lead"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}