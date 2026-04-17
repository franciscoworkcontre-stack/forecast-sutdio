import React from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import GenericWizard from './GenericWizard'

function D4Inputs({ config, setConfig, vocab, mode = 'base' }) {
  const segments = config.segments || []
  const displaySegs = mode === 'base' ? segments.slice(0, 3) : segments

  const updateSeg = (i, field, value) => {
    const next = segments.map((s, idx) => idx === i ? { ...s, [field]: value } : s)
    setConfig(p => ({ ...p, segments: next }))
  }

  const addSegment = () => {
    if (segments.length < 5) {
      setConfig(p => ({ ...p, segments: [...(p.segments||[]), { name: `Segmento ${(p.segments||[]).length+1}`, users: 10000, current_freq_per_week: 1.0, target_freq_per_week: 1.5, weeks_to_achieve: 8 }] }))
    }
  }

  return (
    <div className="space-y-4">
      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">
          Segmentos de Usuarios {mode === 'base' ? '(3 segmentos)' : '(hasta 5 segmentos)'}
        </div>
        <div className="p-4 space-y-4">
          {displaySegs.map((seg, i) => (
            <div key={i} className="ds-card p-3 bg-gray-950/50">
              <div className="flex items-center gap-2 mb-3">
                <input value={seg.name}
                  onChange={e => updateSeg(i, 'name', e.target.value)}
                  className="ds-input flex-1 text-xs font-semibold" />
                <div>
                  <label className="ds-label block mb-1">Usuarios</label>
                  <input type="number" value={seg.users}
                    onChange={e => updateSeg(i, 'users', Number(e.target.value))}
                    className="ds-input w-28 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="flex justify-between">
                    <label className="ds-label">Frec. Actual</label>
                    <span className="text-blue-400 font-mono text-xs">{seg.current_freq_per_week}x/sem</span>
                  </div>
                  <input type="range" min={0.1} max={7} step={0.1} value={seg.current_freq_per_week}
                    onChange={e => updateSeg(i, 'current_freq_per_week', Number(e.target.value))}
                    className="w-full accent-blue-500 mt-1" />
                </div>
                <div>
                  <div className="flex justify-between">
                    <label className="ds-label">Frec. Objetivo</label>
                    <span className="text-emerald-400 font-mono text-xs">{seg.target_freq_per_week}x/sem</span>
                  </div>
                  <input type="range" min={0.1} max={7} step={0.1} value={seg.target_freq_per_week}
                    onChange={e => updateSeg(i, 'target_freq_per_week', Number(e.target.value))}
                    className="w-full accent-emerald-500 mt-1" />
                </div>
                <div>
                  <div className="flex justify-between">
                    <label className="ds-label">Semanas para lograr</label>
                    <span className="text-amber-400 font-mono text-xs">{seg.weeks_to_achieve}sem</span>
                  </div>
                  <input type="range" min={1} max={24} step={1} value={seg.weeks_to_achieve}
                    onChange={e => updateSeg(i, 'weeks_to_achieve', Number(e.target.value))}
                    className="w-full accent-amber-500 mt-1" />
                </div>
              </div>
            </div>
          ))}
          {mode === 'advanced' && segments.length < 5 && (
            <button onClick={addSegment} className="text-xs text-blue-400 hover:text-blue-300 border border-dashed border-blue-900 rounded px-3 py-1.5 w-full transition-colors">
              + Agregar segmento
            </button>
          )}
        </div>
      </div>

      {mode === 'advanced' && (
        <div className="ds-card p-4 border-amber-900/40 bg-amber-950/10">
          <div className="text-xs font-mono font-semibold text-amber-400 mb-3">Avanzado — Factor de canibalización entre ocasiones</div>
          <div className="flex justify-between mb-1">
            <label className="ds-label">Canibalización entre ocasiones</label>
            <span className="text-amber-400 font-mono text-sm">{Math.round((config.cannibalization_factor || 0.15) * 100)}%</span>
          </div>
          <input type="range" min={0} max={0.5} step={0.05} value={config.cannibalization_factor || 0.15}
            onChange={e => setConfig(p => ({ ...p, cannibalization_factor: Number(e.target.value) }))}
            className="w-full accent-amber-500" />
          <p className="text-xs text-gray-500 mt-2">Reducción del uplift neto por superposición entre iniciativas de frecuencia simultáneas.</p>
        </div>
      )}
    </div>
  )
}

function D4Results({ result, config, vocab, scenario, scMultiplier }) {
  const s = result?.summary || {}
  const weekly = result?.weekly || []
  const bySegment = result?.by_segment || []

  const chartData = weekly.map(w => ({
    semana: `S${w.week}`,
    base: Math.round(w.base_orders),
    incremental: Math.round(w.incremental * scMultiplier),
    revenue: Math.round(w.revenue / 1000),
  }))

  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6']

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="metric-card">
          <div className="metric-label">{vocab.transactions} Incrementales</div>
          <div className="metric-value text-lg">{((s.total_incremental_orders || 0) * scMultiplier / 1000).toFixed(1)}K</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Revenue Incremental</div>
          <div className="metric-value text-lg">{config.currency} {((s.incremental_revenue || 0) * scMultiplier / 1000).toFixed(0)}K</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Revenue Total</div>
          <div className="metric-value text-lg">{config.currency} {((s.total_revenue || 0) / 1000).toFixed(0)}K</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Horizonte</div>
          <div className="metric-value text-lg">{config.horizon_weeks} sem</div>
        </div>
      </div>

      <div className="ds-card p-4">
        <div className="ds-section-header -mx-4 -mt-4 mb-4">{vocab.transactions}: Base vs. Incremental</div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v.toLocaleString()} />
            <Tooltip formatter={(v, n) => [v.toLocaleString(), n === 'base' ? 'Base' : 'Incremental']} />
            <Legend />
            <Area type="monotone" dataKey="base" stackId="a" stroke="#3b82f6" fill="#1e3a5f" name="Base" />
            <Area type="monotone" dataKey="incremental" stackId="a" stroke="#10b981" fill="#064e3b" name="Incremental" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">Desglose por Segmento</div>
        <table className="ds-table w-full">
          <thead>
            <tr>
              <th>Segmento</th>
              <th>Usuarios</th>
              <th>Frec. Actual</th>
              <th>Frec. Objetivo</th>
              <th>{vocab.transactions} Incrementales</th>
              <th>Revenue Incremental</th>
            </tr>
          </thead>
          <tbody>
            {bySegment.map((seg, i) => (
              <tr key={i}>
                <td className="text-gray-200">{seg.name}</td>
                <td className="font-mono">{(seg.users / 1000).toFixed(0)}K</td>
                <td className="font-mono text-gray-400">{seg.current_freq}x</td>
                <td className="font-mono text-emerald-400">{seg.target_freq}x</td>
                <td className="font-mono text-blue-400">{(seg.total_incremental_orders * scMultiplier / 1000).toFixed(1)}K</td>
                <td className="font-mono text-emerald-400">{config.currency} {((seg.incremental_revenue * scMultiplier) / 1000).toFixed(0)}K</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const modelConfig = {
  modelId: 'D4',
  modelName: 'Frequency & Wallet Share',
  perspective: 'D',
  apiPath: '/api/models/d4/calculate',
  description: 'Cuantifica el upside de aumentar la frecuencia de compra en segmentos de usuarios existentes sin adquirir nuevos.',
  InputsComponent: D4Inputs,
  ResultsComponent: D4Results,
  defaultConfig: {
    segments: [
      { name: 'Baja Frecuencia', users: 50000, current_freq_per_week: 0.5, target_freq_per_week: 1.0, weeks_to_achieve: 8 },
      { name: 'Frecuencia Media', users: 30000, current_freq_per_week: 1.5, target_freq_per_week: 2.0, weeks_to_achieve: 6 },
      { name: 'Alta Frecuencia', users: 15000, current_freq_per_week: 3.0, target_freq_per_week: 3.5, weeks_to_achieve: 4 },
    ],
  },
  csvTemplates: [
    {
      key: 'segments',
      filename: 'd4_segments_template.csv',
      description: 'Segmentos de usuarios (un segmento por fila)',
      headers: ['name', 'users', 'current_freq_per_week', 'target_freq_per_week', 'weeks_to_achieve'],
      exampleRows: [
        ['Baja Frecuencia', 50000, 0.5, 1.0, 8],
        ['Frecuencia Media', 30000, 1.5, 2.0, 6],
        ['Alta Frecuencia', 15000, 3.0, 3.5, 4],
      ],
    },
  ],
}

export default function D4FrequencyWizard() {
  return <GenericWizard modelConfig={modelConfig} />
}
