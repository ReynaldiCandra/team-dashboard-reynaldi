'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis
} from 'recharts'
import {
  LayoutDashboard, BarChart3, Users, Megaphone, FileText,
  Settings, Bell, ChevronLeft, Sun, Moon, LogOut, Plus,
  Eye, Trash2, TrendingUp, Target, DollarSign, UserPlus,
  Search, CheckCircle, Clock, Star, Zap, Award, Brain,
  Calendar, Download, Filter, RefreshCw, MoreHorizontal,
  ArrowUpRight, List, ArrowDownRight, Activity, Clipboard,
  CreditCard, Gift, PieChart as PieIcon, Edit, X, Check,
  AlertCircle, ChevronRight, PlayCircle, PauseCircle,
  Phone, MessageCircle, UserCheck, Flame, Snowflake,
  GraduationCap, Instagram, MapPin, ClipboardList, Send,
  PhoneCall, Inbox, ChevronDown, BadgeCheck, Ban, Copy,
  FileSpreadsheet, MessageSquare
} from 'lucide-react'
import { useLeads, exportLeadsCSV, buildWABroadcast, buildWAIndividual } from '@/hooks/use-leads'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import type { Lead as DBLead, LeadCategory } from '@/hooks/use-leads'

// ─── Types ───────────────────────────────────────────────────────────────────
type Role = 'superadmin' | 'manager' | 'leader' | 'staff'
type View = 'dashboard' | 'leads' | 'performance' | 'team' | 'campaigns' | 'reports' | 'goals' | 'attendance' | 'commission' | 'settings'

type LeadStatus = 'baru' | 'dihubungi' | 'berminat' | 'survey' | 'meeting' | 'proposal' | 'closing' | 'gagal'
type LeadTemp = 'hot' | 'warm' | 'cold'
type LeadSource = 'Instagram' | 'WhatsApp' | 'Referral' | 'Facebook' | 'Google' | 'Walk-in' | 'Lainnya'
type ChildClass = 'TK' | 'SD Kelas 1' | 'SD Kelas 2' | 'SD Kelas 3' | 'SD Kelas 4' | 'SD Kelas 5' | 'SD Kelas 6' | 'SMP Kelas 7' | 'SMP Kelas 8' | 'SMP Kelas 9' | 'SMA Kelas 10' | 'SMA Kelas 11' | 'SMA Kelas 12'

interface FollowUp { date:string; method:'WA'|'Telepon'|'Kunjungan'|'Email'; note:string; result:string; by:string }
interface Lead {
  id:string; parentName:string; parentPhone:string; childName:string; childClass:ChildClass
  source:LeadSource; status:LeadStatus; temp:LeadTemp; assignedTo:'farhan'|'ramram'
  createdAt:string; lastContact:string; daysSinceLast:number
  notes:string; followUps:FollowUp[]; campaign?:string
  // Extended fields
  parentArea?:string; childGender?:'L'|'P'; hasSibling?:boolean
  leadCategory?:LeadCategory; interestRating?:number; assignedStaffName?:string
}

interface User { id:string; name:string; role:Role; team:string; avatar:string; email:string; online:boolean; revenue:number; leads:number; closing:number; score:number }

// ─── Mock Data ───────────────────────────────────────────────────────────────
const LEADS_INIT: Lead[] = []

const CLASSES: ChildClass[] = ['TK','SD Kelas 1','SD Kelas 2','SD Kelas 3','SD Kelas 4','SD Kelas 5','SD Kelas 6','SMP Kelas 7','SMP Kelas 8','SMP Kelas 9','SMA Kelas 10','SMA Kelas 11','SMA Kelas 12']
const LEAD_SOURCES: LeadSource[] = ['Instagram','WhatsApp','Referral','Facebook','Google','Walk-in','Lainnya']

const USERS: User[] = []

const MONTHLY: {month:string;revenue:number;leads:number;closing:number;target:number}[] = []

const WEEKLY: {day:string;farhan:number;ramram:number}[] = []

const SOURCES: {name:string;value:number;color:string}[] = []

const RADAR_DATA: {metric:string;farhan:number;ramram:number}[] = []

const CAMPAIGNS: {id:string;name:string;status:string;leads:number;closing:number;revenue:number;staff:string[];start:string;end:string;budget:number}[] = []

const LEADERBOARD: {rank:number;name:string;team:string;revenue:number;leads:number;closing:number;score:number;trend:string;avatar:string}[] = []

const PERF_METRICS = [
  { key:'leads', label:'Leads Masuk', icon:Users, target:30, achieved:24, color:'blue' },
  { key:'prospect', label:'Prospect', icon:Target, target:20, achieved:18, color:'purple' },
  { key:'meeting', label:'Meeting', icon:Calendar, target:10, achieved:7, color:'cyan' },
  { key:'proposal', label:'Proposal', icon:Clipboard, target:8, achieved:6, color:'indigo' },
  { key:'closing', label:'Closing', icon:CheckCircle, target:5, achieved:4, color:'green' },
  { key:'revenue', label:'Revenue (jt)', icon:DollarSign, target:50, achieved:42, color:'orange' },
  { key:'followup', label:'Follow-up', icon:RefreshCw, target:50, achieved:45, color:'teal' },
  { key:'new_leads', label:'Treatment Baru', icon:UserPlus, target:15, achieved:12, color:'pink' },
  { key:'old_leads', label:'Treatment Lama', icon:Clock, target:20, achieved:17, color:'yellow' },
]

const GOALS: {id:string;title:string;description:string;target:number;current:number;unit:string;deadline:string;owner:string;priority:string;status:string}[] = []

const ATTENDANCE: {date:string;farhan:string;ramram:string;checkIn:string;checkOut:string}[] = []

const fmtRp = (n:number) => `Rp ${(n/1000000).toFixed(0)}jt`
const fmtNum = (n:number) => n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(n)

// ─── Helpers ─────────────────────────────────────────────────────────────────
const colorMap: Record<string, string> = {
  blue:'from-blue-600 to-blue-400', purple:'from-purple-600 to-purple-400',
  cyan:'from-cyan-600 to-cyan-400', indigo:'from-indigo-600 to-indigo-400',
  green:'from-green-600 to-green-400', orange:'from-orange-600 to-orange-400',
  teal:'from-teal-600 to-teal-400', pink:'from-pink-600 to-pink-400',
  yellow:'from-yellow-600 to-yellow-400',
}
const progressColor: Record<string, string> = {
  blue:'bg-blue-500', purple:'bg-purple-500', cyan:'bg-cyan-500',
  indigo:'bg-indigo-500', green:'bg-green-500', orange:'bg-orange-500',
  teal:'bg-teal-500', pink:'bg-pink-500', yellow:'bg-yellow-500',
}

// ─── Card Component ───────────────────────────────────────────────────────────
function Card({ children, className='', dark }: { children:React.ReactNode; className?:string; dark:boolean }) {
  const base = dark
    ? 'bg-[#111d35] border-[#1e2d4a] hover:border-blue-500/40 hover:shadow-blue-500/10'
    : 'bg-white border-slate-200 hover:border-blue-200 hover:shadow-blue-50'
  return (
    <motion.div
      whileHover={{ y:-3, scale:1.01 }}
      transition={{ type:'spring', stiffness:300, damping:20 }}
      className={`border rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 ${base} ${className}`}
    >
      {children}
    </motion.div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, gradient, change, positive, sub }: {
  label:string; value:string; icon:React.ComponentType<{size?:number;className?:string}>
  gradient:string; change:string; positive:boolean; sub?:string
}) {
  return (
    <motion.div
      whileHover={{ y:-4, scale:1.02 }}
      transition={{ type:'spring', stiffness:300, damping:20 }}
      className={`rounded-2xl p-3 md:p-5 bg-gradient-to-br ${gradient} relative overflow-hidden shadow-lg hover:shadow-2xl cursor-default transition-shadow duration-300`}
    >
      <div className="absolute -right-5 -top-5 opacity-15">
        <Icon size={80} />
      </div>
      <p className="text-white/70 text-[9px] md:text-xs font-semibold uppercase tracking-wider mb-0.5 md:mb-1">{label}</p>
      <p className="text-white text-base md:text-2xl font-bold leading-tight">{value}</p>
      {sub && <p className="text-white/60 text-[9px] md:text-xs mt-0.5">{sub}</p>}
      <div className={`flex items-center gap-1 mt-1.5 md:mt-2 text-[10px] md:text-xs font-semibold ${positive ? 'text-white/90' : 'text-red-200'}`}>
        {positive ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
        {change}
      </div>
    </motion.div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color, dark }: { value:number; max:number; color:string; dark:boolean }) {
  const pct = Math.min(100, Math.round((value/max)*100))
  return (
    <div>
      <div className={`h-2 w-full rounded-full overflow-hidden ${dark ? 'bg-slate-700' : 'bg-slate-200'}`}>
        <motion.div
          initial={{ width:0 }}
          animate={{ width:`${pct}%` }}
          transition={{ duration:0.8, ease:'easeOut' }}
          className={`h-full rounded-full ${progressColor[color] || 'bg-blue-500'}`}
        />
      </div>
      <div className="flex justify-between text-xs mt-0.5">
        <span className={dark ? 'text-slate-500' : 'text-slate-400'}>{value} / {max}</span>
        <span className={`font-semibold ${pct >= 80 ? 'text-green-400' : pct >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{pct}%</span>
      </div>
    </div>
  )
}

// ─── Motivational Banner ──────────────────────────────────────────────────────
const MOT_MSGS = [
  { emoji:'🔥', msg:'Tim Alexandria, hari ini kesempatan baru untuk memecahkan rekor!', sub:'Revenue: Rp 265jt dari Rp 300jt · 12 hari tersisa' },
  { emoji:'💪', msg:'Setiap follow-up adalah langkah nyata menuju closing!', sub:'Conversion rate naik 3.2% — pertahankan momentum!' },
  { emoji:'🏆', msg:'Mr. Farhan sudah 21 closing bulan ini — siapa berikutnya?', sub:'Leaderboard diperbarui real-time · Bersaing sehat!' },
  { emoji:'⚡', msg:'Leads baru masuk! Jangan biarkan dingin terlalu lama!', sub:'Respon dalam 5 menit = 9× lebih besar peluang closing' },
  { emoji:'🌟', msg:'Satu closing hari ini = satu langkah lebih dekat ke target!', sub:'Alexandria Islamic School — Terbaik untuk buah hati Anda' },
]
function MotivationalBanner({ dark }: { dark:boolean }) {
  const [idx, setIdx] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  useEffect(()=>{
    const t = setInterval(()=>setIdx(i=>(i+1)%MOT_MSGS.length), 5000)
    return ()=>clearInterval(t)
  },[])
  if (dismissed) return null
  const m = MOT_MSGS[idx]
  return (
    <div className="px-4 md:px-5 pt-3 shrink-0">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-orange-600 via-amber-500 to-orange-400 shadow-lg shadow-orange-500/25">
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none"/>
        <div className="absolute right-14 bottom-0 w-16 h-16 rounded-full bg-white/10 pointer-events-none"/>
        <div className="absolute -left-4 -bottom-4 w-16 h-16 rounded-full bg-white/10 pointer-events-none"/>
        <div className="relative px-4 py-3 flex items-center gap-3">
          <div className="text-xl md:text-2xl shrink-0 select-none">{m.emoji}</div>
          <AnimatePresence mode="wait">
            <motion.div key={idx} initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-12}} transition={{duration:0.3}} className="flex-1 min-w-0">
              <p className="text-white font-bold text-[11px] md:text-sm leading-snug">{m.msg}</p>
              <p className="text-white/75 text-[9px] md:text-xs mt-0.5 truncate">{m.sub}</p>
            </motion.div>
          </AnimatePresence>
          <div className="flex items-center gap-1 shrink-0">
            {MOT_MSGS.map((_,i)=>(
              <button key={i} onClick={()=>setIdx(i)}
                className={`rounded-full transition-all duration-300 ${i===idx?'w-4 h-2 bg-white':'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'}`}/>
            ))}
          </div>
          <button onClick={()=>setDismissed(true)} className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/35 flex items-center justify-center shrink-0 transition-colors ml-1">
            <X size={11} className="text-white"/>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard View ───────────────────────────────────────────────────────────
function DashboardView({ dark }: { dark:boolean }) {
  const stats = useDashboardStats()
  const [aiSummary, setAiSummary] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [summaryText, setSummaryText] = useState('')
  const card = dark ? 'bg-[#111d35] border-[#1e2d4a]' : 'bg-white border-slate-200'
  const text = dark ? 'text-slate-100' : 'text-slate-800'
  const muted = dark ? 'text-slate-400' : 'text-slate-500'
  const gl = dark ? '#1e2d4a' : '#e2e8f0'
  const ax = dark ? '#94a3b8' : '#64748b'
  const tt = { background: dark ? '#0f1729' : '#fff', border:`1px solid ${gl}`, borderRadius:12, color: dark ? '#e2e8f0' : '#1e293b' }

  const handleAI = async () => {
    setGenerating(true); setSummaryText('')
    const text = `📊 **Ringkasan Performa Tim — Mei 2026**\n\nTotal revenue bulan ini mencapai **Rp 265 juta** (88% dari target Rp 300jt). Mr. Farhan memimpin dengan revenue Rp 92jt dan 21 closing deals. Conversion rate berada di 32.4%, naik 3.2% dari bulan lalu.\n\n🏆 **Top Performer:** Mr. Farhan (Score: 87/100)\n⚠️ **Perlu Perhatian:** Conversion rate masih 2.6% di bawah target 35%\n💡 **Rekomendasi:** Tingkatkan follow-up leads lama, terutama dari sumber Referral yang memiliki closing rate tertinggi.`
    for (const char of text) {
      await new Promise(r => setTimeout(r, 18))
      setSummaryText(p => p + char)
    }
    setGenerating(false)
  }

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Revenue" value="Rp 265jt" icon={DollarSign} gradient="from-blue-700 via-blue-600 to-blue-400" change="18% vs bulan lalu" positive sub="Target: Rp 300jt" />
        <KpiCard label="Total Leads" value={stats.loading ? '...' : String(stats.totalLeads)} icon={Users} gradient="from-violet-700 via-purple-600 to-purple-400" change={stats.loading ? '-' : `${stats.totalClosing} closing`} positive sub="" />
        <KpiCard label="Conversion Rate" value={stats.loading ? '...' : `${stats.conversionRate}%`} icon={TrendingUp} gradient="from-emerald-700 via-emerald-600 to-green-400" change="enrolled / total leads" positive />
        <KpiCard label="Total Closing" value={stats.loading ? '...' : String(stats.totalClosing)} icon={Target} gradient="from-orange-600 via-orange-500 to-amber-400" change={stats.loading ? '-' : `dari ${stats.totalLeads} leads`} positive sub="" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card dark={dark} className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`font-bold ${text}`}>Revenue & Leads Trend</h3>
              <p className={`text-xs ${muted}`}>6 bulan terakhir · 2026</p>
            </div>
            <div className="flex gap-2">
              <button className={`px-3 py-1 text-xs font-semibold rounded-xl ${dark ? 'bg-[#1e2d4a] text-slate-300' : 'bg-slate-100 text-slate-600'}`}>Bulanan</button>
              <button className={`px-3 py-1 text-xs font-semibold rounded-xl bg-blue-600 text-white`}>6 Bulan</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.monthly}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gl} strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke={ax} tick={{ fontSize:11 }} />
              <YAxis stroke={ax} tick={{ fontSize:11 }} />
              <Tooltip contentStyle={tt} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#g1)" strokeWidth={2.5} name="Revenue (jt)" />
              <Area type="monotone" dataKey="leads" stroke="#8b5cf6" fill="url(#g2)" strokeWidth={2.5} name="Leads" />
              <Line type="monotone" dataKey="target" stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} name="Target" dot={false} />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card dark={dark} className="p-5">
          <h3 className={`font-bold mb-1 ${text}`}>Sumber Leads</h3>
          <p className={`text-xs ${muted} mb-3`}>Distribusi bulan ini</p>
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={stats.sources} cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={4} dataKey="value">
                {stats.sources.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={tt} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {stats.sources.map(s => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background:s.color }} />
                  <span className={`text-xs ${muted}`}>{s.name}</span>
                </div>
                <span className={`text-xs font-semibold ${text}`}>{s.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card dark={dark} className="p-5">
          <h3 className={`font-bold mb-1 ${text}`}>Performa Mingguan</h3>
          <p className={`text-xs ${muted} mb-4`}>Leads per hari</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.weekly} barGap={3}>
              <CartesianGrid stroke={gl} strokeDasharray="3 3" />
              <XAxis dataKey="day" stroke={ax} tick={{ fontSize:11 }} />
              <YAxis stroke={ax} tick={{ fontSize:11 }} />
              <Tooltip contentStyle={tt} />
              <Bar dataKey="farhan" fill="#3b82f6" radius={[6,6,0,0]} name="Mr. Farhan" />
              <Bar dataKey="ramram" fill="#8b5cf6" radius={[6,6,0,0]} name="Mr. Ramram" />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card dark={dark} className="p-5">
          <h3 className={`font-bold mb-1 ${text}`}>Radar Performa</h3>
          <p className={`text-xs ${muted} mb-2`}>Perbandingan skill staff</p>
          <ResponsiveContainer width="100%" height={210}>
            <RadarChart data={[]}>
              <PolarGrid stroke={gl} />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize:10, fill:ax }} />
              <Radar name="Mr. Farhan" dataKey="farhan" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
              <Radar name="Mr. Ramram" dataKey="ramram" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        <Card dark={dark} className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`font-bold ${text}`}>🏆 Leaderboard</h3>
              <p className={`text-xs ${muted}`}>Top performer Mei</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {stats.leaderboard.map(l => (
              <motion.div key={l.rank} whileHover={{ x:4 }} className={`flex items-center gap-2.5 p-2 rounded-xl cursor-default ${dark ? 'hover:bg-[#1e2d4a]' : 'hover:bg-slate-50'} transition-colors`}>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${l.rank===1?'bg-yellow-500 text-white':l.rank===2?'bg-slate-400 text-white':l.rank===3?'bg-orange-500 text-white':dark?'bg-[#1e2d4a] text-slate-400':'bg-slate-100 text-slate-500'}`}>{l.rank}</div>
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">{l.avatar}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${text}`}>{l.name}</p>
                  <p className={`text-xs ${muted}`}>{l.team}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-xs font-bold ${text}`}>{fmtRp(l.revenue)}</p>
                  <p className={`text-xs ${l.trend==='up'?'text-green-400':'text-red-400'} flex items-center justify-end gap-0.5`}>
                    {l.trend==='up'?<ArrowUpRight size={10}/>:<ArrowDownRight size={10}/>}{l.score}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI Summary + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card dark={dark} className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center">
                <Brain size={16} className="text-white" />
              </div>
              <div>
                <h3 className={`font-bold ${text}`}>AI Performance Summary</h3>
                <p className={`text-xs ${muted}`}>Powered by AI</p>
              </div>
            </div>
            <button
              onClick={handleAI}
              disabled={generating}
              className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-purple-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {generating ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />}
              {generating ? 'Generating...' : 'Generate'}
            </button>
          </div>
          {summaryText ? (
            <div className={`text-xs leading-relaxed whitespace-pre-line ${text}`}>
              {summaryText}
              {generating && <span className="animate-pulse">▌</span>}
            </div>
          ) : (
            <div className={`flex flex-col items-center justify-center h-32 ${muted} text-center`}>
              <Brain size={32} className="mb-2 opacity-30" />
              <p className="text-xs">Klik "Generate" untuk mendapatkan<br/>ringkasan performa dari AI</p>
            </div>
          )}
        </Card>

        <Card dark={dark} className="p-5">
          <h3 className={`font-bold mb-4 ${text}`}>Activity Log Terbaru</h3>
          <div className="space-y-3">
            {[
              { time:'10:23', user:'Mr. Farhan', action:'Menambah 3 leads baru', type:'success' },
              { time:'09:47', user:'Mr. Ramram', action:'Closing deal Rp 12jt', type:'success' },
              { time:'09:15', user:'Siti Leader', action:'Update campaign status', type:'info' },
              { time:'08:50', user:'Mr. Farhan', action:'Follow-up Hendra Wijaya', type:'info' },
              { time:'08:30', user:'Budi Manager', action:'Approve target bulanan Tim Alpha', type:'warning' },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.type==='success'?'bg-green-400':a.type==='warning'?'bg-yellow-400':'bg-blue-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${text}`}><span className="font-semibold">{a.user}</span> — {a.action}</p>
                </div>
                <span className={`text-xs ${muted} shrink-0`}>{a.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label:'Leads Hari Ini', value:stats.loading?'...':String(stats.todayLeads), icon:Users, color:'from-blue-600 to-blue-400' },
          { label:'Follow-up', value:'8', icon:RefreshCw, color:'from-purple-600 to-purple-400' },
          { label:'Closing Hari Ini', value:stats.loading?'...':String(stats.todayClosing), icon:CheckCircle, color:'from-green-600 to-green-400' },
          { label:'Revenue Hari Ini', value:'Rp 28jt', icon:DollarSign, color:'from-orange-600 to-orange-400' },
          { label:'Staff Online', value:'3/5', icon:Activity, color:'from-emerald-600 to-emerald-400' },
        ].map(s => (
          <motion.div key={s.label} whileHover={{ y:-3 }} transition={{ type:'spring', stiffness:300 }}
            className={`${dark ? 'bg-[#111d35] border-[#1e2d4a]' : 'bg-white border-slate-200'} border rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-lg transition-shadow cursor-default`}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0`}>
              <s.icon size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className={`font-bold text-base ${text}`}>{s.value}</p>
              <p className={`text-xs ${muted} truncate`}>{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Performance View ─────────────────────────────────────────────────────────
function PerformanceView({ dark, currentUser }: { dark:boolean; currentUser:User }) {
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState<Record<string,string>>({})
  const card = dark ? 'bg-[#111d35] border-[#1e2d4a]' : 'bg-white border-slate-200'
  const text = dark ? 'text-slate-100' : 'text-slate-800'
  const muted = dark ? 'text-slate-400' : 'text-slate-500'
  const inp = dark ? 'bg-[#0a1020] border-[#1e2d4a] text-slate-100 placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800'

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-5">
      <Card dark={dark} className="p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className={`font-bold text-lg ${text}`}>Input Performa Harian</h2>
            <p className={`text-xs ${muted}`}>Sabtu, 24 Mei 2026 · {currentUser.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {currentUser.role !== 'staff' && (
              <select className={`px-3 py-2 rounded-xl border text-sm outline-none ${inp}`}>
                {USERS.filter(u=>u.role==='staff').map(u=><option key={u.id}>{u.name}</option>)}
              </select>
            )}
            <span className="text-xs px-3 py-1.5 bg-green-500/20 text-green-400 rounded-xl font-semibold flex items-center gap-1"><CheckCircle size={12}/> Check-in 08:02</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PERF_METRICS.map(m => {
          const pct = Math.min(100, Math.round((m.achieved/m.target)*100))
          const isGood = pct >= 80
          return (
            <Card key={m.key} dark={dark} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${colorMap[m.color]} flex items-center justify-center`}>
                    <m.icon size={14} className="text-white" />
                  </div>
                  <span className={`text-sm font-semibold ${text}`}>{m.label}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${isGood?'bg-green-500/20 text-green-400':'bg-orange-500/20 text-orange-400'}`}>{pct}%</span>
              </div>
              <p className={`text-2xl font-bold mb-2 ${text}`}>{m.achieved}<span className={`text-sm font-normal ${muted}`}>/{m.target}</span></p>
              <ProgressBar value={m.achieved} max={m.target} color={m.color} dark={dark} />
              <input
                type="number"
                value={form[m.key]||''}
                onChange={e=>setForm(p=>({...p,[m.key]:e.target.value}))}
                placeholder="Update..."
                className={`mt-3 w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500/40 transition-all ${inp}`}
              />
            </Card>
          )
        })}
      </div>

      <Card dark={dark} className="p-5 space-y-3">
        <h3 className={`font-semibold flex items-center gap-2 ${text}`}><Clipboard size={16}/>Catatan & Attendance</h3>
        <textarea rows={3} placeholder="Catatan aktivitas hari ini..." className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500/40 resize-none ${inp}`}/>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-4">
            {['Hadir Kantor','WFH','Dinas Luar'].map(opt=>(
              <label key={opt} className={`flex items-center gap-1.5 text-sm ${muted} cursor-pointer`}>
                <input type="radio" name="attendance" className="accent-blue-500"/> {opt}
              </label>
            ))}
          </div>
          <button onClick={handleSave} className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition-all duration-200 ${saved?'bg-green-500 shadow-lg shadow-green-500/30':'bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95'}`}>
            {saved ? <><Check size={14}/> Tersimpan!</> : <><CheckCircle size={14}/> Simpan Performa</>}
          </button>
        </div>
      </Card>

      {/* Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {USERS.filter(u=>u.role==='staff').map(u=>(
          <Card key={u.id} dark={dark} className="p-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg mx-auto mb-2 shadow-lg shadow-blue-500/25">{u.avatar}</div>
            <p className={`text-xs font-semibold ${text}`}>{u.name}</p>
            <p className={`text-3xl font-bold mt-1 ${u.score>=80?'text-green-400':u.score>=60?'text-yellow-400':'text-red-400'}`}>{u.score}</p>
            <p className={`text-xs ${muted}`}>/ 100 poin</p>
            <ProgressBar value={u.score} max={100} color={u.score>=80?'green':u.score>=60?'yellow':'orange'} dark={dark} />
            <div className={`mt-2 text-xs ${muted}`}>{u.score>=80?'🌟 Excellent':u.score>=60?'✅ Good':'⚠️ Needs Work'}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── Team View ────────────────────────────────────────────────────────────────
function TeamView({ dark }: { dark:boolean }) {
  const [showAdd, setShowAdd] = useState(false)
  const [users, setUsers] = useState(USERS)
  const [newUser, setNewUser] = useState({ name:'', email:'', role:'staff', team:'Alpha' })
  const card = dark ? 'bg-[#111d35] border-[#1e2d4a]' : 'bg-white border-slate-200'
  const text = dark ? 'text-slate-100' : 'text-slate-800'
  const muted = dark ? 'text-slate-400' : 'text-slate-500'
  const inp = dark ? 'bg-[#0a1020] border-[#1e2d4a] text-slate-100 placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800'
  const roleBadge: Record<Role,string> = { superadmin:'bg-red-500/20 text-red-400', manager:'bg-orange-500/20 text-orange-400', leader:'bg-purple-500/20 text-purple-400', staff:'bg-blue-500/20 text-blue-400' }
  const roleLabel: Record<Role,string> = { superadmin:'Super Admin', manager:'Manager', leader:'Team Leader', staff:'Staff' }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`font-bold text-lg ${text}`}>Manajemen Tim</h2>
          <p className={`text-xs ${muted}`}>{users.length} anggota terdaftar</p>
        </div>
        <button onClick={()=>setShowAdd(true)} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 hover:scale-105 transition-all">
          <UserPlus size={15}/> Tambah User
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Total Staff', value:users.length, icon:Users, color:'from-blue-600 to-blue-400' },
          { label:'Online Sekarang', value:users.filter(u=>u.online).length, icon:Activity, color:'from-green-600 to-green-400' },
          { label:'Jumlah Tim', value:3, icon:Award, color:'from-purple-600 to-purple-400' },
          { label:'Role Berbeda', value:4, icon:Star, color:'from-orange-600 to-orange-400' },
        ].map(s=>(
          <Card key={s.label} dark={dark} className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0`}><s.icon size={16} className="text-white"/></div>
            <div><p className={`text-xl font-bold ${text}`}>{s.value}</p><p className={`text-xs ${muted}`}>{s.label}</p></div>
          </Card>
        ))}
      </div>

      <Card dark={dark} className="overflow-hidden">
        <div className={`px-5 py-3 border-b flex items-center justify-between ${dark?'border-[#1e2d4a]':'border-slate-100'}`}>
          <h3 className={`font-bold ${text}`}>Daftar Anggota</h3>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${inp}`}>
            <Search size={12} className={muted}/><input placeholder="Cari..." className="bg-transparent outline-none w-24"/>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className={`text-xs uppercase tracking-wider ${muted} ${dark?'bg-[#0a1020]':'bg-slate-50'}`}>
              <th className="px-5 py-3 text-left">Pengguna</th>
              <th className="px-5 py-3 text-left hidden md:table-cell">Role</th>
              <th className="px-5 py-3 text-left hidden lg:table-cell">Tim</th>
              <th className="px-5 py-3 text-left hidden lg:table-cell">Revenue</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u=>(
              <motion.tr key={u.id} layout className={`border-t ${dark?'border-[#1e2d4a] hover:bg-[#1a2a4a]':'border-slate-100 hover:bg-blue-50'} transition-colors`}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">{u.avatar}</div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${dark?'border-[#111d35]':'border-white'} ${u.online?'bg-green-400':'bg-slate-400'}`}/>
                    </div>
                    <div><p className={`font-semibold text-sm ${text}`}>{u.name}</p><p className={`text-xs ${muted}`}>{u.email}</p></div>
                  </div>
                </td>
                <td className="px-5 py-3 hidden md:table-cell">
                  <span className={`text-xs px-2.5 py-1 rounded-xl font-semibold ${roleBadge[u.role]}`}>{roleLabel[u.role]}</span>
                </td>
                <td className={`px-5 py-3 hidden lg:table-cell text-sm ${muted}`}>{u.team}</td>
                <td className={`px-5 py-3 hidden lg:table-cell text-sm font-medium ${text}`}>{u.revenue>0?fmtRp(u.revenue):'-'}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-1 rounded-lg font-medium flex items-center gap-1 w-fit ${u.online?'bg-green-500/20 text-green-400':dark?'bg-[#1e2d4a] text-slate-500':'bg-slate-100 text-slate-400'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${u.online?'bg-green-400':'bg-slate-400'}`}/>{u.online?'Online':'Offline'}
                  </span>
                </td>
                <td className="px-5 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${dark?'bg-[#1e2d4a] hover:bg-blue-600 text-slate-400 hover:text-white':'bg-slate-100 hover:bg-blue-500 text-slate-500 hover:text-white'}`}><Edit size={12}/></button>
                    <button onClick={()=>setUsers(p=>p.filter(x=>x.id!==u.id))} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${dark?'bg-[#1e2d4a] hover:bg-red-600 text-slate-400 hover:text-white':'bg-slate-100 hover:bg-red-500 text-slate-500 hover:text-white'}`}><Trash2 size={12}/></button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={()=>setShowAdd(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
            <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}
              className={`relative w-full max-w-md rounded-2xl border shadow-2xl ${dark?'bg-[#0f1729] border-[#1e2d4a]':'bg-white border-slate-200'}`} onClick={e=>e.stopPropagation()}>
              <div className={`px-5 py-4 border-b flex items-center justify-between ${dark?'border-[#1e2d4a]':'border-slate-100'}`}>
                <h3 className={`font-bold ${text}`}>Tambah User Baru</h3>
                <button onClick={()=>setShowAdd(false)} className={`w-8 h-8 rounded-xl flex items-center justify-center ${dark?'bg-[#1e2d4a] text-slate-400':'bg-slate-100 text-slate-500'}`}><X size={14}/></button>
              </div>
              <div className="p-5 space-y-3">
                {[['Nama Lengkap','text','name'],['Email','email','email']].map(([lbl,type,key])=>(
                  <div key={key}>
                    <label className={`block text-xs font-semibold mb-1 ${muted}`}>{lbl}</label>
                    <input type={type} value={(newUser as any)[key]} onChange={e=>setNewUser(p=>({...p,[key]:e.target.value}))} className={`w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${inp}`}/>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${muted}`}>Role</label>
                    <select value={newUser.role} onChange={e=>setNewUser(p=>({...p,role:e.target.value}))} className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${inp}`}>
                      <option value="staff">Staff</option><option value="leader">Team Leader</option><option value="manager">Manager</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${muted}`}>Tim</label>
                    <select value={newUser.team} onChange={e=>setNewUser(p=>({...p,team:e.target.value}))} className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${inp}`}>
                      <option>Alpha</option><option>Beta</option><option>Gamma</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className={`px-5 py-4 flex gap-3 border-t ${dark?'border-[#1e2d4a]':'border-slate-100'}`}>
                <button onClick={()=>setShowAdd(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${dark?'bg-[#1e2d4a] text-slate-300':'bg-slate-100 text-slate-700'}`}>Batal</button>
                <button onClick={()=>{
                  setUsers(p=>[...p,{id:String(Date.now()),name:newUser.name,role:newUser.role as Role,team:newUser.team,avatar:newUser.name.charAt(0)||'U',email:newUser.email,online:false,revenue:0,leads:0,closing:0,score:0}])
                  setShowAdd(false); setNewUser({name:'',email:'',role:'staff',team:'Alpha'})
                }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30">Simpan</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Campaigns View ───────────────────────────────────────────────────────────
function CampaignsView({ dark }: { dark:boolean }) {
  const [campaigns, setCampaigns] = useState(CAMPAIGNS)
  const text = dark ? 'text-slate-100' : 'text-slate-800'
  const muted = dark ? 'text-slate-400' : 'text-slate-500'
  const STATUS: Record<string,{label:string;bg:string;text:string;icon:React.ComponentType<any>}> = {
    Active:{label:'Aktif',bg:'bg-green-500/20',text:'text-green-400',icon:PlayCircle},
    Paused:{label:'Dijeda',bg:'bg-yellow-500/20',text:'text-yellow-400',icon:PauseCircle},
    Completed:{label:'Selesai',bg:'bg-blue-500/20',text:'text-blue-400',icon:CheckCircle},
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className={`font-bold text-lg ${text}`}>Campaign Management</h2><p className={`text-xs ${muted}`}>{campaigns.length} campaign</p></div>
        <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 hover:scale-105 transition-all"><Plus size={15}/>New Campaign</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.map(c=>{
          const sc = STATUS[c.status]
          const roi = ((c.revenue - c.budget) / c.budget * 100).toFixed(0)
          return (
            <Card key={c.id} dark={dark} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className={`font-bold ${text}`}>{c.name}</h3>
                  <p className={`text-xs ${muted}`}>{c.start} → {c.end}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-xl font-semibold flex items-center gap-1 ${sc.bg} ${sc.text}`}>
                  <sc.icon size={12}/>{sc.label}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  {l:'Leads',v:c.leads,color:'text-blue-400'},
                  {l:'Closing',v:c.closing,color:'text-green-400'},
                  {l:'Revenue',v:fmtRp(c.revenue),color:'text-orange-400'},
                  {l:'ROI',v:`${roi}%`,color:Number(roi)>0?'text-emerald-400':'text-red-400'},
                ].map(s=>(
                  <div key={s.l} className="text-center">
                    <p className={`text-base font-bold ${s.color}`}>{s.v}</p>
                    <p className={`text-xs ${muted}`}>{s.l}</p>
                  </div>
                ))}
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1"><span className={muted}>Budget terpakai</span><span className={text}>{fmtRp(c.budget * 0.7)} / {fmtRp(c.budget)}</span></div>
                <ProgressBar value={70} max={100} color="blue" dark={dark} />
              </div>
              <div className={`flex flex-wrap gap-1.5 pt-3 border-t ${dark?'border-[#1e2d4a]':'border-slate-100'} items-center justify-between`}>
                <div className="flex flex-wrap gap-1">{c.staff.map(s=><span key={s} className={`text-xs px-2 py-0.5 rounded-lg ${dark?'bg-[#1e2d4a] text-slate-400':'bg-slate-100 text-slate-500'}`}>{s}</span>)}</div>
                <div className="flex gap-1">
                  <button className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${dark?'bg-[#1e2d4a] hover:bg-blue-600 text-slate-400 hover:text-white':'bg-slate-100 hover:bg-blue-500 text-slate-500 hover:text-white'}`}><Edit size={12}/></button>
                  <button onClick={()=>setCampaigns(p=>p.filter(x=>x.id!==c.id))} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${dark?'bg-[#1e2d4a] hover:bg-red-600 text-slate-400 hover:text-white':'bg-slate-100 hover:bg-red-500 text-slate-500 hover:text-white'}`}><Trash2 size={12}/></button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ─── Goals / OKR View ─────────────────────────────────────────────────────────
function GoalsView({ dark }: { dark:boolean }) {
  const text = dark ? 'text-slate-100' : 'text-slate-800'
  const muted = dark ? 'text-slate-400' : 'text-slate-500'
  const prio: Record<string,string> = { high:'bg-red-500/20 text-red-400', medium:'bg-yellow-500/20 text-yellow-400', low:'bg-blue-500/20 text-blue-400' }
  const statusCfg: Record<string,{color:string;label:string}> = {
    'on-track':{color:'text-green-400',label:'On Track'},
    'at-risk':{color:'text-yellow-400',label:'At Risk'},
    'behind':{color:'text-red-400',label:'Behind'},
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className={`font-bold text-lg ${text}`}>Goal Setting · OKR</h2><p className={`text-xs ${muted}`}>Q2 2026 · April – Juni</p></div>
        <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 hover:scale-105 transition-all"><Plus size={15}/>Tambah OKR</button>
      </div>
      {GOALS.map(g=>{
        const pct = Math.min(100, Math.round((g.current/g.target)*100))
        const st = statusCfg[g.status]
        return (
          <Card key={g.id} dark={dark} className="p-5">
            <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className={`font-bold ${text}`}>{g.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${prio[g.priority]}`}>{g.priority.toUpperCase()}</span>
                  <span className={`text-xs font-semibold ${st.color} flex items-center gap-1`}>
                    {g.status==='on-track'?<CheckCircle size={11}/>:g.status==='at-risk'?<AlertCircle size={11}/>:<X size={11}/>}{st.label}
                  </span>
                </div>
                <p className={`text-xs ${muted}`}>{g.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-2xl font-bold ${text}`}>{pct}%</p>
                <p className={`text-xs ${muted}`}>tercapai</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className={muted}>{g.current} {g.unit} dari target {g.target} {g.unit}</span>
              <span className={muted}>Deadline: {g.deadline}</span>
            </div>
            <ProgressBar value={g.current} max={g.target} color={g.status==='on-track'?'green':g.status==='at-risk'?'yellow':'orange'} dark={dark} />
            <div className={`flex items-center gap-2 mt-3 pt-3 border-t ${dark?'border-[#1e2d4a]':'border-slate-100'}`}>
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-[9px]">{g.owner.charAt(0)}</div>
              <span className={`text-xs ${muted}`}>{g.owner}</span>
              <div className="flex-1"/>
              <button className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${dark?'bg-[#1e2d4a] hover:bg-blue-600 text-slate-400 hover:text-white':'bg-slate-100 hover:bg-blue-500 text-slate-500 hover:text-white'}`}><Edit size={12}/></button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// ─── Attendance View ──────────────────────────────────────────────────────────
function AttendanceView({ dark }: { dark:boolean }) {
  const [checkedIn, setCheckedIn] = useState(false)
  const [checkTime, setCheckTime] = useState('')
  const text = dark ? 'text-slate-100' : 'text-slate-800'
  const muted = dark ? 'text-slate-400' : 'text-slate-500'
  const inp = dark ? 'bg-[#0a1020] border-[#1e2d4a] text-slate-100 placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800'

  const handleCheckIn = () => {
    const now = new Date()
    setCheckTime(`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`)
    setCheckedIn(true)
  }

  const attStatus: Record<string,{bg:string;text:string}> = {
    hadir: {bg:'bg-green-500/20',text:'text-green-400'},
    wfh: {bg:'bg-blue-500/20',text:'text-blue-400'},
    izin: {bg:'bg-yellow-500/20',text:'text-yellow-400'},
    alpa: {bg:'bg-red-500/20',text:'text-red-400'},
  }

  return (
    <div className="space-y-5">
      <div><h2 className={`font-bold text-lg ${text}`}>Attendance & Check-in</h2><p className={`text-xs ${muted}`}>Sabtu, 24 Mei 2026</p></div>

      {/* Check-in Card */}
      <Card dark={dark} className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${checkedIn?'bg-green-500/20':'bg-[#1e2d4a]'}`}>
              <CheckCircle size={32} className={checkedIn?'text-green-400':muted}/>
            </div>
            <div>
              <h3 className={`font-bold text-lg ${text}`}>{checkedIn ? `Check-in pada ${checkTime}` : 'Belum Check-in'}</h3>
              <p className={`text-sm ${muted}`}>{checkedIn ? 'Kamu sudah tercatat hadir hari ini ✓' : 'Tap tombol untuk check-in sekarang'}</p>
            </div>
          </div>
          <button onClick={handleCheckIn} disabled={checkedIn}
            className={`px-6 py-3 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition-all ${checkedIn?'bg-green-500 opacity-70 cursor-not-allowed':'bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95'}`}>
            <Clock size={15}/>{checkedIn ? 'Sudah Check-in' : 'Check-in Sekarang'}
          </button>
        </div>
        <div className={`grid grid-cols-3 gap-4 mt-5 pt-5 border-t ${dark?'border-[#1e2d4a]':'border-slate-100'}`}>
          {[{l:'Jam Masuk',v:checkTime||'-'},{l:'Jam Keluar',v:'-'},{l:'Durasi',v:checkedIn?'Sedang bekerja':'-'}].map(s=>(
            <div key={s.l} className="text-center"><p className={`text-lg font-bold ${text}`}>{s.v}</p><p className={`text-xs ${muted}`}>{s.l}</p></div>
          ))}
        </div>
      </Card>

      {/* Monthly Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {l:'Hadir',v:'18',icon:CheckCircle,color:'from-green-600 to-green-400'},
          {l:'WFH',v:'4',icon:Activity,color:'from-blue-600 to-blue-400'},
          {l:'Izin',v:'1',icon:AlertCircle,color:'from-yellow-600 to-yellow-400'},
          {l:'Alpa',v:'0',icon:X,color:'from-red-600 to-red-400'},
        ].map(s=>(
          <Card key={s.l} dark={dark} className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0`}><s.icon size={16} className="text-white"/></div>
            <div><p className={`text-xl font-bold ${text}`}>{s.v}</p><p className={`text-xs ${muted}`}>{s.l}</p></div>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card dark={dark} className="overflow-hidden">
        <div className={`px-5 py-3 border-b ${dark?'border-[#1e2d4a]':'border-slate-100'}`}>
          <h3 className={`font-bold ${text}`}>Riwayat 5 Hari Terakhir</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className={`text-xs uppercase tracking-wider ${muted} ${dark?'bg-[#0a1020]':'bg-slate-50'}`}>
              <th className="px-5 py-3 text-left">Tanggal</th>
              <th className="px-5 py-3 text-left">Mr. Farhan</th>
              <th className="px-5 py-3 text-left">Mr. Ramram</th>
              <th className="px-5 py-3 text-left hidden md:table-cell">Check-in</th>
              <th className="px-5 py-3 text-left hidden md:table-cell">Check-out</th>
            </tr>
          </thead>
          <tbody>
            {ATTENDANCE.map((row,i)=>(
              <tr key={i} className={`border-t ${dark?'border-[#1e2d4a] hover:bg-[#1a2a4a]':'border-slate-100 hover:bg-blue-50'} transition-colors`}>
                <td className={`px-5 py-3 text-sm font-medium ${muted}`}>{row.date}</td>
                {[row.farhan, row.ramram].map((st,j)=>(
                  <td key={j} className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-xl font-semibold ${attStatus[st]?.bg} ${attStatus[st]?.text}`}>{st}</span>
                  </td>
                ))}
                <td className={`px-5 py-3 text-sm ${muted} hidden md:table-cell`}>{row.checkIn}</td>
                <td className={`px-5 py-3 text-sm ${muted} hidden md:table-cell`}>{row.checkOut}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ─── Commission View ──────────────────────────────────────────────────────────
function CommissionView({ dark }: { dark:boolean }) {
  const [rate, setRate] = useState(5)
  const [bonusThreshold, setBonusThreshold] = useState(80)
  const [bonusAmount, setBonusAmount] = useState(5000000)
  const text = dark ? 'text-slate-100' : 'text-slate-800'
  const muted = dark ? 'text-slate-400' : 'text-slate-500'
  const inp = dark ? 'bg-[#0a1020] border-[#1e2d4a] text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'

  const data = LEADERBOARD.map(l=>{
    const komisi = l.revenue * (rate/100)
    const bonus = l.score >= bonusThreshold ? bonusAmount : 0
    const insentif = l.closing * 200000
    return { ...l, komisi, bonus, insentif, total:komisi+bonus+insentif }
  })

  return (
    <div className="space-y-5">
      <div><h2 className={`font-bold text-lg ${text}`}>Komisi & Insentif</h2><p className={`text-xs ${muted}`}>Kalkulator otomatis · Mei 2026</p></div>

      {/* Settings */}
      <Card dark={dark} className="p-5">
        <h3 className={`font-semibold mb-4 flex items-center gap-2 ${text}`}><CreditCard size={16}/>Konfigurasi Komisi</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${muted}`}>Komisi Rate (%)</label>
            <input type="number" value={rate} onChange={e=>setRate(Number(e.target.value))} className={`w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${inp}`}/>
          </div>
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${muted}`}>Min. Score untuk Bonus</label>
            <input type="number" value={bonusThreshold} onChange={e=>setBonusThreshold(Number(e.target.value))} className={`w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${inp}`}/>
          </div>
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${muted}`}>Nominal Bonus (Rp)</label>
            <input type="number" value={bonusAmount} onChange={e=>setBonusAmount(Number(e.target.value))} className={`w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${inp}`}/>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l:'Total Komisi', v:fmtRp(data.reduce((a,d)=>a+d.komisi,0)), icon:DollarSign, g:'from-blue-600 to-blue-400' },
          { l:'Total Bonus', v:fmtRp(data.reduce((a,d)=>a+d.bonus,0)), icon:Gift, g:'from-green-600 to-green-400' },
          { l:'Total Insentif', v:fmtRp(data.reduce((a,d)=>a+d.insentif,0)), icon:Award, g:'from-purple-600 to-purple-400' },
          { l:'Grand Total', v:fmtRp(data.reduce((a,d)=>a+d.total,0)), icon:TrendingUp, g:'from-orange-600 to-orange-400' },
        ].map(s=>(
          <Card key={s.l} dark={dark} className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.g} flex items-center justify-center shrink-0`}><s.icon size={16} className="text-white"/></div>
            <div><p className={`text-base font-bold ${text}`}>{s.v}</p><p className={`text-xs ${muted}`}>{s.l}</p></div>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card dark={dark} className="overflow-hidden">
        <div className={`px-5 py-3 border-b flex items-center justify-between ${dark?'border-[#1e2d4a]':'border-slate-100'}`}>
          <h3 className={`font-bold ${text}`}>Detail Kalkulasi per Staff</h3>
          <button className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 hover:bg-green-500 transition-colors"><Download size={12}/>Export Excel</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-xs uppercase tracking-wider ${muted} ${dark?'bg-[#0a1020]':'bg-slate-50'}`}>
                <th className="px-5 py-3 text-left">Staff</th>
                <th className="px-5 py-3 text-right">Revenue</th>
                <th className="px-5 py-3 text-right">Komisi</th>
                <th className="px-5 py-3 text-right">Bonus</th>
                <th className="px-5 py-3 text-right">Insentif</th>
                <th className="px-5 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map(d=>(
                <tr key={d.rank} className={`border-t ${dark?'border-[#1e2d4a] hover:bg-[#1a2a4a]':'border-slate-100 hover:bg-blue-50'} transition-colors`}>
                  <td className="px-5 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">{d.avatar}</div><span className={`font-medium ${text}`}>{d.name}</span></div></td>
                  <td className={`px-5 py-3 text-right ${muted}`}>{fmtRp(d.revenue)}</td>
                  <td className="px-5 py-3 text-right text-blue-400 font-medium">{fmtRp(d.komisi)}</td>
                  <td className={`px-5 py-3 text-right font-medium ${d.bonus>0?'text-green-400':muted}`}>{d.bonus>0?fmtRp(d.bonus):'-'}</td>
                  <td className="px-5 py-3 text-right text-purple-400 font-medium">{fmtRp(d.insentif)}</td>
                  <td className={`px-5 py-3 text-right font-bold ${text}`}>{fmtRp(d.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ─── Reports View ─────────────────────────────────────────────────────────────
function ReportsView({ dark }: { dark:boolean }) {
  const text = dark ? 'text-slate-100' : 'text-slate-800'
  const muted = dark ? 'text-slate-400' : 'text-slate-500'
  const inp = dark ? 'bg-[#0a1020] border-[#1e2d4a] text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
  const gl = dark ? '#1e2d4a' : '#e2e8f0'
  const ax = dark ? '#94a3b8' : '#64748b'
  const tt = { background:dark?'#0f1729':'#fff', border:`1px solid ${gl}`, borderRadius:12, color:dark?'#e2e8f0':'#1e293b' }

  return (
    <div className="space-y-5">
      <div><h2 className={`font-bold text-lg ${text}`}>Reports & Analytics</h2><p className={`text-xs ${muted}`}>Generate & export laporan performa</p></div>

      <Card dark={dark} className="p-5">
        <h3 className={`font-semibold mb-3 flex items-center gap-2 ${text}`}><Filter size={15}/>Filter Laporan</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {['Date Range','Staff','Campaign','Role'].map(f=>(
            <div key={f}>
              <label className={`block text-xs font-semibold mb-1.5 ${muted}`}>{f}</label>
              <select className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${inp}`}><option>Semua {f}</option></select>
            </div>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-1.5 hover:scale-105 transition-all"><FileText size={14}/>Generate Report</button>
          <button className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-green-500/30 flex items-center gap-1.5 hover:scale-105 transition-all"><Download size={14}/>Export Excel</button>
          <button className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-red-500/30 flex items-center gap-1.5 hover:scale-105 transition-all"><Download size={14}/>Export PDF</button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card dark={dark} className="p-5">
          <h3 className={`font-bold mb-1 ${text}`}>Perbandingan Staff</h3>
          <p className={`text-xs ${muted} mb-4`}>Revenue & Leads · Mei 2026</p>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={[
              {name:'Mr. Farhan',revenue:92,leads:78,closing:21},
              {name:'Mr. Ramram',revenue:73,leads:61,closing:17},
              {name:'Dian P.',revenue:58,leads:52,closing:13},
              {name:'Agus S.',revenue:45,leads:41,closing:10},
            ]} barGap={3}>
              <CartesianGrid stroke={gl} strokeDasharray="3 3"/>
              <XAxis dataKey="name" stroke={ax} tick={{fontSize:10}}/>
              <YAxis stroke={ax} tick={{fontSize:10}}/>
              <Tooltip contentStyle={tt}/>
              <Bar dataKey="revenue" fill="#3b82f6" radius={[6,6,0,0]} name="Revenue (jt)"/>
              <Bar dataKey="leads" fill="#8b5cf6" radius={[6,6,0,0]} name="Leads"/>
              <Bar dataKey="closing" fill="#10b981" radius={[6,6,0,0]} name="Closing"/>
              <Legend/>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card dark={dark} className="p-5">
          <h3 className={`font-bold mb-1 ${text}`}>Trend Revenue 6 Bulan</h3>
          <p className={`text-xs ${muted} mb-4`}>vs Target</p>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={MONTHLY}>
              <CartesianGrid stroke={gl} strokeDasharray="3 3"/>
              <XAxis dataKey="month" stroke={ax} tick={{fontSize:11}}/>
              <YAxis stroke={ax} tick={{fontSize:11}}/>
              <Tooltip contentStyle={tt}/>
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} name="Revenue" dot={{fill:'#3b82f6',r:4}}/>
              <Line type="monotone" dataKey="target" stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} name="Target" dot={false}/>
              <Legend/>
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin:(u:User)=>void }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'password'|'magic'>('password')

  const handle = async () => {
    setLoading(true); setError('')
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password: pass })
      if (authErr || !data.user) {
        setError(authErr?.message || 'Email atau password salah.')
        setLoading(false); return
      }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
      const u: User = {
        id: data.user.id,
        name: profile?.full_name || data.user.email || 'User',
        role: (profile?.role || 'staff') as Role,
        team: profile?.team || '',
        avatar: ((profile?.full_name || data.user.email || 'U').charAt(0)).toUpperCase(),
        email: data.user.email || '',
        online: true,
        revenue: 0, leads: 0, closing: 0, score: 0,
      }
      onLogin(u)
    } catch(e) {
      setError('Gagal login: ' + (e instanceof Error ? e.message : 'Unknown error'))
      setLoading(false)
    }
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
          <div className="flex mb-5 p-1 bg-[#0a1020] rounded-xl">
            {(['password','magic'] as const).map(t=>(
              <button key={t} onClick={()=>setTab(t)} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tab===t?'bg-blue-600 text-white shadow-md':'text-slate-400 hover:text-slate-200'}`}>
                {t==='password'?'🔐 Password':'✨ Magic Link'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {error && <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="mb-4 px-4 py-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2"><AlertCircle size={14}/>{error}</motion.div>}
          </AnimatePresence>

          {tab==='password' ? (
            <div className="space-y-4">
              {[['Email','email',email,setEmail],['Password','password',pass,setPass]].map(([lbl,type,val,setter])=>(
                <div key={String(lbl)}>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">{String(lbl)}</label>
                  <input type={String(type)} value={String(val)} onChange={e=>(setter as any)(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handle()} placeholder={lbl==='Email'?'reynaldi@alex.id':'••••••••'} className="w-full px-4 py-3 bg-[#0a1020] border border-[#1e2d4a] rounded-xl text-white placeholder-slate-600 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"/>
                </div>
              ))}
              <button onClick={handle} disabled={loading} className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2">
                {loading?<><RefreshCw size={15} className="animate-spin"/>Masuk...</>:<><Zap size={15}/>Masuk Sekarang</>}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="masukkan email kamu" className="w-full px-4 py-3 bg-[#0a1020] border border-[#1e2d4a] rounded-xl text-white placeholder-slate-600 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"/>
              </div>
              <button onClick={()=>{if(!email){setError("Masukkan email terlebih dahulu");return};setError("Fitur Magic Link belum aktif. Gunakan tab Password.")}} className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                <Zap size={15}/>Kirim Magic Link
              </button>
              <p className="text-xs text-slate-500 text-center">Link masuk akan dikirim ke email kamu</p>
            </div>
          )}

          <div className="mt-5 pt-5 border-t border-[#1e2d4a]">
            <p className="text-xs text-slate-500 text-center mb-3">Demo cepat — klik untuk isi otomatis:</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { n:'Reynaldi (SuperAdmin)', e:'reynaldi@alex.id' },
                { n:'Mr. Farhan (Staff)', e:'farhan@alex.id' },
              ].map(a=>(
                <button key={a.e} onClick={()=>{setEmail(a.e);setPass('admin123');setTab('password')}} className="px-3 py-2 text-xs bg-[#0a1020] border border-[#1e2d4a] rounded-xl text-slate-400 hover:text-slate-200 hover:border-blue-500/50 transition-all text-left">
                  {a.n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright Footer */}
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

// ─── Leads View ───────────────────────────────────────────────────────────────
const PIPELINE: { status:LeadStatus; label:string; color:string; bg:string; dot:string }[] = [
  { status:'baru',      label:'Leads Baru',   color:'text-blue-400',   bg:'bg-blue-500/10 border-blue-500/30',   dot:'bg-blue-400' },
  { status:'dihubungi', label:'Dihubungi',    color:'text-cyan-400',   bg:'bg-cyan-500/10 border-cyan-500/30',   dot:'bg-cyan-400' },
  { status:'berminat',  label:'Berminat',     color:'text-purple-400', bg:'bg-purple-500/10 border-purple-500/30', dot:'bg-purple-400' },
  { status:'survey',    label:'Survey Skolah',color:'text-orange-400', bg:'bg-orange-500/10 border-orange-500/30', dot:'bg-orange-400' },
  { status:'meeting',   label:'Meeting',      color:'text-yellow-400', bg:'bg-yellow-500/10 border-yellow-500/30', dot:'bg-yellow-400' },
  { status:'proposal',  label:'Proposal',     color:'text-pink-400',   bg:'bg-pink-500/10 border-pink-500/30',   dot:'bg-pink-400' },
  { status:'closing',   label:'Closing ✓',    color:'text-green-400',  bg:'bg-green-500/10 border-green-500/30', dot:'bg-green-400' },
  { status:'gagal',     label:'Gagal',        color:'text-slate-400',  bg:'bg-slate-500/10 border-slate-500/30', dot:'bg-slate-500' },
]
const TEMP_CFG = {
  hot:  { label:'Hot',  icon:Flame,     color:'text-red-400',    bg:'bg-red-500/15' },
  warm: { label:'Warm', icon:Activity,  color:'text-orange-400', bg:'bg-orange-500/15' },
  cold: { label:'Cold', icon:Snowflake, color:'text-blue-300',   bg:'bg-blue-500/15' },
}
const SOURCE_CFG: Record<LeadSource,string> = {
  Instagram:'bg-pink-500/20 text-pink-400', WhatsApp:'bg-green-500/20 text-green-400',
  Referral:'bg-purple-500/20 text-purple-400', Facebook:'bg-blue-500/20 text-blue-400',
  Google:'bg-yellow-500/20 text-yellow-400', 'Walk-in':'bg-cyan-500/20 text-cyan-400',
  Lainnya:'bg-slate-500/20 text-slate-400',
}
const METHOD_CFG = { WA:'bg-green-500/20 text-green-400', Telepon:'bg-blue-500/20 text-blue-400', Kunjungan:'bg-purple-500/20 text-purple-400', Email:'bg-orange-500/20 text-orange-400' }

// ─── Lead Category Config ────────────────────────────────────────────────────
const CATEGORY_CFG: Record<string, {label:string; color:string; bg:string; icon:string}> = {
  HOT:    { label:'🔥 HOT',    color:'text-red-400',    bg:'bg-red-500/15 border border-red-500/30',    icon:'🔥' },
  WARM:   { label:'🌤 WARM',   color:'text-orange-400', bg:'bg-orange-500/15 border border-orange-500/30', icon:'🌤' },
  COLD:   { label:'❄ COLD',   color:'text-blue-400',   bg:'bg-blue-500/15 border border-blue-500/30',   icon:'❄' },
  FREEZE: { label:'🧊 FREEZE', color:'text-cyan-400',   bg:'bg-cyan-500/15 border border-cyan-500/30',  icon:'🧊' },
}

const STAFF_LIST = ['Mr. Farhan', 'Mr. Ramram']
const SOURCE_LIST = ['Instagram','WhatsApp','Referral','Facebook','Google','Walk-in','TikTok','Lainnya']
const CLASS_LIST = ['TK','SD Kelas 1','SD Kelas 2','SD Kelas 3','SD Kelas 4','SD Kelas 5','SD Kelas 6',
  'SMP Kelas 7','SMP Kelas 8','SMP Kelas 9','SMA Kelas 10','SMA Kelas 11','SMA Kelas 12']

function StarRating({ value, onChange, dark }: { value:number; onChange?:(v:number)=>void; dark:boolean }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onClick={() => onChange?.(s)}
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          className={`transition-colors ${onChange ? 'cursor-pointer' : 'cursor-default'}`}>
          <Star size={16} className={
            s <= (hover || value)
              ? 'text-yellow-400 fill-yellow-400'
              : dark ? 'text-slate-600' : 'text-slate-300'
          }/>
        </button>
      ))}
    </div>
  )
}

function LeadsView({ dark, currentUser }: { dark:boolean; currentUser:User }) {
  const { leads: dbLeads, loading, createLead, deleteLead } = useLeads()
  const [filterCategory, setFilterCategory] = useState<'all'|'HOT'|'COLD'|'WARM'|'FREEZE'>('all')
  const [filterStaff, setFilterStaff] = useState('all')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [detailLead, setDetailLead] = useState<DBLead|null>(null)
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'list'|'kanban'>('kanban')
  const [formStep, setFormStep] = useState(0)

  const [form, setForm] = useState({
    parentName:'', parentPhone:'', parentArea:'',
    childName:'', childGender:'L' as 'L'|'P', childClass:'TK', hasSibling:false,
    source:'Instagram', assignedStaffName:'Mr. Farhan',
    leadCategory:'WARM' as LeadCategory, interestRating:3, notes:''
  })

  const tx = dark?'text-slate-100':'text-slate-800'
  const mt = dark?'text-slate-400':'text-slate-500'
  const bd = dark?'border-[#1e2d4a]':'border-slate-200'
  const cb = dark?'bg-[#111d35] border-[#1e2d4a]':'bg-white border-slate-200'
  const inp = dark?'bg-[#0a1020] border-[#1e2d4a] text-slate-100 placeholder-slate-600':'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'

  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(''), 3000) }

  const filtered = useMemo(() => {
    return dbLeads.filter(l =>
      (filterCategory === 'all' || l.leadCategory === filterCategory) &&
      (filterStaff === 'all' || l.assignedStaffName === filterStaff) &&
      (!search || l.parentName.toLowerCase().includes(search.toLowerCase()) ||
        l.childName.toLowerCase().includes(search.toLowerCase()) ||
        (l.parentPhone ?? '').includes(search))
    )
  }, [dbLeads, filterCategory, filterStaff, search])

  const stats = useMemo(() => ({
    total: dbLeads.length,
    hot: dbLeads.filter(l=>l.leadCategory==='HOT').length,
    warm: dbLeads.filter(l=>l.leadCategory==='WARM').length,
    freeze: dbLeads.filter(l=>l.leadCategory==='FREEZE').length,
  }), [dbLeads])

  const handleSubmit = async () => {
    if (!form.parentName || !form.childName) { showToast('⚠ Nama orang tua & calon siswa wajib diisi'); return }
    setSaving(true)
    const { error } = await createLead({
      parentName: form.parentName, parentPhone: form.parentPhone, parentArea: form.parentArea,
      childName: form.childName, childGender: form.childGender, childClass: form.childClass, hasSibling: form.hasSibling,
      source: form.source, assignedStaffName: form.assignedStaffName,
      leadCategory: form.leadCategory, interestRating: form.interestRating, notes: form.notes,
      status: 'new', handlerName: currentUser.name, handlerRole: currentUser.role,
    })
    setSaving(false)
    if (error) { showToast('❌ Gagal menyimpan: ' + error.message); return }
    setShowAdd(false)
    setFormStep(0)
    setForm({ parentName:'', parentPhone:'', parentArea:'', childName:'', childGender:'L', childClass:'TK', hasSibling:false, source:'Instagram', assignedStaffName:'Mr. Farhan', leadCategory:'WARM', interestRating:3, notes:'' })
    showToast('✅ Lead berhasil disimpan!')
  }

  const handleExportCSV = () => { exportLeadsCSV(dbLeads); showToast('✅ CSV berhasil diunduh!') }

  const handleCopyBroadcast = async () => {
    const text = buildWABroadcast(dbLeads)
    await navigator.clipboard.writeText(text)
    showToast('✅ Broadcast WA tersalin! Paste di WhatsApp.')
  }

  const handleCopyIndividual = async (lead: DBLead) => {
    const text = buildWAIndividual(lead)
    await navigator.clipboard.writeText(text)
    showToast(`✅ Pesan WA untuk ${lead.childName} tersalin!`)
  }

  const STEPS = ['Data Orang Tua', 'Data Calon Siswa', 'Data Lead']

  return (
    <div className="space-y-5">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}}
            className="fixed top-5 right-5 z-[999] px-5 py-3 rounded-2xl bg-[#111d35] border border-[#1e2d4a] text-white text-sm font-semibold shadow-2xl">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Total Leads', value:stats.total, color:'text-blue-400', bg:'bg-blue-500/10' },
          { label:'🔥 HOT', value:stats.hot, color:'text-red-400', bg:'bg-red-500/10' },
          { label:'🌤 WARM', value:stats.warm, color:'text-orange-400', bg:'bg-orange-500/10' },
          { label:'🧊 FREEZE', value:stats.freeze, color:'text-cyan-400', bg:'bg-cyan-500/10' },
        ].map(s => (
          <div key={s.label} className={`${cb} border rounded-2xl p-4`}>
            <p className={`text-xs font-semibold ${mt}`}>{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div className={`${cb} border rounded-2xl p-4 flex flex-wrap gap-3 items-center justify-between`}>
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${inp} w-44`}>
            <Search size={13} className={mt}/>
            <input placeholder="Cari leads..." value={search} onChange={e=>setSearch(e.target.value)}
              className="bg-transparent outline-none w-full text-xs"/>
          </div>
          {/* Category filter */}
          <select value={filterCategory} onChange={e=>setFilterCategory(e.target.value as typeof filterCategory)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold ${inp}`}>
            <option value="all">Semua Kategori</option>
            {['HOT','WARM','COLD','FREEZE'].map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          {/* Staff filter */}
          <select value={filterStaff} onChange={e=>setFilterStaff(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold ${inp}`}>
            <option value="all">Semua Staff</option>
            {STAFF_LIST.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* View Mode Toggle */}
          <div className={`flex rounded-xl border overflow-hidden ${dark?'border-[#1e2d4a]':'border-slate-200'}`}>
            {(['kanban','list'] as const).map(m=>(
              <button key={m} onClick={()=>setViewMode(m)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors
                  ${viewMode===m?(dark?'bg-blue-600 text-white':'bg-blue-600 text-white'):(dark?'text-slate-400 hover:text-slate-200':'text-slate-500 hover:text-slate-700')}`}>
                {m==='kanban'?<><LayoutDashboard size={12}/>Kanban</>:<><List size={12}/>List</>}
              </button>
            ))}
          </div>
          {/* Export CSV */}
          <button onClick={handleExportCSV}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${dark?'border-green-500/40 text-green-400 hover:bg-green-500/10':'border-green-300 text-green-600 hover:bg-green-50'}`}>
            <FileSpreadsheet size={13}/>Export CSV
          </button>
          {/* Copy WA Broadcast */}
          <button onClick={handleCopyBroadcast}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${dark?'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10':'border-emerald-300 text-emerald-600 hover:bg-emerald-50'}`}>
            <MessageSquare size={13}/>Copy WA Broadcast
          </button>
          {/* Add Lead */}
          <button onClick={()=>{setShowAdd(true);setFormStep(0)}}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02]">
            <Plus size={13}/>Lead Baru
          </button>
        </div>
      </div>

      {/* ── Kanban View ── */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3" style={{minWidth:'900px'}}>
            {(['HOT','WARM','COLD','FREEZE'] as const).map(cat=>{
              const cfg = CATEGORY_CFG[cat]
              const colLeads = filtered.filter(l=>l.leadCategory===cat)
              return (
                <div key={cat} className="flex-1 min-w-[200px]">
                  {/* Column header */}
                  <div className={`flex items-center justify-between px-3 py-2 rounded-xl mb-2 border ${cfg.bg}`}>
                    <span className={`text-xs font-bold ${cfg.color}`}>{cfg.icon} {cat}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{colLeads.length}</span>
                  </div>
                  {/* Cards */}
                  <div className="space-y-2 min-h-[120px]">
                    {colLeads.length === 0 && (
                      <div className={`flex items-center justify-center h-20 rounded-xl border-2 border-dashed ${dark?'border-[#1e2d4a] text-slate-600':'border-slate-200 text-slate-400'} text-xs`}>Kosong</div>
                    )}
                    {colLeads.map((lead,i)=>(
                      <motion.div key={lead.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                        onClick={()=>setDetailLead(lead)}
                        className={`${cb} border rounded-xl p-3 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg`}>
                        <p className={`text-xs font-bold ${tx} truncate`}>{lead.childName}</p>
                        <p className={`text-[10px] ${mt} truncate mt-0.5`}>👨‍👩‍👦 {lead.parentName}</p>
                        {lead.parentPhone && <p className={`text-[10px] ${mt} truncate`}>📱 {lead.parentPhone}</p>}
                        {lead.parentArea && <p className={`text-[10px] ${mt} truncate`}>📍 {lead.parentArea}</p>}
                        <div className="flex items-center justify-between mt-2 gap-2">
                          {lead.interestRating ? <StarRating value={lead.interestRating} dark={dark}/> : <span/>}
                          <div className="flex gap-1" onClick={e=>e.stopPropagation()}>
                            <button onClick={()=>handleCopyIndividual(lead)} className={`w-6 h-6 rounded-lg flex items-center justify-center ${dark?'text-green-400 hover:bg-green-500/10':'text-green-600 hover:bg-green-50'}`}><MessageSquare size={11}/></button>
                            <button onClick={async()=>{await deleteLead(lead.id);showToast('🗑 Lead dihapus')}} className={`w-6 h-6 rounded-lg flex items-center justify-center ${dark?'text-red-400 hover:bg-red-500/10':'text-red-600 hover:bg-red-50'}`}><Trash2 size={11}/></button>
                          </div>
                        </div>
                        {lead.assignedStaffName && <p className={`text-[9px] ${mt} mt-1.5 font-medium`}>👤 {lead.assignedStaffName}</p>}
                        {lead.source && <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded-md font-medium mt-1 ${dark?'bg-[#1e2d4a] text-slate-400':'bg-slate-100 text-slate-500'}`}>{lead.source}</span>}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )
            })}
            {/* Uncategorized column */}
            {(()=>{
              const uncat = filtered.filter(l=>!l.leadCategory)
              if (uncat.length === 0) return null
              return (
                <div key="uncat" className="flex-1 min-w-[200px]">
                  <div className={`flex items-center justify-between px-3 py-2 rounded-xl mb-2 border ${dark?'bg-slate-500/10 border-slate-500/30 text-slate-400':'bg-slate-100 border-slate-200 text-slate-500'}`}>
                    <span className="text-xs font-bold">— Belum Dikategori</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400">{uncat.length}</span>
                  </div>
                  <div className="space-y-2">
                    {uncat.map((lead,i)=>(
                      <motion.div key={lead.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                        onClick={()=>setDetailLead(lead)}
                        className={`${cb} border rounded-xl p-3 cursor-pointer transition-all hover:scale-[1.01]`}>
                        <p className={`text-xs font-bold ${tx} truncate`}>{lead.childName}</p>
                        <p className={`text-[10px] ${mt} truncate mt-0.5`}>👨‍👩‍👦 {lead.parentName}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* ── List View ── */}
      {viewMode === 'list' && (
      <div className={`${cb} border rounded-2xl overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={20} className="animate-spin text-blue-500"/>
            <span className={`ml-2 text-sm ${mt}`}>Memuat data...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Inbox size={40} className={mt}/>
            <p className={`text-sm font-semibold ${tx}`}>Belum ada leads</p>
            <p className={`text-xs ${mt}`}>Klik "Lead Baru" untuk menambahkan</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={`border-b ${bd} ${dark?'bg-[#0a1020]':'bg-slate-50'}`}>
                    {['Orang Tua / WA','Calon Siswa','Daerah','Kategori','Rating','Assign Staff','Sumber','Aksi'].map(h=>(
                      <th key={h} className={`px-4 py-3 text-left font-semibold ${mt} whitespace-nowrap`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead, i) => (
                    <motion.tr key={lead.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}
                      className={`border-b ${bd} cursor-pointer transition-colors ${dark?'hover:bg-[#1a2a3a]':'hover:bg-slate-50'}`}
                      onClick={()=>setDetailLead(lead)}>
                      <td className="px-4 py-3">
                        <p className={`font-semibold ${tx}`}>{lead.parentName}</p>
                        {lead.parentPhone && <p className={`${mt} mt-0.5`}>{lead.parentPhone}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p className={`font-semibold ${tx}`}>{lead.childName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {lead.childGender && <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${lead.childGender==='L'?'bg-blue-500/20 text-blue-400':'bg-pink-500/20 text-pink-400'}`}>{lead.childGender==='L'?'L':'P'}</span>}
                          {lead.childClass && <span className={mt}>{lead.childClass}</span>}
                          {lead.hasSibling && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400 font-semibold">Kakak/Adik</span>}
                        </div>
                      </td>
                      <td className={`px-4 py-3 ${mt}`}>{lead.parentArea ?? '—'}</td>
                      <td className="px-4 py-3">
                        {lead.leadCategory ? (
                          <span className={`text-[10px] px-2 py-1 rounded-lg font-bold ${CATEGORY_CFG[lead.leadCategory]?.bg ?? ''} ${CATEGORY_CFG[lead.leadCategory]?.color ?? ''}`}>{lead.leadCategory}</span>
                        ) : <span className={mt}>—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {lead.interestRating ? <StarRating value={lead.interestRating} dark={dark}/> : <span className={mt}>—</span>}
                      </td>
                      <td className={`px-4 py-3 ${mt}`}>{lead.assignedStaffName ?? '—'}</td>
                      <td className="px-4 py-3">
                        {lead.source ? <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${dark?'bg-[#1e2d4a] text-slate-300':'bg-slate-100 text-slate-600'}`}>{lead.source}</span> : <span className={mt}>—</span>}
                      </td>
                      <td className="px-4 py-3" onClick={e=>e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button onClick={()=>handleCopyIndividual(lead)} title="Copy pesan WA" className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${dark?'text-green-400 hover:bg-green-500/10':'text-green-600 hover:bg-green-50'}`}><MessageSquare size={13}/></button>
                          <button onClick={()=>setDetailLead(lead)} title="Detail" className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${dark?'text-blue-400 hover:bg-blue-500/10':'text-blue-600 hover:bg-blue-50'}`}><Eye size={13}/></button>
                          <button onClick={async ()=>{ await deleteLead(lead.id); showToast('🗑 Lead dihapus') }} title="Hapus" className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${dark?'text-red-400 hover:bg-red-500/10':'text-red-600 hover:bg-red-50'}`}><Trash2 size={13}/></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-inherit">
              {filtered.map((lead, i) => (
                <motion.div key={lead.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                  className={`p-4 transition-colors ${dark?'hover:bg-[#1a2a3a]':'hover:bg-slate-50'}`}
                  onClick={()=>setDetailLead(lead)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Category badge */}
                      {lead.leadCategory && (
                        <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-lg font-bold mb-1.5 ${CATEGORY_CFG[lead.leadCategory]?.bg} ${CATEGORY_CFG[lead.leadCategory]?.color}`}>
                          {lead.leadCategory}
                        </span>
                      )}
                      {/* Names */}
                      <p className={`font-bold text-sm ${tx} truncate`}>{lead.childName}</p>
                      <p className={`text-xs ${mt} truncate`}>👨‍👩‍👦 {lead.parentName}</p>
                      {lead.parentPhone && <p className={`text-xs ${mt}`}>📱 {lead.parentPhone}</p>}
                      {lead.parentArea && <p className={`text-xs ${mt}`}>📍 {lead.parentArea}</p>}
                      {/* Tags row */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {lead.childGender && <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${lead.childGender==='L'?'bg-blue-500/20 text-blue-400':'bg-pink-500/20 text-pink-400'}`}>{lead.childGender==='L'?'Laki-laki':'Perempuan'}</span>}
                        {lead.childClass && <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${dark?'bg-[#1e2d4a] text-slate-300':'bg-slate-100 text-slate-600'}`}>{lead.childClass}</span>}
                        {lead.hasSibling && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400 font-semibold">Ada Kakak/Adik</span>}
                        {lead.source && <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${dark?'bg-[#1e2d4a] text-slate-300':'bg-slate-100 text-slate-600'}`}>{lead.source}</span>}
                      </div>
                      {/* Bottom row */}
                      <div className="flex items-center gap-3 mt-2">
                        {lead.interestRating && <StarRating value={lead.interestRating} dark={dark}/>}
                        {lead.assignedStaffName && <span className={`text-[10px] font-medium ${mt}`}>👤 {lead.assignedStaffName}</span>}
                      </div>
                    </div>
                    {/* Action buttons */}
                    <div className="flex flex-col gap-1.5 shrink-0" onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>handleCopyIndividual(lead)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${dark?'bg-green-500/15 text-green-400':'bg-green-50 text-green-600'}`}>
                        <MessageSquare size={14}/>
                      </button>
                      <button onClick={async ()=>{ await deleteLead(lead.id); showToast('🗑 Lead dihapus') }}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${dark?'bg-red-500/15 text-red-400':'bg-red-50 text-red-600'}`}>
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
        <div className={`px-4 py-2.5 border-t ${bd} flex items-center justify-between`}>
          <p className={`text-xs ${mt}`}>Menampilkan {filtered.length} dari {dbLeads.length} leads</p>
          <p className={`text-xs ${mt}`}>FREEZE = Follow-up 3 bulan kemudian 📅</p>
        </div>
      </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {detailLead && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 pb-[90px] lg:pb-4 bg-black/60 backdrop-blur-sm"            onClick={()=>setDetailLead(null)}>
            <motion.div initial={{scale:0.95,y:20}} animate={{scale:1,y:0}} exit={{scale:0.95,y:20}}
              className={`${dark?'bg-[#0f1729] border-[#1e2d4a]':'bg-white border-slate-200'} border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden`}
              onClick={e=>e.stopPropagation()}>
              <div className={`flex items-center justify-between px-5 py-4 border-b ${bd}`}>
                <div>
                  <p className={`font-bold text-sm ${tx}`}>{detailLead.childName}</p>
                  <p className={`text-xs ${mt}`}>{detailLead.parentName} • {detailLead.parentPhone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={()=>handleCopyIndividual(detailLead)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-semibold hover:bg-green-500/25 transition-colors">
                    <Copy size={12}/>Copy Pesan WA
                  </button>
                  <button onClick={()=>setDetailLead(null)} className={`w-7 h-7 rounded-xl flex items-center justify-center ${dark?'bg-[#1e2d4a] text-slate-400':'bg-slate-100 text-slate-500'}`}>
                    <X size={14}/>
                  </button>
                </div>
              </div>
              <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label:'Kategori', value: detailLead.leadCategory ? <span className={`${CATEGORY_CFG[detailLead.leadCategory]?.color} font-bold`}>{detailLead.leadCategory}</span> : '—' },
                    { label:'Rating', value: detailLead.interestRating ? <StarRating value={detailLead.interestRating} dark={dark}/> : '—' },
                    { label:'Jenis Kelamin', value: detailLead.childGender === 'L' ? 'Laki-laki' : detailLead.childGender === 'P' ? 'Perempuan' : '—' },
                    { label:'Kelas', value: detailLead.childClass ?? '—' },
                    { label:'Daerah', value: detailLead.parentArea ?? '—' },
                    { label:'Kakak/Adik', value: detailLead.hasSibling ? 'Ya' : 'Tidak' },
                    { label:'Sumber', value: detailLead.source ?? '—' },
                    { label:'Assign Staff', value: detailLead.assignedStaffName ?? '—' },
                  ].map(item => (
                    <div key={item.label} className={`p-3 rounded-xl ${dark?'bg-[#1a2a3a]':'bg-slate-50'}`}>
                      <p className={`text-[10px] font-semibold uppercase tracking-wide ${mt}`}>{item.label}</p>
                      <div className={`text-xs font-semibold mt-1 ${tx}`}>{item.value}</div>
                    </div>
                  ))}
                </div>
                {detailLead.notes && (
                  <div className={`p-3 rounded-xl ${dark?'bg-[#1a2a3a]':'bg-slate-50'}`}>
                    <p className={`text-[10px] font-semibold uppercase tracking-wide ${mt} mb-1`}>Catatan</p>
                    <p className={`text-xs ${tx}`}>{detailLead.notes}</p>
                  </div>
                )}
                <p className={`text-[10px] ${mt} text-center`}>
                  Dibuat: {new Date(detailLead.createdAt).toLocaleString('id-ID')}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Lead Modal - 3 Section Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 pb-[90px] lg:pb-4 bg-black/60 backdrop-blur-sm">            <motion.div initial={{scale:0.95,y:20}} animate={{scale:1,y:0}} exit={{scale:0.95,y:20}}
              className={`${dark?'bg-[#0f1729] border-[#1e2d4a]':'bg-white border-slate-200'} border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]`}>
              {/* Header */}
              <div className={`flex items-center justify-between px-5 py-4 border-b ${bd}`}>
                <div>
                  <p className={`font-bold text-sm ${tx}`}>Input Lead Baru</p>
                  <p className={`text-xs ${mt}`}>{STEPS[formStep]} — Langkah {formStep+1} dari {STEPS.length}</p>
                </div>
                <button onClick={()=>{setShowAdd(false);setFormStep(0)}} className={`w-7 h-7 rounded-xl flex items-center justify-center ${dark?'bg-[#1e2d4a] text-slate-400':'bg-slate-100 text-slate-500'}`}>
                  <X size={14}/>
                </button>
              </div>

              {/* Step Indicator */}
              <div className={`px-5 pt-4 flex gap-2`}>
                {STEPS.map((s,i) => (
                  <button key={s} onClick={()=>setFormStep(i)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${i===formStep?(dark?'bg-blue-600 text-white':'bg-blue-600 text-white'):i<formStep?(dark?'bg-green-600/30 text-green-400 border border-green-500/30':'bg-green-50 text-green-600 border border-green-200'):(dark?'bg-[#1e2d4a] text-slate-400':'bg-slate-100 text-slate-500')}`}>
                    {i<formStep?'✓ ':''}{i===0?'👨‍👩‍👦':i===1?'🎒':'📋'} {s}
                  </button>
                ))}
              </div>

              {/* Form Body */}
              <div className="px-5 py-4 space-y-3 flex-1 overflow-y-auto">
                {formStep === 0 && (
                  <>
                    <p className={`text-[11px] font-bold uppercase tracking-wide ${mt}`}>Data Orang Tua</p>
                    <div>
                      <label className={`block text-xs font-semibold ${mt} mb-1`}>Nama Orang Tua <span className="text-red-400">*</span></label>
                      <input value={form.parentName} onChange={e=>setForm(p=>({...p,parentName:e.target.value}))}
                        placeholder="cth. Bpk. Ahmad Fauzi"
                        className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-500/30 ${inp}`}/>
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold ${mt} mb-1`}>Nomor WhatsApp</label>
                      <input value={form.parentPhone} onChange={e=>setForm(p=>({...p,parentPhone:e.target.value}))}
                        placeholder="08xxxxxxxxxx" type="tel"
                        className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-500/30 ${inp}`}/>
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold ${mt} mb-1`}>Daerah <span className={`text-[10px] font-normal ${mt}`}>(Catat area domisili)</span></label>
                      <input value={form.parentArea} onChange={e=>setForm(p=>({...p,parentArea:e.target.value}))}
                        placeholder="cth. Bekasi Barat, Depok, Bogor..."
                        className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-500/30 ${inp}`}/>
                    </div>
                  </>
                )}

                {formStep === 1 && (
                  <>
                    <p className={`text-[11px] font-bold uppercase tracking-wide ${mt}`}>Data Calon Siswa</p>
                    <div>
                      <label className={`block text-xs font-semibold ${mt} mb-1`}>Nama Calon Siswa <span className="text-red-400">*</span></label>
                      <input value={form.childName} onChange={e=>setForm(p=>({...p,childName:e.target.value}))}
                        placeholder="Nama lengkap calon siswa"
                        className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-500/30 ${inp}`}/>
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold ${mt} mb-2`}>Jenis Kelamin</label>
                      <div className="flex gap-2">
                        {(['L','P'] as const).map(g => (
                          <button key={g} type="button" onClick={()=>setForm(p=>({...p,childGender:g}))}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${form.childGender===g?(g==='L'?'bg-blue-600 border-blue-600 text-white':'bg-pink-600 border-pink-600 text-white'):(dark?'border-[#1e2d4a] text-slate-400 hover:bg-[#1e2d4a]':'border-slate-200 text-slate-500 hover:bg-slate-50')}`}>
                            {g==='L'?'👦 Laki-laki':'👧 Perempuan'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold ${mt} mb-1`}>Kelas yang Dituju</label>
                      <select value={form.childClass} onChange={e=>setForm(p=>({...p,childClass:e.target.value}))}
                        className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-500/30 ${inp}`}>
                        {CLASS_LIST.map(c=><option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold ${mt} mb-2`}>Kakak / Adik di Sekolah?</label>
                      <div className="flex gap-2">
                        {[true, false].map(v => (
                          <button key={String(v)} type="button" onClick={()=>setForm(p=>({...p,hasSibling:v}))}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${form.hasSibling===v?(v?'bg-purple-600 border-purple-600 text-white':'bg-slate-600 border-slate-600 text-white'):(dark?'border-[#1e2d4a] text-slate-400 hover:bg-[#1e2d4a]':'border-slate-200 text-slate-500 hover:bg-slate-50')}`}>
                            {v?'✅ Ya, ada':'❌ Tidak ada'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {formStep === 2 && (
                  <>
                    <p className={`text-[11px] font-bold uppercase tracking-wide ${mt}`}>Data Lead</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-semibold ${mt} mb-1`}>Sumber Lead</label>
                        <select value={form.source} onChange={e=>setForm(p=>({...p,source:e.target.value}))}
                          className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-500/30 ${inp}`}>
                          {SOURCE_LIST.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={`block text-xs font-semibold ${mt} mb-1`}>Assign Staff</label>
                        <select value={form.assignedStaffName} onChange={e=>setForm(p=>({...p,assignedStaffName:e.target.value}))}
                          className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-500/30 ${inp}`}>
                          {STAFF_LIST.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold ${mt} mb-2`}>Kategori Leads</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['HOT','WARM','COLD','FREEZE'] as LeadCategory[]).map(cat => (
                          <button key={cat} type="button" onClick={()=>setForm(p=>({...p,leadCategory:cat}))}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-left ${form.leadCategory===cat?`${CATEGORY_CFG[cat].bg} ${CATEGORY_CFG[cat].color}`:(dark?'border-[#1e2d4a] text-slate-400 hover:bg-[#1e2d4a]':'border-slate-200 text-slate-500 hover:bg-slate-50')}`}>
                            <span>{CATEGORY_CFG[cat].label}</span>
                            {cat==='FREEZE' && <p className="text-[9px] font-normal mt-0.5 opacity-70">Follow-up 3 bln kemudian</p>}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold ${mt} mb-2`}>Rating Ketertarikan</label>
                      <div className="flex items-center gap-3">
                        <StarRating value={form.interestRating} onChange={v=>setForm(p=>({...p,interestRating:v}))} dark={dark}/>
                        <span className={`text-xs font-semibold ${tx}`}>
                          {['','Sangat Rendah','Rendah','Sedang','Tinggi','Sangat Tinggi'][form.interestRating]}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold ${mt} mb-1`}>Catatan</label>
                      <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}
                        placeholder="Catatan tambahan tentang lead ini..."
                        rows={3}
                        className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-500/30 resize-none ${inp}`}/>
                    </div>
                  </>
                )}
              </div>

              {/* Footer Buttons */}
              <div className={`flex items-center justify-between gap-3 px-5 py-4 border-t ${bd}`}>
                <button onClick={()=>formStep>0?setFormStep(p=>p-1):setShowAdd(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${dark?'border-[#1e2d4a] text-slate-400 hover:bg-[#1e2d4a]':'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                  {formStep === 0 ? 'Batal' : '← Kembali'}
                </button>
                {formStep < STEPS.length - 1 ? (
                  <button onClick={()=>setFormStep(p=>p+1)}
                    className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/30 hover:scale-[1.02] transition-all">
                    Lanjut →
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={saving}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-green-500/30 hover:scale-[1.02] transition-all disabled:opacity-60">
                    {saving ? <><RefreshCw size={13} className="animate-spin"/>Menyimpan...</> : <><Check size={13}/>Simpan Lead</>}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

const NAV: { icon:React.ComponentType<{size?:number;className?:string}>; label:string; view:View; roles:Role[]; badge?:number }[] = [
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
]

const viewTitle: Record<View,string> = {
  dashboard:'Dashboard Overview', leads:'Leads Management', performance:'Input Performa',
  team:'Manajemen Tim', campaigns:'Campaign', reports:'Reports & Analytics',
  goals:'OKR Goals', attendance:'Attendance & Check-in', commission:'Komisi & Insentif', settings:'Pengaturan'
}

// ─── Mobile Bottom Nav Items ─────────────────────────────────────────────────
const MOB_NAV = [
  { view:'leads'      as View, label:'Leads',      icon:UserPlus },
  { view:'performance'as View, label:'Performa',   icon:BarChart3 },
  { view:'dashboard'  as View, label:'Home',       icon:LayoutDashboard },
  { view:'team'       as View, label:'Tim',        icon:Users },
  { view:'reports'    as View, label:'Laporan',    icon:FileText },
]

export default function AlexandriaDashboard() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [user, setUser] = useState<User|null>(null)
  const [dark, setDark] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [view, setView] = useState<View>('dashboard')
  const [notifOpen, setNotifOpen] = useState(false)
  const [toasts, setToasts] = useState<{id:number;msg:string}[]>([])

  const d = dark
  const bg = d ? 'bg-[#070d1a]' : 'bg-slate-100'
  const sb = d ? 'bg-[#0a1020] border-[#1e2d4a]' : 'bg-white border-slate-200'
  const text = d ? 'text-slate-100' : 'text-slate-800'
  const muted = d ? 'text-slate-400' : 'text-slate-500'
  const hdrBg = d ? 'bg-[#0a1020]/90 border-[#1e2d4a]' : 'bg-white/90 border-slate-200'

  const visibleNav = useMemo(()=>{ if(!user) return []; return NAV.filter(n=>(n.roles as string[]).includes(user.role)) }, [user])

  if (!loggedIn || !user) return <LoginScreen onLogin={u=>{setUser(u);setLoggedIn(true)}}/>

  const NOTIFS = [
    {msg:'Mr. Farhan menambah 3 leads baru',time:'2 menit lalu',icon:Users,color:'text-blue-400'},
    {msg:'Target tim Alpha tercapai! 🎉',time:'15 menit lalu',icon:CheckCircle,color:'text-green-400'},
    {msg:'Campaign Ramadan berakhir besok',time:'1 jam lalu',icon:AlertCircle,color:'text-yellow-400'},
    {msg:'Mr. Ramram closing Rp 8jt',time:'2 jam lalu',icon:TrendingUp,color:'text-green-400'},
    {msg:'Laporan bulanan siap di-download',time:'3 jam lalu',icon:Download,color:'text-purple-400'},
  ]

  return (
    <div className={`flex h-screen w-full overflow-hidden ${bg} ${text} transition-colors duration-300`} style={{fontFamily:'Inter,system-ui,sans-serif'}}>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 220 }}
        transition={{ type:'spring', stiffness:300, damping:30 }}
        className={`${sb} border-r hidden lg:flex flex-col shrink-0 z-20 overflow-hidden`}
      >
        {/* Logo */}
        <div className={`flex items-center h-16 px-3 shrink-0 gap-2 ${collapsed?'justify-center':'justify-between'}`}>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-10}} className="flex items-center gap-2 min-w-0">
                <img src="/logo-alexandria.jpeg" alt="Alexandria" className="w-8 h-8 rounded-xl object-cover shrink-0 shadow-lg shadow-blue-500/30 border border-white/10"/>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-white leading-tight">Alexandria</p>
                  <p className={`text-[10px] ${muted}`}>Marketing Dashboard</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {collapsed && <img src="/logo-alexandria.jpeg" alt="Alexandria" className="w-8 h-8 rounded-xl object-cover shadow-lg shadow-blue-500/30 border border-white/10"/>}
          <button onClick={()=>setCollapsed(!collapsed)} className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors shrink-0 ${d?'bg-[#1e2d4a] hover:bg-[#2a3d5a] text-slate-400':'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}>
            <motion.div animate={{rotate:collapsed?180:0}} transition={{duration:0.3}}>
              <ChevronLeft size={14}/>
            </motion.div>
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
          {!collapsed && <p className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1.5 ${muted}`}>Menu</p>}
          {visibleNav.map(item=>(
            <button
              key={item.view}
              onClick={()=>setView(item.view)}
              title={collapsed?item.label:undefined}
              className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                view===item.view
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : d ? 'text-slate-400 hover:text-slate-100 hover:bg-[#1e2d4a]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              } ${collapsed?'justify-center':''}`}
            >
              <item.icon size={17} className="shrink-0"/>
              <AnimatePresence>
                {!collapsed && <motion.span initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="truncate">{item.label}</motion.span>}
              </AnimatePresence>
              {/* Tooltip when collapsed */}
              {collapsed && (
                <div className={`absolute left-full ml-2 px-2 py-1 text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 ${d?'bg-[#1e2d4a] text-slate-200':'bg-slate-800 text-white'}`}>
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className={`p-2 border-t ${d?'border-[#1e2d4a]':'border-slate-100'} space-y-1`}>
          {/* Dark/Light toggle */}
          <div className={`flex items-center ${collapsed?'justify-center p-2':'justify-between px-3 py-2 rounded-xl '+(d?'bg-[#1e2d4a]':'bg-slate-100')}`}>
            {!collapsed && (
              <div className="flex items-center gap-1.5">
                {d?<Moon size={13} className="text-slate-400"/>:<Sun size={13} className="text-yellow-500"/>}
                <span className={`text-xs ${muted}`}>{d?'Dark':'Light'}</span>
              </div>
            )}
            <button onClick={()=>setDark(!d)} className={`relative w-9 h-5 rounded-full transition-colors duration-300 ${d?'bg-blue-600':'bg-slate-300'}`}>
              <motion.div animate={{x:d?17:2}} transition={{type:'spring',stiffness:500,damping:30}} className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow"/>
            </button>
          </div>
          {/* User */}
          <div className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-colors ${d?'hover:bg-[#1e2d4a]':'hover:bg-slate-100'} ${collapsed?'justify-center':''}`}>
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-white font-bold text-xs">{user.avatar}</div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${d?'border-[#0a1020]':'border-white'} bg-green-400`}/>
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold truncate ${text}`}>{user.name}</p>
                  <p className={`text-[10px] ${muted} capitalize`}>{user.role}</p>
                </motion.div>
              )}
            </AnimatePresence>
            {!collapsed && (
              <button onClick={()=>{setLoggedIn(false);setUser(null)}} title="Logout" className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${d?'text-slate-500 hover:text-red-400 hover:bg-red-500/10':'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}>
                <LogOut size={13}/>
              </button>
            )}
          </div>
        </div>

        {/* Developer Credit */}
        <div className={`shrink-0 px-3 py-2.5 border-t ${d?'border-[#1e2d4a]':'border-slate-100'}`}>
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <img src="/reynaldi.jpeg" alt="Reynaldi" className="w-7 h-7 rounded-full object-cover object-top shrink-0 border border-white/10"/>
              <div className="min-w-0 flex-1">
                <p className={`text-[9px] font-bold truncate ${d?'text-slate-400':'text-slate-500'}`}>Reynaldi Candra Webdev</p>
                <p className={`text-[8px] truncate ${d?'text-slate-600':'text-slate-400'}`}>&copy; 2026 All rights reserved</p>
              </div>
            </div>
          ) : (
            <img src="/reynaldi.jpeg" alt="Reynaldi" className="w-7 h-7 rounded-full object-cover object-top mx-auto border border-white/10"/>
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className={`${hdrBg} border-b backdrop-blur-md px-4 h-14 lg:h-16 flex items-center justify-between shrink-0`}>
          <div className="flex items-center gap-2.5">
            <img src="/logo-alexandria.jpeg" alt="Alexandria" className="lg:hidden w-7 h-7 rounded-lg object-cover shrink-0 border border-white/10"/>
            <div>
              <h1 className={`text-sm lg:text-base font-bold ${text}`}>{viewTitle[view]}</h1>
              <p className={`text-[10px] lg:text-xs ${muted} hidden sm:block`}>Sabtu, 24 Mei 2026 · {user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${d?'bg-[#0a1020] border-[#1e2d4a] text-slate-100':'bg-slate-50 border-slate-200 text-slate-800'} w-48`}>
              <Search size={13} className={muted}/>
              <input placeholder="Cari..." className="bg-transparent outline-none w-full text-xs"/>
            </div>
            <button className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${d?'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30':'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}>
              <Brain size={13}/>AI Summary
            </button>
            {/* Notif */}
            <button onClick={()=>setNotifOpen(!notifOpen)} className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${d?'bg-[#1e2d4a] hover:bg-[#2a3d5a] text-slate-300':'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
              <Bell size={16}/>
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">5</span>
            </button>
            {/* Mobile dark/light toggle */}
            <button onClick={()=>setDark(!d)} className={`lg:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${d?'bg-[#1e2d4a] text-yellow-400 hover:bg-[#2a3d5a]':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {d ? <Sun size={15}/> : <Moon size={15}/>}
            </button>
            {/* Mobile logout */}
            <button onClick={()=>{setLoggedIn(false);setUser(null)}} className={`lg:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${d?'bg-red-500/15 text-red-400 hover:bg-red-500/25':'bg-red-50 text-red-500 hover:bg-red-100'}`}>
              <LogOut size={15}/>
            </button>
          </div>
        </header>

        {/* Notification popup — rendered outside header to avoid backdrop-filter stacking context */}
        <AnimatePresence>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-[998] bg-black/20 backdrop-blur-[2px]" onClick={()=>setNotifOpen(false)}/>
              <motion.div initial={{opacity:0,scale:0.95,y:-10}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95,y:-10}}
                className={`fixed top-[62px] right-3 lg:right-4 w-80 max-w-[calc(100vw-24px)] rounded-2xl border shadow-2xl z-[999] ${d?'bg-[#0f1729] border-[#1e2d4a]':'bg-white border-slate-200'}`}>
                <div className={`px-4 py-3 border-b flex items-center justify-between ${d?'border-[#1e2d4a]':'border-slate-100'}`}>
                  <div className="flex items-center gap-2">
                    <Bell size={14} className={d?'text-blue-400':'text-blue-600'}/>
                    <span className={`text-sm font-bold ${text}`}>Notifikasi</span>
                    <span className="w-5 h-5 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">5</span>
                  </div>
                  <button onClick={()=>setNotifOpen(false)} className={`w-6 h-6 rounded-lg flex items-center justify-center ${d?'bg-[#1e2d4a] text-slate-400 hover:text-slate-200':'bg-slate-100 text-slate-400 hover:text-slate-600'}`}><X size={12}/></button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {NOTIFS.map((n,i)=>(
                    <div key={i} className={`px-4 py-3 border-b ${d?'border-[#1e2d4a] hover:bg-[#1a2a4a]':'border-slate-50 hover:bg-slate-50'} cursor-pointer transition-colors last:border-b-0`}>
                      <div className="flex items-start gap-3">
                        <n.icon size={15} className={`mt-0.5 shrink-0 ${n.color}`}/>
                        <div>
                          <p className={`text-xs font-medium ${text}`}>{n.msg}</p>
                          <p className={`text-[10px] ${muted} mt-0.5`}>{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={`px-4 py-2.5 border-t ${d?'border-[#1e2d4a]':'border-slate-100'}`}>
                  <button className={`text-xs font-semibold ${d?'text-blue-400':'text-blue-600'}`}>Tandai semua sudah dibaca</button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Motivational Banner */}
        <MotivationalBanner dark={d}/>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-5 pb-28 lg:pb-5">
          <AnimatePresence mode="wait">
            <motion.div key={view} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.2}}>
              {view==='dashboard' && <DashboardView dark={d}/>}
              {view==='leads' && <LeadsView dark={d} currentUser={user}/>}
              {view==='performance' && <PerformanceView dark={d} currentUser={user}/>}
              {view==='team' && <TeamView dark={d}/>}
              {view==='campaigns' && <CampaignsView dark={d}/>}
              {view==='reports' && <ReportsView dark={d}/>}
              {view==='goals' && <GoalsView dark={d}/>}
              {view==='attendance' && <AttendanceView dark={d}/>}
              {view==='commission' && <CommissionView dark={d}/>}
              {view==='settings' && (
                <Card dark={d} className="p-8 text-center">
                  <Settings size={48} className={`mx-auto mb-3 ${muted}`}/>
                  <p className={`text-lg font-bold ${text}`}>Pengaturan Sistem</p>
                  <p className={`text-sm mt-1 ${muted}`}>Hanya Super Admin yang bisa akses halaman ini.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    {['Profil & Akun','Keamanan & 2FA','Notifikasi Email'].map(s=>(
                      <button key={s} className={`p-4 rounded-xl border text-sm font-medium transition-colors ${d?'border-[#1e2d4a] hover:bg-[#1e2d4a] text-slate-300':'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>{s}</button>
                    ))}
                  </div>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      {/* ── Mobile Bottom Nav (full-width curved top) ── */}
      <div className={`lg:hidden fixed bottom-0 inset-x-0 z-50
        ${d ? 'bg-[#0d1627] border-[#1e2d4a]' : 'bg-white border-slate-200'}
        border-t rounded-tl-[28px] rounded-tr-[28px]
        shadow-[0_-8px_30px_rgba(0,0,0,0.25)]`}>
        {/* Curve accent line */}
        <div className={`absolute top-0 left-6 right-6 h-[2px] rounded-full ${d?'bg-gradient-to-r from-transparent via-blue-500/40 to-transparent':'bg-gradient-to-r from-transparent via-blue-400/30 to-transparent'}`}/>
        <div className="flex items-end justify-around h-[62px] px-1 pb-2">
          {MOB_NAV.map(item => {
            const active = view === item.view
            return (
              <button key={item.view} onClick={()=>setView(item.view)}
                className="relative flex flex-col items-center justify-end pb-1 flex-1 h-full">
                {active ? (
                  <motion.div
                    layoutId="mob-bubble"
                    transition={{ type:'spring', stiffness:500, damping:35 }}
                    className={`absolute -top-6 w-12 h-12 rounded-full
                      bg-gradient-to-br from-blue-500 to-indigo-600
                      flex items-center justify-center
                      shadow-xl shadow-blue-500/50
                      border-4 ${d ? 'border-[#0d1627]' : 'border-white'}`}>
                    <item.icon size={18} className="text-white"/>
                  </motion.div>
                ) : (
                  <item.icon size={18} className={d ? 'text-slate-500' : 'text-slate-400'}/>
                )}
                <span className={`text-[9px] font-bold leading-none mt-0.5
                  ${active
                    ? (d ? 'text-blue-400' : 'text-blue-600')
                    : (d ? 'text-slate-500' : 'text-slate-400')}`}>
                  {active ? '' : item.label}
                </span>
              </button>
            )
          })}
        </div>
        {/* Safe area bottom padding */}
        <div className="h-safe-bottom pb-1"/>
      </div>
    </div>
  )
}