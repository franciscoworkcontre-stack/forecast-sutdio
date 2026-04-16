import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import GenericWizard from './GenericWizard'

function S4Inputs({ config, setConfig, vocab, mode = 'base' }) {
  const rests = config.restaurants || []

  const updateRest = (i, field, value) => {
    const next = rests.map((r, idx) => idx === i ? { ...r, [field]: value } : r)
    setConfig(p => ({ ...p, restaurants: next }))
  }

  return (
    <div className="space-y-4">
      <div className="ds-card p-4">
        <div className="flex justify-between mb-2">
          <label className="ds-label">Umbral de riesgo (health score)</label>
          <span className="text-red-400 font-mono font-bold">{config.churn_threshold_score}</span>
        </div>
        <input type="range" min={20} max={70} step={5} value={config.churn_threshold_score || 40}
          onChange={e => setConfig(p => ({ ...p, churn_threshold_score: Number(e.target.value) }))}
          className="w-full accent-red-500" />
        <p className="text-xs text-gray-500 mt-1">{vocab.supply}s con score por debajo de este umbral se consideran en riesgo de churn</p>
      </div>

      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">{vocab.supply}s a Evaluar</div>
        <div className="divide-y divide-gray-800">
          {rests.map((r, i) => (
            <div key={i} className="p-3 grid grid-cols-3 gap-2">
              <div className="col-span-3 mb-1">
                <input value={r.name} onChange={e => updateRest(i, 'name', e.target.value)}
                  className="ds-input w-full text-xs font-semibold" />
              </div>
              <div>
                <label className="ds-label block mb-1">{vocab.transactions}/semana</label>
                <input type="number" value={r.weekly_orders} onChange={e => updateRest(i, 'weekly_orders', Number(e.target.value))}
                  className="ds-input w-full text-xs" />
              </div>
              <div>
                <div className="flex justify-between">
                  <label className="ds-label text-[10px]">Tendencia</label>
                  <span className={`font-mono text-[10px] ${r.order_trend_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {r.order_trend_pct > 0 ? '+' : ''}{r.order_trend_pct}%
                  </span>
                </div>
                <input type="range" min={-50} max={30} step={1} value={r.order_trend_pct}
                  onChange={e => updateRest(i, 'order_trend_pct', Number(e.target.value))}
                  className="w-full accent-blue-500" />
              </div>
              <div>
                <div className="flex justify-between">
                  <label className="ds-label text-[10px]">Rating</label>
                  <span className="text-amber-400 font-mono text-[10px]">{r.rating}</span>
                </div>
                <input type="range" min={1} max={5} step={0.1} value={r.rating}
                  onChange={e => updateRest(i, 'rating', Number(e.target.value))}
                  className="w-full accent-amber-500" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {mode === 'advanced' && (
        <div className="ds-card p-4 border-amber-900/40 bg-amber-950/10">
          <div className="text-xs font-mono font-semibold text-amber-400 mb-3">Avanzado — Pesos de señales de salud individuales</div>
          <div className="space-y-2">
            {[
              { key: 'w_order_trend', label: 'Tendencia de órdenes (4 sem)', default: 0.35 },
              { key: 'w_rating', label: 'Rating del restaurante', default: 0.25 },
              { key: 'w_menu_update', label: 'Días desde última actualización de menú', default: 0.15 },
              { key: 'w_response_rate', label: 'Tasa de respuesta / aceptación', default: 0.15 },
              { key: 'w_promo_activity', label: 'Actividad en promos', default: 0.05 },
              { key: 'w_competitive', label: 'Exposición competitiva', default: 0.05 },
            ].map(signal => (
              <div key={signal.key} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 flex-1">{signal.label}</span>
                <input type="range" min={0} max={0.60} step={0.05} value={config[signal.key] ?? signal.default}
                  onChange={e => setConfig(p => ({ ...p, [signal.key]: Number(e.target.value) }))}
                  className="w-28 accent-amber-500" />
                <span className="text-amber-400 font-mono text-xs w-10 text-right">{((config[signal.key] ?? signal.default) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-500 mt-2">Los pesos se normalizan automáticamente al 100%.</p>
        </div>
      )}
    </div>
  )
}

function S4Results({ result, config, vocab, scenario, scMultiplier }) {
  const s = result?.summary || {}
  const scored = result?.scored_restaurants || []
  const dist = result?.health_distribution || []
  const weekly = result?.weekly || []

  const distData = dist.map(d => ({
    rango: d.score_range.split(' ')[0],
    count: d.count,
    ordenes_pct: d.orders_share_pct,
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="metric-card">
          <div className="metric-label">{vocab.supply}s en Riesgo</div>
          <div className="metric-value text-lg text-red-400">{s.at_risk_count} / {s.total_restaurants}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Revenue en Riesgo</div>
          <div className="metric-value text-lg text-red-400">{config.currency} {((s.revenue_at_risk || 0) * scMultiplier / 1000).toFixed(0)}K</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Score Promedio</div>
          <div className={`metric-value text-lg ${(s.avg_health_score || 0) >= 60 ? 'text-emerald-400' : (s.avg_health_score || 0) >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
            {s.avg_health_score}/100
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Umbral Riesgo</div>
          <div className="metric-value text-lg">{config.churn_threshold_score}</div>
        </div>
      </div>

      {/* Scored restaurants */}
      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">{vocab.supply}s — Health Score (menor a mayor)</div>
        <div className="divide-y divide-gray-800">
          {scored.map((r, i) => (
            <div key={i} className={`px-4 py-3 flex items-center gap-4 ${r.at_risk ? 'bg-red-900/10' : ''}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-200">{r.name}</span>
                  {r.at_risk && <span className="text-[10px] font-mono bg-red-900/40 text-red-400 border border-red-800 px-1.5 py-0.5 rounded">EN RIESGO</span>}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {r.weekly_orders} {vocab.transactions}/sem · Rating {r.rating} · {r.response_rate}% resp.
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-mono font-bold ${r.health_score >= 60 ? 'text-emerald-400' : r.health_score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                  {r.health_score}
                </div>
                <div className="text-xs text-gray-600">score</div>
              </div>
              <div className="w-20">
                <div className="h-2 bg-gray-800 rounded-full">
                  <div className={`h-2 rounded-full ${r.health_score >= 60 ? 'bg-emerald-500' : r.health_score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${r.health_score}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ds-card p-4">
        <div className="ds-section-header -mx-4 -mt-4 mb-4">Distribución de Health Score</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={distData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="rango" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" name={`${vocab.supply}s`} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const modelConfig = {
  modelId: 'S4',
  modelName: 'Restaurant Health Score',
  perspective: 'S',
  apiPath: '/api/models/s4/calculate',
  description: 'Identifica qué proveedores están en riesgo de churn y cuánto revenue perderías si se van.',
  InputsComponent: S4Inputs,
  ResultsComponent: S4Results,
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
}

export default function S4HealthWizard() {
  return <GenericWizard modelConfig={modelConfig} />
}
