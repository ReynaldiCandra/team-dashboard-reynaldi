import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function makeClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );
}

export async function GET(req: NextRequest) {
  const supabase = await makeClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role,team").eq("id", user.id).single();

  const isHead = ["head_manager","owner","deputi"].includes(profile?.role ?? "");
  const team = req.nextUrl.searchParams.get("team") ?? (isHead ? null : profile?.team);
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "8");

  let query = supabase
    .from("v_leads_weekly_summary")
    .select("*")
    .order("week_start", { ascending: false })
    .limit(limit);

  if (team) query = query.eq("team", team);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
