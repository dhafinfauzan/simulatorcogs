import { useState, useEffect, useRef } from 'react'
import { Settings as SettingsIcon, DollarSign, Check, AlertCircle } from 'lucide-react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Settings() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [usdRate, setUsdRate] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const saveTimer = useRef(null)

  useEffect(() => {
    api.getSettings().then(s => {
      setUsdRate(s.usd_rate || '16000')
      setLoading(false)
    }).catch(() => {
      setError('Gagal memuat settings.')
      setLoading(false)
    })
  }, [])

  function handleChange(v) {
    setUsdRate(v)
    setSaved(false)
    setError('')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const n = Number(v)
      if (!v || isNaN(n) || n <= 0) {
        setError('Kurs harus angka lebih dari 0.')
        return
      }
      try {
        await api.updateSettings({ usd_rate: String(n) })
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } catch (err) {
        setError(err.message || 'Gagal menyimpan. Pastikan login sebagai admin.')
      }
    }, 800)
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Konfigurasi global aplikasi</p>
      </div>

      <div className="card p-6">
        <h2 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
          <SettingsIcon className="w-4 h-4 text-brand-600" />
          Currency
        </h2>

        <div>
          <label className="input-label flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            USD Rate (1 USD = ? Rp)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-mono">Rp</span>
            <input
              type="number"
              min="1"
              step="any"
              disabled={loading}
              value={usdRate}
              onChange={e => handleChange(e.target.value)}
              className="input-field font-mono pl-10"
              placeholder="16000"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Kurs ini dipakai Simulator saat menampilkan nilai dalam USD. Tersimpan otomatis (debounce 800ms).
          </p>

          {saved && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
              <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span className="text-xs text-emerald-700 font-medium">Tersimpan.</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <span className="text-xs text-red-700">{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
