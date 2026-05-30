/**
 * fix-dashboard.mjs
 * Jalankan dari root project: node fix-dashboard.mjs
 * Script ini otomatis memperbaiki AlexandriaDashboard.tsx
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const FILE = join(process.cwd(), 'src/components/AlexandriaDashboard.tsx')

if (!existsSync(FILE)) {
  console.error('❌ File tidak ditemukan:', FILE)
  console.error('   Pastikan kamu menjalankan script ini dari root project.')
  process.exit(1)
}

let content = readFileSync(FILE, 'utf-8')
const original = content
let changes = 0

function replace(label, from, to) {
  if (!content.includes(from)) {
    console.warn(`⚠️  Tidak ditemukan: ${label}`)
    return
  }
  content = content.replace(from, to)
  changes++
  console.log(`✅ ${label}`)
}

// ─── 1. Tambah imports hook yang hilang ──────────────────────────────────────
replace(
  'Tambah imports hooks',
  `import { useLeads, exportLeadsCSV, buildWABroadcast, buildWAIndividual } from '@/hooks/use-leads'`,
  `import { useLeads, exportLeadsCSV, buildWABroadcast, buildWAIndividual } from '@/hooks/use-leads'
import { useAuth } from '@/hooks/use-auth'
import { useCampaigns } from '@/hooks/use-campaign'
import type { Campaign } from '@/hooks/use-campaign'
import { useGoals } from '@/hooks/use-goals'
import type { OkrGoal } from '@/hooks/use-goals'
import { useAttendance } from '@/hooks/use-attendance'
import { useClosings, useCommissionSettings } from '@/hooks/use-commission'
import { useTeams } from '@/hooks/use-team'
import { createClient } from '@/lib/supabase/client'`
)

// ─── 2. Fix LoginScreen ───────────────────────────────────────────────────────
{
  const start = content.indexOf('function LoginScreen(')
  const end = content.indexOf('\n// ─── Leads View', start)
  if (start === -1 || end === -1) {
    console.warn('⚠️  LoginScreen tidak ditemukan')
  } else {
    const replacement = `function LoginScreen({ onLogin }: { onLogin:(u:User)=>void }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handle = async () => {
    setLoading(true); setError('')
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (authErr) { setError(authErr.message); setLoading(false); return }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { setError('Gagal mendapatkan sesi'); setLoading(false); return }
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    const p = profile as Record<string,unknown> | null
    const u: User = {
      id: session.user.id,
      name: (p?.full_name as string) ?? session.user.email ?? 'User',
      role: (p?.role as Role) ?? 'staff',
      team: (p?.team as string) ?? 'All',
      avatar: ((p?.full_name as string)?.charAt(0) ?? 'U').toUpperCase(),
      email: session.user.email ?? '',
      online: true,
      revenue: 0, leads: 0, closing: 0, score: 0,
    }
    onLogin(u)
  }

  return (
    <div className="min-h-screen bg-[#070d1a] flex items-center justify-center p-4 relative overflow-hidden">
      <motion.div animate={{ scale:[1,1.1,1], opacity:[0.15,0.25,0.15] }} transition={{ repeat:Infinity, duration:8 }} className="absolute -top-60 -left-60 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px]"/>
      <motion.div animate={{ scale:[1,1.15,1], opacity:[0.1,0.2,0.1] }} transition={{ repeat:Infinity, duration:10, delay:2 }} className="absolute -bottom-60 -right-60 w-[500px] h-[500px] bg-purple-600 rounded-full blur-[120px]"/>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <motion.div whileHover={{ rotate:5, scale:1.05 }} className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 shadow-2xl shadow-blue-500/40 cursor-pointer border-2 border-white/10">
            <img src="/logo-alexandria.jpeg" alt="Alexandria" className="w-full h-full object-cover"/>
          </motion.div>
          <h1 className="text-2xl font-bold text-white">Alexandria Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Marketing Performance System</p>
        </div>
        <div className="bg-[#111d35] border border-[#1e2d4a] rounded-2xl p-7 shadow-2xl backdrop-blur">
          <AnimatePresence mode="wait">
            {error && <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="mb-4 px-4 py-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2"><AlertCircle size={14}/>{error}</motion.div>}
          </AnimatePresence>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handle()} placeholder="email kamu" className="w-full px-4 py-3 bg-[#0a1020] border border-[#1e2d4a] rounded-xl text-white placeholder-slate-600 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Password</label>
              <input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handle()} placeholder="••••••••" className="w-full px-4 py-3 bg-[#0a1020] border border-[#1e2d4a] rounded-xl text-white placeholder-slate-600 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"/>
            </div>
            <button onClick={handle} disabled={loading} className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2">
              {loading?<><RefreshCw size={15} className="animate-spin"/>Masuk...</>:<><Zap size={15}/>Masuk Sekarang</>}
            </button>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-center gap-3">
          <img src="/reynaldi.jpeg" alt="Reynaldi Candra" className="w-9 h-9 rounded-full object-cover object-top border-2 border-white/20 shadow-lg"/>
          <div>
            <p className="text-slate-400 text-xs font-semibold">Reynaldi Candra Webdev</p>
            <p className="text-slate-600 text-[10px]">&copy; 2026 All rights reserved</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

`
    content = content.slice(0, start) + replacement + content.slice(end)
    changes++
    console.log('✅ Fix LoginScreen → Supabase auth')
  }
}

// ─── 3. Fix CampaignsView ─────────────────────────────────────────────────────
{
  const start = content.indexOf('// ─── Campaigns View')
  const end = content.indexOf('\n// ─── Goals', start)
  if (start === -1 || end === -1) {
    console.warn('⚠️  CampaignsView tidak ditemukan')
  } else {
    const replacement = `// ─── Campaigns View ─────────────────────────────────────────────────────────
function CampaignsView({ dark }: { dark:boolean }) {
  const { campaigns, loading, createCampaign, deleteCampaign } = useCampaigns()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name:'', status:'Draft' as Campaign['status'], budget:0, start:'', end:'', staff:[] as string[] })
  const [saving, setSaving] = useState(false)
  const text = dark ? 'text-slate-100' : 'text-slate-800'
  const muted = dark ? 'text-slate-400' : 'text-slate-500'
  const inp = dark ? 'bg-[#0a1020] border-[#1e2d4a] text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
  const STATUS: Record<string,{label:string;bg:string;text:string;icon:React.ComponentType<any>}> = {
    Active:{label:'Aktif',bg:'bg-green-500/20',text:'text-green-400',icon:PlayCircle},
    Paused:{label:'Dijeda',bg:'bg-yellow-500/20',text:'text-yellow-400',icon:PauseCircle},
    Completed:{label:'Selesai',bg:'bg-blue-500/20',text:'text-blue-400',icon:CheckCircle},
    Draft:{label:'Draft',bg:'bg-slate-500/20',text:'text-slate-400',icon:FileText},
  }
  const handleCreate = async () => {
    if (!form.name) return
    setSaving(true)
    await createCampaign({ ...form, leads:0, closing:0, revenue:0 })
    setForm({ name:'', status:'Draft', budget:0, start:'', end:'', staff:[] })
    setShowForm(false); setSaving(false)
  }
  if (loading) return <div className={\`text-center py-20 \${muted}\`}>Memuat campaign...</div>
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className={\`font-bold text-lg \${text}\`}>Campaign Management</h2><p className={\`text-xs \${muted}\`}>{campaigns.length} campaign</p></div>
        <button onClick={()=>setShowForm(!showForm)} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 hover:scale-105 transition-all"><Plus size={15}/>New Campaign</button>
      </div>
      {showForm && (
        <Card dark={dark} className="p-5 space-y-3">
          <h3 className={\`font-bold \${text}\`}>Buat Campaign Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className={\`text-xs font-semibold \${muted} block mb-1\`}>Nama Campaign</label>
              <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} className={\`w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500/40 \${inp}\`} placeholder="Ramadan Promo 2026"/></div>
            <div><label className={\`text-xs font-semibold \${muted} block mb-1\`}>Status</label>
              <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value as Campaign['status']}))} className={\`w-full px-3 py-2 rounded-xl border text-sm outline-none \${inp}\`}>
                {['Draft','Active','Paused','Completed'].map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label className={\`text-xs font-semibold \${muted} block mb-1\`}>Mulai</label>
              <input type="date" value={form.start} onChange={e=>setForm(p=>({...p,start:e.target.value}))} className={\`w-full px-3 py-2 rounded-xl border text-sm outline-none \${inp}\`}/></div>
            <div><label className={\`text-xs font-semibold \${muted} block mb-1\`}>Selesai</label>
              <input type="date" value={form.end} onChange={e=>setForm(p=>({...p,end:e.target.value}))} className={\`w-full px-3 py-2 rounded-xl border text-sm outline-none \${inp}\`}/></div>
            <div><label className={\`text-xs font-semibold \${muted} block mb-1\`}>Budget (Rp)</label>
              <input type="number" value={form.budget} onChange={e=>setForm(p=>({...p,budget:Number(e.target.value)}))} className={\`w-full px-3 py-2 rounded-xl border text-sm outline-none \${inp}\`}/></div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleCreate} disabled={saving||!form.name} className="px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-xl hover:bg-green-500 disabled:opacity-50 flex items-center gap-1.5">
              {saving?<RefreshCw size={12} className="animate-spin"/>:<Check size={12}/>}Simpan</button>
            <button onClick={()=>setShowForm(false)} className={\`px-4 py-2 text-xs font-semibold rounded-xl \${dark?'bg-[#1e2d4a] text-slate-400':'bg-slate-100 text-slate-500'}\`}>Batal</button>
          </div>
        </Card>
      )}
      {campaigns.length === 0 && !showForm ? (
        <Card dark={dark} className="p-12 text-center">
          <Megaphone size={40} className={\`mx-auto mb-3 \${muted}\`}/>
          <p className={\`font-bold \${text}\`}>Belum ada campaign</p>
          <p className={\`text-xs mt-1 \${muted}\`}>Klik "New Campaign" untuk mulai</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map(c=>{
            const sc = STATUS[c.status] ?? STATUS.Draft
            const roi = c.budget > 0 ? ((c.revenue - c.budget) / c.budget * 100).toFixed(0) : '0'
            return (
              <Card key={c.id} dark={dark} className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div><h3 className={\`font-bold \${text}\`}>{c.name}</h3><p className={\`text-xs \${muted}\`}>{c.start} → {c.end}</p></div>
                  <span className={\`text-xs px-2.5 py-1 rounded-xl font-semibold flex items-center gap-1 \${sc.bg} \${sc.text}\`}><sc.icon size={12}/>{sc.label}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[{l:'Leads',v:c.leads,color:'text-blue-400'},{l:'Closing',v:c.closing,color:'text-green-400'},{l:'Revenue',v:fmtRp(c.revenue),color:'text-orange-400'},{l:'ROI',v:\`\${roi}%\`,color:Number(roi)>0?'text-emerald-400':'text-red-400'}].map(s=>(
                    <div key={s.l} className="text-center"><p className={\`text-base font-bold \${s.color}\`}>{s.v}</p><p className={\`text-xs \${muted}\`}>{s.l}</p></div>
                  ))}
                </div>
                <div className={\`flex gap-1 pt-3 border-t \${dark?'border-[#1e2d4a]':'border-slate-100'} justify-end\`}>
                  <button onClick={()=>deleteCampaign(c.id)} className={\`w-7 h-7 rounded-lg flex items-center justify-center transition-colors \${dark?'bg-[#1e2d4a] hover:bg-red-600 text-slate-400 hover:text-white':'bg-slate-100 hover:bg-red-500 text-slate-500 hover:text-white'}\`}><Trash2 size={12}/></button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

`
    content = content.slice(0, start) + replacement + content.slice(end)
    changes++
    console.log('✅ Fix CampaignsView → useCampaigns()')
  }
}

// ─── 4. Fix GoalsView ─────────────────────────────────────────────────────────
{
  const start = content.indexOf('// ─── Goals / OKR View')
  const end = content.indexOf('\n// ─── Attendance View', start)
  if (start === -1 || end === -1) {
    console.warn('⚠️  GoalsView tidak ditemukan')
  } else {
    const replacement = `// ─── Goals / OKR View ───────────────────────────────────────────────────────
function GoalsView({ dark }: { dark:boolean }) {
  const { goals, loading, createGoal, deleteGoal } = useGoals()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title:'', description:'', target:100, current:0, unit:'', deadline:'', owner:'', priority:'medium' as OkrGoal['priority'], status:'on-track' as OkrGoal['status'] })
  const [saving, setSaving] = useState(false)
  const text = dark ? 'text-slate-100' : 'text-slate-800'
  const muted = dark ? 'text-slate-400' : 'text-slate-500'
  const inp = dark ? 'bg-[#0a1020] border-[#1e2d4a] text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
  const prio: Record<string,string> = { high:'bg-red-500/20 text-red-400', medium:'bg-yellow-500/20 text-yellow-400', low:'bg-blue-500/20 text-blue-400' }
  const statusCfg: Record<string,{color:string;label:string}> = {
    'on-track':{color:'text-green-400',label:'On Track'},'at-risk':{color:'text-yellow-400',label:'At Risk'},'behind':{color:'text-red-400',label:'Behind'},'completed':{color:'text-blue-400',label:'Completed'}
  }
  const handleCreate = async () => {
    if (!form.title) return
    setSaving(true)
    await createGoal(form)
    setForm({ title:'', description:'', target:100, current:0, unit:'', deadline:'', owner:'', priority:'medium', status:'on-track' })
    setShowForm(false); setSaving(false)
  }
  if (loading) return <div className={\`text-center py-20 \${muted}\`}>Memuat goals...</div>
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className={\`font-bold text-lg \${text}\`}>Goal Setting · OKR</h2><p className={\`text-xs \${muted}\`}>Q2 2026 · April – Juni</p></div>
        <button onClick={()=>setShowForm(!showForm)} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 hover:scale-105 transition-all"><Plus size={15}/>Tambah OKR</button>
      </div>
      {showForm && (
        <Card dark={dark} className="p-5 space-y-3">
          <h3 className={\`font-bold \${text}\`}>OKR Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2"><label className={\`text-xs font-semibold \${muted} block mb-1\`}>Judul Goal</label>
              <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} className={\`w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500/40 \${inp}\`} placeholder="Contoh: 100 Leads di Q2"/></div>
            <div><label className={\`text-xs font-semibold \${muted} block mb-1\`}>Target (angka)</label>
              <input type="number" value={form.target} onChange={e=>setForm(p=>({...p,target:Number(e.target.value)}))} className={\`w-full px-3 py-2 rounded-xl border text-sm outline-none \${inp}\`}/></div>
            <div><label className={\`text-xs font-semibold \${muted} block mb-1\`}>Satuan</label>
              <input value={form.unit} onChange={e=>setForm(p=>({...p,unit:e.target.value}))} className={\`w-full px-3 py-2 rounded-xl border text-sm outline-none \${inp}\`} placeholder="leads, closing, siswa"/></div>
            <div><label className={\`text-xs font-semibold \${muted} block mb-1\`}>Deadline</label>
              <input type="date" value={form.deadline} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))} className={\`w-full px-3 py-2 rounded-xl border text-sm outline-none \${inp}\`}/></div>
            <div><label className={\`text-xs font-semibold \${muted} block mb-1\`}>Owner</label>
              <input value={form.owner} onChange={e=>setForm(p=>({...p,owner:e.target.value}))} className={\`w-full px-3 py-2 rounded-xl border text-sm outline-none \${inp}\`} placeholder="Nama PIC"/></div>
            <div><label className={\`text-xs font-semibold \${muted} block mb-1\`}>Prioritas</label>
              <select value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value as OkrGoal['priority']}))} className={\`w-full px-3 py-2 rounded-xl border text-sm outline-none \${inp}\`}>
                <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleCreate} disabled={saving||!form.title} className="px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-xl hover:bg-green-500 disabled:opacity-50 flex items-center gap-1.5">
              {saving?<RefreshCw size={12} className="animate-spin"/>:<Check size={12}/>}Simpan</button>
            <button onClick={()=>setShowForm(false)} className={\`px-4 py-2 text-xs font-semibold rounded-xl \${dark?'bg-[#1e2d4a] text-slate-400':'bg-slate-100 text-slate-500'}\`}>Batal</button>
          </div>
        </Card>
      )}
      {goals.length === 0 && !showForm ? (
        <Card dark={dark} className="p-12 text-center">
          <Target size={40} className={\`mx-auto mb-3 \${muted}\`}/>
          <p className={\`font-bold \${text}\`}>Belum ada OKR Goals</p>
          <p className={\`text-xs mt-1 \${muted}\`}>Klik "Tambah OKR" untuk mulai</p>
        </Card>
      ) : goals.map(g=>{
        const pct = Math.min(100, g.target > 0 ? Math.round((g.current/g.target)*100) : 0)
        const st = statusCfg[g.status] ?? statusCfg['on-track']
        return (
          <Card key={g.id} dark={dark} className="p-5">
            <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className={\`font-bold \${text}\`}>{g.title}</h3>
                  <span className={\`text-xs px-2 py-0.5 rounded-lg font-semibold \${prio[g.priority]}\`}>{g.priority.toUpperCase()}</span>
                  <span className={\`text-xs font-semibold \${st.color}\`}>{st.label}</span>
                </div>
                <p className={\`text-xs \${muted}\`}>{g.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right"><p className={\`text-2xl font-bold \${text}\`}>{pct}%</p><p className={\`text-xs \${muted}\`}>tercapai</p></div>
                <button onClick={()=>deleteGoal(g.id)} className={\`w-7 h-7 rounded-lg flex items-center justify-center \${dark?'bg-[#1e2d4a] hover:bg-red-600 text-slate-400 hover:text-white':'bg-slate-100 hover:bg-red-500 text-slate-500 hover:text-white'} transition-colors\`}><Trash2 size={12}/></button>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className={muted}>{g.current} {g.unit} dari target {g.target} {g.unit}</span>
              <span className={muted}>Deadline: {g.deadline}</span>
            </div>
            <ProgressBar value={g.current} max={g.target} color={g.status==='on-track'?'green':g.status==='at-risk'?'yellow':'orange'} dark={dark}/>
            <div className={\`flex items-center gap-2 mt-3 pt-3 border-t \${dark?'border-[#1e2d4a]':'border-slate-100'}\`}>
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-[9px]">{g.owner.charAt(0)}</div>
              <span className={\`text-xs \${muted}\`}>{g.owner}</span>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

`
    content = content.slice(0, start) + replacement + content.slice(end)
    changes++
    console.log('✅ Fix GoalsView → useGoals()')
  }
}

// ─── 5. Fix AttendanceView ────────────────────────────────────────────────────
{
  const start = content.indexOf('// ─── Attendance View')
  const end = content.indexOf('\n// ─── Commission View', start)
  if (start === -1 || end === -1) {
    console.warn('⚠️  AttendanceView tidak ditemukan')
  } else {
    const replacement = `// ─── Attendance View ────────────────────────────────────────────────────────
function AttendanceView({ dark, currentUser }: { dark:boolean; currentUser:User }) {
  const [checkingIn, setCheckingIn] = useState(false)
  const [selStatus, setSelStatus] = useState<'hadir'|'wfh'|'dinas'>('hadir')
  const { records, todayRecord, loading, checkIn, getMonthlySummary } = useAttendance(currentUser.id)
  const text = dark ? 'text-slate-100' : 'text-slate-800'
  const muted = dark ? 'text-slate-400' : 'text-slate-500'
  const todayStr = new Date().toLocaleDateString('id-ID', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
  const checkedIn = !!todayRecord?.checkInTime
  const summary = getMonthlySummary(new Date().toISOString().slice(0,7))
  const attStatus: Record<string,{bg:string;text:string}> = {
    hadir:{bg:'bg-green-500/20',text:'text-green-400'}, wfh:{bg:'bg-blue-500/20',text:'text-blue-400'},
    izin:{bg:'bg-yellow-500/20',text:'text-yellow-400'}, alpa:{bg:'bg-red-500/20',text:'text-red-400'}, dinas:{bg:'bg-purple-500/20',text:'text-purple-400'},
  }
  const handleCheckIn = async () => {
    if (checkedIn) return
    setCheckingIn(true)
    await checkIn(selStatus)
    setCheckingIn(false)
  }
  return (
    <div className="space-y-5">
      <div><h2 className={\`font-bold text-lg \${text}\`}>Attendance & Check-in</h2><p className={\`text-xs \${muted}\`}>{todayStr}</p></div>
      <Card dark={dark} className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={\`w-16 h-16 rounded-2xl flex items-center justify-center \${checkedIn?'bg-green-500/20':dark?'bg-[#1e2d4a]':'bg-slate-100'}\`}>
              <CheckCircle size={32} className={checkedIn?'text-green-400':muted}/>
            </div>
            <div>
              <h3 className={\`font-bold text-lg \${text}\`}>{checkedIn ? \`Check-in pada \${todayRecord?.checkInTime}\` : 'Belum Check-in'}</h3>
              <p className={\`text-sm \${muted}\`}>{checkedIn ? 'Kamu sudah tercatat hadir hari ini ✓' : 'Pilih status lalu tap tombol check-in'}</p>
              {!checkedIn && (
                <div className="flex gap-3 mt-2">
                  {(['hadir','wfh','dinas'] as const).map(s=>(
                    <label key={s} className={\`flex items-center gap-1.5 text-xs cursor-pointer \${selStatus===s?text:muted}\`}>
                      <input type="radio" name="att-status" checked={selStatus===s} onChange={()=>setSelStatus(s)} className="accent-blue-500"/>
                      {s.charAt(0).toUpperCase()+s.slice(1)}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button onClick={handleCheckIn} disabled={checkedIn||checkingIn}
            className={\`px-6 py-3 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition-all \${checkedIn?'bg-green-500 opacity-70 cursor-not-allowed':checkingIn?'bg-blue-400 cursor-wait':'bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95'}\`}>
            <Clock size={15}/>{checkedIn?'Sudah Check-in':checkingIn?'Menyimpan...':'Check-in Sekarang'}
          </button>
        </div>
        <div className={\`grid grid-cols-3 gap-4 mt-5 pt-5 border-t \${dark?'border-[#1e2d4a]':'border-slate-100'}\`}>
          {[{l:'Jam Masuk',v:todayRecord?.checkInTime||'-'},{l:'Jam Keluar',v:todayRecord?.checkOutTime||'-'},{l:'Status',v:todayRecord?.status||'—'}].map(s=>(
            <div key={s.l} className="text-center"><p className={\`text-lg font-bold \${text}\`}>{s.v}</p><p className={\`text-xs \${muted}\`}>{s.l}</p></div>
          ))}
        </div>
      </Card>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {([['Hadir',summary.hadir,CheckCircle,'from-green-600 to-green-400'],['WFH',summary.wfh,Activity,'from-blue-600 to-blue-400'],['Izin',summary.izin,AlertCircle,'from-yellow-600 to-yellow-400'],['Alpa',summary.alpa,X,'from-red-600 to-red-400']] as const).map(([l,v,Icon,color])=>(
          <Card key={l} dark={dark} className="p-4 flex items-center gap-3">
            <div className={\`w-10 h-10 rounded-xl bg-gradient-to-br \${color} flex items-center justify-center shrink-0\`}><Icon size={16} className="text-white"/></div>
            <div><p className={\`text-xl font-bold \${text}\`}>{v}</p><p className={\`text-xs \${muted}\`}>{l}</p></div>
          </Card>
        ))}
      </div>
      <Card dark={dark} className="overflow-hidden">
        <div className={\`px-5 py-3 border-b \${dark?'border-[#1e2d4a]':'border-slate-100'}\`}>
          <h3 className={\`font-bold \${text}\`}>Riwayat {records.length} Hari Terakhir</h3>
        </div>
        <table className="w-full text-sm">
          <thead><tr className={\`text-xs uppercase tracking-wider \${muted} \${dark?'bg-[#0a1020]':'bg-slate-50'}\`}>
            <th className="px-5 py-3 text-left">Tanggal</th><th className="px-5 py-3 text-left">Status</th>
            <th className="px-5 py-3 text-left hidden md:table-cell">Check-in</th><th className="px-5 py-3 text-left hidden md:table-cell">Check-out</th>
          </tr></thead>
          <tbody>
            {records.slice(0,10).map((row,i)=>(
              <tr key={i} className={\`border-t \${dark?'border-[#1e2d4a] hover:bg-[#1a2a4a]':'border-slate-100 hover:bg-blue-50'} transition-colors\`}>
                <td className={\`px-5 py-3 text-sm font-medium \${muted}\`}>{new Date(row.attendDate).toLocaleDateString('id-ID')}</td>
                <td className="px-5 py-3"><span className={\`text-xs px-2.5 py-1 rounded-xl font-semibold \${attStatus[row.status]?.bg} \${attStatus[row.status]?.text}\`}>{row.status}</span></td>
                <td className={\`px-5 py-3 text-sm \${muted} hidden md:table-cell\`}>{row.checkInTime||'-'}</td>
                <td className={\`px-5 py-3 text-sm \${muted} hidden md:table-cell\`}>{row.checkOutTime||'-'}</td>
              </tr>
            ))}
            {records.length===0&&<tr><td colSpan={4} className={\`px-5 py-8 text-center text-sm \${muted}\`}>Belum ada data attendance</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

`
    content = content.slice(0, start) + replacement + content.slice(end)
    changes++
    console.log('✅ Fix AttendanceView → useAttendance()')
  }
}

// ─── 6. Fix CommissionView ────────────────────────────────────────────────────
{
  const start = content.indexOf('// ─── Commission View')
  const end = content.indexOf('\n// ─── Reports View', start)
  if (start === -1 || end === -1) {
    console.warn('⚠️  CommissionView tidak ditemukan')
  } else {
    const replacement = `// ─── Commission View ────────────────────────────────────────────────────────
function CommissionView({ dark, currentUser }: { dark:boolean; currentUser:User }) {
  const isManager = currentUser.role === 'manager' || currentUser.role === 'superadmin'
  const { closings, loading, addClosing } = useClosings(isManager ? undefined : currentUser.id)
  const { settings } = useCommissionSettings()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ studentName:'', parentName:'', childClass:'', uangBangunan:0, dpAmount:0, isDpOnly:false, closingBy:'staff' as 'staff'|'manager_self', notes:'' })
  const text = dark ? 'text-slate-100' : 'text-slate-800'
  const muted = dark ? 'text-slate-400' : 'text-slate-500'
  const inp = dark ? 'bg-[#0a1020] border-[#1e2d4a] text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
  const totalKomisi = closings.reduce((s,c)=>s+(isManager?c.komisiManager:c.komisiStaff),0)
  const totalRevenue = closings.reduce((s,c)=>s+c.uangBangunan,0)
  const handleAdd = async () => {
    if (!form.studentName) return
    setSaving(true)
    await addClosing({ ...form, staffId:currentUser.id, managerId:isManager?currentUser.id:undefined, settings })
    setForm({ studentName:'', parentName:'', childClass:'', uangBangunan:0, dpAmount:0, isDpOnly:false, closingBy:'staff', notes:'' })
    setShowForm(false); setSaving(false)
  }
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className={\`font-bold text-lg \${text}\`}>Komisi & Insentif</h2><p className={\`text-xs \${muted}\`}>Kalkulator otomatis · {new Date().toLocaleDateString('id-ID',{month:'long',year:'numeric'})}</p></div>
        <button onClick={()=>setShowForm(!showForm)} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 hover:scale-105 transition-all"><Plus size={15}/>Tambah Closing</button>
      </div>
      {showForm && (
        <Card dark={dark} className="p-5 space-y-3">
          <h3 className={\`font-bold \${text}\`}>Input Closing Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className={\`text-xs font-semibold \${muted} block mb-1\`}>Nama Siswa</label>
              <input value={form.studentName} onChange={e=>setForm(p=>({...p,studentName:e.target.value}))} className={\`w-full px-3 py-2 rounded-xl border text-sm outline-none \${inp}\`} placeholder="Nama siswa"/></div>
            <div><label className={\`text-xs font-semibold \${muted} block mb-1\`}>Nama Orang Tua</label>
              <input value={form.parentName} onChange={e=>setForm(p=>({...p,parentName:e.target.value}))} className={\`w-full px-3 py-2 rounded-xl border text-sm outline-none \${inp}\`} placeholder="Nama orang tua"/></div>
            <div><label className={\`text-xs font-semibold \${muted} block mb-1\`}>Uang Bangunan (Rp)</label>
              <input type="number" value={form.uangBangunan||''} onChange={e=>setForm(p=>({...p,uangBangunan:Number(e.target.value)}))} className={\`w-full px-3 py-2 rounded-xl border text-sm outline-none \${inp}\`} placeholder={\`Default: \${settings.uangBangunanDiskon}\`}/></div>
            <div><label className={\`text-xs font-semibold \${muted} block mb-1\`}>DP (Rp)</label>
              <input type="number" value={form.dpAmount||''} onChange={e=>setForm(p=>({...p,dpAmount:Number(e.target.value)}))} className={\`w-full px-3 py-2 rounded-xl border text-sm outline-none \${inp}\`}/></div>
          </div>
          <div className={\`p-3 rounded-xl \${dark?'bg-[#0a1020]':'bg-slate-50'}\`}>
            <p className={\`text-xs \${muted} mb-1\`}>Estimasi Komisi</p>
            <p className="font-bold text-green-400">{fmtRp(Math.round((form.uangBangunan||settings.uangBangunanDiskon)*(settings.rateStaffClosing/100)))}</p>
            <p className={\`text-xs \${muted}\`}>Rate: {settings.rateStaffClosing}% dari Uang Bangunan</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving||!form.studentName} className="px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-xl hover:bg-green-500 disabled:opacity-50 flex items-center gap-1.5">
              {saving?<RefreshCw size={12} className="animate-spin"/>:<Check size={12}/>}Simpan</button>
            <button onClick={()=>setShowForm(false)} className={\`px-4 py-2 text-xs font-semibold rounded-xl \${dark?'bg-[#1e2d4a] text-slate-400':'bg-slate-100 text-slate-500'}\`}>Batal</button>
          </div>
        </Card>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[{l:'Total Closing',v:closings.length,icon:Award,g:'from-purple-600 to-purple-400'},{l:'Total Revenue',v:fmtRp(totalRevenue),icon:TrendingUp,g:'from-blue-600 to-blue-400'},{l:'Total Komisi',v:fmtRp(totalKomisi),icon:DollarSign,g:'from-green-600 to-green-400'}].map(s=>(
          <Card key={s.l} dark={dark} className="p-4 flex items-center gap-3">
            <div className={\`w-10 h-10 rounded-xl bg-gradient-to-br \${s.g} flex items-center justify-center shrink-0\`}><s.icon size={16} className="text-white"/></div>
            <div><p className={\`text-base font-bold \${text}\`}>{s.v}</p><p className={\`text-xs \${muted}\`}>{s.l}</p></div>
          </Card>
        ))}
      </div>
      <Card dark={dark} className="overflow-hidden">
        <div className={\`px-5 py-3 border-b \${dark?'border-[#1e2d4a]':'border-slate-100'}\`}><h3 className={\`font-bold \${text}\`}>Riwayat Closing</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className={\`text-xs uppercase tracking-wider \${muted} \${dark?'bg-[#0a1020]':'bg-slate-50'}\`}>
              <th className="px-5 py-3 text-left">Siswa</th>
              <th className="px-5 py-3 text-left hidden md:table-cell">Orang Tua</th>
              <th className="px-5 py-3 text-right">Uang Bangunan</th>
              <th className="px-5 py-3 text-right">Komisi</th>
              <th className="px-5 py-3 text-left hidden md:table-cell">Tanggal</th>
            </tr></thead>
            <tbody>
              {closings.map(c=>(
                <tr key={c.id} className={\`border-t \${dark?'border-[#1e2d4a] hover:bg-[#1a2a4a]':'border-slate-100 hover:bg-blue-50'} transition-colors\`}>
                  <td className={\`px-5 py-3 font-medium \${text}\`}>{c.studentName}</td>
                  <td className={\`px-5 py-3 \${muted} hidden md:table-cell\`}>{c.parentName}</td>
                  <td className={\`px-5 py-3 text-right \${muted}\`}>{fmtRp(c.uangBangunan)}</td>
                  <td className="px-5 py-3 text-right text-green-400 font-medium">{fmtRp(isManager?c.komisiManager:c.komisiStaff)}</td>
                  <td className={\`px-5 py-3 \${muted} hidden md:table-cell\`}>{new Date(c.closingDate).toLocaleDateString('id-ID')}</td>
                </tr>
              ))}
              {closings.length===0&&<tr><td colSpan={5} className={\`px-5 py-8 text-center text-sm \${muted}\`}>Belum ada data closing. Tambah closing pertama!</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

`
    content = content.slice(0, start) + replacement + content.slice(end)
    changes++
    console.log('✅ Fix CommissionView → useClosings()')
  }
}

// ─── 7. Fix CommissionView props di render ────────────────────────────────────
replace(
  'Fix CommissionView render props',
  `{view==='commission' && <CommissionView dark={d}/>}`,
  `{view==='commission' && <CommissionView dark={d} currentUser={user}/>}`
)

// ─── 8. Fix LeadsView useLeads (role-based) ───────────────────────────────────
replace(
  'Fix useLeads role-based',
  `const { leads: dbLeads, loading, createLead, updateLead, deleteLead } = useLeads()`,
  `const isManager = currentUser.role === 'manager' || currentUser.role === 'superadmin'
  const { leads: dbLeads, loading, createLead, updateLead, deleteLead } = useLeads(isManager ? undefined : currentUser.id)`
)

// ─── 9. Fix duplicate createClient import (cleanup) ──────────────────────────
// Kalau sudah ada createClient import, hapus duplikat
const clientImportCount = (content.match(/import \{ createClient \}/g) || []).length
if (clientImportCount > 1) {
  // Keep only the first occurrence, remove extras
  let found = 0
  content = content.replace(/import \{ createClient \} from '@\/lib\/supabase\/client'\n/g, (match) => {
    found++
    return found === 1 ? match : ''
  })
  console.log('✅ Hapus duplikat createClient import')
  changes++
}

// ─── Selesai ──────────────────────────────────────────────────────────────────
if (changes === 0) {
  console.log('\n⚠️  Tidak ada perubahan yang berhasil diterapkan.')
  console.log('   Kemungkinan file sudah diubah sebelumnya atau format berbeda.')
} else {
  writeFileSync(FILE, content, 'utf-8')
  console.log(`\n🎉 Selesai! ${changes} perubahan berhasil diterapkan ke:`)
  console.log(`   ${FILE}`)
  console.log('\nLangkah selanjutnya:')
  console.log('  1. Cek error TypeScript: npx tsc --noEmit')
  console.log('  2. Jalankan dev server: npm run dev')
  console.log('  3. Push ke GitHub: git add . && git commit -m "feat: fix all views" && git push')
}
