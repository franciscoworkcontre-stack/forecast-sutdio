import React from 'react'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import GenericWizard from './GenericWizard'

function P5Inputs({ config, setConfig, vocab }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="ds-card p-4">
          <label className="ds-label block mb-2">{vocab.transactions} semanales actuales</label>
          <input type="number" value={config.weekly_orders || 100000}
            onChange={e => setConfig(p => ({ ...p, weekly_orders: Number(e.target.value) }))}
            className="ds-input w-full" />
        </div>
        <div className="ds-card p-4">
          <div className="flex justify-between mb-2">
            <label className="ds-label">Crecimiento {vocab.transactions} %/sem</label>
            <span className="text-emerald-400 font-mono">{config.order_growth_rate_pct_per_week}%</span>
          </div>
          <input type="range" min={0} max={10} step={0.5} value={config.order_growth_rate_pct_per_week || 2}
            onChange={e => setConfig(p => ({ ...p, order_growth_rate_pct_per_week: Number(e.target.value) }))}
            className="w-full accent-emerald-500" />
        </div>
        <div className="ds-card p-4">
          <label className="ds-label block mb-2">Nuevos usuarios/semana</label>
          <input type="number" value={config.weekly_new_users || 2000}
            onChange={e => setConfig(p => ({ ...p, weekly_new_users: Number(e.target.value) }))}
            className="ds-input w-full" />
        </div>
        <div className="ds-card p-4">
          <label className="ds-label block mb-2">CAC ({config.currency})</label>
          <input type="number" value={config.cac || 180}
            onChange={e => setConfig(p => ({ ...p, cac: Number(e.target.value) }))}
            className="ds-input w-full" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="ds-card p-4">
          <label className="ds-label block mb-2">LTV promedio ({config.currency})</label>
          <input type="number" value={config.avg_ltv || 650}
            onChange={e => setConfig(p => ({ ...p, avg_ltv: Number(e.target.value) }))}
            className="ds-input w-full" />
          <p className="text-xs text-gray-600 mt-1">LTV/CAC = {config.avg_ltv && config.cac ? (config.avg_ltv / config.cac).toFixed(2) : '—'}x</p>
        </div>
        <div className="ds-card p-4">
          <label className="ds-label block mb-2">Costo variable por {vocab.transaction} ({config.currency})</label>
          <input type="number" value={config.variable_cost_per_order || 55}
            onChange={e => setConfig(p => ({ ...p, variable_cost_per_order: Number(e.target.value) }))}
            className="ds-input w-full" />
          <p className="text-xs text-gray-600 mt-1">Delivery + subsidio + COGS</p>
        </div>
      </div>

      <div className="ds-card p-4">
        <label className="ds-label block mb-2">Costos fijos por semana ({config.currency})</label>
        <input type="number" value={config.fixed_costs_per_week || 500000}
          onChange={e => setConfig(p => ({ ...p, fixed_costs_per_week: Number(e.target.value) }))}
          className="ds-input w-full" />
      </div>
    </div>
  )
}

function P5Results({ result, config, vocab, scenario, scMultiplier }) {
  const s = result?.summary || {}
  const weekly = result?.weekly || []

  const chartData = weekly.map(w => ({
    semana: `S${w.week}`,
    revenue: Math.round(w.gross_revenue * scMultiplier / 1000),
    costos_var: Math.round(w.variable_costs / 1000),
    cac: Math.round(w.cac_spend / 1000),
    fijos: Math.round(w.fixed_costs / 1000),
    net: Math.round(w.net_contribution * scMultiplier / 1000),
    burn: Math.round(w.cumulative_burn * scMultiplier / 1000000),
  }))

  const sustainable = s.is_sustainable

  return (
    <div className="space-y-6">
      {/* Sustainability badge */}
      <div className={`ds-card p-4 ${sustainable ? 'bg-emerald-900/20 border-emerald-800' : 'bg-red-900/20 border-red-800'}`}>
        <div className="flex items-center gap-3">
          <div className={`text-2xl font-bold ${sustainable ? 'text-emerald-400' : 'text-red-400'}`}>
            {sustainable ? 'SOSTENIBLE' : 'NO SOSTENIBLE'}
          </div>
          <div className="text-sm text-gray-400">
            LTV/CAC: {s.ltv_cac_ratio}x {s.ltv_cac_ratio >= 3 ? '(saludable)' : s.ltv_cac_ratio >= 1 ? '(marginal)' : '(destruye valor)'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="metric-card">
          <div className="metric-label">LTV/CAC</div>
          <div className={`metric-value text-lg ${(s.ltv_cac_ratio || 0) >= 3 ? 'text-emerald-400' : (s.ltv_cac_ratio || 0) >= 1 ? 'text-amber-400' : 'text-red-400'}`}>
            {s.ltv_cac_ratio}x
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Breakeven {vocab.transactions}/sem</div>
          <div className="metric-value text-lg">{s.breakeven_weekly_orders ? (s.breakeven_weekly_orders / 1000).toFixed(0) + 'K' : 'N/A'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Revenue Total</div>
          <div className="metric-value text-lg">{config.currency} {((s.total_gross_revenue || 0) * scMultiplier / 1000000).toFixed(1)}M</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Contribución Net Total</div>
          <div className={`metric-value text-lg ${(s.total_net_contribution || 0) * scMultiplier > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {config.currency} {((s.total_net_contribution || 0) * scMultiplier / 1000).toFixed(0)}K
          </div>
        </div>
      </div>

      <div className="ds-card p-4">
        <div className="ds-section-header -mx-4 -mt-4 mb-4">P&L Semanal ({config.currency}K)</div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}K`} />
            <Tooltip formatter={(v, n) => [`${config.currency} ${v}K`, n]} />
            <Legend />
            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#1e3a5f" name="Revenue" />
            <Area type="monotone" dataKey="costos_var" stroke="#ef4444" fill="#450a0a" stackId="costs" name="Costos variables" />
            <Area type="monotone" dataKey="cac" stroke="#f97316" fill="#431407" stackId="costs" name="CAC Spend" />
            <Area type="monotone" dataKey="fijos" stroke="#9ca3af" fill="#1f2937" stackId="costs" name="Costos fijos" />
            <Line type="monotone" dataKey="net" stroke="#10b981" strokeWidth={2} dot={false} name="Net contribución" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="ds-card p-4">
        <div className="ds-section-header -mx-4 -mt-4 mb-4">Burn Acumulado (M {config.currency})</div>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}M`} />
            <Tooltip formatter={v => [`${config.currency} ${v}M`, 'Burn acumulado']} />
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="burn" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Burn acumulado" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const modelConfig = {
  modelId: 'P5',
  modelName: 'Marketplace Equilibrium',
  perspective: 'P',
  apiPath: '/api/models/p5/calculate',
  description: 'Analiza si el negocio es sostenible: LTV/CAC, breakeven, y contribución neta semana a semana considerando todos los costos.',
  InputsComponent: P5Inputs,
  ResultsComponent: P5Results,
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
}

export default function P5EquilibriumWizard() {
  return <GenericWizard modelConfig={modelConfig} />
}
