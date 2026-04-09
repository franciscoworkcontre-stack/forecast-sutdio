/**
 * FormulaDisplay — shows mathematical formulas for each model.
 * DS/Eng focused: formulas visible by default, monospace, blue-tinted.
 */
import React, { useState } from 'react'

const FORMULAS = {
  A1: {
    title: 'A1 — Promo Uplift',
    lines: [
      'orders_inc[w] = base × (uplift/100) × fatigue[w] × penetration[segment]',
      '',
      'fatigue[w]:',
      '  w ≤ 2  →  1.00',
      '  w ≤ 4  →  0.90',
      '  w ≤ 8  →  0.75',
      '  w ≤ 12 →  0.60',
      '',
      'penetration:',
      '  all         = 1.00',
      '  new_users   = 0.15',
      '  dormant     = 0.20',
      '  high_value  = 0.20',
      '',
      'post_promo_residual[d] = base × (uplift/100) × residual[d] × penetration',
      'residual[d]: {1:0.30, 2:0.20, 3:0.10, 4:0.10, 5+:0.00}',
      '',
      'platform_cost[w] = orders_inc[w] × cost_frac × platform_split',
    ],
  },
  A2: {
    title: 'A2 — Restaurant Acquisition (Cohort)',
    lines: [
      '∀ cohort c (restaurants joined at week c):',
      '',
      '  survival[c][w] = 1 - churn_rate  if w-c ≥ churn_week',
      '                 = 1               otherwise',
      '',
      '  active[c][w] = restaurants_added[c] × survival[c][w]',
      '',
      '  mat[c][w] = maturation_curve[w - c]',
      '              (padded at ends)',
      '',
      '  eff_steady[c][w] = steady_state × (1 + onboarding_uplift)',
      '                     if (w-c) < onboarding_promo_weeks',
      '                   = steady_state   otherwise',
      '',
      '  orders[c][w] = active[c][w] × eff_steady[c][w] × mat[c][w] × saturation',
      '',
      'total_orders[w] = Σ_c orders[c][w]',
    ],
  },
  A3: {
    title: 'A3 — Cannibalization',
    lines: [
      'cannibalization[w] = acquisition_orders[w] × base_rate × density_factor',
      '',
      'base_rate by type:',
      '  dark_kitchen_large  = 0.08',
      '  dark_kitchen_small  = 0.10',
      '  traditional_top     = 0.15',
      '  traditional_avg     = 0.12',
      '  grocery             = 0.05',
    ],
  },
  A4: {
    title: 'A4 — Seasonality',
    lines: [
      'factor[w] = pattern[weekday(w)]',
      '          × holiday_factor[w]',
      '          × rain_factor[w]',
      '          × pay_cycle_factor[w]',
      '          × temperature_factor[w]',
      '          × (1 + trend)^w',
      '',
      'total_orders[w] = raw_orders[w] × factor[w]',
      '',
      'holiday_factor[w] = ∏(1 + effect_i × duration_i/7)',
      '  for each holiday falling in week w',
      '',
      'pay_cycle_factor: +12.5% on quincena days (day 1, 15)',
      'rain_factor: +7.5% net during rainy months (MX: Jun–Oct)',
    ],
  },
  A5: {
    title: 'A5 — Capacity / Expansion',
    lines: [
      'For each city c launched at week launch_c:',
      '',
      '  max_orders[c] = population[c] × penetration × orders_per_user_weekly',
      '',
      '  orders[c][w] = max_orders[c] × ramp_curve[w - launch_c]',
      '                 if w ≥ launch_c, else 0',
      '',
      'total_expansion[w] = Σ_c orders[c][w]',
    ],
  },
  B1: {
    title: 'B1 — Unit Economics',
    lines: [
      'Per order:',
      '  commission_rev  = AOV × commission_pct',
      '  delivery_rev    = delivery_fee',
      '  ad_rev          = ad_revenue_per_order',
      '  gross_rev       = commission_rev + delivery_rev + ad_rev',
      '',
      '  variable_cost   = courier_cost',
      '                  + AOV × support_cost_pct',
      '                  + tech_cost_per_order',
      '                  + subsidy_per_order',
      '',
      '  cm_per_order    = gross_rev - variable_cost',
      '  cm_pct          = cm_per_order / AOV',
      '',
      'Per week:',
      '  gross_revenue[w]  = total_orders[w] × gross_rev_per_order',
      '  total_cm[w]       = total_orders[w] × cm_per_order - marketing_fixed',
    ],
  },
  B2: {
    title: 'B2 — Scenarios & Sensitivity',
    lines: [
      'Upside:   base_orders × upside_mult, uplift × upside_mult',
      'Downside: base_orders × downside_mult, uplift × downside_mult',
      '',
      'Tornado sensitivity (±20% range):',
      '  For each variable v:',
      '    run_up   = forecast(v × 1.20)',
      '    run_down = forecast(v × 0.80)',
      '    delta_up   = Σ total_orders(up) - base_total',
      '    delta_down = Σ total_orders(down) - base_total',
      '  Sort by |delta_up| + |delta_down| descending',
      '  Show top 10 variables',
    ],
  },
  C1: {
    title: 'C1 — Market Share',
    lines: [
      'share[w] = current_share',
      '         + (target_share - current_share) × (w / horizon)  [linear ramp]',
      '  — or —',
      '         = min(current + share_gain_per_week × w, target)   [manual rate]',
      '',
      'market_share_factor[w] = share[w] / current_share',
      '',
      'total_orders[w] = raw_total[w] × market_share_factor[w]',
    ],
  },
}

export default function FormulaDisplay({ modelId, collapsed = false }) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed)
  const formula = FORMULAS[modelId]

  if (!formula) return null

  return (
    <div className="mt-3 border border-gray-800 rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setIsCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-900/80
                   hover:bg-gray-800 text-left transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-blue-400 font-mono text-xs">ƒ</span>
          <span className="text-xs font-medium text-blue-400">Formula: {formula.title}</span>
        </div>
        <span className="text-gray-600 text-xs">{isCollapsed ? '▶' : '▼'}</span>
      </button>

      {!isCollapsed && (
        <div className="ds-formula rounded-none border-0 border-t border-gray-800 text-[11px] leading-5">
          {formula.lines.map((line, i) => (
            <div key={i} className={line === '' ? 'h-2' : ''}>
              {line !== '' && (
                <span className={
                  line.startsWith('  ') ? 'text-blue-300/80' :
                  line.match(/^[A-Za-z_∀Σ∏±]/) ? 'text-blue-400' :
                  'text-gray-500'
                }>
                  {line}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export { FORMULAS }
