'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Plus, Copy, X, DollarSign, Users, Award } from 'lucide-react'
import { useClosings } from '@/hooks/use-closings'
import { useLeads } from '@/hooks/use-leads'

const fmtRp = (n: number) => `Rp ${(n / 1000000).toFixed(1)}jt`

interface CurrentUser {
  id: string
  name: string
  role: string
  team: string
}

export default function ClosingPage({ dark, currentUser }: { dark: boolean; currentUser: CurrentUser }) {
  const isHeadRole = ['head_manager', 'deputi', 'owner'].includes(currentUser.role)
  const isManagerRole = currentUser.role === 'manager'
  const teamFilter = isHeadRole ? undefined : currentUser.team
  const staffFilter = (!isHeadRole && !isManagerRole) ? currentUser.id : undefined

  const { closings, loading, addClosing, totalKomisiStaff, totalKomisiManager } = useClosings(teamFilter, staffFilter)
  const { leads } = useLeads(
    isHeadRole ? undefined : isManagerRole ? undefined : currentUser.id,
    isManagerRole ? currentUser.team : undefined
  )

  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [waText, setWaText] = useState('')
  const [showWA, setShowWA] = useState(false)
  const [form, setForm] = useState({
    leadId: '',
    studentName: '',
    studentType: 'full_day' as 'full_day' | 'boarding',
    area: '',
    uangPangkal: 40000000,
    diskon: false,
    closedBy: (isManagerRole ? 'manager' : 'staff') as 'staff' | 'manager',
  })

  const nominalBayar = form.diskon ? form.uangPangkal * 0.5 : form.uangPangkal
  const komisiStaff = form.closedBy === 'staff' ? Math.round(nominalBayar * 0.15) : 0
  const komisiManager = form.closedBy === 'staff' ? Math.round(nominalBayar * 0.025) : Math.round(nominalBayar * 0.15)
  const hotLeads = leads.filter(l => ['HOT', 'WARM'].includes(l.leadCategory ?? '') && l.status !== 'enrolled')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleLeadSelect = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId)
    if (lead) setForm(p => ({ ...p, leadId, studentName: lead.childName, area: lead.parentArea ?? '' }))
  }

  const handleSubmit = async () => {
    if (!form.studentName || !form.area) { showToast('Nama siswa dan daerah wajib diisi'); return }
    if (nominalBayar < 5500000) { showToast('Minimal pembayaran Rp 5,5jt'); return }
    setSaving(true)
    const { error, waText: wa } = await addClosing({
      leadId: form.leadId || undefined,
      staffId: currentUser.id,
      staffName: currentUser.name,
      managerId: isManagerRole ? currentUser.id : undefined,
      managerName: isManagerRole ? currentUser.name : undefined,
      team: currentUser.team,
      studentName: form.studentName,
      studentType: form.studentType,
      area: form.area,
      uangPangkal: form.uangPangkal,
      diskon: form.diskon,
      nominalBayar,
      closedBy: form.closedBy,
    })
    setSaving(false)
    if (error) { showToast('Gagal: ' + error.message); return }
    setWaText(wa ?? '')
    setShowForm(false)
    setShowWA(true)
    setForm({ leadId: '', studentName: '', studentType: 'full_day', area: '', uangPangkal: 40000000, diskon: false, closedBy: isManagerRole ? 'manager' : 'staff' })
    showToast('Closing berhasil dicatat!')
  }

  const tx = dark ? 'text-slate-100' : 'text-slate-800'
  const mu = dark ? 'text-slate-400' : 'text-slate-500'
  const ca = dark ? 'bg-[#111d35] border-[#1e2d4a]' : 'bg-white border-slate-200'
  const ip = dark ? 'bg-[#0a1020] border-[#1e2d4a] text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-4 right-4 z-50 px-4 py-3 bg-[#111d35] border border-[#1e2d4a] rounded-xl text-white text-sm shadow-2xl">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div>
          <h2 className={"font-bold text-lg " + tx}>Closing</h2>
          <p className={"text-xs " + mu}>{isHeadRole ? 'Semua tim A-H' : 'Tim ' + currentUser.team} · {closings.length} closing</p>
        </div>
        {!isHeadRole && (
          <button onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white text-sm font-semibold rounded-xl flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-green-500/30">
            <Plus size={15} /> Input Closing
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Closing', value: String(closings.length), icon: CheckCircle, color: 'from-green-600 to-green-400' },
          { label: 'Total ominal', value: fmtRp(closings.reduce((s, c) => s + c.nominalBayar, 0)), icon: DollarSign, color: 'from-blue-600 to-blue-400' },
          { label: 'Komisi Staff', value: fmtRp(totalKomisiStaff), icon: Users, color: 'from-purple-600 to-purple-400' },
          { label: 'Komisi Manager', value: fmtRp(totalKomisiManager), icon: Award, color: 'from-orange-600 to-orange-400' },
        ].map(s => (
          <div key={s.label} className={"border rounded-2xl p-4 flex items-center gap-3 " + ca}>
            <div className={"w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 " + s.color}>
              <s.icon size={16} className="text-white" />
            </div>
            <div>
              <p className={"text-lg font-bold " + tx}>{s.value}</p>
              <p className={"text-xs " + mu}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={"border rounded-2xl overflow-hidden " + ca}>
        <div className={"p-5 border-b " + (dark ? 'border-[#1e2d4a]' : 'border-slate-200')}>
          <h3 className={"font-bold " + tx}>Riwayat Closing</h3>
        </div>
        {loading ? (
          <div className={"text-center py-12 " + mu}>Memuat...</div>
        ) : closings.length === 0 ? (
          <div className={"text-center py-12 " + mu}>
            <CheckCircle size={32} className="mx-auto mb-2 opacity-30" />
            <p>Belum ada closing</p>
          </div>
        ) : (
          <div className={"divide-y " + (dark ? 'divide-[#1e2d4a]' : 'divide-slate-100')}>
            {closings.map(c => (
              <div key={c.id} className="p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle size={16} className="text-green-400" />
                  </div>
                  <div>
                    <p className={"font-semibold text-sm " + tx}>{c.studentName}</p>
                    <p className={"text-xs " + mu}>{c.studentType === 'full_day' ? 'Full Day' : 'Boarding'} · {c.area}</p>
                    <p className={"text-xs " + mu}>{c.staffName} · Tim {c.team}</p>
                    <p className="text-xs text-green-400 font-medium mt-0.5">{fmtRp(c.nominalBayar)}{c.diskon ? ' (diskon 50%)' : ''}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={"text-xs " + mu}>{new Date(c.createdAt).toLocaleDateString('id-ID')}</p>
                  {c.komisiStaff > 0 && <p className="text-xs text-purple-400">{fmtRp(c.komisiStaff)}</p>}
                  <button onClick={() => { setWaText(c.waText ?? ''); setShowWA(true) }}
                    className="mt-1 text-xs text-blue-400 hover:underline flex items-center gap-1">
                    <Copy size={10} /> WA
                  </button>
              </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className={"w-full max-w-md rounded-2xl border shadow-2xl overflow-y-auto max-h-[90vh] " + ca}>
              <div className={"sticky top-0 px-6 pt-6 pb-4 border-b flex items-center justify-between " + (dark ? 'bg-[#111d35] border-[#1e2d4a]' : 'bg-white border-slate-200')}>
                <h3 className={"font-bold " + tx}>Input Closing Baru</h3>
                <button onClick={() => setShowForm(false)} className={"w-7 h-7 rounded-lg flex items-center justify-center " + (dark ? 'bg-[#1e2d4a] text-slate-400' : 'bg-slate-100 text-slate-500')}>
                  <X size={14} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {hotLeads.length > 0 && (
                  <div>
                    <label className={"block text-xs font-semibold mb-1 " + mu}>Pilih dari Leads HOT/WARM</label>
                    <select value={form.leadId} onChange={e => handleLeadSelect(e.target.value)}
                      className={"w-full px-3 py-2 rounded-xl border text-sm outline-none " + ip}>
                      <option value="">-- Pilih lead atau isi manual --</option>
                      {hotLeads.map(l => (
                        <option key={l.id} value={l.id}>{l.childName} - {l.leadCategory}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className={"block text-xs font-semibold mb-1 " + mu}>Nama Siswa *</label>
                  <input value={form.studentName} onChange={e => setForm(p => ({ ...p, studentName: e.target.value }))}
                    placeholder="Nama lengkap siswa"
                    className={"w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-green-500/40 " + ip} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={"block text-xs font-semibold mb-1 " + mu}>Program *</label>
                    <select value={form.studentType} onChange={e => setForm(p => ({ ...p, studentType: e.target.value as 'full_day' | 'boarding' }))}
                      className={"w-full px-3 py-2 rounded-xl border text-sm outline-none " + ip}>
                      <option value="full_day">Full Day</option>
                      <option value="boarding">Boarding</option>
                    </select>
                  </div>
                  <div>
                    <label className={"block text-xs font-semibold mb-1 " + mu}>Daerah *</label>
                    <input value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))}
                      placeholder="Kota/Kabupaten"
                      className={"w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-green-500/40 " + ip} />
                  </div>
                </div>
                <div>
                  <label className={"block text-xs font-semibold mb-1 " + mu}>Uang Pangkal</label>
                  <div className="flex gap-2">
                    {[40000000, 20000000, 10000000].map(n => (
                      <button key={n} onClick={() => setForm(p => ({ ...p, uangPangkal: n, diskon: n !== 40000000 }))}
                        className={"flex-1 py-2 rounded-xl text-xs font-semibold border transition-all " + (form.uangPangkal === n ? 'bg-green-600 text-white border-green-600' : (dark ? 'border-[#1e2d4a] text-slate-400' : 'border-slate-200 text-slate-500'))}>
                        {fmtRp(n)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={"block text-xs font-semibold mb-1 " + mu}>Closing oleh</label>
                  <div className="flex gap-2">
                    {(['staff', 'manager'] as const).map(v => (
                      <button key={v} onClick={() => setForm(p => ({ ...p, closedBy: v }))}
                        className={"flex-1 py-2 rounded-xl text-xs font-semibold border transition-all " + (form.closedBy === v ? 'bg-blue-600 text-white border-blue-600' : (dark ? 'border-[#1e2d4a] text-slate-400' : 'border-slate-200 text-slate-500'))}>
                        {v === 'staff' ? 'Staff' : 'Manager'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={"rounded-xl p-3 space-y-1 " + (dark ? 'bg-[#0a1020]' : 'bg-slate-50')}>
                  <p className={"text-xs font-semibold " + tx}>Preview Komisi</p>
                  <p className={"text-xs " + mu}>Nominal: <span className="text-green-400 font-semibold">{fmtRp(nominalBayar)}</span></p>
                  {form.closedBy === 'staff' && <p className={"text-xs " + mu}>Komisi Staff 15%: <span className="text-purple-400 font-semibold">{fmtRp(komisiStaff)}</span></p>}
                  <p className={"text-xs " + mu}>Komisi Manager {form.closedBy === 'staff' ? '2.5%' : '15%'}: <span className="text-orange-400 font-semibold">{fmtRp(komisiManager)}</span></p>
                </div>
                <button onClick={handleSubmit} disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold rounded-xl shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-60">
                  {saving ? 'Menyimpan...' : 'Konfirmasi Closing'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWA && waText && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className={"w-full max-w-md rounded-2xl border shadow-2xl " + ca}>
              <div className={"px-6 pt-6 pb-4 border-b flex items-center justify-between " + (dark ? 'border-[#1e2d4a]' : 'border-slate-200')}>
                <h3 className={"font-bold " + tx}>Broadcast WhatsApp</h3>
                <button onClick={() => setShowWA(false)} className={"w-7 h-7 rounded-lg flex items-center justify-center " + (dark ? 'bg-[#1e2d4a] text-slate-400' : 'bg-slate-100 text-slate-500')}>
                  <X size={14} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className={"rounded-xl p-4 text-sm whitespace-pre-line " + (dark ? 'bg-[#0a1020] text-slate-300' : 'bg-slate-50 text-slate-700')}>
                  {waText}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { navigator.clipboard.writeText(waText); showToast('Teks WA disalin!') }}
                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                    <Copy size={14} /> Salin
                  </button>
                  <button onClick={() => window.open('https://wa.me/?text=' + encodeURIComponent(waText), '_blank')}
                    className="flex-1 py-2.5 bg-[#25D366] text-white rounded-xl text-sm font-semibold transition-colors">
                    Buka WA
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
