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
    const team  = searchParams.get("team");
    const limit = Number(searchParams.get("limit") ?? 12);

    let query = supabase
      .from("weekly_reports")
      .select("*")
      .order("week_start", { ascending: false })
      .limit(limit);

    if (profile.role !== "head_manager") {
      query = query.eq("team", profile.team);
    } else if (team) {
      query = query.eq("team", team);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
