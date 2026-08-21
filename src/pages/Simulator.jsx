import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Calculator, RotateCcw, AlertCircle, TrendingUp, TrendingDown,
  DollarSign, Wallet, Percent, Users, Zap, ChevronDown, ListFilter, Lock
} from 'lucide-react'
import { api } from '../api/client.js'
import { StatusBadge, BEPCard } from '../components/StatusBadge.jsx'

function fmtRp(n) {
  if (n === null || n === undefined || isNaN(n)) return '—'
  return 'Rp' + Math.round(n).toLocaleString('id-ID')
}

function fmtPct(n) {
  if (n === null || n === undefined || isNaN(n)) return '—'
  return (Math.round(n * 100) / 100).toLocaleString('id-ID') + '%'
}

const SCHEMES = [
  { value: 'otc', label: 'OTC' },
  { value: 'mrc', label: 'MRC' }
]

export default function Simulator() {
  const [devices, setDevices] = useState([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [scheme, setScheme] = useState('otc')

  const [totalUnit, setTotalUnit] = useState(100)
  const [programPeriod, setProgramPeriod] = useState(12)
  const [cogs, setCogs] = useState(0)
  const [otcPrice, setOtcPrice] = useState(0)
  const [dailyFee, setDailyFee] = useState(0)
  const [dailyIncentive, setDailyIncentive] = useState(0)
  const [activeDays, setActiveDays] = useState(22)
  const [activeRate, setActiveRate] = useState(50)

  const [result, setResult] = useState(null)
  const [errors, setErrors] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasCalculated, setHasCalculated] = useState(false)

  useEffect(() => {
    api.getDevices({ status: 'active' }).then(setDevices).catch(() => {})
  }, [])

  const selectedDevice = devices.find(d => String(d.id) === String(selectedDeviceId))

  // COGS follows scheme: OTC → cash COGS, MRC → credit COGS
  useEffect(() => {
    if (!selectedDevice) return
    setCogs(scheme === 'mrc' ? selectedDevice.cogs_mrc : selectedDevice.cogs)
  }, [scheme, selectedDeviceId, devices])

  function selectDevice(id) {
    setSelectedDeviceId(id)
    const d = devices.find(d => String(d.id) === String(id))
    if (!d) {
      setCogs(0)
      return
    }
    setCogs(scheme === 'mrc' ? d.cogs_mrc : d.cogs)
    setOtcPrice(d.default_otc_price)
    setDailyFee(d.default_daily_fee)
    setDailyIncentive(d.default_daily_incentive)
    setActiveDays(d.default_active_days)
    setActiveRate(d.default_active_rate)
    setProgramPeriod(d.default_program_period === 24 ? 24 : 12)
  }

  function resetForm() {
    setSelectedDeviceId('')
    setTotalUnit(100)
    setProgramPeriod(12)
    setCogs(0)
    setOtcPrice(0)
    setDailyFee(0)
    setDailyIncentive(0)
    setActiveDays(22)
    setActiveRate(50)
    setResult(null)
    setErrors([])
    setHasCalculated(false)
  }

  const calculate = useCallback(async () => {
    setErrors([])
    setLoading(true)
    try {
      const res = await api.calculate({
        scheme,
        totalUnit: Number(totalUnit),
        programPeriod: Number(programPeriod),
        cogs: Number(cogs),
        otcPrice: Number(otcPrice),
        dailyFee: Number(dailyFee),
        dailyIncentive: Number(dailyIncentive),
        activeDays: Number(activeDays),
        activeRate: Number(activeRate)
      })
      setResult(res)
      setHasCalculated(true)
    } catch (err) {
      if (err.message.includes(',')) {
        setErrors(err.message.split(', ').filter(Boolean))
      } else {
        setErrors([err.message])
      }
    } finally {
      setLoading(false)
    }
  }, [scheme, totalUnit, programPeriod, cogs, otcPrice, dailyFee, dailyIncentive, activeDays, activeRate])

  const calcTimer = useRef(null)
  useEffect(() => {
    if (!hasCalculated) return
    clearTimeout(calcTimer.current)
    calcTimer.current = setTimeout(() => calculate(), 400)
    return () => clearTimeout(calcTimer.current)
  }, [scheme, totalUnit, programPeriod, cogs, otcPrice, dailyFee, dailyIncentive, activeDays, activeRate, hasCalculated, calculate])

  const showOtc = scheme === 'otc'
  const showMrc = scheme === 'mrc'

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">APP MODEL Simulator</h1>
        <p className="text-sm text-slate-500 mt-1">Select device & scheme to calculate business feasibility</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* INPUT PANEL */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-brand-600" />
              Scenario Input
            </h2>

            <div className="mb-5">
              <label className="input-label">Device Model</label>
              <div className="relative">
                <select
                  value={selectedDeviceId}
                  onChange={e => selectDevice(e.target.value)}
                  className="input-field appearance-none pr-9 cursor-pointer"
                >
                  <option value="">— Select Device —</option>
                  {devices.map(d => (
                    <option key={d.id} value={d.id}>{d.device_id} — {d.device_name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="mb-5">
              <label className="input-label">Scheme</label>
              <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
                {SCHEMES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setScheme(s.value)}
                    className={`segment-btn ${scheme === s.value ? 'segment-btn-active' : ''}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="input-label">Total Unit</label>
                <input type="number" min="1" value={totalUnit} onChange={e => setTotalUnit(e.target.value)} className="input-field" />
              </div>
            </div>

            {/* COGS — locked, scheme-dependent */}
            <div className="mb-5">
              <label className="input-label flex items-center gap-1.5">
                COGS per Unit {scheme === 'mrc' ? '(Credit Scheme)' : '(Cash Scheme)'}
                <Lock className="w-3 h-3 text-slate-400" />
              </label>
              <input
                type="text"
                value={cogs ? fmtRp(cogs) : '—'}
                readOnly
                className="input-field font-mono bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Locked from Device Master — {scheme === 'mrc' ? 'credit scheme COGS (incl. data package & marketing)' : 'cash scheme COGS'}
              </p>
            </div>

            {/* OTC */}
            {showOtc && (
              <div className="mb-5 pb-5 border-b border-slate-100">
                <h3 className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-3">OTC Input</h3>
                <div>
                  <label className="input-label">OTC Price per Device (Rp)</label>
                  <input type="number" min="0" value={otcPrice} onChange={e => setOtcPrice(e.target.value)} className="input-field font-mono" />
                </div>
              </div>
            )}

            {/* MRC */}
            {showMrc && (
              <div className="mb-5">
                <h3 className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-3">MRC Input</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="input-label">Program Period</label>
                    <select value={programPeriod} onChange={e => setProgramPeriod(Number(e.target.value))} className="input-field cursor-pointer">
                      <option value={12}>12 months</option>
                      <option value={24}>24 months</option>
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Daily Fee (Rp)</label>
                    <input type="number" min="0" value={dailyFee} onChange={e => setDailyFee(e.target.value)} className="input-field font-mono" />
                  </div>
                  <div>
                    <label className="input-label">Daily Incentive (Rp)</label>
                    <input type="number" min="0" value={dailyIncentive} onChange={e => setDailyIncentive(e.target.value)} className="input-field font-mono" />
                  </div>
                  <div>
                    <label className="input-label">Active Days/month</label>
                    <input type="number" min="1" max="31" value={activeDays} onChange={e => setActiveDays(e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="input-label">Active Rate (%)</label>
                    <input type="number" min="0" max="100" value={activeRate} onChange={e => setActiveRate(e.target.value)} className="input-field" />
                  </div>
                </div>
                {Number(dailyIncentive) > Number(dailyFee) && Number(dailyFee) > 0 && (
                  <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span className="text-xs text-amber-700">Daily incentive exceeds daily fee — please verify.</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={calculate} disabled={loading} className="btn-primary flex-1 justify-center">
                {loading ? 'Calculating…' : 'Calculate'}
              </button>
              <button onClick={resetForm} className="btn-secondary">
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            </div>

            {errors.length > 0 && (
              <div className="mt-4 space-y-1.5">
                {errors.map((err, i) => (
                  <div key={i} className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    <span className="text-xs text-red-700">{err}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RESULTS PANEL */}
        <div className="lg:col-span-3 space-y-5">
          {!hasCalculated || !result ? (
            <div className="card p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <Calculator className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-slate-400 font-semibold text-sm">Simulation results will appear here</h3>
              <p className="text-slate-400 text-xs mt-1.5 max-w-xs">Select a device, configure the scenario, then click Calculate to view feasibility results.</p>
            </div>
          ) : (
            <>
              <BEPCard
                feasibility={result.feasibility}
                bepLabel={result.bepLabel}
                reason={result.feasibilityReason}
              />

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard icon={DollarSign} label="Total Revenue" value={fmtRp(result.totalRevenue)} color="brand" />
                <StatCard icon={Wallet} label="Total Cost" value={fmtRp(result.totalCost)} color="slate" />
                <StatCard
                  icon={result.totalMargin >= 0 ? TrendingUp : TrendingDown}
                  label="Total Margin"
                  value={fmtRp(result.totalMargin)}
                  color={result.totalMargin >= 0 ? 'emerald' : 'red'}
                />
                <StatCard
                  icon={Percent}
                  label="Margin per Device"
                  value={fmtRp(result.marginPerDevice)}
                  color={result.marginPerDevice >= 0 ? 'emerald' : 'red'}
                />
                {showMrc && (
                  <>
                    <StatCard icon={Zap} label="Gross MRC / month" value={fmtRp(result.grossMRC)} color="brand" sublabel="per active device" />
                    <StatCard icon={TrendingUp} label="Net MRC / month" value={fmtRp(result.netMRC)} color="emerald" sublabel="per active device" />
                    <StatCard
                      icon={Users}
                      label="Avg Active Units"
                      value={result.avgActiveUnits !== null ? Math.round(result.avgActiveUnits).toLocaleString('id-ID') : '—'}
                      color="slate"
                      sublabel={`from ${totalUnit} units`}
                    />
                  </>
                )}
                {result.marginPct !== null && (
                  <StatCard
                    icon={Percent}
                    label="Margin %"
                    value={fmtPct(result.marginPct)}
                    color={result.marginPct >= 0 ? 'emerald' : 'red'}
                    sublabel="against cost"
                  />
                )}
              </div>

              <div className="card p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <ListFilter className="w-4 h-4 text-brand-600" />
                  Calculation Breakdown
                </h3>
                <div className="space-y-2.5">
                  {result.breakdown.map((step, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center text-[11px] font-bold text-slate-500 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-slate-600 font-mono leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Feasibility Status</div>
                  <StatusBadge
                    feasibility={result.feasibility}
                    bepLabel={result.bepLabel}
                    reason={result.feasibilityReason}
                  />
                </div>
                <div className="sm:text-right">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Scheme</div>
                  <span className="text-sm font-bold text-slate-900">{SCHEMES.find(s => s.value === result.scheme)?.label}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color = 'slate', sublabel }) {
  const colors = {
    brand: { bg: 'bg-brand-50', icon: 'text-brand-600', ring: 'ring-brand-100' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'ring-emerald-100' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', ring: 'ring-red-100' },
    slate: { bg: 'bg-slate-100', icon: 'text-slate-500', ring: 'ring-slate-200' }
  }
  const c = colors[color] || colors.slate

  return (
    <div className="card p-4 hover:shadow-card-hover transition-shadow duration-200">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={`w-7 h-7 ${c.bg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${c.icon}`} strokeWidth={2.2} />
        </div>
      </div>
      <div className={`text-lg font-bold ${c.icon} font-mono tracking-tight`}>
        {value}
      </div>
      {sublabel && <div className="text-[11px] text-slate-400 mt-0.5">{sublabel}</div>}
    </div>
  )
}
