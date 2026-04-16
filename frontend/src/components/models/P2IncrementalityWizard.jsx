import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import GenericWizard from './GenericWizard'

function P2Inputs({ config, setConfig, vocab }) {
  const campaigns = config.campaigns || []

  const updateCamp = (i, field, value) => {
    const next = campaigns.map((c, idx) => idx === i ? { ...c, [field]: value } : c)
    setConfig(p => ({ ...p, campaigns: next }))
  }

  return (
    <div className="space-y-4">
      <div className="ds-card p-3 bg-purple-950/20 border-purple-900/40">
        <p className="text-xs text-gray-400 leading-relaxed">
          La incrementalidad mide qué fracción de las órdenes promovidas son <strong className="text-purple-300">genuinamente adicionales</strong> vs. órdenes que habrían ocurrido sin el descuento (canibalización).
        </p>
      </div>

      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">Campañas Promocionales</div>
        <div className="p-4 space-y-5">
          {campaigns.map((camp, i) => (
            <div key={i} className="ds-card p-3 bg-gray-950/50">
              <input value={camp.name} onChange={e => updateCamp(i, 'name', e.target.value)}
                className="ds-input w-full mb-3 font-semibold text-xs" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="ds-label block mb-1">{vocab.transactions} promovidas/semana</label>
                  <input type="number" value={camp.promoted_orders_per_week}
                    onChange={e => updateCamp(i, 'promoted_orders_per_week', Number(e.target.value))}
                    className="ds-input w-full text-xs" />
                </div>
                <div>
                  <div className="flex justify-between">
                    <label className="ds-label text-[10px]">Uplift observado</label>
                    <span className="text-emerald-400 font-mono text-[10px]">+{(camp.uplift_observed_pct * 100).toFixed(0)}%</span>
                  </div>
                  <input type="range" min={0.05} max={1} step={0.05} value={camp.uplift_observed_pct}
                    onChange={e => updateCamp(i, 'uplift_observed_pct', Number(e.target.value))}
                    className="w-full accent-emerald-500" />
                </div>
                <div>
                  <label className="ds-label block mb-1">Descuento por {vocab.transaction} ({config.currency})</label>
                  <input type="number" value={camp.discount_per_order}
                    onChange={e => updateCamp(i, 'discount_per_order', Number(e.target.value))}
                    className="ds-input w-full text-xs" />
                </div>
                <div>
                  <label className="ds-label block mb-1">Costo adicional/{vocab.transaction} ({config.currency})</label>
                  <input type="number" value={camp.cost_per_order}
                    onChange={e => updateCamp(i, 'cost_per_order', Number(e.target.value))}
                    className="ds-input w-full text-xs" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function P2Results({ result, config, vocab, scenario, scMultiplier }) {
  const s = result?.summary || {}
  const byCampaign = result?.by_campaign || []

  const chartData = byCampaign.map(c => ({
    campaña: c.name.length > 12 ? c.name.slice(0, 12) + '…' : c.name,
    incremental: Math.round(c.true_incremental_per_week * scMultiplier),
    canibalizado: Math.round(c.cannibalized_per_week),
    roi_pct: Math.round(c.true_roi * 100 * scMultiplier),
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="metric-card">
          <div className="metric-label">{vocab.transactions} Incrementales/sem</div>
          <div className="metric-value text-lg">{((s.total_true_incremental_per_week || 0) * scMultiplier).toFixed(0)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Canibalización</div>
          <div className="metric-value text-lg text-red-400">{s.blended_cannibalization_rate_pct?.toFixed(0)}%</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">ROI Blended</div>
          <div className={`metric-value text-lg ${(s.blended_roi || 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {((s.blended_roi || 0) * 100 * scMultiplier).toFixed(0)}%
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Costo semanal</div>
          <div className="metric-value text-lg text-amber-400">{config.currency} {((s.total_weekly_cost || 0) / 1000).toFixed(0)}K</div>
        </div>
      </div>

      <div className="ds-card p-4">
        <div className="ds-section-header -mx-4 -mt-4 mb-4">{vocab.transactions}: Incremental vs. Canibalizado</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="campaña" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v, n) => [v, n]} />
            <Legend />
            <Bar dataKey="incremental" fill="#10b981" name={`${vocab.transactions} incrementales`} />
            <Bar dataKey="canibalizado" fill="#ef4444" name={`${vocab.transactions} canibalizados`} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">ROI por Campaña (True Incrementality)</div>
        <table className="ds-table w-full">
          <thead>
            <tr>
              <th>Campaña</th>
              <th>{vocab.transactions} Promo</th>
              <th>Incremental</th>
              <th>Canibalización</th>
              <th>Costo/sem</th>
              <th>ROI Real</th>
            </tr>
          </thead>
          <tbody>
            {byCampaign.map((c, i) => (
              <tr key={i}>
                <td className="text-gray-200">{c.name}</td>
                <td className="font-mono">{c.promoted_orders_per_week.toLocaleString()}</td>
                <td className="font-mono text-emerald-400">{(c.true_incremental_per_week * scMultiplier).toFixed(0)}</td>
                <td className="font-mono text-red-400">{c.cannibalization_rate_pct.toFixed(0)}%</td>
                <td className="font-mono text-amber-400">{config.currency} {(c.cost_per_week / 1000).toFixed(1)}K</td>
                <td className={`font-mono font-bold ${c.true_roi > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {(c.true_roi * 100 * scMultiplier).toFixed(0)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const modelConfig = {
  modelId: 'P2',
  modelName: 'Incrementality & Cannibalization',
  perspective: 'P',
  apiPath: '/api/models/p2/calculate',
  description: 'Separa las órdenes que tu campaña realmente generó de las que habrían ocurrido de todos modos — el ROI real de tus promos.',
  InputsComponent: P2Inputs,
  ResultsComponent: P2Results,
  defaultConfig: {
    campaigns: [
      { name: 'Cupón -20%', promoted_orders_per_week: 5000, organic_baseline: 1200, uplift_observed_pct: 0.35, discount_per_order: 58, cost_per_order: 0 },
      { name: 'Free Delivery', promoted_orders_per_week: 8000, organic_baseline: 2000, uplift_observed_pct: 0.25, discount_per_order: 0, cost_per_order: 30 },
      { name: '2x1 Flash', promoted_orders_per_week: 3000, organic_baseline: 500, uplift_observed_pct: 0.50, discount_per_order: 80, cost_per_order: 0 },
    ],
  },
}

export default function P2IncrementalityWizard() {
  return <GenericWizard modelConfig={modelConfig} />
}
