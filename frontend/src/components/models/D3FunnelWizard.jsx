import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import GenericWizard from './GenericWizard'

function D3Inputs({ config, setConfig, vocab }) {
  const steps = config.funnel_steps || []

  const updateStep = (i, field, value) => {
    const next = steps.map((s, idx) => idx === i ? { ...s, [field]: value } : s)
    setConfig(p => ({ ...p, funnel_steps: next }))
  }

  return (
    <div className="space-y-4">
      <div className="ds-card p-4">
        <div className="flex justify-between mb-2">
          <label className="ds-label">Visitantes semanales al top del funnel</label>
          <span className="text-blue-400 font-mono font-bold">{(config.weekly_visitors || 0).toLocaleString()}</span>
        </div>
        <input type="number" value={config.weekly_visitors || 100000}
          onChange={e => setConfig(p => ({ ...p, weekly_visitors: Number(e.target.value) }))}
          className="ds-input w-full" />
      </div>

      <div className="ds-card p-4">
        <div className="flex justify-between mb-2">
          <label className="ds-label">Crecimiento semanal de tráfico</label>
          <span className="text-blue-400 font-mono font-bold">{((config.visitor_growth_pct_per_week || 0) * 100).toFixed(1)}%</span>
        </div>
        <input type="range" min={0} max={0.10} step={0.002} value={config.visitor_growth_pct_per_week || 0.01}
          onChange={e => setConfig(p => ({ ...p, visitor_growth_pct_per_week: Number(e.target.value) }))}
          className="w-full accent-blue-500" />
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>0%</span><span>10%</span>
        </div>
      </div>

      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">Pasos del Funnel y Tasas de Conversión</div>
        <div className="p-4 space-y-3">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs font-mono text-gray-500 w-5">{i + 1}</span>
              <input value={s.name}
                onChange={e => updateStep(i, 'name', e.target.value)}
                className="ds-input flex-1 text-xs" placeholder="Paso" />
              <div className="flex items-center gap-2 flex-shrink-0">
                <input type="range" min={0.01} max={1} step={0.01} value={s.conversion_rate}
                  onChange={e => updateStep(i, 'conversion_rate', Number(e.target.value))}
                  className="w-24 accent-blue-500" />
                <span className="text-blue-400 font-mono text-sm w-12 text-right">{(s.conversion_rate * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function D3Results({ result, config, vocab, scenario, scMultiplier }) {
  const s = result?.summary || {}
  const breakdown = result?.funnel_breakdown || []
  const sensitivity = result?.sensitivity || []
  const weekly = result?.weekly || []

  const chartData = weekly.map(w => ({
    semana: `S${w.week}`,
    ordenes: Math.round(w.orders * scMultiplier),
    visitantes: Math.round(w.visitors_at_top / 100),
  }))

  const sensData = sensitivity.map(s => ({
    paso: s.step.length > 12 ? s.step.slice(0, 12) + '…' : s.step,
    incremental: Math.round(s.incremental_orders_if_10pct_improvement * scMultiplier),
    mejora_pct: s.pct_improvement,
  }))

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
          <div className="metric-label">CVR Total</div>
          <div className="metric-value text-lg">{s.overall_conversion_rate?.toFixed(1)}%</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Mayor Pérdida</div>
          <div className="metric-value text-sm text-red-400">{s.biggest_drop_step}</div>
        </div>
      </div>

      <div className="ds-card p-4">
        <div className="ds-section-header -mx-4 -mt-4 mb-4">{vocab.transactions} semanales</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v.toLocaleString()}`} />
            <Tooltip formatter={(v, n) => [v.toLocaleString(), n === 'ordenes' ? vocab.transactions : 'Visitantes x100']} />
            <Bar dataKey="ordenes" fill="#3b82f6" name={vocab.transactions} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Funnel breakdown */}
      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">Volumen por Paso del Funnel (Semana 1)</div>
        <div className="p-4 space-y-2">
          {breakdown.map((b, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-300">{b.step}</span>
                <div className="text-right">
                  <span className="text-sm font-mono text-gray-100">{b.volume_out.toLocaleString()}</span>
                  <span className="text-xs text-red-400 ml-2">−{b.drop_off_pct.toFixed(0)}%</span>
                </div>
              </div>
              <div className="h-2 bg-gray-800 rounded-full">
                <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${(b.conversion_rate * 100).toFixed(0)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sensitivity analysis */}
      <div className="ds-card p-4">
        <div className="ds-section-header -mx-4 -mt-4 mb-4">Sensibilidad: +10% mejora por paso</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={sensData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis dataKey="paso" type="category" tick={{ fontSize: 10 }} width={100} />
            <Tooltip formatter={v => [v.toLocaleString(), `${vocab.transactions} incrementales`]} />
            <Bar dataKey="incremental" fill="#10b981" name={`${vocab.transactions} incrementales`} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const modelConfig = {
  modelId: 'D3',
  modelName: 'Funnel Conversion',
  perspective: 'D',
  apiPath: '/api/models/d3/calculate',
  description: 'Modela cada paso del journey del usuario y detecta dónde se pierden más órdenes potenciales.',
  InputsComponent: D3Inputs,
  ResultsComponent: D3Results,
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
}

export default function D3FunnelWizard() {
  return <GenericWizard modelConfig={modelConfig} />
}
