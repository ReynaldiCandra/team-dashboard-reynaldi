"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  dark?: boolean;
  currentUser: { id: string; name: string; role: string; team: string };
}

type WeekKey = 0 | 1 | 2 | 3 | 4;
const WEEK_LABELS: Record<WeekKey, string> = { 0:"Prev Month",1:"Week I",2:"Week II",3:"Week III",4:"Week IV" };

const META_FIELDS = [
  { key:"meta_total_campaign", label:"Total Campaign" },
  { key:"meta_ad_spend",       label:"Ad Spend",               prefix:"Rp" },
  { key:"meta_reach",          label:"Reach" },
  { key:"meta_impression",     label:"Impression" },
  { key:"meta_ctr",            label:"CTR",                    suffix:"%" },
  { key:"meta_cpl",            label:"CPL",                    prefix:"Rp" },
  { key:"meta_lpv",            label:"LPV (Landing Page View)" },
  { key:"meta_total_leads",    label:"Total Leads CTWA+LP" },
  { key:"meta_cvr",            label:"Conversion Rate",        suffix:"%" },
];
const GOOGLE_FIELDS = [
  { key:"google_total_campaign", label:"Total Kampanye" },
  { key:"google_ad_spend",       label:"Ads Spend",            prefix:"Rp" },
  { key:"google_total_click",    label:"Total Klik" },
  { key:"google_total_tayangan", label:"Total Tayangan" },
  { key:"google_ctr",            label:"CTR",                  suffix:"%" },
  { key:"google_cpc",            label:"CPC",                  prefix:"Rp" },
  { key:"google_cpa",            label:"Biaya/Konversi (CPA)", prefix:"Rp" },
  { key:"google_total_leads",    label:"Total Leads" },
];
const LEADS_FIELDS = [
  { key:"lead_sd",     label:"Lead SD" },
  { key:"lead_smp_fd", label:"Lead SMP FD" },
  { key:"lead_smp_bd", label:"Lead SMP BD" },
  { key:"lead_sma_fd", label:"Lead SMA FD" },
  { key:"lead_sma_bd", label:"Lead SMA BD" },
  { key:"appointment", label:"Appointment" },
  { key:"school_tour", label:"School Tour / Open House" },
];
const CLOSING_FIELDS = [
  { key:"closing_sd",     label:"SD" },
  { key:"revenue_sd",     label:"\u2514 Revenue SD",     prefix:"Rp" },
  { key:"closing_smp_fd", label:"SMP FD" },
  { key:"revenue_smp_fd", label:"\u2514 Revenue SMP FD", prefix:"Rp" },
  { key:"closing_smp_bd", label:"SMP BD" },
  { key:"revenue_smp_bd", label:"\u2514 Revenue SMP BD", prefix:"Rp" },
  { key:"closing_sma_fd", label:"SMA FD" },
  { key:"revenue_sma_fd", label:"\u2514 Revenue SMA FD", prefix:"Rp" },
  { key:"closing_sma_bd", label:"SMA BD" },
  { key:"revenue_sma_bd", label:"\u2514 Revenue SMA BD", prefix:"Rp" },
  { key:"target_closing", label:"Target Closing" },
];

function currentMonth() { return new Date().toISOString().slice(0, 7); }
function calcMonthly(data: Record<WeekKey, any>, key: string): number {
  return ([1,2,3,4] as WeekKey[]).reduce<number>((s, w) => s + (Number(data[w]?.[key]) || 0), 0);
}

export function WeeklyReportView({ dark = false, currentUser }: Props) {
  const [month, setMonth] = useState(currentMonth());
  const [activeWeek, setActiveWeek] = useState<WeekKey>(1);
  const [data, setData] = useState<Record<WeekKey, any>>({0:{},1:{},2:{},3:{},4:{}});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const bg   = dark ? "bg-[#0a1020]"   : "bg-gray-50";
  const card = dark ? "bg-[#111d35] border-[#1e2d4a]" : "bg-white border-slate-100";
  const tx   = dark ? "text-slate-100" : "text-slate-800";
  const mt   = dark ? "text-slate-400" : "text-slate-500";
  const inp  = dark ? "bg-white/5 border-white/10 text-slate-200" : "bg-yellow-50 border-slate-200 text-slate-700";

  useEffect(() => { loadAll(); }, [month]);

  async function loadAll() {
    const sb = createClient();
    const { data: rows } = await sb
      .from("weekly_reports")
      .select("*")
      .eq("report_month", month)
      .eq("team", currentUser.team);
    const result: Record<WeekKey, any> = {0:{},1:{},2:{},3:{},4:{}};
    (rows ?? []).forEach((r: any) => { result[r.week_number as WeekKey] = r; });
    setData(result);
  }

  const setField = useCallback((week: WeekKey, key: string, val: string) => {
    setData(prev => ({ ...prev, [week]: { ...prev[week], [key]: val === "" ? "" : isNaN(Number(val)) ? val : Number(val) } }));
  }, []);

  async function saveWeek(week: WeekKey) {
    setSaving(true);
    const sb = createClient();
    const payload = {
      report_month: month,
      week_number: week,
      team: currentUser.team,
      manager_id: currentUser.id,
      manager_name: currentUser.name,
      ...data[week],
    };
    const { error } = await sb.from("weekly_reports")
      .upsert(payload, { onConflict: "report_month,week_number,team" });
    setSaving(false);
    setToast(error ? "\u274c " + error.message : "\u2705 " + WEEK_LABELS[week] + " tersimpan!");
    setTimeout(() => setToast(""), 3000);
    if (!error) loadAll();
  }

  const renderSection = (
    title: string,
    fields: { key: string; label: string; prefix?: string; suffix?: string }[]
  ) => (
    <>
      <tr>
        <td colSpan={7} className={`px-3 py-2 text-xs font-bold ${dark ? "bg-orange-900/40 text-orange-300" : "bg-orange-500 text-white"}`}>
          {title}
        </td>
      </tr>
      {fields.map(({ key, label, prefix, suffix }) => (
        <tr key={key} className={`border-b ${dark ? "border-white/5 hover:bg-white/5" : "border-slate-50 hover:bg-slate-50"}`}>
          <td className={`px-3 py-1.5 text-xs ${tx} whitespace-nowrap`}>{label}</td>
          {([0,1,2,3,4] as WeekKey[]).map(w => (
            <td key={w} className={`px-1 py-1 ${w === activeWeek || w === 0 ? "" : "opacity-50"}`}>
              <div className="flex items-center">
                {prefix && <span className={`text-[10px] px-1 ${mt}`}>{prefix}</span>}
                <input
                  type="number" min="0"
                  value={data[w]?.[key] ?? ""}
                  onChange={e => setField(w, key, e.target.value)}
                  className={`w-full px-2 py-1 text-xs rounded border outline-none text-right ${
                    w === activeWeek || w === 0
                      ? inp
                      : dark ? "bg-white/5 border-white/5 text-slate-500" : "bg-slate-50 border-slate-100 text-slate-400"
                  }`}
                  placeholder="0"
                />
                {suffix && <span className={`text-[10px] px-1 ${mt}`}>{suffix}</span>}
              </div>
            </td>
          ))}
          <td className={`px-3 py-1 text-xs text-right font-bold ${dark ? "text-green-400" : "text-green-600"}`}>
            {calcMonthly(data, key) || "-"}
          </td>
        </tr>
      ))}
    </>
  );

  return (
    <div className={`min-h-screen ${bg} p-6`}>
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-800 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${tx}`}>Weekly & Monthly Report</h1>
            <p className={`text-sm ${mt}`}>Tim {currentUser.team} ·{currentUser.name} · Manager</p>
          </div>
          <input
            type="month" value={month}
            onChange={e => setMonth(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-sm outline-none ${dark ? "bg-[#1a2a45] border-[#1e2d4a] text-white" : "bg-white border-slate-200"}`}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {([0,1,2,3,4] as WeekKey[]).map(w => (
            <button key={w} onClick={() => setActiveWeek(w)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeWeek === w
                  ? "bg-orange-500 text-white shadow"
                  : dark ? "bg-white/10 text-slate-300 hover:bg-white/15" : "bg-white border boder-slate-200 text-slate-600 hover:bg-orange-50"
              }`}>
              {WEEK_LABELS[w]}
            </button>
          ))}
        </div>

        <div className={`${card} border rounded-2xl overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr>
                  <th className="bg-orange-500 text-white text-left px-3 py-2.5 text-xs font-bold w-52">
                    WEEKLY & MONTHLY REPORT
                  </th>
                  {([0,1,2,3,4] as WeekKey[]).map(w => (
                    <th key={w} className={`px-3 py-2.5 text-xs font-bold text-right ${
                      w === activeWeek ? "bg-orange-600 text-white" : "bg-orange-500 text-white"
                    }`}>
                      {WEEK_LABELS[w]}
                    </th>
                  ))}
                  <th className="bg-green-600 text-white px-3 py-2.5 text-xs font-bold text-right">MONTHLY</th>
                </tr>
                <tr className={dark ? "bg-white/5" : "bg-orange-50"}>
                  <td className={`px-3 py-1.5 text-xs font-semibold ${mt}`}>TIM: {currentUser.team}</td>
                  <td colSpan={6} className={`px-3 py-1.5 text-xs ${mt}`}>DMM: {currentUser.name}</td>
                </tr>
              </thead>
              <tbody>
                {renderSection("META ADS", META_FIELDS)}
                {renderSection("GOOGLE ADS", GOOGLE_FIELDS)}
                {renderSection("DATA LEADS", LEADS_FIELDS)}
                {renderSection("DATA CLOSING", CLOSING_FIELDS)}
                <tr>
                  <td colSpan={7} className={`px-3 py-2 text-xs font-bold ${dark ? "bg-orange-900/40 text-orange-300" : "bg-orange-500 text-white"}`}>
                    ANALISIS
                  </td>
                </tr>
                {(["insight","problem","action_plan"] as const).map(key => (
                  <tr key={key} className={`border-b ${dark ? "border-white/5" : "border-slate-50"}`}>
                    <td className={`px-3 py-2 text-xs font-bold uppercase ${tx}`}>{key.replace("_"," ")}</td>
                    <td colSpan={6} className="px-2 py-1">
                      <input
                        type="text"
                        value={(data[activeWeek]?.[key] as string) ?? ""}
                        onChange={e => setField(activeWeek, key, e.target.value)}
                        className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none ${inp}`}
                        placeholder={`Tulis ${key.replace("_"," ")} untuk ${WEEK_LABELS[activeWeek]}...`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button
          onClick={() => saveWeek(activeWeek)}
          disabled={saving}
          className="px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl disabled:opacity-50 transition-colors"
        >
          {saving ? "Menyimpan..." : `Simpan ${WEEK_LABELS[activeWeek]}`}
        </button>
      </div>
    </div>
  );
}
