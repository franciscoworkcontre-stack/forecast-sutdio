/**
 * ConfigStep — general configuration step in the wizard.
 * Name, horizon, country, base orders, segments, models_active.
 */
import React from 'react'

const COUNTRIES = ['MX', 'BR', 'CO', 'AR', 'CL', 'PE', 'EC', 'UY', 'CR', 'PA', 'DO', 'GT', 'HN', 'SV', 'BO', 'PY', 'VE']

const MODEL_OPTIONS = [
  {
    id: 'A1',
    label: 'A1 — Promo Uplift',
    desc: 'Models incremental orders from promotional campaigns with fatigue decay',
    formula: 'base × uplift × fatigue[w] × penetration[segment]',
    color: 'blue',
  },
  {
    id: 'A2',
    label: 'A2 — Restaurant Acquisition',
    desc: 'Cohort-based maturation model for newly onboarded restaurants',
    formula: 'Σ_cohort restaurants × steady_state × maturation[w-c] × survival',
    color: 'emerald',
  },
  {
    id: 'A3',
    label: 'A3 — Cannibalization',
    desc: 'Subtracts cannibalized orders from acquisition (requires A2)',
    formula: 'acquisition × cannibalization_rate',
    color: 'red',
    requires: 'A2',
  },
  {
    id: 'A4',
    label: 'A4 — Seasonality',
    desc: 'Multiplicative factors: holidays × rain × pay_cycles × temperature × trend',
    formula: 'orders × pattern × holiday × rain × pay_cycle × temp × (1+trend)^w',
    color: 'amber',
  },
  {
    id: 'A5',
    label: 'A5 — City Expansion',
    desc: 'Models new city launches with ramp curves',
    formula: 'Σ_city population × penetration × orders_per_user × ramp[w - launch]',
    color: 'purple',
  },
  {
    id: 'B1',
    label: 'B1 — Unit Economics',
    desc: 'Per-order P&L: commission + delivery + ads - courier - support - tech',
    formula: 'CM = (AOV×commission + delivery_fee + ad_rev) - (courier + support + tech)',
    color: 'cyan',
  },
  {
    id: 'B2',
    label: 'B2 — Scenarios & Sensitivity',
    desc: 'Upside/downside bands + tornado chart showing input sensitivities',
    formula: 'Upside: base × 1.2 | Downside: base × 0.8 | Tornado: ±20% per variable',
    color: 'orange',
  },
  {
    id: 'C1',
    label: 'C1 — Market Share',
    desc: 'Scale forecasts by market share ramp from current → target',
    formula: 'factor[w] = (current + (target-current) × w/horizon) / current',
    color: 'pink',
  },
]

const COLOR_CLASSES = {
  blue: 'border-blue-800 bg-blue-900/20 hover:bg-blue-900/30',
  emerald: 'border-emerald-800 bg-emerald-900/20 hover:bg-emerald-900/30',
  red: 'border-red-800 bg-red-900/20 hover:bg-red-900/30',
  amber: 'border-amber-800 bg-amber-900/20 hover:bg-amber-900/30',
  purple: 'border-purple-800 bg-purple-900/20 hover:bg-purple-900/30',
  cyan: 'border-cyan-800 bg-cyan-900/20 hover:bg-cyan-900/30',
  orange: 'border-orange-800 bg-orange-900/20 hover:bg-orange-900/30',
  pink: 'border-pink-800 bg-pink-900/20 hover:bg-pink-900/30',
}

const COLOR_BADGE = {
  blue: 'text-blue-400',
  emerald: 'text-emerald-400',
  red: 'text-red-400',
  amber: 'text-amber-400',
  purple: 'text-purple-400',
  cyan: 'text-cyan-400',
  orange: 'text-orange-400',
  pink: 'text-pink-400',
}

export default function ConfigStep({ inputs, setInputs }) {
  const toggleModel = (id) => {
    const current = inputs.models_active || []
    const model = MODEL_OPTIONS.find(m => m.id === id)

    if (current.includes(id)) {
      // Remove + remove dependents
      const newActive = current.filter(m => m !== id && MODEL_OPTIONS.find(x => x.id === m)?.requires !== id)
      setInputs({ ...inputs, models_active: newActive })
    } else {
      // Add + auto-add requirement
      const newActive = [...current, id]
      if (model?.requires && !newActive.includes(model.requires)) {
        newActive.push(model.requires)
      }
      setInputs({ ...inputs, models_active: newActive })
    }
  }

  const isActive = (id) => (inputs.models_active || []).includes(id)

  return (
    <div className="space-y-6">
      {/* Basic config */}
      <div className="ds-card p-4 space-y-4">
        <div className="ds-section-header -mx-4 -mt-4 mb-4">Forecast Configuration</div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="ds-label">Forecast Name</label>
            <input
              type="text"
              value={inputs.name}
              onChange={e => setInputs({ ...inputs, name: e.target.value })}
              placeholder="e.g. Q4 2024 Promo Forecast"
              className="ds-input w-full"
            />
          </div>

          <div className="space-y-1">
            <label className="ds-label">Country</label>
            <select
              value={inputs.country}
              onChange={e => setInputs({ ...inputs, country: e.target.value })}
              className="ds-input w-full"
            >
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="ds-label">Horizon (weeks) <span className="text-gray-600">[4–52]</span></label>
            <input
              type="number"
              value={inputs.horizon_weeks}
              onChange={e => setInputs({ ...inputs, horizon_weeks: parseInt(e.target.value) || 12 })}
              min={4} max={52}
              className="ds-input w-full"
            />
          </div>

          <div className="space-y-1">
            <label className="ds-label">Base Weekly Orders <span className="text-gray-600">[float, 0–10M]</span></label>
            <input
              type="number"
              value={inputs.base_orders_weekly}
              onChange={e => setInputs({ ...inputs, base_orders_weekly: parseFloat(e.target.value) || 0 })}
              min={0} step={100}
              className="ds-input w-full"
            />
          </div>
        </div>
      </div>

      {/* Model selection */}
      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">Select Active Models</div>
        <div className="p-4 grid grid-cols-1 gap-3">
          {MODEL_OPTIONS.map(model => {
            const active = isActive(model.id)
            const baseClasses = `border rounded-lg p-3 cursor-pointer transition-all ${
              active ? COLOR_CLASSES[model.color] : 'border-gray-800 bg-gray-900/30 hover:bg-gray-800/50'
            }`

            return (
              <div
                key={model.id}
                className={baseClasses}
                onClick={() => toggleModel(model.id)}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleModel(model.id)}
                    className="mt-0.5 w-4 h-4 rounded bg-gray-800 border-gray-700"
                    onClick={e => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-mono font-semibold text-sm ${active ? COLOR_BADGE[model.color] : 'text-gray-400'}`}>
                        {model.id}
                      </span>
                      <span className={`text-sm font-medium ${active ? 'text-gray-200' : 'text-gray-500'}`}>
                        {model.label.replace(`${model.id} — `, '')}
                      </span>
                      {model.requires && (
                        <span className="text-xs text-gray-600 font-mono">requires: {model.requires}</span>
                      )}
                    </div>
                    <p className={`text-xs ${active ? 'text-gray-400' : 'text-gray-600'} mb-1.5`}>
                      {model.desc}
                    </p>
                    <code className="text-[10px] font-mono text-blue-500/70 bg-gray-950 px-2 py-0.5 rounded border border-gray-800">
                      {model.formula}
                    </code>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active models summary */}
      {(inputs.models_active || []).length > 0 && (
        <div className="ds-card p-3">
          <div className="text-xs text-gray-500 mb-2">Active models pipeline:</div>
          <div className="flex flex-wrap gap-2">
            {(inputs.models_active || []).sort().map(m => (
              <span key={m} className="ds-badge-blue font-mono">{m}</span>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-600 font-mono">
            orders[w] = {buildPipeline(inputs.models_active || [])}
          </div>
        </div>
      )}
    </div>
  )
}

function buildPipeline(models) {
  const parts = []
  if (models.length === 0) return 'base_orders'
  parts.push('base_orders')
  if (models.includes('A1')) parts.push('+ promo_uplift[w]')
  if (models.includes('A2')) parts.push('+ acquisition_orders[w]')
  if (models.includes('A3')) parts.push('- cannibalization[w]')
  if (models.includes('A5')) parts.push('+ expansion_orders[w]')

  let result = parts.join(' ')
  if (models.includes('A4')) result = `(${result}) × seasonal_factor[w]`
  if (models.includes('C1')) result = `(${result}) × market_share_factor[w]`
  return result
}
