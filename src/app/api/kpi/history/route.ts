import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function serverClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );
}

interface KpiRow {
  date: string; user_name: string; team: string;
  leads: number; prospect: number; meeting: number;
  proposal: number; closing: number; revenue_jt: number;
  followup: number; treat_baru: number; treat_lama: number;
  meta_ads_spend: number; google_ads_spend: number;
  meta_ads_leads: number; google_ads_leads: number;
}

export async function GET(req: NextRequest) {
  const supabase = await serverClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ambil role & team dari profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, team")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "staff";
  const team = profile?.team ?? null;

  const params = req.nextUrl.searchParams;
  const now    = new Date();
  const first  = new Date(now.getFullYear(), now.getMonth(), 1);
  const from   = params.get("from") ?? first.toISOString().split("T")[0];
  const to     = params.get("to")   ?? now.toISOString().split("T")[0];

  let query = supabase
    .from("kpi_daily")
    .select("date,user_name,team,leads,prospect,meeting,proposal,closing,revenue_jt,followup,treat_baru,treat_lama,meta_ads_spend,google_ads_spend,meta_ads_leads,google_ads_leads")
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: false });

  // Manager: filter by team only
  if (role === "manager" && team) {
    query = query.eq("team", team);
  }
  // Staff: filter by own user_id only
  if (role === "staff") {
    query = query.eq("user_id", user.id);
  }
  // head_manager: no filter = lihat semua

  const { data, error } = await query.returns<KpiRow[]>();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];
  const byDate: Record<string, KpiRow[]> = {};
  for (const row of rows) {
    if (!byDate[row.date]) byDate[row.date] = [];
    byDate[row.date].push(row);
  }

  return NextResponse.json({ data: rows, byDate, role, team });
}
