import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import GenericWizard from './GenericWizard'

function P1Inputs({ config, setConfig, vocab, mode = 'base' }) {
  const zones = config.zones || []
  const plan = config.supply_growth_plan || []

  return (
    <div className="space-y-4">
      <div className="ds-card p-4">
        <div className="flex justify-between mb-2">
          <label className="ds-label">Elasticidad del efecto de red</label>
          <span className="text-purple-400 font-mono font-bold">{config.network_effect_elasticity}</span>
        </div>
        <input type="range" min={0.05} max={1.0} step={0.05} value={config.network_effect_elasticity || 0.3}
          onChange={e => setConfig(p => ({ ...p, network_effect_elasticity: Number(e.target.value) }))}
          className="w-full accent-purple-500" />
        <p className="text-xs text-gray-500 mt-2">Por cada +10% de oferta nueva, la demanda crece en elasticidad × 10%. Rango típico: 0.2-0.5 para marketplaces maduros.</p>
      </div>

      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">Zonas Geográficas</div>
        <div className="p-4 space-y-2">
          {zones.map((z, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 items-end">
              <div>
                <label className="ds-label block mb-1">Zona</label>
                <input value={z.name} onChange={e => {
                  const next = zones.map((zz, idx) => idx === i ? { ...zz, name: e.target.value } : zz)
                  setConfig(p => ({ ...p, zones: next }))
                }} className="ds-input w-full text-xs" />
              </div>
              <div>
                <label className="ds-label block mb-1">Oferta actual</label>
                <input type="number" value={z.supply_count} onChange={e => {
                  const next = zones.map((zz, idx) => idx === i ? { ...zz, supply_count: Number(e.target.value) } : zz)
                  setConfig(p => ({ ...p, zones: next }))
                }} className="ds-input w-full text-xs" />
              </div>
              <div>
                <label className="ds-label block mb-1">Demanda semanal</label>
                <input type="number" value={z.demand_weekly} onChange={e => {
                  const next = zones.map((zz, idx) => idx === i ? { ...zz, demand_weekly: Number(e.target.value) } : zz)
                  setConfig(p => ({ ...p, zones: next }))
                }} className="ds-input w-full text-xs" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">Plan de Crecimiento de Oferta</div>
        <div className="p-4 space-y-2">
          {plan.map((sp, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-1">
                <label className="ds-label block mb-1">Semana</label>
                <input type="number" value={sp.week} min={1} max={config.horizon_weeks || 12} onChange={e => {
                  const next = plan.map((pp, idx) => idx === i ? { ...pp, week: Number(e.target.value) } : pp)
                  setConfig(p => ({ ...p, supply_growth_plan: next }))
                }} className="ds-input w-full text-xs" />
              </div>
              <div className="flex-1">
                <label className="ds-label block mb-1">Nueva oferta</label>
                <input type="number" value={sp.new_supply} onChange={e => {
                  const next = plan.map((pp, idx) => idx === i ? { ...pp, new_supply: Number(e.target.value) } : pp)
                  setConfig(p => ({ ...p, supply_growth_plan: next }))
                }} className="ds-input w-full text-xs" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {mode === 'advanced' && (
        <div className="ds-card p-4 border-amber-900/40 bg-amber-950/10">
          <div className="text-xs font-mono font-semibold text-amber-400 mb-3">Avanzado — Umbral de liquidez y doom loop</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between mb-1">
                <label className="ds-label">Umbral de liquidez mínimo (fulfillment %)</label>
                <span className="text-amber-400 font-mono text-sm">{Math.round((config.liquidity_threshold || 0.70) * 100)}%</span>
              </div>
              <input type="range" min={0.50} max={0.90} step={0.05} value={config.liquidity_threshold || 0.70}
                onChange={e => setConfig(p => ({ ...p, liquidity_threshold: Number(e.target.value) }))}
                className="w-full accent-amber-500" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="ds-label">Umbral de doom loop (demanda/semana)</label>
                <span className="text-amber-400 font-mono text-sm">{(config.doom_loop_threshold || 5000).toLocaleString()}</span>
              </div>
              <input type="number" value={config.doom_loop_threshold || 5000}
                onChange={e => setConfig(p => ({ ...p, doom_loop_threshold: Number(e.target.value) }))}
                className="ds-input w-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function P1Results({ result, config, vocab, scenario, scMultiplier }) {
  const s = result?.summary || {}
  const weekly = result?.weekly || []

  const chartData = weekly.map(w => ({
    semana: `S${w.week}`,
    demanda: Math.round(w.demand),
    ordenes: Math.round(w.orders * scMultiplier),
    fulfillment: Math.round(w.fulfillment_rate * 100),
    oferta: Math.round(w.supply),
  }))

  const phaseColors = { supply_constrained: '#ef4444', growing: '#f59e0b', mature: '#10b981' }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="metric-card">
          <div className="metric-label">{vocab.transactions} Totales</div>
          <div className="metric-value text-lg">{((s.total_orders || 0) * scMultiplier / 1000).toFixed(1)}K</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Revenue</div>
          <div className="metric-value text-lg">{config.currency} {((s.total_revenue || 0) * scMultiplier / 1000).toFixed(0)}K</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Fulfillment Final</div>
          <div className="metric-value text-lg text-emerald-400">{((s.final_fulfillment_rate || 0) * 100).toFixed(0)}%</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Fase Final</div>
          <div className={`metric-value text-sm font-semibold`} style={{ color: phaseColors[s.final_phase] || '#9ca3af' }}>
            {s.final_phase?.replace('_', ' ') || '—'}
          </div>
        </div>
      </div>

      <div className="ds-card p-4">
        <div className="ds-section-header -mx-4 -mt-4 mb-4">{vocab.transactions} y Fulfillment Rate por semana</div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={v => v.toLocaleString()} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <ReferenceLine yAxisId="right" y={85} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '85% umbral', fill: '#f59e0b', fontSize: 10 }} />
            <Line yAxisId="left" type="monotone" dataKey="ordenes" stroke="#3b82f6" strokeWidth={2} name={vocab.transactions} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="fulfillment" stroke="#10b981" strokeWidth={2} name="Fulfillment %" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">Fases de Liquidez por semana</div>
        <div className="p-4 flex flex-wrap gap-2">
          {weekly.map((w, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-white"
                style={{ backgroundColor: phaseColors[w.phase] || '#6b7280' }}>
                {w.week}
              </div>
              <div className="text-[9px] text-gray-600">{(w.fulfillment_rate * 100).toFixed(0)}%</div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 px-4 pb-3">
          {Object.entries(phaseColors).map(([phase, color]) => (
            <div key={phase} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-400">{phase.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const modelConfig = {
  modelId: 'P1',
  modelName: 'Network Effects & Liquidity',
  perspective: 'P',
  apiPath: '/api/models/p1/calculate',
  description: 'Modela cómo el crecimiento de oferta genera demanda vía efectos de red, y clasifica cada zona en fase de liquidez.',
  InputsComponent: P1Inputs,
  ResultsComponent: P1Results,
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
}

export default function P1NetworkWizard() {
  return <GenericWizard modelConfig={modelConfig} />
}
