/**
 * Per-model insight generators.
 * Each function takes (summary, config) and returns an array of
 * 3–4 concrete factual strings derived directly from the model output.
 * No hedging, no "good/bad" framing — just the data in plain language.
 */

function fmt(v, currency = 'MXN') {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  if (typeof v === 'string') return v
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return `${currency} ${(v / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000)     return `${currency} ${(v / 1_000).toFixed(0)}K`
  if (abs < 1 && abs > 0) return `${(v * 100).toFixed(1)}%`
  return `${v.toLocaleString()}`
}

function fmtN(v) {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'number') return v.toLocaleString()
  return String(v)
}

// ── D1 — Markov Cohort Engine ─────────────────────────────────────────────────
export function interpretD1(summary = {}, config = {}) {
  const c = config.currency || 'MXN'
  const h = config.horizon_weeks || 12
  const lines = []

  if (summary.total_orders != null && summary.total_incremental != null)
    lines.push(`${fmtN(summary.total_orders)} órdenes totales en ${h} semanas — ${fmtN(summary.total_incremental)} son incrementales por levers`)

  if (summary.total_revenue != null && summary.total_contribution != null)
    lines.push(`Revenue neto: ${fmt(summary.total_revenue, c)} · Contribución: ${fmt(summary.total_contribution, c)}`)

  if (summary.avg_contribution_pct != null)
    lines.push(`Margen de contribución promedio: ${((summary.avg_contribution_pct || 0) * 100).toFixed(1)}% sobre el revenue neto`)

  if (summary.avg_cost_per_order != null)
    lines.push(`Costo promedio por orden (incentivos): ${fmt(summary.avg_cost_per_order, c)}`)

  return lines.slice(0, 4)
}

// ── D2 — Cohort Retention & LTV ──────────────────────────────────────────────
export function interpretD2(summary = {}, config = {}) {
  const c = config.currency || 'MXN'
  const h = config.horizon_weeks || 12
  const lines = []

  if (summary.avg_ltv_cac != null)
    lines.push(`LTV/CAC promedio: ${summary.avg_ltv_cac.toFixed(2)}x — umbral de rentabilidad típico es 2.5x`)

  if (summary.total_revenue != null)
    lines.push(`Revenue acumulado en ${h} semanas: ${fmt(summary.total_revenue, c)}`)

  if (summary.best_channel)
    lines.push(`Canal más eficiente: ${summary.best_channel}`)

  if (summary.total_orders != null)
    lines.push(`${fmtN(summary.total_orders)} órdenes totales generadas por cohortes activas`)

  return lines.slice(0, 4)
}

// ── D3 — Funnel Conversion ───────────────────────────────────────────────────
export function interpretD3(summary = {}, config = {}) {
  const c = config.currency || 'MXN'
  const h = config.horizon_weeks || 12
  const lines = []

  if (summary.overall_conversion_rate != null)
    lines.push(`Conversión total del funnel: ${(summary.overall_conversion_rate).toFixed(2)}% de visitantes convierten en orden`)

  if (summary.biggest_drop_step)
    lines.push(`Mayor caída de conversión en: "${summary.biggest_drop_step}"`)

  if (summary.total_orders != null)
    lines.push(`${fmtN(summary.total_orders)} órdenes generadas en ${h} semanas`)

  if (summary.total_revenue != null)
    lines.push(`Revenue total del periodo: ${fmt(summary.total_revenue, c)}`)

  return lines.slice(0, 4)
}

// ── D4 — Frequency & Wallet Share ────────────────────────────────────────────
export function interpretD4(summary = {}, config = {}) {
  const c = config.currency || 'MXN'
  const h = config.horizon_weeks || 12
  const lines = []

  if (summary.total_incremental_orders != null)
    lines.push(`${fmtN(summary.total_incremental_orders)} órdenes incrementales proyectadas en ${h} semanas`)

  if (summary.incremental_revenue != null)
    lines.push(`Revenue incremental total: ${fmt(summary.incremental_revenue, c)}`)

  if (summary.total_revenue != null)
    lines.push(`Revenue total del portfolio: ${fmt(summary.total_revenue, c)}`)

  return lines.slice(0, 4)
}

// ── D5 — Reactivation & Winback ──────────────────────────────────────────────
export function interpretD5(summary = {}, config = {}) {
  const c = config.currency || 'MXN'
  const h = config.horizon_weeks || 12
  const lines = []

  if (summary.total_reactivated_users != null)
    lines.push(`${fmtN(summary.total_reactivated_users)} usuarios reactivados en ${h} semanas`)

  if (summary.blended_roi != null)
    lines.push(`ROI combinado de campañas: ${summary.blended_roi.toFixed(2)}x`)

  if (summary.total_revenue != null)
    lines.push(`Revenue generado por reactivación: ${fmt(summary.total_revenue, c)}`)

  if (summary.total_cost != null)
    lines.push(`Costo total de campañas: ${fmt(summary.total_cost, c)}`)

  return lines.slice(0, 4)
}

// ── S1 — Restaurant Onboarding & Maturation ──────────────────────────────────
export function interpretS1(summary = {}, config = {}) {
  const c = config.currency || 'MXN'
  const h = config.horizon_weeks || 12
  const lines = []

  if (summary.total_restaurants_added != null)
    lines.push(`${fmtN(summary.total_restaurants_added)} restaurantes activados en ${h} semanas`)

  if (summary.total_revenue != null)
    lines.push(`Revenue acumulado de nuevos restaurantes: ${fmt(summary.total_revenue, c)}`)

  if (summary.total_orders != null)
    lines.push(`${fmtN(summary.total_orders)} órdenes totales generadas`)

  if (summary.avg_weekly_orders != null)
    lines.push(`Promedio de ${summary.avg_weekly_orders.toFixed(0)} órdenes/restaurante/semana al alcanzar madurez`)

  return lines.slice(0, 4)
}

// ── S2 — Portfolio & Selection Effect ────────────────────────────────────────
export function interpretS2(summary = {}, config = {}) {
  const c = config.currency || 'MXN'
  const lines = []

  if (summary.uplift_pct != null)
    lines.push(`Uplift de portfolio por cambios propuestos: ${summary.uplift_pct.toFixed(1)}%`)

  if (summary.total_revenue != null)
    lines.push(`Revenue total del portfolio: ${fmt(summary.total_revenue, c)}`)

  if (summary.total_orders != null)
    lines.push(`${fmtN(summary.total_orders)} órdenes totales`)

  if (summary.delta_orders != null)
    lines.push(`${summary.delta_orders > 0 ? '+' : ''}${fmtN(summary.delta_orders)} órdenes/semana por el cambio de mix`)

  return lines.slice(0, 4)
}

// ── S3 — Restaurant Engagement ───────────────────────────────────────────────
export function interpretS3(summary = {}, config = {}) {
  const c = config.currency || 'MXN'
  const lines = []

  if (summary.restaurants_in_program != null)
    lines.push(`${fmtN(summary.restaurants_in_program)} restaurantes incluidos en el programa de engagement`)

  if (summary.roi != null)
    lines.push(`ROI del programa: ${summary.roi.toFixed(2)}x`)

  if (summary.incremental_revenue != null)
    lines.push(`Revenue incremental generado: ${fmt(summary.incremental_revenue, c)}`)

  if (summary.program_cost != null)
    lines.push(`Costo total del programa: ${fmt(summary.program_cost, c)}`)

  return lines.slice(0, 4)
}

// ── S4 — Restaurant Health Score ─────────────────────────────────────────────
export function interpretS4(summary = {}, config = {}) {
  const c = config.currency || 'MXN'
  const lines = []

  if (summary.at_risk_count != null && summary.total_restaurants != null)
    lines.push(`${summary.at_risk_count} de ${summary.total_restaurants} restaurantes por debajo del umbral de riesgo (score < ${config.churn_threshold_score || 40})`)

  if (summary.revenue_at_risk != null)
    lines.push(`Revenue en riesgo si churnan los proveedores críticos: ${fmt(summary.revenue_at_risk, c)}`)

  if (summary.avg_health_score != null)
    lines.push(`Score de salud promedio del portfolio: ${summary.avg_health_score}/100`)

  return lines.slice(0, 4)
}

// ── P1 — Network Effects & Liquidity ─────────────────────────────────────────
export function interpretP1(summary = {}, config = {}) {
  const c = config.currency || 'MXN'
  const h = config.horizon_weeks || 12
  const lines = []

  if (summary.final_phase)
    lines.push(`Fase final del mercado en semana ${h}: "${summary.final_phase.replace('_', ' ')}"`)

  if (summary.final_fulfillment_rate != null)
    lines.push(`Fulfillment rate final: ${(summary.final_fulfillment_rate * 100).toFixed(0)}%`)

  if (summary.total_orders != null)
    lines.push(`${fmtN(summary.total_orders)} órdenes acumuladas en el periodo`)

  if (summary.total_revenue != null)
    lines.push(`Revenue total: ${fmt(summary.total_revenue, c)}`)

  return lines.slice(0, 4)
}

// ── P2 — Incrementality & Cannibalization ────────────────────────────────────
export function interpretP2(summary = {}, config = {}) {
  const c = config.currency || 'MXN'
  const lines = []

  if (summary.blended_roi != null)
    lines.push(`ROI combinado de campañas: ${summary.blended_roi.toFixed(2)}x`)

  if (summary.blended_cannibalization_rate_pct != null)
    lines.push(`Tasa de canibalización promedio: ${summary.blended_cannibalization_rate_pct.toFixed(1)}% — ese porcentaje de órdenes habría ocurrido sin la promo`)

  if (summary.total_weekly_incremental_revenue != null)
    lines.push(`Revenue incremental neto/semana: ${fmt(summary.total_weekly_incremental_revenue, c)}`)

  if (summary.net_contribution != null)
    lines.push(`Net contribution total del periodo: ${fmt(summary.net_contribution, c)}`)

  return lines.slice(0, 4)
}

// ── P3 — Delivery Economics & Capacity ───────────────────────────────────────
export function interpretP3(summary = {}, config = {}) {
  const c = config.currency || 'MXN'
  const h = config.horizon_weeks || 12
  const lines = []

  if (summary.bottleneck_week != null)
    lines.push(`Cuello de botella de flota en semana ${summary.bottleneck_week} — capacidad máxima alcanzada`)
  else
    lines.push(`Sin cuello de botella de flota en el horizonte de ${h} semanas`)

  if (summary.total_orders != null)
    lines.push(`${fmtN(summary.total_orders)} órdenes totales con la flota actual`)

  if (summary.total_revenue != null)
    lines.push(`Revenue de delivery: ${fmt(summary.total_revenue, c)}`)

  if (summary.total_couriers != null)
    lines.push(`Flota final: ${fmtN(summary.total_couriers)} repartidores activos`)

  return lines.slice(0, 4)
}

// ── P4 — Competitive Dynamics ────────────────────────────────────────────────
export function interpretP4(summary = {}, config = {}) {
  const c = config.currency || 'MXN'
  const lines = []

  if (summary.initial_share_pct != null && summary.final_share_pct != null) {
    const delta = (summary.final_share_pct - summary.initial_share_pct).toFixed(1)
    lines.push(`Market share: ${summary.initial_share_pct.toFixed(1)}% inicial → ${summary.final_share_pct.toFixed(1)}% final (${delta > 0 ? '+' : ''}${delta}pp)`)
  }

  if (summary.revenue_vs_baseline != null)
    lines.push(`Revenue vs. baseline sin eventos competitivos: ${summary.revenue_vs_baseline > 0 ? '+' : ''}${fmt(summary.revenue_vs_baseline, c)}`)

  if (summary.total_response_cost != null)
    lines.push(`Costo total de la respuesta competitiva: ${fmt(summary.total_response_cost, c)}`)

  return lines.slice(0, 4)
}

// ── P5 — Marketplace Equilibrium ─────────────────────────────────────────────
export function interpretP5(summary = {}, config = {}) {
  const c = config.currency || 'MXN'
  const h = config.horizon_weeks || 12
  const lines = []

  if (summary.is_sustainable != null)
    lines.push(`El modelo es ${summary.is_sustainable ? 'sostenible' : 'no sostenible'} en el horizonte de ${h} semanas`)

  if (summary.ltv_cac_ratio != null)
    lines.push(`LTV/CAC ratio: ${summary.ltv_cac_ratio.toFixed(2)}x`)

  if (summary.total_revenue != null)
    lines.push(`Revenue total proyectado: ${fmt(summary.total_revenue, c)}`)

  if (summary.total_costs != null)
    lines.push(`Costos totales del periodo: ${fmt(summary.total_costs, c)}`)

  return lines.slice(0, 4)
}

// ── Router ────────────────────────────────────────────────────────────────────
const INTERPRETERS = {
  D1: interpretD1,
  D2: interpretD2, D3: interpretD3, D4: interpretD4, D5: interpretD5,
  S1: interpretS1, S2: interpretS2, S3: interpretS3, S4: interpretS4,
  P1: interpretP1, P2: interpretP2, P3: interpretP3, P4: interpretP4,
  P5: interpretP5,
}

export function getInsights(modelId, summary, config) {
  const fn = INTERPRETERS[modelId?.toUpperCase()]
  if (!fn) return []
  return fn(summary || {}, config || {}).filter(Boolean)
}
