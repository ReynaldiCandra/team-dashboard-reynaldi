import { readFileSync } from 'fs';
const env = readFileSync('.env.local', 'utf8');
const get = (k) => env.match(new RegExp('^' + k + '=(.+)', 'm'))?.[1]?.trim();
const SUPABASE_URL = get('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_KEY = get('SUPABASE_SERVICE_ROLE_KEY');
if (!SUPABASE_URL || !SERVICE_KEY || SERVICE_KEY === 'your_service_role_key_here') { console.error('Set SUPABASE_SERVICE_ROLE_KEY dulu!'); process.exit(1); }
const teams = ['A','B','C','D','E','G','H'];
const users = [];
for (const t of teams) {
  users.push({ email: 'manager.' + t.toLowerCase() + '@alexandria.sch.id', password: 'Alex@Mgr' + t + '2024', name: 'Manager Tim ' + t, role: 'manager', team: 'Tim ' + t });
  users.push({ email: 'staff1.' + t.toLowerCase() + '@alexandria.sch.id', password: 'Alex@S1' + t + '2024', name: 'Staff 1 Tim ' + t, role: 'staff', team: 'Tim ' + t });
  users.push({ email: 'staff2.' + t.toLowerCase() + '@alexandria.sch.id', password: 'Alex@S2' + t + '2024', name: 'Staff 2 Tim ' + t, role: 'staff', team: 'Tim ' + t });
}
async function createUser(u) {
  const r1 = await fetch(SUPABASE_URL + '/auth/v1/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SERVICE_KEY, 'apikey': SERVICE_KEY },
    body: JSON.stringify({ email: u.email, password: u.password, email_confirm: true, user_metadata: { full_name: u.name } })
  });
  const d1 = await r1.json();
  if (!r1.ok) { console.error('GAGAL ' + u.email + ': ' + (d1.message || JSON.stringify(d1))); return; }
  const r2 = await fetch(SUPABASE_URL + '/rest/v1/profiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SERVICE_KEY, 'apikey': SERVICE_KEY, 'Prefer': 'resolution=merge-duplicates' },
    body: JSON.stringify({ id: d1.id, full_name: u.name, role: u.role, team: u.team })
  });
  if (!r2.ok) { const d2 = await r2.json(); console.warn('WARN profile ' + u.email + ': ' + JSON.stringify(d2)); }
  console.log('OK ' + u.role.padEnd(8) + ' | ' + u.team + ' | ' + u.email);
}
console.log('Membuat ' + users.length + ' akun...');
for (const u of users) await createUser(u);
console.log('');
console.log('=== RINGKASAN ===');
for (const u of users) console.log(u.team + ' | ' + u.role.padEnd(8) + ' | ' + u.email.padEnd(42) + ' | ' + u.password);