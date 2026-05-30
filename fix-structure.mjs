/**
 * fix-structure.mjs
 * Update AlexandriaDashboard.tsx:
 *   - Role: tambah owner, deputi, head_manager
 *   - 8 Tim: A-H
 *   - TeamView: terhubung ke Supabase via useTeams()
 *   - NAV: sesuaikan akses per role
 *   - Leaderboard: tampilkan per tim
 *
 * Jalankan: node fix-structure.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const FILE = join(process.cwd(), 'src/components/AlexandriaDashboard.tsx')

if (!existsSync(FILE)) {
  console.error('❌ File tidak ditemukan:', FILE)
  console.error('   Pastikan dijalankan dari root project.')
  process.exit(1)
}

let content = readFileSync(FILE, 'utf-8')
let changes = 0

function replace(label, from, to) {
  if (!content.includes(from)) {
    console.warn(`⚠️  Tidak ditemukan: ${label}`)
    return false
  }
  content = content.replace(from, to)
  changes++
  console.log(`✅ ${label}`)
  return true
}

// ─── 1. Update tipe Role ──────────────────────────────────────────────────────
replace(
  'Update tipe Role (tambah owner, deputi, head_manager)',
  `type Role = 'superadmin' | 'manager' | 'leader' | 'staff'`,
  `type Role = 'owner' | 'deputi' | 'head_manager' | 'manager' | 'staff'`
)

// ─── 2. Tambah konstanta TEAMS ────────────────────────────────────────────────
replace(
  'Tambah konstanta TEAMS dan ROLES',
  `const CLASSES: ChildClass[]`,
  `// ─── Konstanta Tim & Role ─────────────────────────────────────────────────────
const TEAMS = ['Tim A','Tim B','Tim C','Tim D','Tim E','Tim F','Tim G','Tim H'] as const
type TeamName = typeof TEAMS[number] | 'All'

const ROLE_CONFIG: Record<Role, { label:string; badge:string; nav:string[] }> = {
  owner:        { label:'Pemilik Yayasan', badge:'bg-yellow-500/20 text-yellow-300', nav:['dashboard','performance','team','campaigns','reports','goals','settings'] },
  deputi:       { label:'Deputi',          badge:'bg-purple-500/20 text-purple-300', nav:['dashboard','performance','team','campaigns','reports','goals','attendance','commission','settings'] },
  head_manager: { label:'Head Manager',   badge:'bg-red-500/20 text-red-300',    nav:['dashboard','leads','performance','team','campaigns','reports','goals','attendance','commission','settings'] },
  manager:      { label:'Manager',         badge:'bg-orange-500/20 text-orange-400', nav:['dashboard','leads','performance','team','campaigns','goals','attendance','commission'] },
  staff:        { label:'Staff Marketing', badge:'bg-blue-500/20 text-blue-400',    nav:['dashboard','leads','attendance','commission'] },
}

const CLASSES: ChildClass[]`
)

// ─── 3. Update NAV array ──────────────────────────────────────────────────────
replace(
  'Update NAV roles (pakai Role baru)',
  `const NAV: { icon:React.ComponentType<{size?:number;className?:string}>; label:string; view:View; roles:Role[]; badge?:number }[] = [
  { icon:LayoutDashboard, label:'Dashboard',  view:'dashboard',   roles:['superadmin','manager','leader','staff'] },
  { icon:Inbox,           label:'Leads',      view:'leads',       roles:['superadmin','manager','leader','staff'], badge:3 },
  { icon:BarChart3,       label:'Performa',   view:'performance', roles:['superadmin','manager','leader','staff'] },
  { icon:Users,           label:'Tim',        view:'team',        roles:['superadmin','manager','leader'] },
  { icon:Megaphone,       label:'Campaign',   view:'campaigns',   roles:['superadmin','manager','leader'] },
  { icon:FileText,        label:'Reports',    view:'reports',     roles:['superadmin','manager'] },
  { icon:Target,          label:'OKR Goals',  view:'goals',       roles:['superadmin','manager','leader'] },
  { icon:Calendar,        label:'Attendance', view:'attendance',  roles:['superadmin','manager','leader','staff'] },
  { icon:CreditCard,      label:'Komisi',     view:'commission',  roles:['superadmin','manager'] },
  { icon:Settings,        label:'Settings',   view:'settings',    roles:['superadmin'] },
]`,
  `const NAV: { icon:React.ComponentType<{size?:number;className?:string}>; label:string; view:View; roles:Role[]; badge?:number }[] = [
  { icon:LayoutDashboard, label:'Dashboard',  view:'dashboard',   roles:['owner','deputi','head_manager','manager','staff'] },
  { icon:Inbox,           label:'Leads',      view:'leads',       roles:['head_manager','manager','staff'], badge:3 },
  { icon:BarChart3,       label:'Performa',   view:'performance', roles:['owner','deputi','head_manager','manager','staff'] },
  { icon:Users,           label:'Tim',        view:'team',        roles:['owner','deputi','head_manager','manager'] },
  { icon:Megaphone,       label:'Campaign',   view:'campaigns',   roles:['deputi','head_manager','manager'] },
  { icon:FileText,        label:'Reports',    view:'reports',     roles:['owner','deputi','head_manager'] },
  { icon:Target,          label:'OKR Goals',  view:'goals',       roles:['deputi','head_manager','manager'] },
  { icon:Calendar,        label:'Attendance', view:'attendance',  roles:['head_manager','manager','staff'] },
  { icon:CreditCard,      label:'Komisi',     view:'commission',  roles:['head_manager','manager','staff'] },
  { icon:Settings,        label:'Settings',   view:'settings',    roles:['owner','deputi','head_manager'] },
]`
)

// ─── 4. Update TeamView ───────────────────────────────────────────────────────
{
  const start = content.indexOf('// ─── Team View ───')
  const end = content.indexOf('\n// ─── Campaigns View', start)
  if (start === -1 || end === -1) {
    console.warn('⚠️  TeamView tidak ditemukan')
  } else {
    const replacement = `// ─── Team View ────────────────────────────────────────────────────────────────
function TeamView({ dark, currentUser }: { dark:boolean; currentUser:User }) {
  const { members, loading, addMember, deleteMember } = useTeams()
  const [showAdd, setShowAdd] = useState(false)
  const [filterTeam, setFilterTeam] = useState<string>('All')
  const [newMember, setNewMember] = useState({ name:'', email:'', role:'staff', team:'Tim A' })
  const [saving, setSaving] = useState(false)

  const text = dark ? 'text-slate-100' : 'text-slate-800'
  const muted = dark ? 'text-slate-400' : 'text-slate-500'
  const inp = dark ? 'bg-[#0a1020] border-[#1e2d4a] text-slate-100 placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800'

  const canManage = ['owner','deputi','head_manager'].includes(currentUser.role)

  // Filter berdasarkan role: manager hanya lihat timnya sendiri
  const visibleMembers = members.filter(m => {
    if (currentUser.role === 'manager') return m.team === currentUser.team || m.id === currentUser.id
    if (filterTeam !== 'All') return m.team === filterTeam
    return true
  })

  // Grouping per tim untuk summary
  const teamSummary = TEAMS.map(t => {
    const tm = members.filter(m => m.team === t)
    return {
      name: t,
      total: tm.length,
      revenue: tm.reduce((s,m) => s + m.revenue, 0),
      leads: tm.reduce((s,m) => s + m.leads, 0),
      closing: tm.reduce((s,m) => s + m.closing, 0),
    }
  }).filter(t => t.total > 0)

  const handleAdd = async () => {
    if (!newMember.name || !newMember.email) return
    setSaving(true)
    await addMember({ ...newMember, avatar: newMember.name.charAt(0).toUpperCase(), online:false, revenue:0, leads:0, closing:0, score:0 })
    setNewMember({ name:'', email:'', role:'staff', team:'Tim A' })
    setShowAdd(false); setSaving(false)
  }

  if (loading) return <div className={\`text-center py-20 \${muted}\`}>Memuat data tim...</div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className={\`font-bold text-lg \${text}\`}>Manajemen Tim</h2>
          <p className={\`text-xs \${muted}\`}>{members.length} anggota · {teamSummary.length} tim aktif</p>
        </div>
        {canManage && (
          <button onClick={()=>setShowAdd(true)} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 hover:scale-105 transition-all">
            <UserPlus size={15}/> Tambah User
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Total Anggota', value:members.length, icon:Users, color:'from-blue-600 to-blue-400' },
          { label:'Tim Aktif', value:teamSummary.length, icon:Award, color:'from-purple-600 to-purple-400' },
          { label:'Total Leads', value:members.reduce((s,m)=>s+m.leads,0), icon:TrendingUp, color:'from-green-600 to-green-400' },
          { label:'Total Closing', value:members.reduce((s,m)=>s+m.closing,0), icon:Target, color:'from-orange-600 to-orange-400' },
        ].map(s=>(
          <Card key={s.label} dark={dark} className="p-4 flex items-center gap-3">
            <div className={\`w-10 h-10 rounded-xl bg-gradient-to-br \${s.color} flex items-center justify-center shrink-0\`}><s.icon size={16} className="text-white"/></div>
            <div><p className={\`text-xl font-bold \${text}\`}>{s.value}</p><p className={\`text-xs \${muted}\`}>{s.label}</p></div>
          </Card>
        ))}
      </div>

      {/* Team Leaderboard A-H */}
      {teamSummary.length > 0 && (
        <Card dark={dark} className="p-5">
          <h3 className={\`font-bold mb-4 \${text}\`}>Leaderboard Tim A–H</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...teamSummary].sort((a,b)=>b.closing-a.closing).map((t,i)=>(
              <div key={t.name} className={\`p-3 rounded-xl border \${dark?'border-[#1e2d4a] bg-[#0a1020]':'border-slate-200 bg-slate-50'}\`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={\`text-xs font-bold \${text}\`}>{t.name}</span>
                  <span className={\`text-xs font-bold \${i===0?'text-yellow-400':i===1?'text-slate-400':i===2?'text-orange-400':muted}\`}>#{i+1}</span>
                </div>
                <p className={\`text-lg font-bold \${text}\`}>{t.closing}</p>
                <p className={\`text-xs \${muted}\`}>closing</p>
                <p className={\`text-xs text-blue-400 mt-0.5\`}>{t.leads} leads · {t.total} orang</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filter Tim */}
      {currentUser.role !== 'manager' && (
        <div className="flex gap-2 flex-wrap">
          {(['All', ...TEAMS] as string[]).map(t=>(
            <button key={t} onClick={()=>setFilterTeam(t)}
              className={\`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors \${filterTeam===t?(dark?'bg-blue-600 text-white':'bg-blue-600 text-white'):(dark?'bg-[#1e2d4a] text-slate-400 hover:text-slate-200':'bg-slate-100 text-slate-500 hover:text-slate-700')}\`}>
              {t === 'All' ? 'Semua Tim' : t}
            </button>
          ))}
        </div>
      )}

      {/* Tabel Anggota */}
      <Card dark={dark} className="overflow-hidden">
        <div className={\`px-5 py-3 border-b flex items-center justify-between \${dark?'border-[#1e2d4a]':'border-slate-100'}\`}>
          <h3 className={\`font-bold \${text}\`}>Daftar Anggota ({visibleMembers.length})</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className={\`text-xs uppercase tracking-wider \${muted} \${dark?'bg-[#0a1020]':'bg-slate-50'}\`}>
              <th className="px-5 py-3 text-left">Anggota</th>
              <th className="px-5 py-3 text-left hidden md:table-cell">Role</th>
              <th className="px-5 py-3 text-left hidden md:table-cell">Tim</th>
              <th className="px-5 py-3 text-right hidden lg:table-cell">Leads</th>
              <th className="px-5 py-3 text-right hidden lg:table-cell">Closing</th>
              {canManage && <th className="px-5 py-3 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {visibleMembers.map(u=>{
              const rc = ROLE_CONFIG[u.role as Role] ?? ROLE_CONFIG.staff
              return (
                <motion.tr key={u.id} layout className={\`border-t \${dark?'border-[#1e2d4a] hover:bg-[#1a2a4a]':'border-slate-100 hover:bg-blue-50'} transition-colors\`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {u.avatar || u.name.charAt(0)}
                      </div>
                      <div><p className={\`font-semibold text-sm \${text}\`}>{u.name}</p><p className={\`text-xs \${muted}\`}>{u.email}</p></div>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <span className={\`text-xs px-2.5 py-1 rounded-xl font-semibold \${rc.badge}\`}>{rc.label}</span>
                  </td>
                  <td className={\`px-5 py-3 hidden md:table-cell text-sm \${muted}\`}>
                    <span className={\`px-2 py-0.5 rounded-lg text-xs font-medium \${dark?'bg-[#1e2d4a]':'bg-slate-100'}\`}>{u.team}</span>
                  </td>
                  <td className={\`px-5 py-3 text-right hidden lg:table-cell text-sm font-medium \${text}\`}>{u.leads}</td>
                  <td className={\`px-5 py-3 text-right hidden lg:table-cell text-sm font-bold text-green-400\`}>{u.closing}</td>
                  {canManage && (
                    <td className="px-5 py-3 text-center">
                      <button onClick={()=>deleteMember(u.id)} className={\`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-colors \${dark?'bg-[#1e2d4a] hover:bg-red-600 text-slate-400 hover:text-white':'bg-slate-100 hover:bg-red-500 text-slate-500 hover:text-white'}\`}><Trash2 size={12}/></button>
                    </td>
                  )}
                </motion.tr>
              )
            })}
            {visibleMembers.length === 0 && (
              <tr><td colSpan={6} className={\`px-5 py-10 text-center text-sm \${muted}\`}>Belum ada anggota di tim ini</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Modal Tambah User */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={()=>setShowAdd(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
            <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
              className={\`relative w-full max-w-md rounded-2xl border shadow-2xl \${dark?'bg-[#0f1729] border-[#1e2d4a]':'bg-white border-slate-200'}\`} onClick={e=>e.stopPropagation()}>
              <div className={\`px-5 py-4 border-b flex items-center justify-between \${dark?'border-[#1e2d4a]':'border-slate-100'}\`}>
                <h3 className={\`font-bold \${text}\`}>Tambah Anggota Baru</h3>
                <button onClick={()=>setShowAdd(false)} className={\`w-8 h-8 rounded-xl flex items-center justify-center \${dark?'bg-[#1e2d4a] text-slate-400':'bg-slate-100 text-slate-500'}\`}><X size={14}/></button>
              </div>
              <div className="p-5 space-y-3">
                <div><label className={\`block text-xs font-semibold mb-1 \${muted}\`}>Nama Lengkap</label>
                  <input value={newMember.name} onChange={e=>setNewMember(p=>({...p,name:e.target.value}))} className={\`w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500/40 \${inp}\`} placeholder="Nama lengkap"/></div>
                <div><label className={\`block text-xs font-semibold mb-1 \${muted}\`}>Email</label>
                  <input type="email" value={newMember.email} onChange={e=>setNewMember(p=>({...p,email:e.target.value}))} className={\`w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500/40 \${inp}\`} placeholder="email@alexandria.sch.id"/></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={\`block text-xs font-semibold mb-1 \${muted}\`}>Role</label>
                    <select value={newMember.role} onChange={e=>setNewMember(p=>({...p,role:e.target.value}))} className={\`w-full px-3 py-2 rounded-xl border text-sm outline-none \${inp}\`}>
                      <option value="staff">Staff Marketing</option>
                      <option value="manager">Manager</option>
                      <option value="head_manager">Head Manager</option>
                      <option value="deputi">Deputi</option>
                      <option value="owner">Pemilik</option>
                    </select></div>
                  <div><label className={\`block text-xs font-semibold mb-1 \${muted}\`}>Tim</label>
                    <select value={newMember.team} onChange={e=>setNewMember(p=>({...p,team:e.target.value}))} className={\`w-full px-3 py-2 rounded-xl border text-sm outline-none \${inp}\`}>
                      <option value="All">All (Management)</option>
                      {TEAMS.map(t=><option key={t} value={t}>{t}</option>)}
                    </select></div>
                </div>
              </div>
              <div className={\`px-5 py-4 flex gap-3 border-t \${dark?'border-[#1e2d4a]':'border-slate-100'}\`}>
                <button onClick={()=>setShowAdd(false)} className={\`flex-1 py-2.5 rounded-xl text-sm font-semibold \${dark?'bg-[#1e2d4a] text-slate-300':'bg-slate-100 text-slate-700'}\`}>Batal</button>
                <button onClick={handleAdd} disabled={saving||!newMember.name||!newMember.email} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving?<><RefreshCw size={13} className="animate-spin"/>Menyimpan...</>:'Simpan'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

`
    content = content.slice(0, start) + replacement + content.slice(end)
    changes++
    console.log('✅ Fix TeamView → 8 tim A-H + useTeams() + Leaderboard')
  }
}

// ─── 5. Update TeamView props di render (tambah currentUser) ─────────────────
replace(
  'TeamView render → tambah currentUser prop',
  `{view==='team' && <TeamView dark={d}/>}`,
  `{view==='team' && <TeamView dark={d} currentUser={user}/>}`
)

// ─── 6. Update sidebar user badge (role label) ────────────────────────────────
replace(
  'Sidebar role label → pakai ROLE_CONFIG',
  `<p className={\`text-[10px] \${muted} capitalize\`}>{user.role}</p>`,
  `<p className={\`text-[10px] \${muted}\`}>{ROLE_CONFIG[user.role]?.label ?? user.role}</p>`
)

// ─── 7. Update visibleNav filter (sudah pakai roles array dari NAV) ───────────
// NAV sudah diupdate, visibleNav otomatis menyesuaikan

// ─── 8. Update roleBadge di tempat lain (LeadsView/PerformanceView) ──────────
replace(
  'Update roleBadge supadmin → head_manager di LeadsView',
  `isManager ? undefined : currentUser.id`,
  `(['head_manager','deputi','owner'].includes(currentUser.role)) ? undefined : currentUser.id`
)

// ─── Selesai ──────────────────────────────────────────────────────────────────
if (changes === 0) {
  console.log('\n⚠️  Tidak ada perubahan yang berhasil diterapkan.')
} else {
  writeFileSync(FILE, content, 'utf-8')
  console.log(`\n🎉 Selesai! ${changes} perubahan berhasil diterapkan.`)
  console.log('\nLangkah selanjutnya:')
  console.log('  1. npx tsc --noEmit   (cek TypeScript error)')
  console.log('  2. npm run dev        (test di browser)')
  console.log('  3. Jalankan SQL di Supabase (step1-sql-foundation.sql)')
  console.log('  4. git add . && git commit -m "feat: 8 tim A-H, role baru, team leaderboard" && git push')
}
