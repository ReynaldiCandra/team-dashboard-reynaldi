"use client";
import { useState, useEffect, useCallback } from "react";

export interface KPIValues {
  leads: number;
  prospect: number;
  meeting: number;
  proposal: number;
  closing: number;
  revenue_jt: number;
  followup: number;
  treat_baru: number;
  treat_lama: number;
  meta_ads_spend: number;
  google_ads_spend: number;
  meta_ads_leads: number;
  google_ads_leads: number;
  notes: string;
}

const EMPTY: KPIValues = {
  leads: 0, prospect: 0, meeting: 0, proposal: 0, closing: 0,
  revenue_jt: 0, followup: 0, treat_baru: 0, treat_lama: 0,
  meta_ads_spend: 0, google_ads_spend: 0,
  meta_ads_leads: 0, google_ads_leads: 0,
  notes: "",
};

export function useKPI(date?: string) {
  const today = date ?? new Date().toISOString().split("T")[0];
  const [values,  setValues]  = useState<KPIValues>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/kpi?date=" + today);
      const json = await res.json() as { data?: Record<string, unknown> };
      if (json.data) {
        setValues(prev => ({
          ...prev,
          leads:            Number(json.data!.leads)            || 0,
          prospect:         Number(json.data!.prospect)         || 0,
          meeting:          Number(json.data!.meeting)          || 0,
          proposal:         Number(json.data!.proposal)         || 0,
          closing:          Number(json.data!.closing)          || 0,
          revenue_jt:       Number(json.data!.revenue_jt)       || 0,
          followup:         Number(json.data!.followup)         || 0,
          treat_baru:       Number(json.data!.treat_baru)       || 0,
          treat_lama:       Number(json.data!.treat_lama)       || 0,
          meta_ads_spend:   Number(json.data!.meta_ads_spend)   || 0,
          google_ads_spend: Number(json.data!.google_ads_spend) || 0,
          meta_ads_leads:   Number(json.data!.meta_ads_leads)   || 0,
          google_ads_leads: Number(json.data!.google_ads_leads) || 0,
          notes:            String(json.data!.notes ?? ""),
        }));
      }
    } catch (_) { /* ignore */ }
    setLoading(false);
  }, [today]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (extra?: Partial<KPIValues & { team: string; role: string }>) => {
    setSaving(true);
    setError(null);
    try {
      const res  = await fetch("/api/kpi", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...values, ...extra, date: today }),
      });
      const json = await res.json() as { error?: string };
      if (json.error) throw new Error(json.error);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan");
    }
    setSaving(false);
  }, [values, today]);

  return { values, setValues, loading, saving, saved, error, save, reload: load };
}
