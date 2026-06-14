const fs = require("fs");
const path = require("path");

const files = {
"src/types/mobile.ts": `export type LeadCategory = "HOT" | "WARM" | "COLD";
export interface Lead { id:string;name:string;phone:string;child_name:string;category:LeadCategory;status:string;area:string;assigned_to:string;team:string|null;created_at:string;last_contact_at?:string|null;follow_up_date?:string|null; }
export interface LeaderboardEntry { id:string;name:string;team?:string;points?:number;closing_count?:number; }
export interface Notification { id:string;message:string;time?:string;read:boolean;from?:"Manager"|"Head Manager"|"Sistem";created_at?:string; }
export interface Task { id:string;title:string;done:boolean;priority:"high"|"medium"|"low"; }`,

"src/hooks/useStreak.ts": `"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
export function useStreak(userId: string | undefined) {
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    async function fetchStreak() {
      const supabase = createClient();
      const { data } = await supabase.from("activity_log").select("created_at").eq("user_id", userId).order("created_at", { ascending: false });
      if (!data) { setLoading(false); return; }
      const dates = [...new Set(data.map((r) => new Date(r.created_at).toISOString().split("T")[0]))].sort((a,b)=>b.localeCompare(a));
      let count = 0;
      const today = new Date();
      for (let i = 0; i < dates.length; i++) {
        const exp = new Date(today); exp.setDate(today.getDate() - i);
        if (dates[i] === exp.toISOString().split("T")[0]) count++;
        else break;
      }
      setStreak(count); setLoading(false);
    }
    fetchStreak();
  }, [userId]);
  return { streak, loading };
}`,

"src/data/waScripts.ts": `export interface WAScript { title:string;tag:string;text:(namaOrtu:string,namaAnak:string,staffName?:string)=>string; }
export interface WAScriptCategory { category:string;icon:string;color:string;scripts:WAScript[]; }
export const WA_SCRIPTS: WAScriptCategory[] = [
  { category:"Pesan Pertama",icon:"👋",color:"bg-green-500",scripts:[
    { title:"Perkenalan Awal",tag:"Pertama kali hubungi",text:(n,c,s="Staff Marketing")=>\`Assalamualaikum Bapak/Ibu \${n} 🌟\\n\\nPerkenalkan, saya *\${s}* dari Tim Marketing *Alexandria School*.\\n\\nSaya ingin menyampaikan informasi mengenai program unggulan kami yang mungkin sangat cocok untuk putra/putri Bapak/Ibu, *\${c}*.\\n\\nApakah Bapak/Ibu berkenan jika saya berbagi informasi lebih lanjut? 🙏\` },
    { title:"Dari Referral",tag:"Lead dari rekomendasi",text:(n,c,s="Staff Marketing")=>\`Assalamualaikum Bapak/Ibu \${n} 👋\\n\\nSaya *\${s}* dari Alexandria School. Kami mendapat informasi bahwa Bapak/Ibu sedang mencari sekolah terbaik untuk *\${c}*.\\n\\nAlhamdulillah, kami memiliki program yang sangat sesuai! Boleh saya ceritakan sedikit? 😊\` },
    { title:"Dari Media Sosial",tag:"Lead dari IG/FB/TikTok",text:(n,c,s="Staff Marketing")=>\`Halo Bapak/Ibu \${n}! 😊\\n\\nSaya *\${s}* dari *Alexandria School*. Saya melihat Bapak/Ibu tertarik dengan postingan kami.\\n\\nBoleh saya bantu jelaskan lebih detail mengenai program untuk *\${c}*? ✨\` },
    { title:"Dari Pameran",tag:"Setelah pameran/open house",text:(n,c,s="Staff Marketing")=>\`Assalamualaikum Bapak/Ibu \${n} 🎉\\n\\nSenang bertemu di acara kemarin! Saya *\${s}* dari *Alexandria School*.\\n\\nIngin menindaklanjuti ketertarikan mengenai pendaftaran *\${c}*. Ada waktu ngobrol? 🙏\` },
  ]},
  { category:"Follow Up HOT 🔥",icon:"🔥",color:"bg-red-500",scripts:[
    { title:"Dorong ke Closing",tag:"Lead sangat tertarik",text:(n,c)=>\`Assalamualaikum Bapak/Ibu \${n} 😊\\n\\nAda *promo spesial* yang sayang untuk dilewatkan minggu ini untuk *\${c}*!\\n\\n⚡ Kuota terbatas!\\n\\nApakah Bapak/Ibu sudah ada waktu untuk kita diskusikan? 🎯\` },
    { title:"Pengingat Batas Waktu",tag:"Promo hampir habis",text:(n,c)=>\`Bapak/Ibu \${n} 🌟\\n\\n⚠️ *Kuota pendaftaran \${c} tinggal 3 tempat!*\\n\\nApakah Bapak/Ibu sudah siap konfirmasi? Kami bisa proses *hari ini juga!* ✅\` },
    { title:"Setelah Presentasi",tag:"Sudah presentasi/demo",text:(n,c)=>\`Assalamualaikum Bapak/Ibu \${n} 😊\\n\\nTerima kasih sudah meluangkan waktu berdiskusi. Ada pertanyaan mengenai pendaftaran *\${c}*?\\n\\nSaya siap membantu kapan saja 🙏\` },
    { title:"Tawaran Khusus Personal",tag:"Penawaran eksklusif",text:(n,c)=>\`Bapak/Ibu \${n} 🌸\\n\\nKhusus untuk *\${c}*, ada penawaran istimewa:\\n✅ Diskon biaya pendaftaran 20%\\n✅ Seragam gratis 2 set\\n✅ Cicilan 0% hingga 12 bulan\\n\\n*Berlaku hari ini saja!* 🎁\` },
  ]},
  { category:"Follow Up WARM",icon:"🌡️",color:"bg-orange-500",scripts:[
    { title:"Masih Pertimbangkan",tag:"Lead belum memutuskan",text:(n,c)=>\`Halo Bapak/Ibu \${n} 🌸\\n\\nAda *beasiswa & cicilan 0%* untuk *\${c}* bulan ini!\\n\\nAda pertanyaan yang bisa saya bantu? 💬\` },
    { title:"Ajak Kunjungan",tag:"Tour sekolah",text:(n,c)=>\`Bapak/Ibu \${n} 😊\\n\\nBagaimana jika Bapak/Ibu dan *\${c}* berkunjung ke *Alexandria School*?\\n\\n📍 Lihat fasilitas, suasana belajar & bertemu pengajar langsung.\\n\\nMau kita jadwalkan? 🏫\` },
    { title:"Kirim Brosur Digital",tag:"Share materi informasi",text:(n,c)=>\`Assalamualaikum Bapak/Ibu \${n} 👋\\n\\nSaya lampirkan brosur digital untuk *\${c}*. Mohon ditinjau ya 😊\\n\\nAda pertanyaan? Saya siap! 🙏\` },
    { title:"Lead Lama Tidak Respon",tag:"Tidak respon lama",text:(n,c)=>\`Assalamualaikum Bapak/Ibu \${n} 🌟\\n\\nApakah Bapak/Ibu masih berminat dengan info pendaftaran *\${c}*?\\n\\nKami masih siap membantu kapan pun 🙏\` },
  ]},
  { category:"Follow Up COLD ❄️",icon:"❄️",color:"bg-blue-500",scripts:[
    { title:"Penawaran Baru",tag:"Bangkitkan minat lagi",text:(n,c)=>\`Assalamualaikum Bapak/Ibu \${n} 😊\\n\\nAda *program baru yang sangat menarik* untuk \${c}!\\n\\nApakah Bapak/Ibu tertarik mendengar info terbarunya? 🌟\` },
    { title:"Prestasi Sekolah",tag:"Tunjukkan pencapaian",text:(n)=>\`Bapak/Ibu \${n} 🏆\\n\\nKami baru meraih:\\n🥇 Juara 1 Olimpiade Matematika Nasional\\n🏅 Akreditasi A\\n⭐ Rating 4.9/5 dari 500+ ortu\\n\\nMungkin bisa jadi pertimbangan? 😊\` },
    { title:"Promo Musiman",tag:"Promo tahun ajaran baru",text:(n,c)=>\`Halo Bapak/Ibu \${n} 🎊\\n\\n*Promo Tahun Ajaran Baru* untuk *\${c}*:\\n🎁 Beasiswa s/d 50%\\n📚 Buku gratis 1 tahun\\n\\nMinat? 🙏\` },
  ]},
  { category:"Closing & Pembayaran",icon:"⭐",color:"bg-yellow-500",scripts:[
    { title:"Final Closing",tag:"Kuota hampir habis",text:(n,c)=>\`Assalamualaikum Bapak/Ibu \${n} 🌟\\n\\nKuota *\${c}* tinggal *3 tempat!*\\n\\nMau saya bantu proses *hari ini*? ✅\` },
    { title:"Info Cara Bayar",tag:"Setelah deal",text:(n,c)=>\`Bapak/Ibu \${n} 😊\\n\\nInfo pembayaran *\${c}*:\\n🏦 BCA: 1234567890 a.n. Alexandria School\\n\\nKirim bukti transfer ke sini ya 🙏\` },
    { title:"Konfirmasi Terdaftar",tag:"Pembayaran lunas",text:(n,c)=>\`Selamat Bapak/Ibu \${n}! 🎉\\n\\n✅ *\${c} RESMI TERDAFTAR!*\\n\\nSelamat bergabung di keluarga *Alexandria School*! 🏫🌟\` },
    { title:"Pengingat Bayar",tag:"Belum bayar setelah deal",text:(n,c)=>\`Assalamualaikum Bapak/Ibu \${n} 🙏\\n\\nMengingatkan pembayaran *\${c}* yang belum kami terima.\\n\\nAda kendala? Kami siap bantu 😊\` },
  ]},
  { category:"Handling Keberatan",icon:"🤝",color:"bg-teal-500",scripts:[
    { title:"Keberatan Harga",tag:"Lead bilang mahal",text:(n,c)=>\`Bapak/Ibu \${n}, saya paham biaya adalah pertimbangan penting 😊\\n\\nAda *cicilan 0% 12 bulan* lho untuk *\${c}*! Mau saya simulasikan? 😊\` },
    { title:"Keberatan Lokasi",tag:"Lead bilang terlalu jauh",text:(n,c)=>\`Bapak/Ibu \${n} 🙏\\n\\nUntuk *\${c}*, tersedia antar-jemput dari berbagai titik!\\n\\nMau saya cek titik penjemputan terdekat? 😊\` },
    { title:"Bandingkan Sekolah",tag:"Masih compare sekolah lain",text:(n,c)=>\`Bapak/Ibu \${n}, wajar mempertimbangkan banyak pilihan 😊\\n\\nBoleh jadwalkan kunjungan ke *Alexandria* untuk *\${c}* langsung? 🏫\` },
  ]},
  { category:"After Sales & Loyalitas",icon:"💎",color:"bg-pink-500",scripts:[
    { title:"Check-in Siswa Baru",tag:"1 bulan setelah masuk",text:(n,c)=>\`Assalamualaikum Bapak/Ibu \${n} 😊\\n\\nSudah 1 bulan *\${c}* di *Alexandria*. Bagaimana perkembangannya?\\n\\nTerima kasih sudah mempercayai kami 🌟\` },
    { title:"Minta Referral",tag:"Minta rekomendasi ke teman",text:(n,c)=>\`Assalamualaikum Bapak/Ibu \${n} 🌟\\n\\n*\${c}* sudah berkembang luar biasa!\\n\\nJika ada kenalan yang mencari sekolah, ada *bonus spesial* untuk setiap referral! 🎁\` },
  ]},
];`,

"src/components/mobile/KpiRing.tsx": `"use client";
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
}`,

"src/components/mobile/Confetti.tsx": `"use client";
import { useMemo } from "react";
const COLORS=["#f87171","#60a5fa","#34d399","#fbbf24","#a78bfa","#f472b6","#fb923c"];
export function Confetti({ active }:{ active:boolean }) {
  const pieces=useMemo(()=>Array.from({length:30},(_,i)=>({id:i,x:Math.random()*100,delay:Math.random()*0.6,dur:0.9+Math.random()*0.7,color:COLORS[i%COLORS.length],size:5+Math.random()*6,rot:Math.random()*360,isCircle:Math.random()>0.5})),[]);
  if(!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      <style>{\`@keyframes confettiFall{0%{transform:translateY(-10px) rotate(0deg);opacity:1}100%{transform:translateY(900px) rotate(720deg);opacity:0}}\`}</style>
      {pieces.map(p=><div key={p.id} style={{position:"absolute",left:\`\${p.x}%\`,top:"-10px",width:p.size,height:p.size,backgroundColor:p.color,borderRadius:p.isCircle?"50%":"2px",animation:\`confettiFall \${p.dur}s \${p.delay}s ease-in forwards\`,transform:\`rotate(\${p.rot}deg)\`}}/>)}
    </div>
  );
}`,

"src/components/mobile/UrgencyBadge.tsx": `interface UrgencyBadgeProps { lastContactAt?:string|null;category:string; }
function daysSince(d?:string|null){if(!d)return 999;return Math.floor((Date.now()-new Date(d).getTime())/(1000*60*60*24));}
export function UrgencyBadge({ lastContactAt,category }:UrgencyBadgeProps) {
  const days=daysSince(lastContactAt);
  if(category==="HOT"&&days>=2) return <span className="text-[9px] px-1.5 py-0.5 bg-red-500 text-white rounded-full font-semibold animate-pulse">⚠️ {days}h tdk follow up</span>;
  if(category==="WARM"&&days>=4) return <span className="text-[9px] px-1.5 py-0.5 bg-orange-400 text-white rounded-full font-semibold">⏰ {days}h idle</span>;
  if(days>=6) return <span className="text-[9px] px-1.5 py-0.5 bg-slate-400 text-white rounded-full font-semibold">{days}h idle</span>;
  return null;
}`,

"src/components/mobile/MiniChart.tsx": `"use client";
interface D { day:string;val:number; }
const DEF:D[]=[{day:"Sen",val:4},{day:"Sel",val:6},{day:"Rab",val:3},{day:"Kam",val:7},{day:"Jum",val:5},{day:"Sab",val:2},{day:"Min",val:8}];
export function MiniChart({ data=DEF,dark=false }:{ data?:D[];dark?:boolean }) {
  const max=Math.max(...data.map(d=>d.val),1);
  const ti=new Date().getDay()===0?6:new Date().getDay()-1;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className={\`text-xs font-semibold \${dark?"text-slate-100":"text-slate-800"}\`}>Leads Masuk (7 Hari)</span>
        <span className={\`text-[10px] \${dark?"text-slate-400":"text-slate-500"}\`}>Total: {data.reduce((s,d)=>s+d.val,0)}</span>
      </div>
      <div className="flex items-end gap-1.5 h-14">
        {data.map((d,i)=>(
          <div key={d.day} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full rounded-t-md transition-all duration-500" style={{height:\`\${(d.val/max)*48}px\`,background:i===ti?"#3b82f6":dark?"#1e2d4a":"#dbeafe"}}/>
            <span className={\`text-[9px] \${i===ti?"text-blue-500 font-semibold":dark?"text-slate-500":"text-slate-400"}\`}>{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}`,

"src/components/mobile/LeaderboardMini.tsx": `"use client";
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
    <div className={\`\${card} border rounded-2xl p-4 shadow-md\`}>
      <div className="flex items-center justify-between mb-3">
        <span className={\`text-xs font-semibold \${tx}\`}>🏆 Leaderboard Tim</span>
        {onViewAll&&<button onClick={onViewAll} className={\`text-xs \${dark?"text-blue-400":"text-blue-500"} flex items-center gap-0.5\`}>Semua<ChevronRight size={11}/></button>}
      </div>
      {entries.slice(0,5).map((e,i)=>{
        const isMe=e.id===currentUserId;
        const pts=e.points??e.closing_count??0;
        return(
          <div key={e.id} className={\`flex items-center gap-3 py-2 px-2 rounded-xl mb-1 last:mb-0 \${isMe?dark?"bg-blue-900/40 border border-blue-700":"bg-blue-50 border border-blue-100":""}\`}>
            <span className={\`w-5 text-xs font-bold text-center \${i===0?"text-yellow-500":i===1?"text-slate-400":i===2?"text-orange-400":mt}\`}>{i<3?RANK[i]:i+1}</span>
            <div className={\`w-7 h-7 rounded-full \${AVC[i%AVC.length]} flex items-center justify-center text-white font-bold text-xs flex-shrink-0\`}>{e.name.charAt(0).toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <p className={\`text-xs font-semibold \${tx} flex items-center gap-1 truncate\`}>{e.name}{isMe&&<span className="text-[9px] bg-blue-500 text-white px-1.5 rounded-full">Kamu</span>}</p>
              {e.team&&<p className={\`text-[10px] \${mt}\`}>{e.team}</p>}
            </div>
            <span className={\`text-xs font-bold \${i===0?"text-yellow-500":dark?"text-slate-300":"text-slate-600"}\`}>{pts} pts</span>
          </div>
        );
      })}
      {entries.length===0&&<p className={\`text-xs text-center py-4 \${mt}\`}>Belum ada data</p>}
    </div>
  );
}`,

"src/components/mobile/FabAddLead.tsx": `"use client";
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
          <div className={\`\${dark?"bg-[#111d35]":"bg-white"} rounded-t-3xl p-5 pb-8\`}>
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-4"/>
            <div className="flex items-center justify-between mb-4">
              <h3 className={\`text-base font-bold \${tx}\`}>Tambah Lead Baru</h3>
              <button onClick={()=>setOpen(false)} className={mt}><X size={18}/></button>
            </div>
            {[{k:"name",l:"Nama Orang Tua",p:"Contoh: Budi Santoso"},{k:"child_name",l:"Nama Anak",p:"Contoh: Rafi"},{k:"phone",l:"No. WhatsApp",p:"08xxxxxxxxxx",t:"tel"},{k:"area",l:"Area / Kota",p:"Contoh: Depok"}].map(f=>(
              <div key={f.k} className="mb-3">
                <label className={\`text-xs font-semibold \${mt} block mb-1\`}>{f.l}</label>
                <input type={f.t??"text"} placeholder={f.p} value={form[f.k as keyof typeof form]} onChange={e=>setForm(pr=>({...pr,[f.k]:e.target.value}))} className={\`w-full px-3 py-2.5 rounded-xl border text-sm outline-none \${dark?"bg-white/5 border-white/10 text-slate-200 placeholder-slate-600":"bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400"}\`}/>
              </div>
            ))}
            <div className="mb-5">
              <label className={\`text-xs font-semibold \${mt} block mb-2\`}>Kategori</label>
              <div className="flex gap-2">
                {(["HOT","WARM","COLD"] as Cat[]).map(c=>(
                  <button key={c} onClick={()=>setCat(c)} className={\`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all \${cat===c?c==="HOT"?"bg-red-500 border-red-500 text-white":c==="WARM"?"bg-orange-400 border-orange-400 text-white":"bg-blue-500 border-blue-500 text-white":c==="HOT"?"border-red-200 bg-red-50 text-red-500":c==="WARM"?"border-orange-200 bg-orange-50 text-orange-500":"border-blue-200 bg-blue-50 text-blue-500"}\`}>
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
}`,

"src/components/mobile/NotifPanel.tsx": `"use client";
import { X } from "lucide-react";
interface N { id:string;message:string;time?:string;created_at?:string;read:boolean;from?:string; }
interface P { notifications:N[];dark?:boolean;onClose:()=>void; }
function timeAgo(d?:string){if(!d)return"";const m=Math.floor((Date.now()-new Date(d).getTime())/60000);if(m<1)return"Baru saja";if(m<60)return\`\${m} mnt lalu\`;const h=Math.floor(m/60);if(h<24)return\`\${h} jam lalu\`;return\`\${Math.floor(h/24)} hari lalu\`;}
function sStyle(from?:string){if(from==="Head Manager")return{bg:"bg-purple-600",badge:"bg-purple-100 text-purple-600"};if(from==="Manager")return{bg:"bg-blue-500",badge:"bg-blue-100 text-blue-600"};return{bg:"bg-slate-400",badge:"bg-slate-100 text-slate-500"};}
export function NotifPanel({notifications,dark=false,onClose}:P){
  const bg=dark?"bg-[#0a1020]":"bg-gray-50";
  const card=dark?"bg-[#111d35] border-[#1e2d4a]":"bg-white border-slate-100";
  const tx=dark?"text-slate-100":"text-slate-800";
  const mt=dark?"text-slate-400":"text-slate-500";
  return(
    <div className={\`absolute inset-0 z-50 flex flex-col \${bg}\`}>
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-5 pt-12 pb-5">
        <div className="flex items-center justify-between">
          <div><h2 className="text-white font-bold text-lg">Notifikasi</h2><p className="text-blue-200 text-xs">{notifications.filter(n=>!n.read).length} belum dibaca</p></div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white"><X size={18}/></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notifications.length===0&&<div className={\`text-center py-12 \${mt}\`}><p className="text-3xl mb-2">🔔</p><p className="text-sm">Tidak ada notifikasi</p></div>}
        {notifications.map(n=>{const s=sStyle(n.from);return(
          <div key={n.id} className={\`\${card} border rounded-2xl p-4 shadow-sm \${n.read?"opacity-60":""}\`}>
            <div className="flex items-start gap-3">
              <div className={\`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 \${s.bg}\`}>{n.from==="Head Manager"?"HM":(n.from??"S").charAt(0)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">{n.from&&<span className={\`text-[10px] font-semibold px-2 py-0.5 rounded-full \${s.badge}\`}>{n.from}</span>}{!n.read&&<div className="w-2 h-2 bg-red-500 rounded-full"/>}</div>
                <p className={\`text-xs leading-relaxed \${tx}\`}>{n.message}</p>
                <p className={\`text-[10px] mt-1 \${mt}\`}>{n.time??timeAgo(n.created_at)}</p>
              </div>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}`,

"src/components/mobile/SlideMenu.tsx": `"use client";
import { X,Home,Users,MessageCircle,CheckSquare,BarChart2,Award,Calendar,Activity,Settings,LogOut,Sun,Moon,Flame } from "lucide-react";
interface P { open:boolean;onClose:()=>void;activeTab:string;onNavigate:(t:string)=>void;dark:boolean;onToggleDark:()=>void;user:{name:string;role:string;team:string};streak?:number; }
const ITEMS=[{icon:Home,label:"Dashboard",tab:"home"},{icon:Users,label:"Leads",tab:"leads"},{icon:MessageCircle,label:"Script WA",tab:"wa"},{icon:CheckSquare,label:"Tasks",tab:"tasks"},{icon:BarChart2,label:"KPI & Performa",tab:"kpi"},{icon:Award,label:"Leaderboard",tab:"board"},{icon:Calendar,label:"Jadwal Follow Up",tab:"schedule"},{icon:Activity,label:"Activity Log",tab:"log"},{icon:Settings,label:"Pengaturan",tab:"settings"}];
export function SlideMenu({open,onClose,activeTab,onNavigate,dark,onToggleDark,user,streak=0}:P){
  if(!open)return null;
  const go=(t:string)=>{onNavigate(t);onClose();};
  return(
    <div className="absolute inset-0 z-40 flex">
      <div className="flex-1 bg-black/40" onClick={onClose}/>
      <div className={\`w-72 h-full \${dark?"bg-[#0d1a30]":"bg-white"} shadow-2xl flex flex-col\`}>
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 pb-6">
          <div className="flex items-center justify-between mb-4"><span className="text-white text-sm font-semibold opacity-80">Menu</span><button onClick={onClose} className="text-white/70"><X size={18}/></button></div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg border-2 border-white/30">{user.name.charAt(0)}</div>
            <div><p className="text-white font-semibold text-sm">{user.name}</p><p className="text-white/70 text-xs">{user.role}</p>{streak>0&&<div className="flex items-center gap-1 mt-0.5"><Flame size={10} className="text-orange-300"/><span className="text-orange-300 text-[10px] font-semibold">{streak} hari streak!</span></div>}</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {ITEMS.map(m=>{const Icon=m.icon;const a=activeTab===m.tab;return(<button key={m.tab} onClick={()=>go(m.tab)} className={\`w-full flex items-center gap-3 px-5 py-3 text-sm \${a?"bg-blue-50 text-blue-600 border-r-2 border-blue-500":dark?"text-slate-300 hover:bg-white/5":"text-slate-700 hover:bg-slate-50"}\`}><Icon size={18}/>{m.label}</button>);})}
          <button className={\`w-full flex items-center gap-3 px-5 py-3 text-sm text-red-500 mt-2 border-t \${dark?"border-white/10":"border-slate-100"}\`}><LogOut size={18}/>Keluar</button>
        </div>
        <div className={\`p-4 border-t \${dark?"border-white/10":"border-slate-100"}\`}>
          <button onClick={onToggleDark} className={\`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm \${dark?"bg-white/5 text-slate-300":"bg-slate-50 text-slate-700"}\`}>
            <span className="flex items-center gap-2">{dark?<Moon size={15}/>:<Sun size={15}/>}{dark?"Mode Gelap":"Mode Terang"}</span>
            <div className={\`w-9 h-5 rounded-full relative \${dark?"bg-blue-500":"bg-slate-200"}\`}><div className={\`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow \${dark?"left-4":"left-0.5"}\`}/></div>
          </button>
        </div>
      </div>
    </div>
  );
}`,

"src/components/mobile/index.ts": `export { MobileLayout } from "./MobileLayout";
export type { MobileLayoutProps } from "./MobileLayout";
export { MobileHomePage } from "./MobileHomePage";
export { MobileLeadsPage } from "./MobileLeadsPage";
export { WAScriptPage } from "./WAScriptPage";
export { SchedulePage } from "./SchedulePage";
export { SlideMenu } from "./SlideMenu";
export { NotifPanel } from "./NotifPanel";
export { FabAddLead } from "./FabAddLead";
export { KpiRing } from "./KpiRing";
export { MiniChart } from "./MiniChart";
export { LeaderboardMini } from "./LeaderboardMini";
export { UrgencyBadge } from "./UrgencyBadge";
export { Confetti } from "./Confetti";`,
};

// Create directories and write files
let count = 0;
for (const [filePath, content] of Object.entries(files)) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
  console.log("✅ " + filePath);
  count++;
}

console.log("\n================================================");
console.log("✅ SELESAI! " + count + " file berhasil dibuat.");
console.log("\n⚠️  Masih perlu dibuat manual (terlalu panjang):");
console.log("   - src/components/mobile/MobileLeadsPage.tsx");
console.log("   - src/components/mobile/WAScriptPage.tsx");
console.log("   - src/components/mobile/SchedulePage.tsx");
console.log("   - src/components/mobile/MobileHomePage.tsx");
console.log("   - src/components/mobile/MobileLayout.tsx");
console.log("\nJalankan: node setup2.js untuk file-file di atas.");
console.log("================================================");
