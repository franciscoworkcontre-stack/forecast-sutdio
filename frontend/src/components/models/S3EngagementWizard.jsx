import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import GenericWizard from './GenericWizard'

function S3Inputs({ config, setConfig, vocab }) {
  const rests = config.restaurants || []
  const prog = config.engagement_program || {}

  const updateProg = (field, value) => {
    setConfig(p => ({ ...p, engagement_program: { ...p.engagement_program, [field]: value } }))
  }

  return (
    <div className="space-y-4">
      <div className="ds-card p-4">
        <label className="ds-label block mb-2">Tier objetivo del programa</label>
        <div className="flex gap-2">
          {['high', 'medium', 'low'].map(t => (
            <button key={t} onClick={() => setConfig(p => ({ ...p, target_tier: t }))}
              className={`px-4 py-2 rounded border text-sm font-medium transition-all ${
                config.target_tier === t
                  ? 'bg-emerald-900/40 border-emerald-600 text-emerald-300'
                  : 'border-gray-700 text-gray-400 hover:border-gray-600'
              }`}>
              {t === 'high' ? 'Alto' : t === 'medium' ? 'Medio' : 'Bajo'}
            </button>
          ))}
        </div>
      </div>

      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">Estado actual de {vocab.supply}s</div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-3">
            {rests.map((r, i) => (
              <div key={i} className={`metric-card ${config.target_tier === r.tier ? 'border-emerald-700 bg-emerald-900/10' : ''}`}>
                <div className="metric-label">{r.tier === 'high' ? 'Alto' : r.tier === 'medium' ? 'Medio' : 'Bajo'} engagement</div>
                <div className="metric-value text-xl">{r.count.toLocaleString()}</div>
                <div className="text-xs text-gray-500">{r.avg_weekly_orders} {vocab.transactions}/sem</div>
                <div className="text-xs text-gray-500">Score: {r.engagement_score}/100</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ds-card p-4">
        <div className="ds-section-header -mx-4 -mt-4 mb-4">Parámetros del Programa de Engagement</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="ds-label block mb-1">Costo por {vocab.supply} ({config.currency})</label>
            <input type="number" value={prog.cost_per_restaurant || 800}
              onChange={e => updateProg('cost_per_restaurant', Number(e.target.value))}
              className="ds-input w-full" />
          </div>
          <div>
            <div className="flex justify-between">
              <label className="ds-label">Mejora de score esperada</label>
              <span className="text-emerald-400 font-mono text-xs">+{prog.expected_score_improvement || 15}pts</span>
            </div>
            <input type="range" min={1} max={40} step={1} value={prog.expected_score_improvement || 15}
              onChange={e => updateProg('expected_score_improvement', Number(e.target.value))}
              className="w-full accent-emerald-500 mt-1" />
          </div>
          <div>
            <div className="flex justify-between">
              <label className="ds-label">{vocab.transactions} por punto de mejora</label>
              <span className="text-blue-400 font-mono text-xs">{prog.orders_per_point_improvement || 0.3}</span>
            </div>
            <input type="range" min={0.1} max={2} step={0.1} value={prog.orders_per_point_improvement || 0.3}
              onChange={e => updateProg('orders_per_point_improvement', Number(e.target.value))}
              className="w-full accent-blue-500 mt-1" />
          </div>
        </div>
      </div>
    </div>
  )
}

function S3Results({ result, config, vocab, scenario, scMultiplier }) {
  const s = result?.summary || {}
  const baseline = result?.current_baseline || {}
  const improved = result?.improved_baseline || {}
  const weekly = result?.weekly || []

  const chartData = weekly.map(w => ({
    semana: `S${w.week}`,
    baseline: Math.round(w.baseline_orders),
    total: Math.round(w.total_orders * scMultiplier),
    incremental: Math.round(w.incremental_orders * scMultiplier),
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="metric-card">
          <div className="metric-label">{vocab.transactions}/sem Actual</div>
          <div className="metric-value text-lg">{(baseline.total_weekly_orders || 0).toLocaleString()}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">{vocab.transactions}/sem Mejorado</div>
          <div className="metric-value text-lg text-emerald-400">{((improved.total_weekly_orders || 0) * scMultiplier).toLocaleString()}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">ROI del Programa</div>
          <div className={`metric-value text-lg ${(s.roi || 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {((s.roi || 0) * 100 * scMultiplier).toFixed(0)}%
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Costo Programa</div>
          <div className="metric-value text-lg text-amber-400">{config.currency} {((s.program_cost || 0) / 1000).toFixed(0)}K</div>
        </div>
      </div>

      <div className="ds-card p-4">
        <div className="ds-section-header -mx-4 -mt-4 mb-4">{vocab.transactions} semanales: Before vs. After</div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v.toLocaleString()} />
            <Tooltip formatter={(v, n) => [v.toLocaleString(), n]} />
            <Legend />
            <Line type="monotone" dataKey="baseline" stroke="#6b7280" strokeDasharray="5 5" name="Baseline" dot={false} />
            <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} name="Con programa" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="ds-card p-4">
        <div className="ds-section-header -mx-4 -mt-4 mb-3">Resumen del Programa</div>
        <div className="grid grid-cols-2 gap-4 p-2">
          <div>
            <div className="text-xs text-gray-500 mb-1">{vocab.supply}s en el programa</div>
            <div className="text-lg font-mono text-gray-200">{(s.restaurants_in_program || 0).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Tier objetivo</div>
            <div className="text-lg font-mono text-emerald-400">{s.target_tier}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Revenue incremental</div>
            <div className="text-lg font-mono text-emerald-400">{config.currency} {((s.incremental_revenue || 0) * scMultiplier / 1000).toFixed(0)}K</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">{vocab.transactions} incrementales</div>
            <div className="text-lg font-mono text-blue-400">{((s.incremental_orders_total || 0) * scMultiplier).toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

const modelConfig = {
  modelId: 'S3',
  modelName: 'Restaurant Engagement',
  perspective: 'S',
  apiPath: '/api/models/s3/calculate',
  description: 'Calcula el ROI de programas de engagement para aumentar el volumen de proveedores existentes sin incrementar el subsidio de la plataforma.',
  InputsComponent: S3Inputs,
  ResultsComponent: S3Results,
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
}

export default function S3EngagementWizard() {
  return <GenericWizard modelConfig={modelConfig} />
}
