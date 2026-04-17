/**
 * Benchmark ranges for common model inputs.
 * Used by AssumptionBadge to flag inputs outside realistic ranges.
 *
 * Format per field:
 *   industry_key: { min, max, benchmark, unit, tip }
 *   default:      { min, max, benchmark, unit, tip }
 */

export const FIELD_BENCHMARKS = {
  take_rate: {
    food_delivery:  { min: 0.15, max: 0.30, benchmark: 0.22, unit: '%', tip: 'Food Delivery LATAM: 18–28%. > 30% es inusual.' },
    rideshare:      { min: 0.18, max: 0.32, benchmark: 0.25, unit: '%', tip: 'Rideshare LATAM: 20–30%.' },
    ecommerce:      { min: 0.06, max: 0.20, benchmark: 0.12, unit: '%', tip: 'E-commerce: 8–18%. GMV comisión.' },
    saas_b2b:       { min: 0.60, max: 0.90, benchmark: 0.78, unit: '%', tip: 'SaaS: 65–85% gross margin.' },
    fintech:        { min: 0.02, max: 0.15, benchmark: 0.05, unit: '%', tip: 'Fintech/lending: 2–12% del monto.' },
    default:        { min: 0.05, max: 0.50, benchmark: 0.22, unit: '%', tip: 'Take rate: % de comisión sobre GMV.' },
  },

  aov: {
    food_delivery:  { min: 100, max: 800,     benchmark: 290,   unit: 'MXN', tip: 'Food Delivery MX: MXN 150–600 típico. < 100 es muy bajo.' },
    rideshare:      { min: 40,  max: 400,     benchmark: 120,   unit: 'MXN', tip: 'Rideshare MX: MXN 60–250 típico.' },
    ecommerce:      { min: 200, max: 3000,    benchmark: 850,   unit: 'MXN', tip: 'E-commerce MX: ticket promedio MXN 300–2000.' },
    quick_commerce: { min: 200, max: 1200,    benchmark: 650,   unit: 'MXN', tip: 'Quick Commerce: canasta MXN 300–1000.' },
    hotel:          { min: 500, max: 8000,    benchmark: 1800,  unit: 'MXN', tip: 'Hotel/STR MX: tarifa noche MXN 800–5000.' },
    saas_b2b:       { min: 50,  max: 2000,    benchmark: 250,   unit: 'USD', tip: 'SaaS B2B ARPU mensual: USD 50–1500.' },
    default:        { min: 10,  max: 100000,  benchmark: 290,   unit: '',    tip: 'Valor promedio por transacción.' },
  },

  horizon_weeks: {
    default: { min: 4, max: 52, benchmark: 12, unit: 'sem', tip: '12 sem = 1 trimestre (estándar). > 26 sem requiere supuestos de largo plazo sólidos.' },
  },

  // D2 / LTV
  cac: {
    food_delivery:  { min: 20,  max: 500,  benchmark: 150, unit: 'MXN', tip: 'CAC Food Delivery MX: MXN 50–300 típico. > 500 es ineficiente.' },
    default:        { min: 5,   max: 2000, benchmark: 150, unit: '',    tip: 'Costo de adquirir un usuario. Verifica si incluye atribución correcta.' },
  },
  weekly_new_users: {
    default: { min: 10, max: 500000, benchmark: 500, unit: 'users/sem', tip: 'Nuevos usuarios por semana. > 10K/sem es escala significativa.' },
  },
  orders_per_active_per_week: {
    food_delivery:  { min: 0.5, max: 4.0, benchmark: 1.2, unit: 'ord/usr', tip: 'Food Delivery: 1–2 órdenes/sem es un buen usuario. > 4 es power user.' },
    default:        { min: 0.1, max: 10,  benchmark: 1.0, unit: 'tx/usr',  tip: 'Transacciones por usuario activo por semana.' },
  },

  // D3 Funnel
  conversion_rate: {
    default: { min: 0.02, max: 0.95, benchmark: 0.40, unit: '%', tip: 'Cada paso del funnel. < 5% en un paso indica fricción severa.' },
  },
  weekly_visitors: {
    default: { min: 1000, max: 50000000, benchmark: 100000, unit: 'vis/sem', tip: 'Tráfico semanal total al funnel.' },
  },

  // P2 Incrementality
  uplift_observed_pct: {
    default: { min: 0.05, max: 0.80, benchmark: 0.30, unit: '%', tip: 'Uplift lift-over-control típico: 10–60%. > 80% es inusual — verifica metodología.' },
  },
  organic_baseline: {
    default: { min: 0, max: 1000000, benchmark: null, tip: 'Órdenes que habrían ocurrido sin la promoción. Mide bien con un grupo control.' },
  },
  discount_per_order: {
    food_delivery:  { min: 0, max: 150, benchmark: 50, unit: 'MXN', tip: 'Descuento promedio por orden. > MXN 100 erosiona márgenes severamente.' },
    default:        { min: 0, max: 500, benchmark: 30, unit: '',    tip: 'Descuento por orden. Verifica que no supere el margen bruto.' },
  },

  // S1 Onboarding
  new_restaurants_per_week: {
    default: { min: 1, max: 2000, benchmark: 50, unit: 'rest/sem', tip: 'Ritmo de activación. > 200/sem requiere operaciones de onboarding robustas.' },
  },

  // S4 Health
  rating: {
    default: { min: 1, max: 5, benchmark: 4.2, unit: '/5', tip: 'Rating promedio. < 3.5 es señal de churn inminente. Benchmark sano: > 4.0.' },
  },
  order_trend_pct: {
    default: { min: -0.30, max: 0.30, benchmark: 0.0, unit: '%', tip: 'Tendencia semana-a-semana. < -10% por semana es alerta roja.' },
  },

  // P1 Network
  fulfillment_rate: {
    food_delivery: { min: 0.70, max: 0.99, benchmark: 0.88, unit: '%', tip: 'Food Delivery: > 85% es bueno. < 75% genera cancelaciones y churns de demanda.' },
    default:       { min: 0.50, max: 0.99, benchmark: 0.85, unit: '%', tip: 'Tasa de cumplimiento. < 80% señala problemas de oferta.' },
  },

  // P3 Delivery
  fleet_size: {
    default: { min: 10, max: 100000, benchmark: 1000, unit: 'couriers', tip: 'Tamaño de flota. Valida con datos reales de cobertura operativa.' },
  },
}

/**
 * Get warning level for a field value.
 * Returns null (ok), 'warning' (borderline), or 'danger' (outlier).
 */
export function checkBenchmark(fieldKey, value, industry = 'default') {
  if (value === null || value === undefined || value === '') return null

  const fieldDef = FIELD_BENCHMARKS[fieldKey]
  if (!fieldDef) return null

  const range = fieldDef[industry] || fieldDef.default
  if (!range) return null

  const numVal = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numVal)) return null

  // For percentage fields (take_rate, conversion_rate, etc.), value is 0–1
  // For display purposes they're shown as %, but stored as decimals
  const displayVal = numVal

  const { min, max, tip, unit } = range

  if (displayVal < min) {
    return {
      level: 'warning',
      text: `Por debajo del mínimo típico (${min}${unit ? ' ' + unit : ''})`,
      tip: tip || '',
    }
  }
  if (displayVal > max) {
    return {
      level: 'danger',
      text: `Fuera del rango habitual — máximo típico: ${max}${unit ? ' ' + unit : ''}`,
      tip: tip || '',
    }
  }
  return null
}
