import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function makeClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(n: string) { return cookieStore.get(n)?.value; } } }
  );
}

export async function GET(req: NextRequest) {
  const supabase = await makeClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role,team").eq("id", user.id).single();
  const isHead = ["head_manager","owner","deputi"].includes(profile?.role ?? "");
  let query = supabase.from("registrations").select("*").order("created_at", { ascending: false });
  if (!isHead) query = query.eq("team", profile?.team ?? "");
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const supabase = await makeClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role,team,full_name").eq("id", user.id).single();
  if (!["head_manager","manager","owner","deputi"].includes(profile?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { data, error } = await supabase.from("registrations").insert({
    ...body,
    created_by: user.id,
    created_by_name: profile?.full_name ?? "",
    team: profile?.team ?? "",
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
