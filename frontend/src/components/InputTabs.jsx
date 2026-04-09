/**
 * InputTabs — per-model input forms with JSON mode toggle, formula display, sparklines.
 */
import React, { useState } from 'react'
import FormulaDisplay from './FormulaDisplay'
import SparklinePreview, { FatigueCurvePreview } from './SparklinePreview'
import { CurveEditor } from './EditableTable'
import { getBenchmarkStatus, validateJson } from '../utils/validators'
import { fmtPctRaw, fmtOrders } from '../utils/formatters'

// ── Helper components ────────────────────────────────────────────────────────

function FieldWrapper({ label, type, tooltip, benchmarkStatus, children }) {
  const [showTip, setShowTip] = useState(false)

  let badgeClass = 'ds-badge-gray'
  let badgeText = type
  if (benchmarkStatus) {
    if (benchmarkStatus.range === 'below') badgeClass = 'ds-badge-red'
    else if (benchmarkStatus.range === 'above') badgeClass = 'ds-badge-green'
    else badgeClass = 'ds-badge-amber'
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <label className="ds-label">{label}</label>
        <span className={badgeClass}>{badgeText}</span>
        {benchmarkStatus && (
          <span className="text-gray-600 text-[10px] font-mono">
            [{benchmarkStatus.low}–{benchmarkStatus.high}]
          </span>
        )}
        {tooltip && (
          <div className="relative">
            <button
              type="button"
              className="text-gray-600 hover:text-gray-400 text-xs leading-none"
              onMouseEnter={() => setShowTip(true)}
              onMouseLeave={() => setShowTip(false)}
            >
              ?
            </button>
            {showTip && (
              <div className="ds-tooltip bottom-full left-0 mb-1 w-64">
                {tooltip}
              </div>
            )}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

function NumInput({ value, onChange, min, max, step = 0.1, placeholder }) {
  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={e => onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
      min={min} max={max} step={step}
      placeholder={placeholder}
      className="ds-input w-full"
    />
  )
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="ds-input w-full"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}

function JsonModeEditor({ value, onChange }) {
  const [text, setText] = useState(JSON.stringify(value, null, 2))
  const [err, setErr] = useState(null)

  const handleBlur = () => {
    const result = validateJson(text)
    if (result.ok) {
      setErr(null)
      onChange(result.data)
    } else {
      setErr(result.error)
    }
  }

  return (
    <div className="space-y-1">
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setErr(null) }}
        onBlur={handleBlur}
        rows={12}
        className="ds-input w-full font-mono text-xs leading-5 resize-y"
        spellCheck={false}
      />
      {err && <p className="text-red-400 text-xs font-mono">{err}</p>}
    </div>
  )
}

// ── Promo Tab ────────────────────────────────────────────────────────────────

function PromoTab({ inputs, setInputs }) {
  const [jsonMode, setJsonMode] = useState(false)
  const promos = inputs.promo_inputs || []

  const updatePromo = (idx, key, value) => {
    const updated = promos.map((p, i) => i === idx ? { ...p, [key]: value } : p)
    setInputs({ ...inputs, promo_inputs: updated })
  }

  const addPromo = () => {
    setInputs({
      ...inputs,
      promo_inputs: [...promos, {
        orders_base_weekly: inputs.base_orders_weekly || 1000,
        promo_type: 'discount_pct',
        duration_weeks: 4,
        uplift_pct: 27.5,
        target_segment: 'all',
        who_funds: 'platform',
        cofund_split: 0.5,
      }]
    })
  }

  const removePromo = (idx) => {
    setInputs({ ...inputs, promo_inputs: promos.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-4">
      <FormulaDisplay modelId="A1" collapsed={false} />

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">{promos.length} promotion(s) configured</span>
        <div className="flex gap-2">
          <button type="button" onClick={() => setJsonMode(m => !m)} className="btn-ghost text-xs">
            {jsonMode ? 'Form Mode' : 'JSON Mode'}
          </button>
          <button type="button" onClick={addPromo} className="btn-secondary text-xs">
            + Add Promo
          </button>
        </div>
      </div>

      {jsonMode ? (
        <JsonModeEditor
          value={inputs.promo_inputs}
          onChange={v => setInputs({ ...inputs, promo_inputs: v })}
        />
      ) : (
        promos.map((promo, idx) => (
          <div key={idx} className="border border-gray-800 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-900/80 border-b border-gray-800">
              <span className="text-sm font-medium text-gray-300">
                Promo #{idx + 1} — <span className="font-mono text-blue-400">{promo.promo_type}</span>
              </span>
              <button type="button" onClick={() => removePromo(idx)} className="btn-danger text-xs py-0.5 px-2">
                Remove
              </button>
            </div>

            <div className="p-4 grid grid-cols-2 gap-4">
              <FieldWrapper
                label="Base Weekly Orders"
                type="float [0–1M]"
                tooltip="Weekly order volume before promo. Used to compute absolute incremental orders."
              >
                <NumInput
                  value={promo.orders_base_weekly}
                  onChange={v => updatePromo(idx, 'orders_base_weekly', v)}
                  min={0} max={1000000} step={100}
                />
              </FieldWrapper>

              <FieldWrapper
                label="Promo Type"
                type="enum"
                tooltip="Type of promotion. Affects benchmark uplift range and cost structure."
              >
                <Select
                  value={promo.promo_type}
                  onChange={v => updatePromo(idx, 'promo_type', v)}
                  options={[
                    { value: 'discount_pct', label: 'Discount % (benchmark: 27.5%)' },
                    { value: 'discount_fixed', label: 'Discount Fixed (benchmark: 20%)' },
                    { value: 'bogo', label: 'BOGO (benchmark: 37.5%)' },
                    { value: 'free_delivery', label: 'Free Delivery (benchmark: 27.5%)' },
                    { value: 'cashback', label: 'Cashback (benchmark: 14%)' },
                    { value: 'bundle', label: 'Bundle Deal (benchmark: 18.5%)' },
                  ]}
                />
              </FieldWrapper>

              <FieldWrapper
                label="Uplift %"
                type="float [0–500]"
                tooltip="Percentage increase in orders. Default = benchmark mid for selected type."
                benchmarkStatus={getBenchmarkStatus('uplift_pct', promo.uplift_pct, promo.promo_type)}
              >
                <NumInput
                  value={promo.uplift_pct}
                  onChange={v => updatePromo(idx, 'uplift_pct', v)}
                  min={0} max={500} step={0.5}
                />
              </FieldWrapper>

              <FieldWrapper
                label="Duration (weeks)"
                type="int [1–52]"
                tooltip="Number of weeks the promotion runs before entering residual phase."
              >
                <NumInput
                  value={promo.duration_weeks}
                  onChange={v => updatePromo(idx, 'duration_weeks', Math.round(v))}
                  min={1} max={52} step={1}
                />
              </FieldWrapper>

              <FieldWrapper
                label="Target Segment"
                type="enum"
                tooltip="Determines penetration rate: all=1.0, new_users=0.15, dormant=0.20, high_value=0.20"
              >
                <Select
                  value={promo.target_segment}
                  onChange={v => updatePromo(idx, 'target_segment', v)}
                  options={[
                    { value: 'all', label: 'All Users (1.0 penetration)' },
                    { value: 'new_users', label: 'New Users (0.15 penetration)' },
                    { value: 'dormant', label: 'Dormant (0.20 penetration)' },
                    { value: 'high_value', label: 'High Value (0.20 penetration)' },
                  ]}
                />
              </FieldWrapper>

              <FieldWrapper
                label="Who Funds"
                type="enum"
                tooltip="Cost allocation: platform absorbs 100%, merchant absorbs 100%, or shared at cofund_split."
              >
                <Select
                  value={promo.who_funds}
                  onChange={v => updatePromo(idx, 'who_funds', v)}
                  options={[
                    { value: 'platform', label: 'Platform (100%)' },
                    { value: 'merchant', label: 'Merchant (100%)' },
                    { value: 'cofunded', label: 'Co-funded (split)' },
                  ]}
                />
              </FieldWrapper>

              {promo.who_funds === 'cofunded' && (
                <FieldWrapper
                  label="Platform Cofund Split"
                  type="float [0–1]"
                  tooltip="Fraction of cost borne by platform. 0.5 = 50/50."
                >
                  <NumInput
                    value={promo.cofund_split}
                    onChange={v => updatePromo(idx, 'cofund_split', v)}
                    min={0} max={1} step={0.05}
                  />
                </FieldWrapper>
              )}

              {/* Fatigue curve preview */}
              <div className="col-span-2">
                <div className="ds-label mb-1">Fatigue Curve Preview</div>
                <FatigueCurvePreview
                  fatigueCurve={promo.fatigue_curve}
                  horizon={promo.duration_weeks || 12}
                />
              </div>

              {/* Custom fatigue curve */}
              <div className="col-span-2">
                <FieldWrapper
                  label="Custom Fatigue Curve (optional)"
                  type="List[float]"
                  tooltip="Per-week multipliers [0-1]. If null, uses default {w≤2:1.0, w≤4:0.90, w≤8:0.75, w≤12:0.60}"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promo.fatigue_curve ? promo.fatigue_curve.join(', ') : ''}
                      onChange={e => {
                        const vals = e.target.value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v))
                        updatePromo(idx, 'fatigue_curve', vals.length > 0 ? vals : null)
                      }}
                      placeholder="e.g. 1.0, 0.9, 0.8, 0.6 (leave blank for default)"
                      className="ds-input flex-1 text-xs"
                    />
                    {promo.fatigue_curve && (
                      <button type="button" onClick={() => updatePromo(idx, 'fatigue_curve', null)} className="btn-ghost text-xs">
                        Reset
                      </button>
                    )}
                  </div>
                </FieldWrapper>
              </div>
            </div>
          </div>
        ))
      )}

      {promos.length === 0 && (
        <div className="text-center py-8 text-gray-600 text-sm border border-dashed border-gray-800 rounded-lg">
          No promotions configured. Click "+ Add Promo" to start.
        </div>
      )}
    </div>
  )
}

// ── Acquisition Tab ──────────────────────────────────────────────────────────

function AcquisitionTab({ inputs, setInputs }) {
  const [jsonMode, setJsonMode] = useState(false)
  const acq = inputs.acquisition_input || {
    restaurant_plan: new Array(inputs.horizon_weeks || 12).fill(0),
    restaurant_type: 'dark_kitchen_large',
    steady_state_orders: 215,
    onboarding_promo_uplift: 0.40,
    onboarding_promo_weeks: 6,
    churn_rate: 0.20,
    churn_week: 5,
    saturation_factor: 1.0,
  }

  const updateAcq = (key, value) => {
    setInputs({ ...inputs, acquisition_input: { ...acq, [key]: value } })
  }

  const updatePlan = (weekIdx, value) => {
    const plan = [...(acq.restaurant_plan || [])]
    while (plan.length <= weekIdx) plan.push(0)
    plan[weekIdx] = parseInt(value) || 0
    updateAcq('restaurant_plan', plan)
  }

  const MATURATION_CURVES = {
    dark_kitchen_large: [0.15, 0.25, 0.40, 0.55, 0.65, 0.75, 0.82, 0.88, 0.92, 0.95, 0.98, 1.0],
    dark_kitchen_small: [0.15, 0.25, 0.40, 0.55, 0.65, 0.75, 0.82, 0.88, 0.92, 0.95, 0.98, 1.0],
    traditional_top: [0.08, 0.15, 0.22, 0.30, 0.38, 0.48, 0.58, 0.67, 0.75, 0.83, 0.90, 1.0],
    traditional_avg: [0.08, 0.15, 0.22, 0.30, 0.38, 0.48, 0.58, 0.67, 0.75, 0.83, 0.90, 1.0],
    grocery: [0.20, 0.35, 0.50, 0.65, 0.75, 0.85, 0.90, 0.95, 0.98, 1.0, 1.0, 1.0],
    custom: [0.10, 0.20, 0.35, 0.50, 0.65, 0.78, 0.88, 0.94, 0.97, 1.0, 1.0, 1.0],
  }

  const activeCurve = acq.maturation_curve || MATURATION_CURVES[acq.restaurant_type] || MATURATION_CURVES.custom

  if (jsonMode) {
    return (
      <div className="space-y-4">
        <FormulaDisplay modelId="A2" collapsed={false} />
        <div className="flex justify-end">
          <button type="button" onClick={() => setJsonMode(false)} className="btn-ghost text-xs">Form Mode</button>
        </div>
        <JsonModeEditor
          value={acq}
          onChange={v => setInputs({ ...inputs, acquisition_input: v })}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <FormulaDisplay modelId="A2" collapsed={false} />

      <div className="flex justify-end">
        <button type="button" onClick={() => setJsonMode(true)} className="btn-ghost text-xs">JSON Mode</button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FieldWrapper label="Restaurant Type" type="enum" tooltip="Determines default maturation curve and steady-state benchmarks.">
          <Select
            value={acq.restaurant_type}
            onChange={v => {
              updateAcq('restaurant_type', v)
              // Reset steady state to benchmark mid
              const defaults = { dark_kitchen_large: 215, dark_kitchen_small: 100, traditional_top: 140, traditional_avg: 60, grocery: 80, custom: 100 }
              updateAcq('steady_state_orders', defaults[v] || 100)
            }}
            options={[
              { value: 'dark_kitchen_large', label: 'Dark Kitchen Large (215 ord/wk)' },
              { value: 'dark_kitchen_small', label: 'Dark Kitchen Small (100 ord/wk)' },
              { value: 'traditional_top', label: 'Traditional Top (140 ord/wk)' },
              { value: 'traditional_avg', label: 'Traditional Avg (60 ord/wk)' },
              { value: 'grocery', label: 'Grocery (80 ord/wk)' },
              { value: 'custom', label: 'Custom' },
            ]}
          />
        </FieldWrapper>

        <FieldWrapper
          label="Steady State Orders/wk"
          type="float"
          tooltip="Orders per week per restaurant at full maturity (after 12 weeks)."
          benchmarkStatus={getBenchmarkStatus('steady_state_orders', acq.steady_state_orders, acq.restaurant_type)}
        >
          <NumInput value={acq.steady_state_orders} onChange={v => updateAcq('steady_state_orders', v)} min={0} step={5} />
        </FieldWrapper>

        <FieldWrapper label="Churn Rate" type="float [0–1]" tooltip="Fraction of restaurants that churn after churn_week weeks.">
          <NumInput value={acq.churn_rate} onChange={v => updateAcq('churn_rate', v)} min={0} max={1} step={0.01} />
        </FieldWrapper>

        <FieldWrapper label="Churn Week" type="int" tooltip="Weeks after joining when churn_rate is applied.">
          <NumInput value={acq.churn_week} onChange={v => updateAcq('churn_week', Math.round(v))} min={1} max={52} step={1} />
        </FieldWrapper>

        <FieldWrapper label="Onboarding Promo Uplift" type="float [0–5]" tooltip="Multiplier boost during first N weeks on platform (e.g. 0.40 = +40%).">
          <NumInput value={acq.onboarding_promo_uplift} onChange={v => updateAcq('onboarding_promo_uplift', v)} min={0} max={5} step={0.05} />
        </FieldWrapper>

        <FieldWrapper label="Onboarding Promo Weeks" type="int" tooltip="Duration of elevated orders after onboarding.">
          <NumInput value={acq.onboarding_promo_weeks} onChange={v => updateAcq('onboarding_promo_weeks', Math.round(v))} min={0} max={52} step={1} />
        </FieldWrapper>

        <FieldWrapper label="Saturation Factor" type="float [0–2]" tooltip="Global scaling of all acquisition orders. 1.0 = no scaling.">
          <NumInput value={acq.saturation_factor} onChange={v => updateAcq('saturation_factor', v)} min={0} max={2} step={0.05} />
        </FieldWrapper>
      </div>

      {/* Maturation curve preview */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="ds-label">Maturation Curve</span>
          <span className="text-xs text-gray-600 font-mono">
            W1: {(activeCurve[0] * 100).toFixed(0)}% → W12: {(activeCurve[Math.min(11, activeCurve.length-1)] * 100).toFixed(0)}%
          </span>
        </div>
        <SparklinePreview data={activeCurve} color="#34d399" height={48} showTooltip />
      </div>

      {/* Restaurant plan editor */}
      <div>
        <div className="ds-label mb-2">Restaurant Plan (added per week)</div>
        <div className="overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {(acq.restaurant_plan || []).slice(0, inputs.horizon_weeks || 12).map((v, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <span className="text-gray-600 text-[10px] font-mono">W{i+1}</span>
                <input
                  type="number"
                  value={v}
                  min={0} step={1}
                  onChange={e => updatePlan(i, e.target.value)}
                  className="w-14 px-1 py-1 bg-gray-800 border border-gray-700 text-gray-200
                             text-xs font-mono text-center rounded focus:border-blue-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Plan sparkline */}
        <div className="mt-2">
          <SparklinePreview
            data={(acq.restaurant_plan || []).slice(0, inputs.horizon_weeks || 12)}
            color="#fbbf24"
            height={36}
          />
        </div>
      </div>
    </div>
  )
}

// ── Seasonality Tab ──────────────────────────────────────────────────────────

function SeasonalityTab({ inputs, setInputs }) {
  const [jsonMode, setJsonMode] = useState(false)
  const seas = inputs.seasonality_input || {
    country: inputs.country || 'MX',
    use_holidays: true,
    use_rain_season: true,
    use_pay_cycles: true,
    use_temperature: true,
    trend_weekly_growth: 0.002,
  }

  const updateSeas = (key, value) => {
    setInputs({ ...inputs, seasonality_input: { ...seas, [key]: value } })
  }

  const COUNTRIES = ['MX', 'BR', 'CO', 'AR', 'CL', 'PE', 'EC', 'UY', 'CR', 'PA', 'DO', 'GT', 'HN', 'SV', 'BO', 'PY', 'VE']

  if (jsonMode) {
    return (
      <div className="space-y-4">
        <FormulaDisplay modelId="A4" collapsed={false} />
        <div className="flex justify-end">
          <button type="button" onClick={() => setJsonMode(false)} className="btn-ghost text-xs">Form Mode</button>
        </div>
        <JsonModeEditor
          value={seas}
          onChange={v => setInputs({ ...inputs, seasonality_input: v })}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <FormulaDisplay modelId="A4" collapsed={false} />
      <div className="flex justify-end">
        <button type="button" onClick={() => setJsonMode(true)} className="btn-ghost text-xs">JSON Mode</button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FieldWrapper label="Country" type="enum [17 LATAM]" tooltip="Selects country-specific holiday calendar, pay cycles, and seasonal patterns.">
          <Select
            value={seas.country}
            onChange={v => updateSeas('country', v)}
            options={COUNTRIES.map(c => ({ value: c, label: c }))}
          />
        </FieldWrapper>

        <FieldWrapper label="Weekly Trend Growth" type="float/week" tooltip="Compound weekly organic growth rate. 0.002 = +0.2%/week ≈ +10.7% annual.">
          <NumInput
            value={seas.trend_weekly_growth}
            onChange={v => updateSeas('trend_weekly_growth', v)}
            min={-0.1} max={0.1} step={0.001}
          />
        </FieldWrapper>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          ['use_holidays', 'Use Holidays', 'Apply holiday calendar multipliers (±30–40% on major holidays)'],
          ['use_rain_season', 'Use Rain Season', 'Apply demand uplift during rainy months (net +5–10%)'],
          ['use_pay_cycles', 'Use Pay Cycles', 'Apply quincena/salary day uplift (+10–15%)'],
          ['use_temperature', 'Use Temperature', 'Apply temperature effects on hot/cold months'],
        ].map(([key, label, tooltip]) => (
          <FieldWrapper key={key} label={label} type="bool" tooltip={tooltip}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={seas[key]}
                onChange={e => updateSeas(key, e.target.checked)}
                className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-blue-500
                           focus:ring-blue-500 focus:ring-offset-gray-950"
              />
              <span className="text-sm text-gray-400">{seas[key] ? 'Enabled' : 'Disabled'}</span>
            </label>
          </FieldWrapper>
        ))}
      </div>

      <div className="ds-card p-3 mt-2">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="font-medium text-gray-400 mb-2">Active effects for {seas.country}:</div>
          {seas.use_holidays && <div>📅 Holidays — e.g. Día de las Madres: +37.5%, Año Nuevo: -32.5%</div>}
          {seas.use_rain_season && <div>🌧 Rain season — net +7.5% demand (Jun–Oct for MX)</div>}
          {seas.use_pay_cycles && <div>💰 Pay cycles — +12.5% on quincena days (day 1, 15)</div>}
          {seas.use_temperature && <div>🌡 Temperature — +4% hot months, +0% cold months (MX)</div>}
          <div>📈 Trend — compound {((seas.trend_weekly_growth || 0) * 100).toFixed(3)}%/week</div>
        </div>
      </div>
    </div>
  )
}

// ── Unit Economics Tab ───────────────────────────────────────────────────────

function UnitEconomicsTab({ inputs, setInputs }) {
  const [jsonMode, setJsonMode] = useState(false)
  const ue = inputs.unit_economics || {
    commission_pct: 0.27,
    avg_order_value: 15.0,
    delivery_fee: 2.5,
    ad_revenue_per_order: 0.10,
    courier_cost_per_order: 4.0,
    support_cost_pct: 0.02,
    tech_cost_per_order: 0.03,
    subsidy_per_order: null,
    marketing_fixed_cost: 0,
  }

  const updateUE = (key, value) => {
    setInputs({ ...inputs, unit_economics: { ...ue, [key]: value } })
  }

  // Compute derived metrics
  const aov = ue.avg_order_value || 15
  const grossRev = aov * (ue.commission_pct || 0.27) + (ue.delivery_fee || 2.5) + (ue.ad_revenue_per_order || 0.10)
  const varCost = (ue.courier_cost_per_order || 4.0) + aov * (ue.support_cost_pct || 0.02) + (ue.tech_cost_per_order || 0.03)
  const cmPerOrder = grossRev - varCost
  const cmPct = cmPerOrder / aov

  if (jsonMode) {
    return (
      <div className="space-y-4">
        <FormulaDisplay modelId="B1" collapsed={false} />
        <div className="flex justify-end">
          <button type="button" onClick={() => setJsonMode(false)} className="btn-ghost text-xs">Form Mode</button>
        </div>
        <JsonModeEditor
          value={ue}
          onChange={v => setInputs({ ...inputs, unit_economics: v })}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <FormulaDisplay modelId="B1" collapsed={false} />
      <div className="flex justify-end">
        <button type="button" onClick={() => setJsonMode(true)} className="btn-ghost text-xs">JSON Mode</button>
      </div>

      {/* Live P&L preview */}
      <div className="ds-card p-3 grid grid-cols-3 gap-3">
        <div>
          <div className="ds-label mb-0.5">Gross Rev/Order</div>
          <div className="font-mono text-emerald-400 text-sm">${grossRev.toFixed(2)}</div>
        </div>
        <div>
          <div className="ds-label mb-0.5">Var Cost/Order</div>
          <div className="font-mono text-red-400 text-sm">${varCost.toFixed(2)}</div>
        </div>
        <div>
          <div className="ds-label mb-0.5">CM/Order</div>
          <div className={`font-mono text-sm ${cmPerOrder >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ${cmPerOrder.toFixed(2)} ({(cmPct * 100).toFixed(1)}%)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FieldWrapper label="Commission %" type="float [0–1]" tooltip="Platform take rate on GMV (e.g. 0.27 = 27%)."
          benchmarkStatus={getBenchmarkStatus('commission_pct', ue.commission_pct)}>
          <NumInput value={ue.commission_pct} onChange={v => updateUE('commission_pct', v)} min={0} max={1} step={0.01} />
        </FieldWrapper>

        <FieldWrapper label="Avg Order Value (AOV)" type="float [$]" tooltip="Average consumer basket size in USD.">
          <NumInput value={ue.avg_order_value} onChange={v => updateUE('avg_order_value', v)} min={0} step={0.5} />
        </FieldWrapper>

        <FieldWrapper label="Delivery Fee" type="float [$]" tooltip="Fee charged to consumer for delivery.">
          <NumInput value={ue.delivery_fee} onChange={v => updateUE('delivery_fee', v)} min={0} step={0.1} />
        </FieldWrapper>

        <FieldWrapper label="Ad Revenue/Order" type="float [$]" tooltip="Sponsored listing / restaurant ads revenue per order delivered.">
          <NumInput value={ue.ad_revenue_per_order} onChange={v => updateUE('ad_revenue_per_order', v)} min={0} step={0.01} />
        </FieldWrapper>

        <FieldWrapper label="Courier Cost/Order" type="float [$]" tooltip="Total courier payout including base pay and incentives."
          benchmarkStatus={getBenchmarkStatus('courier_cost_per_order', ue.courier_cost_per_order)}>
          <NumInput value={ue.courier_cost_per_order} onChange={v => updateUE('courier_cost_per_order', v)} min={0} step={0.1} />
        </FieldWrapper>

        <FieldWrapper label="Support Cost %" type="float [0–1]" tooltip="Customer support cost as fraction of AOV.">
          <NumInput value={ue.support_cost_pct} onChange={v => updateUE('support_cost_pct', v)} min={0} max={0.2} step={0.001} />
        </FieldWrapper>

        <FieldWrapper label="Tech Cost/Order" type="float [$]" tooltip="Infrastructure / payment processing cost per order.">
          <NumInput value={ue.tech_cost_per_order} onChange={v => updateUE('tech_cost_per_order', v)} min={0} step={0.01} />
        </FieldWrapper>

        <FieldWrapper label="Marketing Fixed Cost/wk" type="float [$]" tooltip="Fixed weekly marketing spend (not per-order).">
          <NumInput value={ue.marketing_fixed_cost || 0} onChange={v => updateUE('marketing_fixed_cost', v)} min={0} step={100} />
        </FieldWrapper>

        <FieldWrapper label="Subsidy/Order (override)" type="float [$] | null" tooltip="If set, overrides auto-calculated subsidy from promo costs.">
          <div className="flex gap-2">
            <input
              type="number"
              value={ue.subsidy_per_order ?? ''}
              onChange={e => updateUE('subsidy_per_order', e.target.value === '' ? null : parseFloat(e.target.value))}
              placeholder="Auto (from promos)"
              min={0} step={0.01}
              className="ds-input flex-1"
            />
            {ue.subsidy_per_order != null && (
              <button type="button" onClick={() => updateUE('subsidy_per_order', null)} className="btn-ghost text-xs">
                Auto
              </button>
            )}
          </div>
        </FieldWrapper>
      </div>
    </div>
  )
}

// ── Scenarios Tab ────────────────────────────────────────────────────────────

function ScenariosTab({ inputs, setInputs }) {
  const sc = inputs.scenarios_config || {
    upside_multiplier: 1.2,
    downside_multiplier: 0.8,
    sensitivity_range_pct: 0.20,
  }

  const updateSc = (key, value) => {
    setInputs({ ...inputs, scenarios_config: { ...sc, [key]: value } })
  }

  return (
    <div className="space-y-4">
      <FormulaDisplay modelId="B2" collapsed={false} />

      <div className="grid grid-cols-2 gap-4">
        <FieldWrapper label="Upside Multiplier" type="float [0.5–3.0]" tooltip="Multiplier applied to base_orders and uplift_pct for upside scenario.">
          <NumInput value={sc.upside_multiplier} onChange={v => updateSc('upside_multiplier', v)} min={1.0} max={3.0} step={0.05} />
        </FieldWrapper>

        <FieldWrapper label="Downside Multiplier" type="float [0.1–1.5]" tooltip="Multiplier applied to base_orders and uplift_pct for downside scenario.">
          <NumInput value={sc.downside_multiplier} onChange={v => updateSc('downside_multiplier', v)} min={0.1} max={1.0} step={0.05} />
        </FieldWrapper>

        <FieldWrapper label="Sensitivity Range %" type="float [0.01–1.0]" tooltip="±% range used for tornado sensitivity analysis.">
          <NumInput value={sc.sensitivity_range_pct} onChange={v => updateSc('sensitivity_range_pct', v)} min={0.01} max={1.0} step={0.01} />
        </FieldWrapper>
      </div>

      <div className="ds-card p-3 text-xs text-gray-500">
        <div className="font-medium text-gray-400 mb-2">Scenario Configuration:</div>
        <div>Upside: base_orders × {sc.upside_multiplier} → +{((sc.upside_multiplier - 1) * 100).toFixed(0)}%</div>
        <div>Downside: base_orders × {sc.downside_multiplier} → {((sc.downside_multiplier - 1) * 100).toFixed(0)}%</div>
        <div>Tornado: ±{(sc.sensitivity_range_pct * 100).toFixed(0)}% on each input variable</div>
      </div>
    </div>
  )
}

// ── Market Share Tab ─────────────────────────────────────────────────────────

function MarketShareTab({ inputs, setInputs }) {
  const ms = inputs.market_share_input || {
    current_share: 0.30,
    target_share: 0.35,
    total_market_orders_weekly: 100000,
  }

  const updateMs = (key, value) => {
    setInputs({ ...inputs, market_share_input: { ...ms, [key]: value } })
  }

  return (
    <div className="space-y-4">
      <FormulaDisplay modelId="C1" collapsed={false} />

      <div className="grid grid-cols-2 gap-4">
        <FieldWrapper label="Current Market Share" type="float [0–1]">
          <NumInput value={ms.current_share} onChange={v => updateMs('current_share', v)} min={0} max={1} step={0.01} />
        </FieldWrapper>

        <FieldWrapper label="Target Market Share" type="float [0–1]">
          <NumInput value={ms.target_share} onChange={v => updateMs('target_share', v)} min={0} max={1} step={0.01} />
        </FieldWrapper>

        <FieldWrapper label="Total Market Orders/wk" type="float">
          <NumInput value={ms.total_market_orders_weekly} onChange={v => updateMs('total_market_orders_weekly', v)} min={0} step={1000} />
        </FieldWrapper>
      </div>

      <div className="ds-card p-3 text-xs text-gray-500">
        <div>Share ramp: {(ms.current_share * 100).toFixed(1)}% → {(ms.target_share * 100).toFixed(1)}% (linear over horizon)</div>
        <div>Factor at W1: {(ms.current_share / ms.current_share).toFixed(3)}</div>
        <div>Factor at W{inputs.horizon_weeks}: {(ms.target_share / ms.current_share).toFixed(3)}</div>
        <div>Max orders at target: {fmtOrders(ms.total_market_orders_weekly * ms.target_share)}/wk</div>
      </div>
    </div>
  )
}

// ── Main InputTabs ───────────────────────────────────────────────────────────

const MODEL_TABS = {
  A1: { label: 'A1 Promo', component: PromoTab },
  A2: { label: 'A2 Acquisition', component: AcquisitionTab },
  A4: { label: 'A4 Seasonality', component: SeasonalityTab },
  B1: { label: 'B1 Unit Econ', component: UnitEconomicsTab },
  B2: { label: 'B2 Scenarios', component: ScenariosTab },
  C1: { label: 'C1 Market Share', component: MarketShareTab },
}

export default function InputTabs({ inputs, setInputs }) {
  const activeModels = inputs.models_active || []
  const availableTabs = Object.entries(MODEL_TABS).filter(([key]) => activeModels.includes(key))
  const [activeTab, setActiveTab] = useState(availableTabs[0]?.[0] || null)

  if (availableTabs.length === 0) {
    return (
      <div className="ds-card p-6 text-center text-gray-500 text-sm">
        No models selected. Go back to step 1 to select models.
      </div>
    )
  }

  const ActiveComponent = activeTab ? MODEL_TABS[activeTab]?.component : null

  // Ensure activeTab is valid
  const validTab = availableTabs.find(([key]) => key === activeTab) ? activeTab : availableTabs[0]?.[0]

  return (
    <div className="space-y-0">
      {/* Tab bar */}
      <div className="flex border-b border-gray-800 overflow-x-auto">
        {availableTabs.map(([key, { label }]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`ds-tab whitespace-nowrap ${(validTab === key) ? 'ds-tab-active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="pt-4">
        {validTab && MODEL_TABS[validTab] && React.createElement(MODEL_TABS[validTab].component, { inputs, setInputs })}
      </div>
    </div>
  )
}
