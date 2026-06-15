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

export async function GET(req: NextRequest) {
  const supabase = await serverClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dateParam = req.nextUrl.searchParams.get("date");
  const date = dateParam ?? new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("kpi_daily")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const supabase = await serverClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const date = body.date ?? new Date().toISOString().split("T")[0];

  const payload = {
    user_id:          user.id,
    user_name:        body.user_name ?? user.email,
    team:             body.team ?? "F",
    role:             body.role ?? "staff",
    date,
    leads:            body.leads            ?? 0,
    prospect:         body.prospect         ?? 0,
    meeting:          body.meeting          ?? 0,
    proposal:         body.proposal         ?? 0,
    closing:          body.closing          ?? 0,
    revenue_jt:       body.revenue_jt       ?? 0,
    followup:         body.followup         ?? 0,
    treat_baru:       body.treat_baru       ?? 0,
    treat_lama:       body.treat_lama       ?? 0,
    meta_ads_spend:   body.meta_ads_spend   ?? 0,
    google_ads_spend: body.google_ads_spend ?? 0,
    meta_ads_leads:   body.meta_ads_leads   ?? 0,
    google_ads_leads: body.google_ads_leads ?? 0,
    notes:            body.notes            ?? "",
  };

  const { data, error } = await supabase
    .from("kpi_daily")
    .upsert(payload, { onConflict: "user_id,date" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
