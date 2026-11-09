import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, DollarSign, Check, AlertCircle, Save } from 'lucide-react'
import { api } from '../api/client.js'

export default function Settings() {
  const [usdRate, setUsdRate] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.getSettings().then(s => {
      setUsdRate(s.usd_rate || '18500')
      setLoading(false)
    }).catch(() => {
      setError('Gagal memuat settings.')
      setLoading(false)
    })
  }, [])

  async function handleSave() {
    setError('')
    setSaved(false)
    const n = Number(usdRate)
    if (!usdRate || isNaN(n) || n <= 0) {
      setError('Kurs harus angka lebih dari 0.')
      return
    }
    setSaving(true)
    try {
      await api.updateSettings({ usd_rate: String(n) })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message || 'Gagal menyimpan.')
    } finally {
      setSaving(false)
    }
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
              onChange={e => { setUsdRate(e.target.value); setSaved(false); setError('') }}
              className="input-field font-mono pl-10"
              placeholder="16000"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Kurs ini dipakai Simulator saat menampilkan nilai dalam USD. Klik Save untuk menyimpan.
          </p>
        </div>

        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="btn-primary gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save'}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <Check className="w-4 h-4" />
              Tersimpan!
            </span>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 mt-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
            <span className="text-xs text-red-700">{error}</span>
          </div>
        )}
      </div>
    </div>
  )
}
