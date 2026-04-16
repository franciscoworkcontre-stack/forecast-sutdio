import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import GenericWizard from './GenericWizard'

function P4Inputs({ config, setConfig, vocab }) {
  const scenarios = config.competitor_scenarios || []
  const response = config.our_response || {}

  const updateScenario = (i, field, value) => {
    const next = scenarios.map((s, idx) => idx === i ? { ...s, [field]: value } : s)
    setConfig(p => ({ ...p, competitor_scenarios: next }))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="ds-card p-4">
          <label className="ds-label block mb-2">{vocab.transactions} totales del mercado/semana</label>
          <input type="number" value={config.market_weekly_orders || 500000}
            onChange={e => setConfig(p => ({ ...p, market_weekly_orders: Number(e.target.value) }))}
            className="ds-input w-full" />
        </div>
        <div className="ds-card p-4">
          <div className="flex justify-between mb-2">
            <label className="ds-label">Nuestro market share</label>
            <span className="text-purple-400 font-mono font-bold">{config.our_market_share_pct?.toFixed(0)}%</span>
          </div>
          <input type="range" min={1} max={80} step={1} value={config.our_market_share_pct || 35}
            onChange={e => setConfig(p => ({ ...p, our_market_share_pct: Number(e.target.value) }))}
            className="w-full accent-purple-500" />
        </div>
      </div>

      <div className="ds-card p-4">
        <div className="flex justify-between mb-2">
          <label className="ds-label">Elasticidad precio (sensibilidad de share a precios)</label>
          <span className="text-blue-400 font-mono">{config.price_elasticity}</span>
        </div>
        <input type="range" min={0.1} max={2} step={0.1} value={config.price_elasticity || 0.8}
          onChange={e => setConfig(p => ({ ...p, price_elasticity: Number(e.target.value) }))}
          className="w-full accent-blue-500" />
      </div>

      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">Escenarios Competitivos</div>
        <div className="p-4 space-y-4">
          {scenarios.map((sc, i) => (
            <div key={i} className="ds-card p-3 bg-gray-950/50">
              <input value={sc.name} onChange={e => updateScenario(i, 'name', e.target.value)}
                className="ds-input w-full mb-2 text-xs" />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="ds-label block mb-1">Tipo</label>
                  <select value={sc.type} onChange={e => updateScenario(i, 'type', e.target.value)}
                    className="ds-input w-full text-xs">
                    <option value="price_cut">Baja de precios</option>
                    <option value="new_entry">Nuevo entrante</option>
                    <option value="exit">Salida</option>
                  </select>
                </div>
                <div>
                  <div className="flex justify-between">
                    <label className="ds-label text-[10px]">Magnitud</label>
                    <span className="text-red-400 font-mono text-[10px]">{sc.magnitude_pct.toFixed(0)}%</span>
                  </div>
                  <input type="range" min={1} max={40} step={1} value={sc.magnitude_pct}
                    onChange={e => updateScenario(i, 'magnitude_pct', Number(e.target.value))}
                    className="w-full accent-red-500" />
                </div>
                <div>
                  <label className="ds-label block mb-1">Semana del evento</label>
                  <input type="number" min={1} max={config.horizon_weeks || 12} value={sc.week_of_event}
                    onChange={e => updateScenario(i, 'week_of_event', Number(e.target.value))}
                    className="ds-input w-full text-xs" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ds-card p-4">
        <div className="ds-section-header -mx-4 -mt-4 mb-3">Nuestra Respuesta</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="ds-label block mb-2">Tipo de respuesta</label>
            <div className="flex gap-1 flex-wrap">
              {['match', 'ignore', 'differentiate'].map(t => (
                <button key={t} onClick={() => setConfig(p => ({ ...p, our_response: { ...p.our_response, type: t } }))}
                  className={`px-2 py-1 rounded text-xs border transition-all ${
                    response.type === t ? 'bg-purple-900/40 border-purple-600 text-purple-300' : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="ds-label block mb-1">Costo respuesta/semana ({config.currency})</label>
            <input type="number" value={response.cost_per_week || 50000}
              onChange={e => setConfig(p => ({ ...p, our_response: { ...p.our_response, cost_per_week: Number(e.target.value) } }))}
              className="ds-input w-full text-xs" />
          </div>
        </div>
      </div>
    </div>
  )
}

function P4Results({ result, config, vocab, scenario, scMultiplier }) {
  const s = result?.summary || {}
  const weekly = result?.weekly || []

  const chartData = weekly.map(w => ({
    semana: `S${w.week}`,
    ordenes: Math.round(w.our_orders * scMultiplier),
    share: parseFloat(w.our_share_pct.toFixed(1)),
    net: Math.round(w.net_revenue * scMultiplier / 1000),
  }))

  const baselineOrders = (config.market_weekly_orders || 500000) * (config.our_market_share_pct || 35) / 100

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="metric-card">
          <div className="metric-label">Share Inicial</div>
          <div className="metric-value text-lg">{s.initial_share_pct?.toFixed(1)}%</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Share Final</div>
          <div className={`metric-value text-lg ${(s.final_share_pct || 0) >= (s.initial_share_pct || 0) ? 'text-emerald-400' : 'text-red-400'}`}>
            {s.final_share_pct?.toFixed(1)}%
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Revenue vs. Baseline</div>
          <div className={`metric-value text-lg ${(s.revenue_vs_baseline || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {(s.revenue_vs_baseline || 0) >= 0 ? '+' : ''}{config.currency} {((s.revenue_vs_baseline || 0) * scMultiplier / 1000).toFixed(0)}K
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Costo de Respuesta</div>
          <div className="metric-value text-lg text-amber-400">{config.currency} {((s.total_response_cost || 0) / 1000).toFixed(0)}K</div>
        </div>
      </div>

      <div className="ds-card p-4">
        <div className="ds-section-header -mx-4 -mt-4 mb-4">Market Share y {vocab.transactions} en el tiempo</div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={v => v.toLocaleString()} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} domain={[0, 70]} />
            <Tooltip />
            <Legend />
            <ReferenceLine yAxisId="left" y={baselineOrders * scMultiplier} stroke="#6b7280" strokeDasharray="3 3" label={{ value: 'Baseline', fill: '#6b7280', fontSize: 10 }} />
            <Line yAxisId="left" type="monotone" dataKey="ordenes" stroke="#8b5cf6" strokeWidth={2} name={vocab.transactions} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="share" stroke="#f59e0b" strokeWidth={2} name="Share %" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Events timeline */}
      <div className="ds-card p-4">
        <div className="ds-section-header -mx-4 -mt-4 mb-3">Timeline de Eventos Competitivos</div>
        <div className="relative pt-4 pb-2">
          <div className="absolute left-0 right-0 h-1 bg-gray-700 top-6" />
          <div className="flex justify-between relative">
            {(config.competitor_scenarios || []).map((sc, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-gray-900" />
                <div className="text-[9px] text-center text-gray-400 max-w-16">{sc.name.slice(0, 10)}</div>
                <div className="text-[10px] font-mono text-red-400">S{sc.week_of_event}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const modelConfig = {
  modelId: 'P4',
  modelName: 'Competitive Dynamics',
  perspective: 'P',
  apiPath: '/api/models/p4/calculate',
  description: 'Simula el impacto en tus órdenes y market share ante eventos competitivos: entradas, salidas, y guerras de precios.',
  InputsComponent: P4Inputs,
  ResultsComponent: P4Results,
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
}

export default function P4CompetitiveWizard() {
  return <GenericWizard modelConfig={modelConfig} />
}
