/**
 * Zod schemas and validation helpers.
 */
import { z } from 'zod'

export const PromoSchema = z.object({
  orders_base_weekly: z.number().min(0).max(1_000_000),
  promo_type: z.enum(['discount_pct', 'discount_fixed', 'bogo', 'free_delivery', 'cashback', 'bundle']),
  duration_weeks: z.number().int().min(1).max(52),
  uplift_pct: z.number().min(0).max(500),
  target_segment: z.enum(['all', 'new_users', 'dormant', 'high_value']),
  who_funds: z.enum(['platform', 'merchant', 'cofunded']),
  cofund_split: z.number().min(0).max(1).optional(),
  fatigue_curve: z.array(z.number()).optional(),
  residual_curve: z.array(z.number()).optional(),
})

export const AcquisitionSchema = z.object({
  restaurant_plan: z.array(z.number().int().min(0)),
  restaurant_type: z.enum(['dark_kitchen_large', 'dark_kitchen_small', 'traditional_top', 'traditional_avg', 'grocery', 'custom']),
  steady_state_orders: z.number().min(0),
  onboarding_promo_uplift: z.number().min(0).max(5).optional(),
  onboarding_promo_weeks: z.number().int().min(0).max(52).optional(),
  churn_rate: z.number().min(0).max(1).optional(),
  churn_week: z.number().int().min(0).max(52).optional(),
  saturation_factor: z.number().min(0).max(2).optional(),
})

export const SeasonalitySchema = z.object({
  country: z.string(),
  use_holidays: z.boolean(),
  use_rain_season: z.boolean(),
  use_pay_cycles: z.boolean(),
  use_temperature: z.boolean(),
  trend_weekly_growth: z.number().min(-0.1).max(0.1).optional(),
})

export const UnitEconomicsSchema = z.object({
  commission_pct: z.number().min(0).max(1),
  avg_order_value: z.number().min(0),
  delivery_fee: z.number().min(0),
  ad_revenue_per_order: z.number().min(0),
  courier_cost_per_order: z.number().min(0),
  support_cost_pct: z.number().min(0).max(1),
  tech_cost_per_order: z.number().min(0),
  subsidy_per_order: z.number().min(0).optional().nullable(),
  marketing_fixed_cost: z.number().min(0).optional(),
})

export const ForecastRequestSchema = z.object({
  name: z.string().min(1).max(200),
  horizon_weeks: z.number().int().min(4).max(52),
  country: z.string(),
  base_orders_weekly: z.number().min(0),
  models_active: z.array(z.string()),
  promo_inputs: z.array(PromoSchema).optional(),
  acquisition_input: AcquisitionSchema.optional(),
  seasonality_input: SeasonalitySchema.optional(),
  unit_economics: UnitEconomicsSchema.optional(),
})

export function validateJson(str) {
  try {
    return { ok: true, data: JSON.parse(str) }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

export function isInRange(value, low, high) {
  if (value < low) return 'below'
  if (value > high) return 'above'
  return 'normal'
}

// Benchmark ranges for quick UI validation
export const BENCHMARKS = {
  uplift_pct: {
    discount_pct: { low: 15, mid: 27.5, high: 40 },
    discount_fixed: { low: 10, mid: 20, high: 30 },
    bogo: { low: 25, mid: 37.5, high: 50 },
    free_delivery: { low: 20, mid: 27.5, high: 35 },
    cashback: { low: 8, mid: 14, high: 20 },
    bundle: { low: 12, mid: 18.5, high: 25 },
  },
  steady_state_orders: {
    dark_kitchen_large: { low: 180, mid: 215, high: 250 },
    dark_kitchen_small: { low: 80, mid: 100, high: 130 },
    traditional_top: { low: 110, mid: 140, high: 180 },
    traditional_avg: { low: 40, mid: 60, high: 90 },
    grocery: { low: 60, mid: 80, high: 110 },
  },
  churn_rate: { low: 0.10, mid: 0.20, high: 0.30 },
  commission_pct: { low: 0.22, mid: 0.27, high: 0.32 },
  courier_cost_per_order: { low: 3.0, mid: 4.0, high: 6.0 },
}

export function getBenchmarkStatus(field, value, subKey = null) {
  const bench = subKey ? BENCHMARKS[field]?.[subKey] : BENCHMARKS[field]
  if (!bench) return null
  const range = isInRange(value, bench.low, bench.high)
  return { range, low: bench.low, mid: bench.mid, high: bench.high }
}
