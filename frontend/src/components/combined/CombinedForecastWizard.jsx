import React, { useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts'

// ── API base ──────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || ''

// ── Model Registry ─────────────────────────────────────────────────────────────
// Inline — intentionally no imports from individual wizard files

const MODEL_REGISTRY = {
  D2: {
    id: 'D2', name: 'Cohort Retention & LTV', perspective: 'D',
    description: '¿Cuándo recupero el CAC? ¿Qué canal es más eficiente?',
    apiPath: '/api/models/d2/calculate',
    color: '#3b82f6',
    revenueKey: 'total_revenue', ordersKey: null,
    costKey: null, isRisk: false, isIncremental: false,
    defaultConfig: {
      channels: [
        { name: 'Paid Search', cac: 180, weekly_new_users: 500 },
        { name: 'Social Media', cac: 120, weekly_new_users: 800 },
        { name: 'Referral', cac: 60, weekly_new_users: 300 },
      ],
      retention_curve: [1.0, 0.65, 0.55, 0.45, 0.38, 0.32, 0.27, 0.23],
      orders_per_active_per_week: 1.2,
    },
  },
  D3: {
    id: 'D3', name: 'Funnel Conversion', perspective: 'D',
    description: '¿En qué paso del journey pierdo la mayoría de órdenes?',
    apiPath: '/api/models/d3/calculate',
    color: '#60a5fa',
    revenueKey: 'total_revenue', ordersKey: 'total_orders',
    costKey: null, isRisk: false, isIncremental: false,
    defaultConfig: {
      weekly_visitors: 100000,
      visitor_growth_pct_per_week: 0.01,
      funnel_steps: [
        { name: 'App Open', conversion_rate: 0.55 },
        { name: 'Browse Restaurant', conversion_rate: 0.40 },
        { name: 'View Menu', conversion_rate: 0.60 },
        { name: 'Add to Cart', conversion_rate: 0.45 },
        { name: 'Place Order', conversion_rate: 0.80 },
      ],
    },
  },
  D4: {
    id: 'D4', name: 'Frequency & Wallet Share', perspective: 'D',
    description: '¿Cuánta frecuencia adicional puedo extraer de usuarios existentes?',
    apiPath: '/api/models/d4/calculate',
    color: '#93c5fd',
    revenueKey: 'total_revenue', ordersKey: 'total_orders',
    costKey: null, isRisk: false, isIncremental: true,
    defaultConfig: {
      segments: [
        { name: 'Baja Frecuencia', users: 50000, current_freq_per_week: 0.5, target_freq_per_week: 1.0, weeks_to_achieve: 8 },
        { name: 'Frecuencia Media', users: 30000, current_freq_per_week: 1.5, target_freq_per_week: 2.0, weeks_to_achieve: 6 },
        { name: 'Alta Frecuencia', users: 15000, current_freq_per_week: 3.0, target_freq_per_week: 3.5, weeks_to_achieve: 4 },
      ],
    },
  },
  D5: {
    id: 'D5', name: 'Reactivation & Winback', perspective: 'D',
    description: '¿Cuántas órdenes puedo recuperar de mi base dormida?',
    apiPath: '/api/models/d5/calculate',
    color: '#bfdbfe',
    revenueKey: 'total_revenue', ordersKey: 'total_orders',
    costKey: null, isRisk: false, isIncremental: true,
    defaultConfig: {
      churned_segments: [
        { name: '1-4 semanas inactivo', count: 15000, recency_weeks: 3, organic_reactiv_rate: 0.05 },
        { name: '1-3 meses inactivo', count: 40000, recency_weeks: 8, organic_reactiv_rate: 0.02 },
        { name: '+3 meses inactivo', count: 80000, recency_weeks: 20, organic_reactiv_rate: 0.005 },
      ],
      campaigns: [
        { name: 'Email Cupón 20%', cost_per_contacted: 5, contact_rate: 0.40, incremental_reactiv_rate: 0.10, orders_per_reactivated: 2 },
        { name: 'Push Personalizado', cost_per_contacted: 2, contact_rate: 0.55, incremental_reactiv_rate: 0.07, orders_per_reactivated: 1.5 },
      ],
    },
  },
  S1: {
    id: 'S1', name: 'Restaurant Onboarding', perspective: 'S',
    description: '¿Cuántas órdenes generarán los restaurantes que activo esta semana?',
    apiPath: '/api/models/s1/calculate',
    color: '#10b981',
    revenueKey: 'total_revenue', ordersKey: 'total_orders',
    costKey: null, isRisk: false, isIncremental: false,
    defaultConfig: {
      new_restaurants_per_week: 50,
      peak_gmv_per_restaurant_per_week: 18000,
      maturation_curve: [0.15, 0.25, 0.40, 0.55, 0.65, 0.72, 0.78, 0.83, 0.87, 0.90, 0.93, 0.95],
    },
  },
  S2: {
    id: 'S2', name: 'Portfolio & Selection Effect', perspective: 'S',
    description: '¿Más restaurantes o mejores restaurantes?',
    apiPath: '/api/models/s2/calculate',
    color: '#34d399',
    revenueKey: 'total_revenue', ordersKey: 'total_orders',
    costKey: null, isRisk: false, isIncremental: false,
    defaultConfig: {
      traffic_per_week: 500000,
      restaurant_tiers: [
        { name: 'Premium', count: 500, traffic_share: 0.30, conversion_rate: 0.18, avg_aov_multiplier: 1.4 },
        { name: 'Standard', count: 2000, traffic_share: 0.50, conversion_rate: 0.12, avg_aov_multiplier: 1.0 },
        { name: 'Economy', count: 3000, traffic_share: 0.20, conversion_rate: 0.08, avg_aov_multiplier: 0.75 },
      ],
      proposed_changes: [
        { tier_name: 'Premium', delta_count: 50, delta_conversion: 0.01 },
      ],
    },
  },
  S3: {
    id: 'S3', name: 'Restaurant Engagement', perspective: 'S',
    description: '¿Cómo subo el volumen de restaurantes existentes sin subsidiar?',
    apiPath: '/api/models/s3/calculate',
    color: '#6ee7b7',
    revenueKey: 'incremental_revenue', ordersKey: 'incremental_orders_total',
    costKey: 'program_cost', isRisk: false, isIncremental: true,
    defaultConfig: {
      target_tier: 'low',
      restaurants: [
        { tier: 'high', count: 300, avg_weekly_orders: 250, engagement_score: 80 },
        { tier: 'medium', count: 1200, avg_weekly_orders: 120, engagement_score: 55 },
        { tier: 'low', count: 2500, avg_weekly_orders: 40, engagement_score: 30 },
      ],
      engagement_program: {
        cost_per_restaurant: 800,
        expected_score_improvement: 15,
        orders_per_point_improvement: 0.3,
      },
    },
  },
  S4: {
    id: 'S4', name: 'Restaurant Health Score', perspective: 'S',
    description: '¿Qué restaurantes van a irse y cuánto revenue perdería?',
    apiPath: '/api/models/s4/calculate',
    color: '#f87171',
    revenueKey: 'revenue_at_risk', ordersKey: null,
    costKey: null, isRisk: true, isIncremental: false,
    defaultConfig: {
      churn_threshold_score: 40,
      restaurants: [
        { name: 'El Rancho', weekly_orders: 180, order_trend_pct: -15, rating: 3.8, days_since_menu_update: 90, response_rate: 0.70 },
        { name: 'Sushi Oishi', weekly_orders: 250, order_trend_pct: 5, rating: 4.5, days_since_menu_update: 14, response_rate: 0.92 },
        { name: 'Tacos Don Pedro', weekly_orders: 120, order_trend_pct: -8, rating: 3.5, days_since_menu_update: 60, response_rate: 0.60 },
        { name: 'Burger Palace', weekly_orders: 310, order_trend_pct: 2, rating: 4.2, days_since_menu_update: 7, response_rate: 0.95 },
        { name: 'La Italiana', weekly_orders: 90, order_trend_pct: -25, rating: 3.2, days_since_menu_update: 120, response_rate: 0.50 },
        { name: 'Noodle Box', weekly_orders: 200, order_trend_pct: 8, rating: 4.6, days_since_menu_update: 10, response_rate: 0.98 },
      ],
    },
  },
  P1: {
    id: 'P1', name: 'Network Effects & Liquidity', perspective: 'P',
    description: '¿Está este mercado en fase de oferta, demanda, o ya es maduro?',
    apiPath: '/api/models/p1/calculate',
    color: '#a78bfa',
    revenueKey: 'total_revenue', ordersKey: 'total_orders',
    costKey: null, isRisk: false, isIncremental: false,
    defaultConfig: {
      network_effect_elasticity: 0.3,
      zones: [
        { name: 'Centro', supply_count: 500, demand_weekly: 50000, fulfillment_rate: 0.88 },
        { name: 'Norte', supply_count: 200, demand_weekly: 25000, fulfillment_rate: 0.75 },
        { name: 'Sur', supply_count: 100, demand_weekly: 15000, fulfillment_rate: 0.65 },
      ],
      supply_growth_plan: [
        { week: 2, new_supply: 50 },
        { week: 4, new_supply: 80 },
        { week: 6, new_supply: 60 },
      ],
    },
  },
  P2: {
    id: 'P2', name: 'Incrementality & Cannibalization', perspective: 'P',
    description: '¿Cuántas de mis órdenes promovidas habrían pasado de todas formas?',
    apiPath: '/api/models/p2/calculate',
    color: '#c4b5fd',
    revenueKey: 'net_contribution', ordersKey: 'total_incremental_orders',
    costKey: 'total_cost', isRisk: false, isIncremental: true,
    defaultConfig: {
      campaigns: [
        { name: 'Cupón -20%', promoted_orders_per_week: 5000, organic_baseline: 1200, uplift_observed_pct: 0.35, discount_per_order: 58, cost_per_order: 0 },
        { name: 'Free Delivery', promoted_orders_per_week: 8000, organic_baseline: 2000, uplift_observed_pct: 0.25, discount_per_order: 0, cost_per_order: 30 },
        { name: '2x1 Flash', promoted_orders_per_week: 3000, organic_baseline: 500, uplift_observed_pct: 0.50, discount_per_order: 80, cost_per_order: 0 },
      ],
    },
  },
  P3: {
    id: 'P3', name: 'Delivery Economics & Capacity', perspective: 'P',
    description: '¿En qué punto la flota se convierte en cuello de botella?',
    apiPath: '/api/models/p3/calculate',
    color: '#ddd6fe',
    revenueKey: 'total_revenue', ordersKey: 'total_orders',
    costKey: null, isRisk: false, isIncremental: false,
    defaultConfig: {
      couriers: 2000,
      orders_per_courier_per_hour: 1.5,
      active_hours_per_day: 8.0,
      current_weekly_orders: 80000,
      order_growth_rate_pct_per_week: 2.0,
      delivery_cost_per_order: 45,
      platform_subsidy_per_order: 15,
      capacity_utilization_threshold: 0.85,
      new_couriers_per_week: 20,
    },
  },
  P4: {
    id: 'P4', name: 'Competitive Dynamics', perspective: 'P',
    description: '¿Qué pasa con mis órdenes si entra o sale un competidor?',
    apiPath: '/api/models/p4/calculate',
    color: '#8b5cf6',
    revenueKey: 'revenue_vs_baseline', ordersKey: null,
    costKey: 'total_response_cost', isRisk: false, isIncremental: false,
    defaultConfig: {
      market_weekly_orders: 500000,
      our_market_share_pct: 35,
      price_elasticity: 0.8,
      competitor_scenarios: [
        { name: 'Competidor A reduce precios', type: 'price_cut', magnitude_pct: 15, week_of_event: 3 },
        { name: 'Nuevo entrante', type: 'new_entry', magnitude_pct: 5, week_of_event: 6 },
      ],
      our_response: { type: 'match', cost_per_week: 50000 },
    },
  },
  P5: {
    id: 'P5', name: 'Marketplace Equilibrium', perspective: 'P',
    description: '¿Es mi negocio sostenible o estoy subsidiando demanda artificial?',
    apiPath: '/api/models/p5/calculate',
    color: '#7c3aed',
    revenueKey: 'total_revenue', ordersKey: 'total_orders',
    costKey: 'total_costs', isRisk: false, isIncremental: false,
    defaultConfig: {
      weekly_orders: 100000,
      cac: 180,
      weekly_new_users: 2000,
      avg_ltv: 650,
      fixed_costs_per_week: 500000,
      variable_cost_per_order: 55,
      churn_rate_pct: 5.0,
      order_growth_rate_pct_per_week: 2.0,
      new_user_growth_pct_per_week: 1.5,
    },
  },
}

const PERSPECTIVE_ORDER = ['D', 'S', 'P']
const PERSPECTIVE_LABELS = { D: 'Demanda', S: 'Oferta', P: 'Plataforma' }
const PERSPECTIVE_COLORS = { D: 'blue', S: 'emerald', P: 'purple' }
const PERSPECTIVE_BADGE = {
  D: 'bg-blue-900/40 text-blue-300 border border-blue-800',
  S: 'bg-emerald-900/40 text-emerald-300 border border-emerald-800',
  P: 'bg-purple-900/40 text-purple-300 border border-purple-800',
}

const INDUSTRY_VOCAB = {
  food_delivery: { aovLabel: 'AOV', defaultAov: 290, currency: 'MXN', transaction: 'Orden', transactions: 'Órdenes' },
  rideshare:     { aovLabel: 'Tarifa Promedio', defaultAov: 120, currency: 'MXN', transaction: 'Viaje', transactions: 'Viajes' },
  ecommerce:     { aovLabel: 'Ticket Promedio', defaultAov: 850, currency: 'MXN', transaction: 'Compra', transactions: 'Compras' },
  saas_b2b:      { aovLabel: 'ARPU Mensual', defaultAov: 250, currency: 'USD', transaction: 'Suscripción', transactions: 'Suscripciones' },
}
const DEFAULT_VOCAB = { aovLabel: 'AOV', defaultAov: 290, currency: 'MXN', transaction: 'Orden', transactions: 'Órdenes' }

function fmtK(v, currency = 'MXN') {
  if (!v && v !== 0) return '—'
  const abs = Math.abs(v)
  if (abs >= 1000000) return `${currency} ${(v / 1000000).toFixed(1)}M`
  if (abs >= 1000) return `${currency} ${(v / 1000).toFixed(0)}K`
  return `${currency} ${v.toFixed(0)}`
}

// ── Step 0: Model Selection ───────────────────────────────────────────────────

function StepSelect({ selected, onToggle }) {
  const byPerspective = PERSPECTIVE_ORDER.map(p => ({
    p,
    models: Object.values(MODEL_REGISTRY).filter(m => m.perspective === p),
  }))

  return (
    <div className="space-y-6">
      <div className="ds-card p-4 bg-amber-950/10 border-amber-900/40">
        <div className="flex gap-2">
          <span className="text-amber-400 text-sm font-mono font-bold">BETA</span>
          <p className="text-xs text-amber-300/80">
            El Combined Forecast corre cada modelo de forma independiente y muestra sus resultados juntos.
            Los números <strong>no son</strong> un P&amp;L unificado — son outputs aislados de modelos distintos.
            Úsalo para diagnóstico rápido, no para reportar cifras consolidadas a un CFO.
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-200 mb-1">Selecciona 2–5 modelos</h2>
        <p className="text-xs text-gray-500 mb-4">Elige los modelos que quieres correr en paralelo. Se usarán tus parámetros globales como punto de partida.</p>
      </div>

      {byPerspective.map(({ p, models }) => (
        <div key={p}>
          <div className={`text-xs font-mono font-bold uppercase tracking-widest mb-3 ${
            p === 'D' ? 'text-blue-400' : p === 'S' ? 'text-emerald-400' : 'text-purple-400'
          }`}>
            {p} — {PERSPECTIVE_LABELS[p]}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {models.map(m => {
              const isSelected = selected.includes(m.id)
              return (
                <button
                  key={m.id}
                  onClick={() => onToggle(m.id)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? `border-opacity-100 bg-opacity-20 ${
                          p === 'D' ? 'border-blue-600 bg-blue-900/30 text-blue-200' :
                          p === 'S' ? 'border-emerald-600 bg-emerald-900/30 text-emerald-200' :
                          'border-purple-600 bg-purple-900/30 text-purple-200'
                        }`
                      : 'border-gray-800 hover:border-gray-700 text-gray-400'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`flex-shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded mt-0.5 ${PERSPECTIVE_BADGE[p]}`}>
                      {m.id}
                    </span>
                    <div>
                      <div className="text-xs font-semibold leading-tight mb-0.5">{m.name}</div>
                      <div className="text-[11px] text-gray-500 leading-snug">{m.description}</div>
                      {m.isIncremental && (
                        <span className="inline-block mt-1 text-[9px] font-mono bg-emerald-900/40 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded">
                          INCREMENTAL
                        </span>
                      )}
                      {m.isRisk && (
                        <span className="inline-block mt-1 text-[9px] font-mono bg-red-900/40 text-red-400 border border-red-800 px-1.5 py-0.5 rounded">
                          RIESGO
                        </span>
                      )}
                    </div>
                    <div className={`ml-auto flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? p === 'D' ? 'border-blue-500 bg-blue-500' :
                          p === 'S' ? 'border-emerald-500 bg-emerald-500' :
                          'border-purple-500 bg-purple-500'
                        : 'border-gray-700'
                    }`}>
                      {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <div className="text-xs text-gray-500 text-center">
        {selected.length === 0 && 'Selecciona al menos 2 modelos para continuar'}
        {selected.length === 1 && 'Selecciona al menos 1 modelo más'}
        {selected.length >= 2 && selected.length <= 5 && `${selected.length} modelos seleccionados — listo para continuar`}
        {selected.length > 5 && <span className="text-amber-400">Máximo 5 modelos para mantener la vista clara</span>}
      </div>
    </div>
  )
}

// ── Step 1: Global Config ─────────────────────────────────────────────────────

function StepConfig({ config, setConfig, selectedIds, vocab }) {
  const selected = selectedIds.map(id => MODEL_REGISTRY[id]).filter(Boolean)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-200 mb-1">Parámetros globales</h2>
        <p className="text-xs text-gray-500">Estos valores se propagarán como contexto a todos los modelos seleccionados.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="ds-card p-4">
          <label className="ds-label block mb-2">Horizonte (semanas)</label>
          <input
            type="number" min={4} max={52} step={1}
            value={config.horizon_weeks}
            onChange={e => setConfig(p => ({ ...p, horizon_weeks: Number(e.target.value) }))}
            className="ds-input w-full"
          />
        </div>
        <div className="ds-card p-4">
          <label className="ds-label block mb-2">{vocab.aovLabel} ({config.currency})</label>
          <input
            type="number" min={1}
            value={config.aov}
            onChange={e => setConfig(p => ({ ...p, aov: Number(e.target.value) }))}
            className="ds-input w-full"
          />
        </div>
        <div className="ds-card p-4">
          <div className="flex justify-between mb-2">
            <label className="ds-label">Take Rate</label>
            <span className="text-blue-400 font-mono text-sm">{(config.take_rate * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range" min={0.05} max={0.40} step={0.01}
            value={config.take_rate}
            onChange={e => setConfig(p => ({ ...p, take_rate: Number(e.target.value) }))}
            className="w-full accent-blue-500"
          />
        </div>
        <div className="ds-card p-4">
          <label className="ds-label block mb-2">Moneda</label>
          <select
            value={config.currency}
            onChange={e => setConfig(p => ({ ...p, currency: e.target.value }))}
            className="ds-input w-full"
          >
            <option value="MXN">MXN</option>
            <option value="USD">USD</option>
            <option value="COP">COP</option>
            <option value="BRL">BRL</option>
            <option value="ARS">ARS</option>
            <option value="CLP">CLP</option>
          </select>
        </div>
      </div>

      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">Modelos seleccionados</div>
        <div className="divide-y divide-gray-800">
          {selected.map(m => (
            <div key={m.id} className="px-4 py-3 flex items-center gap-3">
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${PERSPECTIVE_BADGE[m.perspective]}`}>{m.id}</span>
              <div>
                <div className="text-xs font-semibold text-gray-200">{m.name}</div>
                <div className="text-[11px] text-gray-500">{m.description}</div>
              </div>
              <div className="ml-auto text-[10px] text-gray-600 font-mono">
                {m.isIncremental ? 'incremental' : m.isRisk ? 'riesgo' : 'baseline'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ds-card p-3 bg-gray-900/30 border-gray-800">
        <p className="text-xs text-gray-500">
          Cada modelo usa sus propios parámetros específicos (zonas, canales, campañas, etc.) con los valores por defecto.
          Para ajustar parámetros avanzados, usa cada modelo individualmente desde <Link to="/new" className="text-blue-400 hover:underline">Nuevo Forecast</Link>.
        </p>
      </div>
    </div>
  )
}

// ── Step 2: Results ───────────────────────────────────────────────────────────

function ModelResultCard({ modelId, result, config, loading, error }) {
  const m = MODEL_REGISTRY[modelId]
  if (!m) return null

  const s = result?.summary || {}

  const primaryValue = s[m.revenueKey]
  const ordersValue = m.ordersKey ? s[m.ordersKey] : null
  const costValue = m.costKey ? s[m.costKey] : null

  if (loading) {
    return (
      <div className="ds-card p-4 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${PERSPECTIVE_BADGE[m.perspective]}`}>{m.id}</span>
          <span className="text-sm font-semibold text-gray-300">{m.name}</span>
        </div>
        <div className="space-y-2">
          <div className="h-8 bg-gray-800 rounded w-3/4" />
          <div className="h-4 bg-gray-800 rounded w-1/2" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="ds-card p-4 border-red-900/40">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${PERSPECTIVE_BADGE[m.perspective]}`}>{m.id}</span>
          <span className="text-sm font-semibold text-red-400">{m.name}</span>
        </div>
        <p className="text-xs text-red-400">Error: {error}</p>
      </div>
    )
  }

  if (!result) return null

  const currency = config.currency || 'MXN'

  return (
    <div className="ds-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${PERSPECTIVE_BADGE[m.perspective]}`}>{m.id}</span>
        <span className="text-sm font-semibold text-gray-200">{m.name}</span>
        {m.isIncremental && (
          <span className="ml-auto text-[9px] font-mono bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 px-1.5 py-0.5 rounded">INCREMENTAL</span>
        )}
        {m.isRisk && (
          <span className="ml-auto text-[9px] font-mono bg-red-900/30 text-red-400 border border-red-800/50 px-1.5 py-0.5 rounded">RIESGO</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {primaryValue !== undefined && primaryValue !== null && (
          <div>
            <div className="text-[10px] text-gray-500 mb-0.5">
              {m.isRisk ? 'Revenue en riesgo' : m.isIncremental ? 'Revenue incremental' : 'Revenue total'}
            </div>
            <div className={`text-lg font-mono font-bold ${
              m.isRisk ? 'text-red-400' : primaryValue >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {fmtK(primaryValue, currency)}
            </div>
          </div>
        )}
        {ordersValue !== undefined && ordersValue !== null && (
          <div>
            <div className="text-[10px] text-gray-500 mb-0.5">
              {m.isIncremental ? 'Órdenes incrementales' : 'Órdenes totales'}
            </div>
            <div className="text-lg font-mono font-bold text-blue-400">
              {Number(ordersValue).toLocaleString()}
            </div>
          </div>
        )}
        {costValue !== undefined && costValue !== null && (
          <div>
            <div className="text-[10px] text-gray-500 mb-0.5">Costo</div>
            <div className="text-lg font-mono font-bold text-amber-400">
              {fmtK(costValue, currency)}
            </div>
          </div>
        )}
        {/* Show a few extra summary keys */}
        {Object.entries(s).filter(([k]) => !['total_revenue', 'total_orders', 'net_contribution', 'revenue_at_risk', 'incremental_revenue', 'incremental_orders_total', 'program_cost', 'total_cost', 'total_costs', 'revenue_vs_baseline', 'total_response_cost', 'total_incremental_orders'].includes(k)).slice(0, 2).map(([k, v]) => (
          typeof v === 'number' && (
            <div key={k}>
              <div className="text-[10px] text-gray-500 mb-0.5">{k.replace(/_/g, ' ')}</div>
              <div className="text-sm font-mono text-gray-300">
                {Math.abs(v) < 1 ? `${(v * 100).toFixed(1)}%` : Math.abs(v) > 10000 ? fmtK(v, '') : v.toFixed(1)}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  )
}

function AggregatePanel({ results, selectedIds, config }) {
  const currency = config.currency || 'MXN'

  // Separate models by type for aggregation
  const incrementalRevenue = selectedIds
    .filter(id => MODEL_REGISTRY[id]?.isIncremental && !MODEL_REGISTRY[id]?.isRisk)
    .reduce((sum, id) => {
      const s = results[id]?.result?.summary || {}
      const m = MODEL_REGISTRY[id]
      return sum + (s[m.revenueKey] || 0)
    }, 0)

  const riskRevenue = selectedIds
    .filter(id => MODEL_REGISTRY[id]?.isRisk)
    .reduce((sum, id) => {
      const s = results[id]?.result?.summary || {}
      const m = MODEL_REGISTRY[id]
      return sum + (s[m.revenueKey] || 0)
    }, 0)

  const baselineRevenue = selectedIds
    .filter(id => !MODEL_REGISTRY[id]?.isIncremental && !MODEL_REGISTRY[id]?.isRisk)
    .reduce((sum, id) => {
      const s = results[id]?.result?.summary || {}
      const m = MODEL_REGISTRY[id]
      const v = s[m.revenueKey]
      return sum + (v || 0)
    }, 0)

  // Chart data: one bar per model
  const chartData = selectedIds.map(id => {
    const m = MODEL_REGISTRY[id]
    const s = results[id]?.result?.summary || {}
    const v = s[m?.revenueKey] || 0
    return {
      name: id,
      value: Math.round(Math.abs(v) / 1000),
      isRisk: m?.isRisk || false,
      fill: m?.color || '#6b7280',
    }
  })

  return (
    <div className="space-y-4">
      <div className="ds-card p-4 border-gray-700">
        <div className="ds-section-header -mx-4 -mt-4 mb-4">Diagnóstico Agregado</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {baselineRevenue > 0 && (
            <div className="metric-card">
              <div className="metric-label">Revenue Baseline (suma)</div>
              <div className="metric-value text-base text-emerald-400">{fmtK(baselineRevenue, currency)}</div>
              <div className="text-[10px] text-gray-600 mt-1">Modelos de flujo total</div>
            </div>
          )}
          {incrementalRevenue > 0 && (
            <div className="metric-card">
              <div className="metric-label">Revenue Incremental (suma)</div>
              <div className="metric-value text-base text-blue-400">{fmtK(incrementalRevenue, currency)}</div>
              <div className="text-[10px] text-gray-600 mt-1">Oportunidades identificadas</div>
            </div>
          )}
          {riskRevenue > 0 && (
            <div className="metric-card">
              <div className="metric-label">Revenue en Riesgo</div>
              <div className="metric-value text-base text-red-400">-{fmtK(riskRevenue, currency)}</div>
              <div className="text-[10px] text-gray-600 mt-1">Escenarios de pérdida</div>
            </div>
          )}
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="ds-card p-4">
          <div className="ds-section-header -mx-4 -mt-4 mb-4">Revenue por Modelo ({currency} K)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${v}K`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={32} />
              <Tooltip formatter={v => [`${currency} ${v}K`, 'Revenue']} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.isRisk ? '#ef4444' : entry.fill} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="ds-card p-3 bg-amber-950/10 border-amber-900/30">
        <p className="text-[11px] text-amber-300/70 leading-relaxed">
          <strong className="text-amber-400">Nota metodológica:</strong> Baseline y modelos incrementales no son sumables directamente
          — los modelos de "baseline" miden el negocio total, los "incrementales" miden uplift marginal.
          Sumar ambos resultaría en doble conteo. Usa este diagnóstico para priorizar iniciativas, no para reportar GMV total.
        </p>
      </div>
    </div>
  )
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export default function CombinedForecastWizard() {
  const [searchParams] = useSearchParams()
  const industryId = searchParams.get('industry')
  const vocab = INDUSTRY_VOCAB[industryId] || DEFAULT_VOCAB

  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState(['D2', 'D3', 'S1', 'P3'])
  const [globalConfig, setGlobalConfig] = useState({
    horizon_weeks: 12,
    aov: vocab.defaultAov,
    take_rate: 0.22,
    currency: vocab.currency,
  })
  const [results, setResults] = useState({}) // { [modelId]: { result, error, loading } }
  const [running, setRunning] = useState(false)
  const [excelLoading, setExcelLoading] = useState(false)

  const toggleModel = useCallback((id) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 5 ? [...prev, id] : prev
    )
  }, [])

  const handleRun = async () => {
    setRunning(true)
    const initialState = {}
    selected.forEach(id => { initialState[id] = { loading: true, result: null, error: null } })
    setResults(initialState)

    await Promise.allSettled(
      selected.map(async (id) => {
        const m = MODEL_REGISTRY[id]
        if (!m) return
        const payload = { ...globalConfig, ...m.defaultConfig }
        try {
          const resp = await fetch(`${API_BASE}${m.apiPath}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          if (!resp.ok) {
            const err = await resp.text()
            setResults(prev => ({ ...prev, [id]: { loading: false, result: null, error: err } }))
          } else {
            const data = await resp.json()
            setResults(prev => ({ ...prev, [id]: { loading: false, result: data, error: null } }))
          }
        } catch (e) {
          setResults(prev => ({ ...prev, [id]: { loading: false, result: null, error: e.message } }))
        }
      })
    )
    setRunning(false)
  }

  const handleExcel = async () => {
    setExcelLoading(true)
    try {
      const payload = {
        global_config: globalConfig,
        models: selected.map(id => ({
          model_id: id,
          model_name: MODEL_REGISTRY[id]?.name || id,
          config: { ...globalConfig, ...MODEL_REGISTRY[id]?.defaultConfig },
          result: results[id]?.result || null,
        })).filter(m => m.result),
      }
      const resp = await fetch(`${API_BASE}/api/combined/export-excel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!resp.ok) throw new Error('Export failed')
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `combined_forecast_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Excel export failed', e)
    } finally {
      setExcelLoading(false)
    }
  }

  const hasResults = selected.some(id => results[id]?.result)
  const allDone = selected.length > 0 && selected.every(id => results[id] && !results[id].loading)
  const canAdvance = [
    selected.length >= 2 && selected.length <= 5,
    true,
    true,
  ]

  const STEPS = ['Modelos', 'Configuración', 'Resultados']

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/new" className="btn-ghost text-xs">← Modelos</Link>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-200 font-mono">Combined Forecast</span>
              <span className="text-[10px] font-mono bg-amber-700/60 text-amber-300 px-1.5 py-0.5 rounded">BETA</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <React.Fragment key={i}>
                <button
                  onClick={() => { if (i < step || (i === step + 1 && canAdvance[step])) setStep(i) }}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                    step === i ? 'bg-blue-900/40 text-blue-300' :
                    i < step ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                    step === i ? 'bg-blue-600 text-white' :
                    i < step ? 'bg-gray-700 text-gray-400' : 'bg-gray-800 text-gray-600'
                  }`}>{i + 1}</span>
                  <span className="hidden sm:inline">{s}</span>
                </button>
                {i < STEPS.length - 1 && <span className="text-gray-700 text-xs">›</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Step 0 */}
        {step === 0 && (
          <>
            <StepSelect selected={selected} onToggle={toggleModel} />
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setStep(1)}
                disabled={selected.length < 2 || selected.length > 5}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Configurar parámetros →
              </button>
            </div>
          </>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <>
            <StepConfig
              config={globalConfig}
              setConfig={setGlobalConfig}
              selectedIds={selected}
              vocab={vocab}
            />
            <div className="mt-6 flex justify-between">
              <button onClick={() => setStep(0)} className="btn-ghost">← Modelos</button>
              <button onClick={() => { setStep(2); handleRun() }} className="btn-primary">
                Correr {selected.length} modelos →
              </button>
            </div>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-200">Resultados combinados</h2>
                <p className="text-xs text-gray-500">{selected.length} modelos · {globalConfig.horizon_weeks} semanas · {globalConfig.currency}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setResults({}); handleRun() }}
                  disabled={running}
                  className="btn-secondary text-xs disabled:opacity-40"
                >
                  {running ? '...' : '↺ Re-correr'}
                </button>
                {allDone && hasResults && (
                  <button
                    onClick={handleExcel}
                    disabled={excelLoading}
                    className="btn-secondary text-xs disabled:opacity-40"
                  >
                    {excelLoading ? 'Exportando...' : '⬇ Excel'}
                  </button>
                )}
                <button onClick={() => setStep(1)} className="btn-ghost text-xs">← Config</button>
              </div>
            </div>

            {/* Aggregate panel — show once all done */}
            {allDone && hasResults && (
              <AggregatePanel results={results} selectedIds={selected} config={globalConfig} />
            )}

            {/* Per-model cards */}
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-gray-500 mb-3">Resultados por modelo</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selected.map(id => (
                  <ModelResultCard
                    key={id}
                    modelId={id}
                    result={results[id]?.result}
                    config={globalConfig}
                    loading={results[id]?.loading || false}
                    error={results[id]?.error}
                  />
                ))}
              </div>
            </div>

            {/* Links to individual models */}
            {allDone && (
              <div className="ds-card p-4">
                <div className="ds-section-header -mx-4 -mt-4 mb-3">Explorar en detalle</div>
                <div className="flex flex-wrap gap-2">
                  {selected.map(id => {
                    const m = MODEL_REGISTRY[id]
                    const paths = {
                      D2: '/models/d2', D3: '/models/d3', D4: '/models/d4', D5: '/models/d5',
                      S1: '/models/s1', S2: '/models/s2', S3: '/models/s3', S4: '/models/s4',
                      P1: '/models/p1', P2: '/models/p2', P3: '/models/p3', P4: '/models/p4', P5: '/models/p5',
                    }
                    return (
                      <Link
                        key={id}
                        to={paths[id] || '/new'}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-gray-700 hover:border-gray-600 text-xs text-gray-400 hover:text-gray-200 transition-colors"
                      >
                        <span className={`text-[9px] font-mono font-bold px-1 py-0.5 rounded ${PERSPECTIVE_BADGE[m?.perspective || 'D']}`}>{id}</span>
                        {m?.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
