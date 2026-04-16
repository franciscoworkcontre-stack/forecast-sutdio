import React from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import GenericWizard from './GenericWizard'

function S2Inputs({ config, setConfig, vocab, mode = 'base' }) {
  const tiers = config.restaurant_tiers || []
  const changes = config.proposed_changes || []

  const updateTier = (i, field, value) => {
    const next = tiers.map((t, idx) => idx === i ? { ...t, [field]: value } : t)
    setConfig(p => ({ ...p, restaurant_tiers: next }))
  }

  const updateChange = (i, field, value) => {
    const next = changes.map((c, idx) => idx === i ? { ...c, [field]: value } : c)
    setConfig(p => ({ ...p, proposed_changes: next }))
  }

  return (
    <div className="space-y-4">
      <div className="ds-card p-4">
        <label className="ds-label block mb-2">Tráfico semanal total a la plataforma</label>
        <input type="number" value={config.traffic_per_week || 500000}
          onChange={e => setConfig(p => ({ ...p, traffic_per_week: Number(e.target.value) }))}
          className="ds-input w-full" />
      </div>

      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">Tiers de {vocab.supply}s (portafolio actual)</div>
        <div className="p-4 space-y-3">
          {tiers.map((t, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 items-end">
              <div>
                <label className="ds-label block mb-1">Tier</label>
                <input value={t.name} onChange={e => updateTier(i, 'name', e.target.value)}
                  className="ds-input w-full text-xs" />
              </div>
              <div>
                <label className="ds-label block mb-1">Cantidad</label>
                <input type="number" value={t.count} onChange={e => updateTier(i, 'count', Number(e.target.value))}
                  className="ds-input w-full text-xs" />
              </div>
              <div>
                <div className="flex justify-between">
                  <label className="ds-label text-[10px]">Traffic share</label>
                  <span className="text-blue-400 font-mono text-[10px]">{(t.traffic_share * 100).toFixed(0)}%</span>
                </div>
                <input type="range" min={0.01} max={1} step={0.01} value={t.traffic_share}
                  onChange={e => updateTier(i, 'traffic_share', Number(e.target.value))}
                  className="w-full accent-blue-500" />
              </div>
              <div>
                <div className="flex justify-between">
                  <label className="ds-label text-[10px]">Conversión</label>
                  <span className="text-emerald-400 font-mono text-[10px]">{(t.conversion_rate * 100).toFixed(0)}%</span>
                </div>
                <input type="range" min={0.01} max={0.5} step={0.01} value={t.conversion_rate}
                  onChange={e => updateTier(i, 'conversion_rate', Number(e.target.value))}
                  className="w-full accent-emerald-500" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">Cambios Propuestos</div>
        <div className="p-4 space-y-3">
          {changes.map((c, i) => (
            <div key={i} className="grid grid-cols-3 gap-3 items-end">
              <div>
                <label className="ds-label block mb-1">Tier</label>
                <select value={c.tier_name} onChange={e => updateChange(i, 'tier_name', e.target.value)}
                  className="ds-input w-full text-xs">
                  {tiers.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="ds-label block mb-1">Delta {vocab.supply}s</label>
                <input type="number" value={c.delta_count} onChange={e => updateChange(i, 'delta_count', Number(e.target.value))}
                  className="ds-input w-full text-xs" />
              </div>
              <div>
                <div className="flex justify-between">
                  <label className="ds-label text-[10px]">Delta conversión</label>
                  <span className="text-amber-400 font-mono text-[10px]">{(c.delta_conversion * 100).toFixed(1)}pp</span>
                </div>
                <input type="range" min={-0.05} max={0.10} step={0.005} value={c.delta_conversion}
                  onChange={e => updateChange(i, 'delta_conversion', Number(e.target.value))}
                  className="w-full accent-amber-500" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {mode === 'advanced' && (
        <div className="ds-card p-4 border-amber-900/40 bg-amber-950/10">
          <div className="text-xs font-mono font-semibold text-amber-400 mb-3">Avanzado — Split nuevo vs. existente</div>
          <div className="flex justify-between mb-1">
            <label className="ds-label">% {vocab.supply}s nuevos en portafolio</label>
            <span className="text-amber-400 font-mono text-sm">{Math.round((config.new_supply_pct || 0.20) * 100)}%</span>
          </div>
          <input type="range" min={0.05} max={0.60} step={0.05} value={config.new_supply_pct || 0.20}
            onChange={e => setConfig(p => ({ ...p, new_supply_pct: Number(e.target.value) }))}
            className="w-full accent-amber-500" />
          <p className="text-xs text-gray-500 mt-2">Los {vocab.supply}s nuevos tienen menor conversión inicial hasta que maduran.</p>
        </div>
      )}
    </div>
  )
}

function S2Results({ result, config, vocab, scenario, scMultiplier }) {
  const s = result?.summary || {}
  const weekly = result?.weekly || []
  const byTier = result?.by_tier || []

  const chartData = weekly.map(w => ({
    semana: `S${w.week}`,
    base: Math.round(w.baseline_revenue * scMultiplier / 1000),
    cambios: Math.round(w.with_changes_revenue * scMultiplier / 1000),
    uplift: Math.round(w.uplift_revenue * scMultiplier / 1000),
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="metric-card">
          <div className="metric-label">Revenue Base</div>
          <div className="metric-value text-lg">{config.currency} {((s.total_baseline_revenue || 0) * scMultiplier / 1000).toFixed(0)}K</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Revenue con Cambios</div>
          <div className="metric-value text-lg text-emerald-400">{config.currency} {((s.total_with_changes_revenue || 0) * scMultiplier / 1000).toFixed(0)}K</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Uplift Total</div>
          <div className="metric-value text-lg text-blue-400">{config.currency} {((s.total_uplift_revenue || 0) * scMultiplier / 1000).toFixed(0)}K</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Uplift %</div>
          <div className="metric-value text-lg text-emerald-400">+{(s.uplift_pct || 0).toFixed(1)}%</div>
        </div>
      </div>

      <div className="ds-card p-4">
        <div className="ds-section-header -mx-4 -mt-4 mb-4">Revenue: Base vs. Con Cambios (K {config.currency})</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}K`} />
            <Tooltip formatter={(v, n) => [`${config.currency} ${v}K`, n]} />
            <Legend />
            <Bar dataKey="base" fill="#1e3a5f" name="Baseline" />
            <Bar dataKey="uplift" fill="#10b981" stackId="a" name="Uplift" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">Desglose por Tier</div>
        <table className="ds-table w-full">
          <thead>
            <tr>
              <th>Tier</th>
              <th>Cantidad</th>
              <th>Traffic Share</th>
              <th>Conversión</th>
              <th>{vocab.transactions}/semana</th>
              <th>AOV multiplier</th>
            </tr>
          </thead>
          <tbody>
            {byTier.map((t, i) => (
              <tr key={i}>
                <td className="text-gray-200 font-medium">{t.name}</td>
                <td className="font-mono">{t.count.toLocaleString()}</td>
                <td className="font-mono">{t.traffic_share_pct}%</td>
                <td className="font-mono text-blue-400">{t.conversion_rate_pct}%</td>
                <td className="font-mono">{t.weekly_orders.toLocaleString()}</td>
                <td className="font-mono text-amber-400">{t.aov_multiplier}x</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const modelConfig = {
  modelId: 'S2',
  modelName: 'Portfolio & Selection Effect',
  perspective: 'S',
  apiPath: '/api/models/s2/calculate',
  description: 'Compara el impacto de agregar más proveedores vs. mejorar la conversión de los existentes — "más o mejores".',
  InputsComponent: S2Inputs,
  ResultsComponent: S2Results,
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
}

export default function S2PortfolioWizard() {
  return <GenericWizard modelConfig={modelConfig} />
}
