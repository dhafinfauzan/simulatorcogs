import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

/**
 * StatusBadge — feasibility indicator with icon + color + label
 * Per PRD: color is not the only indicator; label + icon required.
 *
 * @param {string} feasibility - 'layak' | 'tidak_layak'
 * @param {string} reason - explanation text
 * @param {string} bepLabel - BEP display text
 */
export function StatusBadge({ feasibility, reason, bepLabel, size = 'default' }) {
  const isLayak = feasibility === 'layak'

  const config = isLayak
    ? {
        icon: CheckCircle2,
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        iconColor: 'text-emerald-500',
        label: 'Feasible'
      }
    : {
        icon: XCircle,
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        iconColor: 'text-red-500',
        label: 'Not Financially Feasible'
      }

  const Icon = config.icon
  const padding = size === 'large' ? 'px-5 py-4' : 'px-3.5 py-2.5'

  return (
    <div className={`inline-flex items-center gap-2.5 ${padding} ${config.bg} border ${config.border} rounded-lg`}>
      <Icon className={`${config.iconColor} ${size === 'large' ? 'w-6 h-6' : 'w-5 h-5'}`} strokeWidth={2.2} />
      <div className="leading-tight">
        <div className={`font-bold ${config.text} ${size === 'large' ? 'text-base' : 'text-sm'}`}>
          {config.label}
        </div>
        {reason && size === 'large' && (
          <div className="text-xs text-slate-500 mt-0.5 max-w-md">{reason}</div>
        )}
      </div>
    </div>
  )
}

/**
 * BEPCard — large prominent BEP display card
 */
export function BEPCard({ feasibility, bepLabel, reason }) {
  const isLayak = feasibility === 'layak'
  const Icon = isLayak ? CheckCircle2 : (bepLabel === 'Not Reached' ? AlertTriangle : XCircle)

  return (
    <div className={`card p-6 ${isLayak ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30'}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Break Even Point
          </div>
          <div className={`text-3xl font-extrabold ${isLayak ? 'text-emerald-600' : 'text-red-600'}`}>
            {bepLabel}
          </div>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center
          ${isLayak ? 'bg-emerald-100' : 'bg-red-100'}`}>
          <Icon className={`w-7 h-7 ${isLayak ? 'text-emerald-600' : 'text-red-600'}`} strokeWidth={2.2} />
        </div>
      </div>
      {reason && (
        <p className="mt-4 text-sm text-slate-600 leading-relaxed">{reason}</p>
      )}
    </div>
  )
}
