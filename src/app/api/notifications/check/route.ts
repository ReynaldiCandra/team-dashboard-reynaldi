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

export async function POST(req: NextRequest) {
  const supabase = await makeClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().split("T")[0];
  const TEAMS = ["Tim A","Tim B","Tim C","Tim D","Tim E","Tim F","Tim G","Tim H"];

  // Cek tim mana yang belum submit hari ini
  const { data: submitted } = await supabase
    .from("daily_reports")
    .select("team")
    .eq("report_date", today);

  const submittedTeams = new Set((submitted ?? []).map((r: any) => r.team));
  const missing = TEAMS.filter(t => !submittedTeams.has(t));

  if (missing.length === 0) return NextResponse.json({ created: 0, message: "Semua tim sudah submit hari ini" });

  // Cek weekly report dengan closing_rate drop > 30%
  const { data: weeklyRows } = await supabase
    .from("weekly_reports")
    .select("team, closing_rate, week_start")
    .order("week_start", { ascending: false })
    .limit(16);

  const alerts: { title: string; message: string; type: string; user_id: string }[] = [];

  // Notifikasi missing daily report — kirim ke user yg login (manager/head)
  if (missing.length > 0) {
    alerts.push({
      title: "Daily Report Belum Disubmit",
      message: missing.length + " tim belum submit daily report hari ini: " + missing.join(", "),
      type: "warning",
      user_id: user.id,
    });
  }

  // Deteksi closing_rate drop per tim
  const byTeam: Record<string, number[]> = {};
(weeklyRows ?? []).forEach((r: any) => {
    if (!byTeam[r.team]) byTeam[r.team] = [];
    byTeam[r.team].push(Number(r.closing_rate));
  });

  Object.entries(byTeam).forEach(([team, rates]) => {
    if (rates.length >= 2) {
      const latest = rates[0];
      const prev = rates[1];
      if (prev > 0 && ((prev - latest) / prev) > 0.3) {
        alerts.push({
          title: "Closing Rate Turun Drastis",
          message: team + ": closing rate turun dari " + prev + "% ke " + latest + "% (turun " + Math.round(((prev-latest)/prev)*100) + "%)",
          type: "error",
          user_id: user.id,
        });
      }
    }
  });

  if (alerts.length === 0) return NextResponse.json({ created: 0 });

  const { error } = await supabase.from("notifications").insert(
    alerts.map(a => ({ user_id: a.user_id, title: a.title, message: a.message, type: a.type, is_read: false }))
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ created: alerts.length, alerts });
}
