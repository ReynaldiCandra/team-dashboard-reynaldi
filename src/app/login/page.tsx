'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, RefreshCw, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export default function LoginPage() {
  const { signInWithPassword, signInWithMagicLink } = useAuth()
  const [tab, setTab] = useState<'password' | 'magic'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicSent, setMagicSent] = useState(false)

  const handlePassword = async () => {
    if (!email || !password) { setError('Email dan password wajib diisi'); return }
    setLoading(true); setError('')
    const { error } = await signInWithPassword(email, password)
    if (error) { setError('Email atau password salah. Periksa kembali.'); setLoading(false) }
    else { window.location.href = '/dashboard' }
  }

  const handleMagic = async () => {
    if (!email) { setError('Masukkan email terlebih dahulu'); return }
    setLoading(true); setError('')
    const { error } = await signInWithMagicLink(email)
    if (error) { setError(error.message); setLoading(false) }
    else { setMagicSent(true); setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-xl shadow-blue-200">A</div>
          <h1 className="text-2xl font-bold text-slate-800">Alexandria Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Marketing Performance System</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-100 p-7">
          <div className="flex mb-6 p-1 bg-slate-100 rounded-xl">
            {(['password','magic'] as const).map(t => (
              <button key={t} onClick={()=>{setTab(t);setError('');setMagicSent(false)}}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tab===t?'bg-white text-blue-600 shadow-sm border border-slate-200':'text-slate-500 hover:text-slate-700'}`}>
                {t==='password'?'🔐 Password':'✨ Magic Link'}
              </button>
            ))}
          </div>
          <AnimatePresence>
            {error && (
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
                <AlertCircle size={14}/>{error}
              </motion.div>
            )}
          </AnimatePresence>
          {magicSent ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">📧</div>
              <p className="text-slate-800 font-semibold">Link terkirim!</p>
              <p className="text-slate-500 text-sm mt-1">Cek email <span className="text-blue-600 font-medium">{email}</span></p>
              <button onClick={()=>setMagicSent(false)} className="mt-4 text-xs text-slate-400 hover:text-slate-600">Kirim ulang</button>
            </div>
          ) : tab==='password' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handlePassword()} placeholder="email@perusahaan.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handlePassword()} placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all pr-11"/>
                  <button type="button" onClick={()=>setShowPass(p=>!p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">{showPass?<EyeOff size={15}/>:<Eye size={15}/>}</button>
                </div>
              </div>
              <button onClick={handlePassword} disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2">
                {loading?<><RefreshCw size={15} className="animate-spin"/>Masuk...</>:<><Zap size={15}/>Masuk Sekarang</>}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@perusahaan.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all"/>
              </div>
              <button onClick={handleMagic} disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-200 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                {loading?<><RefreshCw size={15} className="animate-spin"/>Mengirim...</>:<><Zap size={15}/>Kirim Magic Link</>}
              </button>
              <p className="text-xs text-slate-400 text-center">Link login tanpa password dikirim ke email kamu</p>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-slate-400 mt-5">Alexandria Islamic School © {new Date().getFullYear()}</p>
      </motion.div>
    </div>
  )
}
