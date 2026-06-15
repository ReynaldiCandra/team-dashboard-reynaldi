'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, RefreshCw, AlertCircle, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import { useAuthActions } from '@/hooks/use-auth'

const ROLES = ['Pendiri', 'Deputi', 'Head Manager', 'Manager', 'Staff']
const ROLE_COLORS: Record<string, string> = {
  Pendiri:       'bg-purple-100 text-purple-700 border-purple-200',
  Deputi:        'bg-blue-100 text-blue-700 border-blue-200',
  'Head Manager':'bg-indigo-100 text-indigo-700 border-indigo-200',
  Manager:       'bg-teal-100 text-teal-700 border-teal-200',
  Staff:         'bg-slate-100 text-slate-600 border-slate-200',
}

export default function LoginPage() {
  const { signInWithPassword } = useAuthActions()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleLogin = async () => {
    if (!email || !password) { setError('Email dan password wajib diisi'); return }
    setLoading(true); setError('')
    const { error } = await signInWithPassword(email, password)
    if (error) {
      setError('Email atau password salah. Periksa kembali.')
      setLoading(false)
    } else {
      window.location.href = '/dashboard'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/60 to-indigo-100/80 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Soft background blobs */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-100/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-sm"
      >
        {/* Logo & Title */}
        <div className="text-center mb-7">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="w-20 h-20 rounded-full border-4 border-white shadow-xl shadow-blue-200/60 overflow-hidden bg-white">
              <Image
                src="/logo-alexandria.jpeg"
                alt="Alexandria"
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
              <Zap size={10} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Alexandria Dashboard
          </h1>
          <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mt-1">
            Marketing System
          </p>
          <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full">
            <Zap size={10} className="text-blue-500" />
            <span className="text-xs text-blue-600 font-medium">Alexandria Islamic School</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/80 border border-white p-6">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2"
              >
                <AlertCircle size={13} /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="nama@alexandria.sch.id"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading
                ? <><RefreshCw size={15} className="animate-spin" /> Masuk...</>
                : <><Zap size={15} /> Masuk Sekarang</>
              }
            </button>
          </div>

          {/* Role badges */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase text-center mb-2.5">
              Akses Berdasarkan Role
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {ROLES.map(r => (
                <span
                  key={r}
                  className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${ROLE_COLORS[r]}`}
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-center gap-2.5">
          <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-white shadow-sm">
            <Image
              src="/reynaldi.jpeg"
              alt="Reynaldi"
              width={28}
              height={28}
              className="object-cover w-full h-full"
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">Reynaldi Candra Webdev</p>
            <p className="text-[10px] text-slate-400">© {new Date().getFullYear()} Alexandria Islamic School</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
