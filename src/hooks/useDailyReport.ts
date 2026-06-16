import { useState, useCallback } from "react";

export interface DailyReport {
  id: string;
  team: string;
  report_date: string;
  meta_ads_spend: number;
  google_ads_spend: number;
  meta_ads_leads: number;
  google_ads_leads: number;
  warms: number;
  hot_leads: number;
  closing: number;
  notes: string;
  created_at: string;
}

export function useDailyReport() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (params?: { from?: string; to?: string; team?: string }) => {
    setLoading(true); setError(null);
    try {
      const q = new URLSearchParams();
      if (params?.from)  q.set("from",  params.from);
      if (params?.to)    q.set("to",    params.to);
      if (params?.team)  q.set("team",  params.team);
      const res = await window.fetch(`/api/daily-report?${q}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setReports(json.data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const submit = useCallback(async (payload: Omit<DailyReport, "id" | "created_at">) => {
    const res = await window.fetch("/api/daily-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data as DailyReport;
  }, []);

  return { reports, loading, error, fetch, submit };
}
