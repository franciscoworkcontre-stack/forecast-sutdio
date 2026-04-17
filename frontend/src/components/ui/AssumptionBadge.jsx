import React from 'react'
import { checkBenchmark } from '../../utils/benchmarks'
import HelperTooltip from './HelperTooltip'

/**
 * AssumptionBadge — shows inline warning when a field value is outside benchmark range.
 *
 * Usage:
 *   <AssumptionBadge field="take_rate" value={0.55} industry="food_delivery" currency="MXN" />
 *
 * Props:
 *   field     — benchmark key (e.g. 'take_rate', 'cac', 'aov')
 *   value     — current numeric value
 *   industry  — industry id (optional, falls back to default)
 *   currency  — active currency code (e.g. 'MXN'). Skips checks in a different native currency.
 *   inline    — if true, renders as a tiny inline badge next to the label
 */
export default function AssumptionBadge({ field, value, industry = 'default', currency = null, inline = false }) {
  const warn = checkBenchmark(field, value, industry, currency)
  if (!warn) return null

  const isDanger  = warn.level === 'danger'
  const baseClass = isDanger
    ? 'bg-red-900/40 border-red-700 text-red-300'
    : 'bg-amber-900/30 border-amber-700/60 text-amber-300'

  if (inline) {
    return (
      <span className={`inline-flex items-center gap-1 ml-1.5 px-1.5 py-0.5 rounded border text-[10px] font-mono leading-none ${baseClass}`}>
        {isDanger ? '⚠' : '!'} {warn.text}
        {warn.tip && <HelperTooltip text={warn.tip} size="sm" />}
      </span>
    )
  }

  return (
    <div className={`mt-1.5 flex items-start gap-1.5 px-2 py-1.5 rounded border text-xs ${baseClass}`}>
      <span className="flex-shrink-0 font-bold">{isDanger ? '⚠' : '!'}</span>
      <span>{warn.text}</span>
      {warn.tip && <HelperTooltip text={warn.tip} size="sm" />}
    </div>
  )
}
