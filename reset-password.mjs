import { readFileSync } from "fs";
const env = readFileSync(".env.local", "utf8");
const get = (k) => env.match(new RegExp("^" + k + "=(.+)", "m"))?.[1]?.trim();
const URL = get("NEXT_PUBLIC_SUPABASE_URL");
const KEY = get("SUPABASE_SERVICE_ROLE_KEY");

const updates = [
  { email: "headmanager@alexandria.sch.id", password: "PASSWORD_BARU_HM" },
  { email: "manager.f@alexandria.sch.id",   password: "PASSWORD_BARU_MF" },
  { email: "farhan@alexandria.sch.id",       password: "PASSWORD_BARU_F1" },
  { email: "ramram@alexandria.sch.id",       password: "PASSWORD_BARU_F2" },
];

const r = await fetch(URL + "/auth/v1/admin/users?per_page=200", {
  headers: { Authorization: "Bearer " + KEY, apikey: KEY }
});
const { users } = await r.json();

for (const u of updates) {
  const found = users?.find(x => x.email === u.email);
  if (!found) { console.log("Tidak ditemukan:", u.email); continue; }
  const r2 = await fetch(URL + "/auth/v1/admin/users/" + found.id, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + KEY, apikey: KEY },
    body: JSON.stringify({ password: u.password })
  });
  console.log(r2.ok ? "Berhasil:" : "Gagal:", u.email);
}
