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

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export async function POST(req: NextRequest) {
  const supabase = await makeClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { team, scope } = await req.json();

  const query = supabase
    .from("weekly_reports")
    .select("*")
    .order("week_start", { ascending: false })
    .limit(scope === "all" ? 32 : 4);

  if (scope !== "all" && team) {
    query.eq("team", team);
  }

  const { data: rows, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!rows || rows.length === 0) return NextResponse.json({ insight: "Belum ada data untuk dianalisis." });

  const summary = rows.map((r: any) =>
    "Tim " + r.team + " (" + r.week_start + " s/d " + r.week_end + "): " +
    "Spend Rp" + Number(r.total_spend).toLocaleString("id-ID") + ", " +
    "Leads " + r.total_leads + ", CPL Rp" + Number(r.cpl).toLocaleString("id-ID") + ", " +
    "Hot " + r.total_hot_leads + " (" + r.hot_rate + "%), Closing " + r.total_closing + " (" + r.closing_rate + "%), " +
    "Status: " + r.status + " — " + r.status_reason
  ).join("\n");

  const prompt = "Kamu adalah AI Analis Performa Tim Markeng Alexandria (lembaga pendidikan).\n\nData performa mingguan:\n" + summary + "\n\nBerikan analisis singkat (maks 200 kata) dalam bahasa Indonesia:\n1. Tim/minggu mana yang underperform dan kemungkinan penyebabnya\n2. Tren CPL apakah naik/turun dan artinya apa\n3. Rekomendasi konkret untuk minggu depan\nFormat: gunakan poin-poin singkat dengan emoji.";

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API key tidak ditemukan" }, { status: 500 });

  const geminiRes = await fetch(GEMINI_URL + "?key=" + apiKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 800 },
    }),
  });

  if (!geminiRes.ok) {
    const err = await geminiRes.json();
    return NextResponse.json({ error: err.error?.message ?? "Gemini error" }, { status: geminiRes.status });
  }

  const result = await geminiRes.json();
  const insight = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "Tidak ada respons dari AI.";
  return NextResponse.json({ insight });
}
