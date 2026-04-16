import React from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import GenericWizard from './GenericWizard'

// ── Inputs ────────────────────────────────────────────────────────────────────

function D2Inputs({ config, setConfig, vocab }) {
  const channels = config.channels || []

  const updateChannel = (i, field, value) => {
    const next = channels.map((ch, idx) => idx === i ? { ...ch, [field]: value } : ch)
    setConfig(p => ({ ...p, channels: next }))
  }

  return (
    <div className="space-y-4">
      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">Canales de Adquisición</div>
        <div className="p-4 space-y-3">
          {channels.map((ch, i) => (
            <div key={i} className="grid grid-cols-3 gap-3 items-end">
              <div>
                <label className="ds-label block mb-1">Canal</label>
                <input value={ch.name}
                  onChange={e => updateChannel(i, 'name', e.target.value)}
                  className="ds-input w-full text-xs" />
              </div>
              <div>
                <label className="ds-label block mb-1">CAC ({config.currency})</label>
                <input type="number" value={ch.cac}
                  onChange={e => updateChannel(i, 'cac', Number(e.target.value))}
                  className="ds-input w-full text-xs" />
              </div>
              <div>
                <label className="ds-label block mb-1">Nuevos usuarios/semana</label>
                <input type="number" value={ch.weekly_new_users}
                  onChange={e => updateChannel(i, 'weekly_new_users', Number(e.target.value))}
                  className="ds-input w-full text-xs" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ds-card p-4">
        <div className="flex justify-between mb-2">
          <label className="ds-label">{vocab.transactions} por usuario activo por semana</label>
          <span className="text-blue-400 font-mono font-bold">{config.orders_per_active_per_week?.toFixed(1)}</span>
        </div>
        <input type="range" min={0.2} max={5} step={0.1} value={config.orders_per_active_per_week || 1.2}
          onChange={e => setConfig(p => ({ ...p, orders_per_active_per_week: Number(e.target.value) }))}
          className="w-full accent-blue-500" />
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>0.2x/sem</span><span>5x/sem</span>
        </div>
      </div>

      <div className="ds-card p-4">
        <label className="ds-label block mb-2">Curva de Retención (semanas 1-8)</label>
        <p className="text-xs text-gray-500 mb-3">Fracción de usuarios retenidos en cada semana post-adquisición</p>
        <div className="grid grid-cols-8 gap-1">
          {(config.retention_curve || []).map((v, i) => (
            <div key={i} className="text-center">
              <input type="number" min={0} max={1} step={0.01} value={v}
                onChange={e => {
                  const next = [...(config.retention_curve || [])]
                  next[i] = Math.min(1, Math.max(0, Number(e.target.value)))
                  setConfig(p => ({ ...p, retention_curve: next }))
                }}
                className="ds-input w-full text-center text-xs px-1 py-1" />
              <div className="text-[10px] text-gray-600 mt-1">S{i + 1}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Results ───────────────────────────────────────────────────────────────────

function D2Results({ result, config, vocab, scenario, scMultiplier }) {
  const s = result?.summary || {}
  const weekly = result?.weekly || []
  const channels = s.per_channel || []

  const chartData = weekly.map(w => {
    const row = { semana: `S${w.week}` }
    Object.entries(w.by_channel || {}).forEach(([k, v]) => {
      row[k] = Math.round(v * scMultiplier)
    })
    return row
  })

  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b']

  return (
    <div className="space-y-6">
      {/* Channel metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {channels.map((ch, i) => (
          <div key={i} className="metric-card">
            <div className="metric-label">{ch.name}</div>
            <div className="metric-value text-xl">{ch.ltv_cac_ratio}x LTV/CAC</div>
            <div className="text-xs text-gray-500">
              CAC: {config.currency} {ch.cac} · Payback semana {ch.payback_week}
            </div>
            <div className="text-xs text-gray-400">LTV: {config.currency} {(ch.ltv_per_user * scMultiplier).toFixed(0)}</div>
          </div>
        ))}
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="metric-card">
          <div className="metric-label">Revenue Total</div>
          <div className="metric-value text-lg">{config.currency} {((s.total_revenue || 0) * scMultiplier / 1000).toFixed(0)}K</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">LTV/CAC Promedio</div>
          <div className="metric-value text-lg">{s.avg_ltv_cac}x</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Mejor Canal</div>
          <div className="metric-value text-lg text-blue-400 text-sm">{s.best_channel}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Horizonte</div>
          <div className="metric-value text-lg">{config.horizon_weeks} sem</div>
        </div>
      </div>

      {/* Revenue by channel chart */}
      <div className="ds-card p-4">
        <div className="ds-section-header -mx-4 -mt-4 mb-4">Revenue por Canal ({vocab.transactions})</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
            <Tooltip formatter={(v, n) => [`${config.currency} ${(v/1000).toFixed(1)}K`, n]} />
            <Legend />
            {channels.map((ch, i) => (
              <Bar key={ch.name} dataKey={ch.name} stackId="a" fill={COLORS[i % COLORS.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Payback table */}
      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">Análisis de Payback por Canal</div>
        <table className="ds-table w-full">
          <thead>
            <tr>
              <th>Canal</th>
              <th>CAC</th>
              <th>LTV ({config.horizon_weeks}sem)</th>
              <th>LTV/CAC</th>
              <th>Payback</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((ch, i) => (
              <tr key={i}>
                <td className="text-gray-200 font-medium">{ch.name}</td>
                <td className="text-red-400">{config.currency} {ch.cac}</td>
                <td className="text-emerald-400">{config.currency} {(ch.ltv_per_user * scMultiplier).toFixed(0)}</td>
                <td className={ch.ltv_cac_ratio >= 3 ? 'text-emerald-400 font-bold' : ch.ltv_cac_ratio >= 1 ? 'text-amber-400' : 'text-red-400'}>
                  {(ch.ltv_cac_ratio * scMultiplier).toFixed(2)}x
                </td>
                <td className="text-blue-400">Sem {ch.payback_week}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Wizard export ─────────────────────────────────────────────────────────────

const modelConfig = {
  modelId: 'D2',
  modelName: 'Cohort Retention & LTV',
  perspective: 'D',
  apiPath: '/api/models/d2/calculate',
  description: 'Calcula cuándo recuperas el CAC por canal y qué canal de adquisición genera más LTV por peso invertido.',
  InputsComponent: D2Inputs,
  ResultsComponent: D2Results,
  defaultConfig: {
    channels: [
      { name: 'Paid Search', cac: 180, weekly_new_users: 500 },
      { name: 'Social Media', cac: 120, weekly_new_users: 800 },
      { name: 'Referral', cac: 60, weekly_new_users: 300 },
    ],
    retention_curve: [1.0, 0.65, 0.55, 0.45, 0.38, 0.32, 0.27, 0.23],
    orders_per_active_per_week: 1.2,
  },
}

export default function D2CohortWizard() {
  return <GenericWizard modelConfig={modelConfig} />
}
