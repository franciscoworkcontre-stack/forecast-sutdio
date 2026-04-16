import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import GenericWizard from './GenericWizard'

function D5Inputs({ config, setConfig, vocab }) {
  const campaigns = config.campaigns || []

  const updateCamp = (i, field, value) => {
    const next = campaigns.map((c, idx) => idx === i ? { ...c, [field]: value } : c)
    setConfig(p => ({ ...p, campaigns: next }))
  }

  return (
    <div className="space-y-4">
      <div className="ds-card p-4">
        <div className="ds-section-header -mx-4 -mt-4 mb-4">Resumen de Usuarios Dormidos</div>
        <div className="grid grid-cols-3 gap-3">
          {(config.churned_segments || []).map((seg, i) => (
            <div key={i} className="metric-card">
              <div className="metric-label">{seg.name}</div>
              <div className="metric-value text-xl">{(seg.count / 1000).toFixed(0)}K</div>
              <div className="text-xs text-gray-500">Reac. orgánica: {(seg.organic_reactiv_rate * 100).toFixed(0)}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">Campañas de Reactivación</div>
        <div className="p-4 space-y-4">
          {campaigns.map((camp, i) => (
            <div key={i} className="ds-card p-3 bg-gray-950/50">
              <input value={camp.name}
                onChange={e => updateCamp(i, 'name', e.target.value)}
                className="ds-input w-full mb-3 font-semibold text-xs" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between">
                    <label className="ds-label">Tasa de contacto</label>
                    <span className="text-blue-400 font-mono text-xs">{(camp.contact_rate * 100).toFixed(0)}%</span>
                  </div>
                  <input type="range" min={0.05} max={1} step={0.05} value={camp.contact_rate}
                    onChange={e => updateCamp(i, 'contact_rate', Number(e.target.value))}
                    className="w-full accent-blue-500" />
                </div>
                <div>
                  <div className="flex justify-between">
                    <label className="ds-label">Reactivación incremental</label>
                    <span className="text-emerald-400 font-mono text-xs">{(camp.incremental_reactiv_rate * 100).toFixed(0)}%</span>
                  </div>
                  <input type="range" min={0.01} max={0.30} step={0.01} value={camp.incremental_reactiv_rate}
                    onChange={e => updateCamp(i, 'incremental_reactiv_rate', Number(e.target.value))}
                    className="w-full accent-emerald-500" />
                </div>
                <div>
                  <label className="ds-label block mb-1">Costo por contactado ({config.currency})</label>
                  <input type="number" value={camp.cost_per_contacted}
                    onChange={e => updateCamp(i, 'cost_per_contacted', Number(e.target.value))}
                    className="ds-input w-full text-xs" />
                </div>
                <div>
                  <div className="flex justify-between">
                    <label className="ds-label">{vocab.transactions} por reactivado</label>
                    <span className="text-amber-400 font-mono text-xs">{camp.orders_per_reactivated}x</span>
                  </div>
                  <input type="range" min={0.5} max={5} step={0.5} value={camp.orders_per_reactivated}
                    onChange={e => updateCamp(i, 'orders_per_reactivated', Number(e.target.value))}
                    className="w-full accent-amber-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function D5Results({ result, config, vocab, scenario, scMultiplier }) {
  const s = result?.summary || {}
  const byCampaign = result?.by_campaign || []
  const weekly = result?.weekly || []

  const roiData = byCampaign.map(c => ({
    campaña: c.name.length > 14 ? c.name.slice(0, 14) + '…' : c.name,
    roi_pct: Math.round(c.roi * 100 * scMultiplier),
    revenue: Math.round(c.revenue * scMultiplier / 1000),
    cost: Math.round(c.cost / 1000),
  }))

  const weeklyData = weekly.map(w => ({
    semana: `S${w.week}`,
    ordenes: Math.round(w.incremental_orders * scMultiplier),
    costo: Math.round(w.cost / 1000),
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="metric-card">
          <div className="metric-label">Usuarios Reactivados</div>
          <div className="metric-value text-lg">{((s.total_reactivated_users || 0) * scMultiplier / 1000).toFixed(1)}K</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Revenue Incremental</div>
          <div className="metric-value text-lg">{config.currency} {((s.total_revenue || 0) * scMultiplier / 1000).toFixed(0)}K</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">ROI Blended</div>
          <div className={`metric-value text-lg ${(s.blended_roi || 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {((s.blended_roi || 0) * 100 * scMultiplier).toFixed(0)}%
          </div>
        </div>
      </div>

      <div className="ds-card p-4">
        <div className="ds-section-header -mx-4 -mt-4 mb-4">ROI por Campaña</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={roiData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="campaña" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v, n) => [n === 'roi_pct' ? `${v}%` : `${config.currency} ${v}K`, n === 'roi_pct' ? 'ROI' : 'Revenue']} />
            <Bar dataKey="roi_pct" fill="#10b981" name="ROI %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">Detalle por Campaña</div>
        <table className="ds-table w-full">
          <thead>
            <tr>
              <th>Campaña</th>
              <th>Reactivados</th>
              <th>{vocab.transactions}</th>
              <th>Revenue</th>
              <th>Costo</th>
              <th>ROI</th>
            </tr>
          </thead>
          <tbody>
            {byCampaign.map((c, i) => (
              <tr key={i}>
                <td className="text-gray-200">{c.name}</td>
                <td className="font-mono">{(c.reactivated_users * scMultiplier).toFixed(0)}</td>
                <td className="font-mono">{(c.incremental_orders * scMultiplier).toFixed(0)}</td>
                <td className="font-mono text-emerald-400">{config.currency} {((c.revenue * scMultiplier) / 1000).toFixed(0)}K</td>
                <td className="font-mono text-red-400">{config.currency} {(c.cost / 1000).toFixed(0)}K</td>
                <td className={`font-mono font-bold ${c.roi > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {(c.roi * 100 * scMultiplier).toFixed(0)}%
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
  modelId: 'D5',
  modelName: 'Reactivation & Winback',
  perspective: 'D',
  apiPath: '/api/models/d5/calculate',
  description: 'Calcula el ROI de campañas de reactivación sobre tu base de usuarios dormidos, separando el efecto incremental del orgánico.',
  InputsComponent: D5Inputs,
  ResultsComponent: D5Results,
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
}

export default function D5WinbackWizard() {
  return <GenericWizard modelConfig={modelConfig} />
}
