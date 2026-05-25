'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, RefreshCw, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export default function LoginPage() {
  const router = useRouter()
  const { signInWithPassword, signInWithMagicLink } = useAuth()
  const [tab, setTab] = useState<'password' | 'magic'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicSent, setMagicSent] = useState(false)

  const handlePassword = async () => {
    if (!email || !password) { setError('Email dan password wajib diisi'); return }
    setLoading(true); setError('')
    const { error } = await signInWithPassword(email, password)
    if (error) {
      setError('Email atau password salah. Periksa kembali.')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  const handleMagic = async () => {
    if (!email) { setError('Masukkan email terlebih dahulu'); return }
    setLoading(true); setError('')
    const { error } = await signInWithMagicLink(email)
    if (error) { setError(error.message); setLoading(false) }
    else { setMagicSent(true); setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#070d1a] flex items-center justify-center p-4 relative overflow-hidden">
      <motion.div animate={{ scale:[1,1.1,1], opacity:[0.15,0.25,0.15] }} transition={{ repeat:Infinity, duration:8 }}
        className="absolute -top-60 -left-60 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px] pointer-events-none" />
      <motion.div animate={{ scale:[1,1.15,1], opacity:[0.1,0.2,0.1] }} transition={{ repeat:Infinity, duration:10, delay:2 }}
        className="absolute -bottom-60 -right-60 w-[500px] h-[500px] bg-purple-600 rounded-full blur-[120px] pointer-events-none" />

      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-2xl shadow-blue-500/40">A</div>
          <h1 className="text-2xl font-bold text-white">Alexandria Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Marketing Performance System</p>
        </div>

        <div className="bg-[#111d35] border border-[#1e2d4a] rounded-2xl p-7 shadow-2xl">
          <div className="flex mb-5 p-1 bg-[#0a1020] rounded-xl">
            {(['password','magic'] as const).map(t => (
              <button key={t} onClick={()=>{setTab(t);setError('');setMagicSent(false)}}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tab===t?'bg-blue-600 text-white shadow-md':'text-slate-400 hover:text-slate-200'}`}>
                {t==='password'?'🔐 Password':'✨ Magic Link'}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                className="mb-4 px-4 py-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={14}/>{error}
              </motion.div>
            )}
          </AnimatePresence>

          {magicSent ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">📧</div>
              <p className="text-white font-semibold">Link terkirim!</p>
              <p className="text-slate-400 text-sm mt-1">Cek email <span className="text-blue-400">{email}</span></p>
              <button onClick={()=>setMagicSent(false)} className="mt-4 text-xs text-slate-500 hover:text-slate-300 transition-colors">Kirim ulang</button>
            </div>
          ) : tab === 'password' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handlePassword()}
                  placeholder="email@perusahaan.com"
                  className="w-full px-4 py-3 bg-[#0a1020] border border-[#1e2d4a] rounded-xl text-white placeholder-slate-600 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Password</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handlePassword()}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-[#0a1020] border border-[#1e2d4a] rounded-xl text-white placeholder-slate-600 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"/>
              </div>
              <button onClick={handlePassword} disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <><RefreshCw size={15} className="animate-spin"/>Masuk...</> : <><Zap size={15}/>Masuk Sekarang</>}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="email@perusahaan.com"
                  className="w-full px-4 py-3 bg-[#0a1020] border border-[#1e2d4a] rounded-xl text-white placeholder-slate-600 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"/>
              </div>
              <button onClick={handleMagic} disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                {loading ? <><RefreshCw size={15} className="animate-spin"/>Mengirim...</> : <><Zap size={15}/>Kirim Magic Link</>}
              </button>
              <p className="text-xs text-slate-500 text-center">Link login akan dikirim ke email kamu tanpa perlu password</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
