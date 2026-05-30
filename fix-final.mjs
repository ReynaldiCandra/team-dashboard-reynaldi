/**
 * fix-final.mjs  
 * Fix terakhir: LoginScreen pakai Supabase auth + tanda mata + NAV roles benar
 * Jalankan: node fix-final.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const FILE = join(process.cwd(), 'src/components/AlexandriaDashboard.tsx')
if (!existsSync(FILE)) { console.error('❌ File tidak ditemukan'); process.exit(1) }

let content = readFileSync(FILE, 'utf-8')
let changes = 0

function replaceAll(label, from, to) {
  if (!content.includes(from)) { console.warn(`⚠️  Skip: ${label}`); return }
  content = content.split(from).join(to)
  changes++
  console.log(`✅ ${label}`)
}

function replaceSection(label, startMarker, endMarker, replacement) {
  const si = content.indexOf(startMarker)
  const ei = content.indexOf(endMarker, si + 1)
  if (si === -1 || ei === -1) { console.warn(`⚠️  Skip: ${label}`); return }
  content = content.slice(0, si) + replacement + content.slice(ei)
  changes++
  console.log(`✅ ${label}`)
}

// ─── 1. Pastikan import createClient ada ─────────────────────────────────────
if (!content.includes("import { createClient } from '@/lib/supabase/client'")) {
  replaceAll(
    'Tambah import createClient',
    `import { useLeads,`,
    `import { createClient } from '@/lib/supabase/client'\nimport { useLeads,`
  )
}

// ─── 2. Fix tipe Role (paksa replace semua variasi) ───────────────────────────
const roleLines = [
  `type Role = 'superadmin' | 'manager' | 'leader' | 'staff'`,
  `type Role = 'owner' | 'deputi' | 'head_manager' | 'manager' | 'leader' | 'staff'`,
]
for (const r of roleLines) {
  if (content.includes(r)) {
    content = content.split(r).join(`type Role = 'owner' | 'deputi' | 'head_manager' | 'manager' | 'staff'`)
    changes++; console.log('✅ Fix tipe Role')
  }
}

// ─── 3. Fix USERS array (hapus role lama) ────────────────────────────────────
replaceAll('Fix USERS role: superadmin → owner', `role:'superadmin'`, `role:'owner'`)
replaceAll('Fix USERS role: leader → manager',   `role:'leader'`,     `role:'manager'`)

// ─── 4. Fix isManager (semua variasi) ────────────────────────────────────────
const isManagerOld = [
  `currentUser.role === 'manager' || currentUser.role === 'superadmin'`,
  `(['owner','deputi','head_manager'].includes(currentUser.role)) ? undefined : currentUser.id`,
]
for (const old of isManagerOld) {
  if (content.includes(old)) {
    content = content.split(old).join(`['owner','deputi','head_manager','manager'].includes(currentUser.role)`)
    changes++; console.log('✅ Fix isManager check')
  }
}

// ─── 5. Fix NAV (paksa replace) ──────────────────────────────────────────────
const NAV_OLD_PATTERNS = [
  [`roles:['superadmin','manager','leader','staff']`, `roles:['owner','deputi','head_manager','manager','staff']`],
  [`roles:['superadmin','manager','leader']`,          `roles:['owner','deputi','head_manager','manager']`],
  [`roles:['superadmin','manager']`,                   `roles:['owner','deputi','head_manager','manager']`],
  [`roles:['superadmin']`,                             `roles:['owner','deputi','head_manager']`],
  [`roles:['head_manager','manager','leader','staff']`,`roles:['head_manager','manager','staff']`],
]
for (const [from, to] of NAV_OLD_PATTERNS) {
  if (content.includes(from)) {
    content = content.split(from).join(to)
    changes++
    console.log(`✅ Fix NAV: ...${from.slice(8,40)}`)
  }
}

// ─── 6. Fix roleBadge / roleLabel lama ───────────────────────────────────────
replaceAll('Fix roleBadge superadmin', `superadmin:'bg-red-500/20 text-red-400'`, `owner:'bg-yellow-500/20 text-yellow-300'`)
replaceAll('Fix roleBadge leader',     `, leader:'bg-purple-500/20 text-purple-400'`, ``)
replaceAll('Fix roleLabel superadmin', `superadmin:'Super Admin'`,  `owner:'Pemilik Yayasan'`)
replaceAll('Fix roleLabel leader',     `, leader:'Team Leader'`, ``)

// ─── 7. Fix sidebar capitalize → ROLE_CONFIG ─────────────────────────────────
replaceAll(
  'Fix sidebar role label',
  `<p className={\`text-[10px] \${muted} capitalize\`}>{user.role}</p>`,
  `<p className={\`text-[10px] \${muted}\`}>{ROLE_CONFIG[user.role]?.label ?? user.role}</p>`
)

// ─── 8. Fix TeamView render prop ─────────────────────────────────────────────
replaceAll(
  'Fix TeamView currentUser prop',
  `{view==='team' && <TeamView dark={d}/>}`,
  `{view==='team' && <TeamView dark={d} currentUser={user}/>}`
)

// ─── 9. GANTI LoginScreen (pakai Supabase + tanda mata) ──────────────────────
{
  const start = content.indexOf('function LoginScreen(')
  // Cari awal section berikutnya setelah LoginScreen
  const nextSection = content.indexOf('\n// ─── ', start + 100)
  if (start === -1 || nextSection === -1) {
    console.warn('⚠️  LoginScreen tidak ditemukan / tidak bisa ganti')
  } else {
    const newLoginScreen = `function LoginScreen({ onLogin }: { onLogin:(u:User)=>void }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handle = async () => {
    if (!email || !pass) { setError('Isi email dan password terlebih dahulu'); return }
    setLoading(true); setError('')
    const supabase = createClient()
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (authErr) { setError('Email atau password salah'); setLoading(false); return }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { setError('Gagal mendapatkan sesi. Coba lagi.'); setLoading(false); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    const p = profile as Record<string,unknown> | null
    const u: User = {
      id: session.user.id,
      name: (p?.full_name as string) ?? session.user.email?.split('@')[0] ?? 'User',
      role: (p?.role as Role) ?? 'staff',
      team: (p?.team as string) ?? 'All',
      avatar: ((p?.full_name as string)?.charAt(0) ?? 'U').toUpperCase(),
      email: session.user.email ?? '',
      online: true,
      revenue: 0, leads: 0, closing: 0, score: 0,
    }
    onLogin(u)
  }

  const ROLE_HINTS = [
    { role:'owner',        label:'Pemilik',      color:'text-yellow-400', email:'pa.idris@alexandria.sch.id' },
    { role:'deputi',       label:'Deputi',        color:'text-purple-400', email:'deputi@alexandria.sch.id' },
    { role:'head_manager', label:'Head Manager',  color:'text-red-400',    email:'erwin@alexandria.sch.id' },
    { role:'manager',      label:'Manager',       color:'text-orange-400', email:'manager.a@alexandria.sch.id' },
    { role:'staff',        label:'Staff',         color:'text-blue-400',   email:'staff.a1@alexandria.sch.id' },
  ]

  return (
    <div className="min-h-screen bg-[#070d1a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glows */}
      <motion.div animate={{ scale:[1,1.1,1], opacity:[0.15,0.25,0.15] }} transition={{ repeat:Infinity, duration:8 }}
        className="absolute -top-60 -left-60 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px]"/>
      <motion.div animate={{ scale:[1,1.15,1], opacity:[0.1,0.2,0.1] }} transition={{ repeat:Infinity, duration:10, delay:2 }}
        className="absolute -bottom-60 -right-60 w-[500px] h-[500px] bg-purple-600 rounded-full blur-[120px]"/>
      {/* Decorative dots grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:'radial-gradient(circle, #fff 1px, transparent 1px)',backgroundSize:'32px 32px'}}/>

      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="relative w-full max-w-md">

        {/* ── TANDA MATA (School Badge) ── */}
        <div className="text-center mb-6">
          <div className="relative inline-block">
            {/* Outer ring - Islamic geometric */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 30, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-blue-500/20"
              style={{ margin: '-12px' }}
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
              className="absolute inset-0 rounded-full border border-dashed border-purple-500/20"
              style={{ margin: '-6px' }}
            />
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative w-20 h-20 rounded-full overflow-hidden mx-auto shadow-2xl shadow-blue-500/40 border-2 border-white/10"
            >
              <img src="/logo-alexandria.jpeg" alt="Alexandria" className="w-full h-full object-cover"/>
              {/* Verified badge */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center border-2 border-[#070d1a]">
                <BadgeCheck size={12} className="text-white"/>
              </div>
            </motion.div>
          </div>

          <div className="mt-4">
            <h1 className="text-2xl font-bold text-white tracking-tight">Alexandria Dashboard</h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-blue-500/60"/>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Marketing System</p>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-blue-500/60"/>
            </div>
            {/* School name badge */}
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full">
              <GraduationCap size={11} className="text-blue-400"/>
              <span className="text-[10px] font-semibold text-blue-300 tracking-wide">Alexandria Islamic School</span>
            </div>
          </div>
        </div>

        {/* ── Login Card ── */}
        <div className="bg-[#111d35] border border-[#1e2d4a] rounded-2xl p-7 shadow-2xl backdrop-blur">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                className="mb-4 px-4 py-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={14}/>{error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handle()}
                placeholder="email@alexandria.sch.id"
                className="w-full px-4 py-3 bg-[#0a1020] border border-[#1e2d4a] rounded-xl text-white placeholder-slate-600 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Password</label>
              <input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handle()}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#0a1020] border border-[#1e2d4a] rounded-xl text-white placeholder-slate-600 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"/>
            </div>
            <button onClick={handle} disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <><RefreshCw size={15} className="animate-spin"/>Masuk...</> : <><Zap size={15}/>Masuk Sekarang</>}
            </button>
          </div>

          {/* Role Legend */}
          <div className={\`mt-5 pt-4 border-t border-[#1e2d4a]\`}>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5 text-center">Akses Berdasarkan Role</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {ROLE_HINTS.map(h=>(
                <span key={h.role} className={\`text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 \${h.color} font-medium\`}>
                  {h.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Developer Credit ── */}
        <div className="mt-5 flex items-center justify-center gap-3">
          <img src="/reynaldi.jpeg" alt="Reynaldi" className="w-9 h-9 rounded-full object-cover object-top border-2 border-white/20 shadow-lg"/>
          <div>
            <p className="text-slate-400 text-xs font-semibold">Reynaldi Candra Webdev</p>
            <p className="text-slate-600 text-[10px]">&copy; 2026 Alexandria Islamic School</p>
          </div>
        </div>

      </motion.div>
    </div>
  )
}

`
    content = content.slice(0, start) + newLoginScreen + content.slice(nextSection)
    changes++
    console.log('✅ Fix LoginScreen → Supabase auth + tanda mata school badge')
  }
}

// ─── Tulis file ───────────────────────────────────────────────────────────────
writeFileSync(FILE, content, 'utf-8')
console.log(`\n🎉 Selesai! ${changes} perubahan diterapkan.`)
console.log('\nSelanjutnya:')
console.log('  npx tsc --noEmit')
console.log('  git add . && git commit -m "feat: login Supabase, tanda mata, fix roles" && git push')
