import { useState, useEffect, useCallback } from 'react'
import {
  Cpu, Plus, Search, Pencil, Trash2, Power, X, AlertCircle, Check
} from 'lucide-react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

function fmtRp(n) {
  if (n === null || n === undefined) return '—'
  return 'Rp' + Math.round(n).toLocaleString('id-ID')
}

function fmtUsd(n) {
  if (n === null || n === undefined || isNaN(n)) return '—'
  return '$' + (Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function DeviceManagement() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingDevice, setEditingDevice] = useState(null)
  const [toast, setToast] = useState(null)

  const loadDevices = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getDevices({ status: statusFilter, search })
      setDevices(data)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    const timer = setTimeout(loadDevices, 200)
    return () => clearTimeout(timer)
  }, [loadDevices])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function handleAdd() {
    setEditingDevice(null)
    setShowModal(true)
  }

  function handleEdit(device) {
    setEditingDevice(device)
    setShowModal(true)
  }

  async function handleToggle(id) {
    try {
      const result = await api.toggleDevice(id)
      showToast(result.message)
      loadDevices()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete device "${name}"? This action cannot be undone.`)) return
    try {
      await api.deleteDevice(id)
      showToast('Device deleted.')
      loadDevices()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Device Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage device models for the simulator</p>
        </div>
        {isAdmin && (
          <button onClick={handleAdd} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Device
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search devices…"
            className="input-field pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Device ID</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Name</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Status</th>
              <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">COGS</th>
              <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">OTC Price</th>
              <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Daily Fee</th>
              {isAdmin && <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="px-5 py-12 text-center text-slate-400 text-sm">
                  Loading…
                </td>
              </tr>
            ) : devices.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="px-5 py-12 text-center">
                  <Cpu className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No devices yet. {isAdmin && 'Click "Add Device" to add one.'}</p>
                </td>
              </tr>
            ) : (
              devices.map(d => (
                <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-sm font-semibold text-slate-700">{d.device_id}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-900 font-medium">{d.device_name}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold
                      ${d.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${d.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {d.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm text-slate-600 font-mono">{fmtUsd(d.cogs)}</td>
                  <td className="px-5 py-3.5 text-right text-sm text-slate-600 font-mono">{fmtRp(d.default_otc_price)}</td>
                  <td className="px-5 py-3.5 text-right text-sm text-slate-600 font-mono">{fmtRp(d.default_daily_fee)}</td>
                  {isAdmin && (
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(d)} className="btn-ghost !px-2 !py-1.5" title="Edit">
                          <Pencil className="w-4 h-4 text-slate-500" />
                        </button>
                        <button onClick={() => handleToggle(d.id)} className="btn-ghost !px-2 !py-1.5" title="Activate/Deactivate">
                          <Power className={`w-4 h-4 ${d.status === 'Active' ? 'text-emerald-500' : 'text-slate-400'}`} />
                        </button>
                        <button onClick={() => handleDelete(d.id, d.device_name)} className="btn-ghost !px-2 !py-1.5" title="Delete">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {showModal && (
        <DeviceModal
          device={editingDevice}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false)
            showToast(editingDevice ? 'Device updated.' : 'Device added.')
            loadDevices()
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white text-sm font-medium rounded-xl shadow-xl">
          {toast.type === 'error'
            ? <AlertCircle className="w-4 h-4 text-red-400" />
            : <Check className="w-4 h-4 text-emerald-400" />
          }
          {toast.msg}
        </div>
      )}
    </div>
  )
}

function DeviceModal({ device, onClose, onSaved }) {
  const isEdit = !!device
  const [form, setForm] = useState({
    device_id: device?.device_id || '',
    device_name: device?.device_name || '',
    status: device?.status || 'Active',
    cogs: device?.cogs || 0,
    cogs_mrc: device?.cogs_mrc ?? device?.cogs ?? 0,
    otc_enabled: device?.otc_enabled ?? 1,
    default_otc_price: device?.default_otc_price || 0,
    mrc_enabled: device?.mrc_enabled ?? 1,
    default_daily_fee: device?.default_daily_fee || 0,
    default_daily_incentive: device?.default_daily_incentive || 0,
    default_setup_fee: device?.default_setup_fee || 0,
    default_active_days: device?.default_active_days || 22,
    default_active_rate: device?.default_active_rate || 50,
    default_program_period: device?.default_program_period || 12
  })
  const [tiers, setTiers] = useState(
    Array.isArray(device?.price_tiers) ? device.price_tiers : []
  )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function updateTier(i, field, value) {
    setTiers(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t))
  }

  function addTier() {
    setTiers(prev => [...prev, { min_qty: '', price: '' }])
  }

  function removeTier(i) {
    setTiers(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    // validasi tier
    const cleanTiers = []
    for (const t of tiers) {
      const q = Number(t.min_qty), p = Number(t.price)
      if (!t.min_qty || !t.price || isNaN(q) || isNaN(p) || q < 1 || p < 0) {
        setError('Setiap tier butuh Min Qty (≥1) dan Price (≥0) yang valid.')
        return
      }
      cleanTiers.push({ min_qty: q, price: p })
    }
    setSaving(true)
    try {
      const payload = { ...form, price_tiers: cleanTiers }
      if (isEdit) {
        await api.updateDevice(device.id, payload)
      } else {
        await api.createDevice(payload)
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-slate-900">
            {isEdit ? 'Edit Device' : 'Add Device'}
          </h2>
          <button onClick={onClose} className="btn-ghost !p-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Device ID</label>
                <input value={form.device_id} onChange={e => update('device_id', e.target.value)} className="input-field font-mono" placeholder="e.g: QS5M" required />
              </div>
              <div>
                <label className="input-label">Device Name</label>
                <input value={form.device_name} onChange={e => update('device_name', e.target.value)} className="input-field" placeholder="e.g: Soundbox QS5M" required />
              </div>
              <div>
                <label className="input-label">Status</label>
                <select value={form.status} onChange={e => update('status', e.target.value)} className="input-field">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="input-label">COGS — Cash/OTC (USD)</label>
                <input type="number" min="0" step="any" value={form.cogs} onChange={e => update('cogs', e.target.value === '' ? 0 : Number(e.target.value))} className="input-field" required />
              </div>
              <div>
                <label className="input-label">COGS — Credit/MRC (USD)</label>
                <input type="number" min="0" step="any" value={form.cogs_mrc ?? form.cogs} onChange={e => update('cogs_mrc', e.target.value === '' ? 0 : Number(e.target.value))} className="input-field" required />
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Volume Price Tiers (USD)</h3>
              <button type="button" onClick={addTier} className="btn-ghost !px-2 !py-1 text-xs font-semibold text-brand-600 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add Tier
              </button>
            </div>
            {tiers.length === 0 ? (
              <p className="text-xs text-slate-400">Belum ada tier — COGS dasar dipakai untuk semua jumlah pembelian.</p>
            ) : (
              <div className="space-y-2">
                {tiers.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 whitespace-nowrap">Beli ≥</span>
                    <input
                      type="number" min="1" value={t.min_qty}
                      onChange={e => updateTier(i, 'min_qty', e.target.value)}
                      className="input-field !py-1.5 w-24" placeholder="24"
                    />
                    <span className="text-xs text-slate-500 whitespace-nowrap">pcs →</span>
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                      <input
                        type="number" min="0" step="any" value={t.price}
                        onChange={e => updateTier(i, 'price', e.target.value)}
                        className="input-field !py-1.5 pl-7 font-mono" placeholder="120"
                      />
                    </div>
                    <button type="button" onClick={() => removeTier(i)} className="btn-ghost !px-2 !py-1.5" title="Remove tier">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
                <p className="text-[11px] text-slate-400 mt-1">
                  Tier dgn Min Qty terbesar yang tercapai otomatis dipakai di Simulator.
                </p>
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">OTC Settings</h3>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={!!form.otc_enabled} onChange={e => update('otc_enabled', e.target.checked ? 1 : 0)} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                Enabled
              </label>
            </div>
            <div className="grid grid-cols-1">
              <div>
                <label className="input-label">Default OTC Price per Unit (Rp)</label>
                <input type="number" min="0" value={form.default_otc_price} onChange={e => update('default_otc_price', Number(e.target.value))} className="input-field" disabled={!form.otc_enabled} />
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">MRC Settings</h3>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={!!form.mrc_enabled} onChange={e => update('mrc_enabled', e.target.checked ? 1 : 0)} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                Enabled
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Default Daily Fee (Rp)</label>
                <input type="number" min="0" value={form.default_daily_fee} onChange={e => update('default_daily_fee', Number(e.target.value))} className="input-field" disabled={!form.mrc_enabled} />
              </div>
              <div>
                <label className="input-label">Daily Sales Incentive (Rp)</label>
                <input type="number" min="0" value={form.default_daily_incentive} onChange={e => update('default_daily_incentive', Number(e.target.value))} className="input-field" disabled={!form.mrc_enabled} />
              </div>
              <div>
                <label className="input-label">Active Days per Month</label>
                <input type="number" min="1" max="31" value={form.default_active_days} onChange={e => update('default_active_days', Number(e.target.value))} className="input-field" disabled={!form.mrc_enabled} />
              </div>
              <div>
                <label className="input-label">Default Setup Fee / DP (Rp)</label>
                <input type="number" min="0" value={form.default_setup_fee} onChange={e => update('default_setup_fee', Number(e.target.value))} className="input-field" placeholder="0 (Optional)" disabled={!form.mrc_enabled} />
              </div>
              <div>
                <label className="input-label">Default Program Period</label>
                <select value={form.default_program_period} onChange={e => update('default_program_period', Number(e.target.value))} className="input-field">
                  <option value={12}>12 months</option>
                  <option value={24}>24 months</option>
                </select>
              </div>
            </div>
          </section>

          {error && (
            <div className="flex items-center gap-2 px-3.5 py-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
