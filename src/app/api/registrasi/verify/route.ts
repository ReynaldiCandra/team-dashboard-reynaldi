import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const reg = req.nextUrl.searchParams.get("reg");
  if (!id && !reg) return NextResponse.json({ error: "id or reg required" }, { status: 400 });

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(n: string) { return cookieStore.get(n)?.value; } } }
  );

  let query = supabase.from("registrations")
    .select("reg_number,nama_siswa,status_pendaftaran,tahun_ajaran,created_at,verify_hash,created_by_name");

  if (id) query = query.eq("id", id);
  else query = query.eq("reg_number", reg!);

  const { data, error } = await query.single();
  if (error || !data) return NextResponse.json({ valid: false, message: "Dokumen tidak ditemukan" });
  return NextResponse.json({ valid: true, data });
}
