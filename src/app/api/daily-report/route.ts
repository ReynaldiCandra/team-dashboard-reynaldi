import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function makeClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => (cookieStore as any).getAll?.() ?? [] } }
  );
}

export async function GET(req: NextRequest) {
  try {
    const supabase = makeClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles").select("role,team").eq("id", user.id).single();
    if (!profile) return NextResponse.json({ error: "No profile" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const from  = searchParams.get("from");
    const to    = searchParams.get("to");
    const team  = searchParams.get("team");

    let query = supabase.from("daily_reports").select("*").order("report_date", { ascending: false });

    if (profile.role !== "head_manager") {
      query = query.eq("team", profile.team);
    } else if (team) {
      query = query.eq("team", team);
    }
    if (from) query = query.gte("report_date", from);
    if (to)   query = query.lte("report_date", to);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = makeClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles").select("role,team").eq("id", user.id).single();
    if (!profile) return NextResponse.json({ error: "No profile" }, { status: 403 });

    const body = await req.json();
    const {
      report_date, team,
      meta_ads_spend = 0, google_ads_spend = 0,
      meta_ads_leads = 0, google_ads_leads = 0,
      warms = 0, hot_leads = 0, closing = 0,
      notes = ""
    } = body;

    if (!report_date) return NextResponse.json({ error: "report_date required" }, { status: 400 });

    const reportTeam = profile.role === "head_manager" ? team : profile.team;
    if (!reportTeam) return NextResponse.json({ error: "team required" }, { status: 400 });

    const payload = {
      team: reportTeam, report_date,
      meta_ads_spend, google_ads_spend,
      meta_ads_leads, google_ads_leads,
      warms, hot_leads, closing, notes,
      submitted_by: user.id,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("daily_reports")
      .upsert(payload, { onConflict: "team,report_date" })
      .select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
