import React from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import GenericWizard from './GenericWizard'

function S1Inputs({ config, setConfig, vocab }) {
  return (
    <div className="space-y-4">
      <div className="ds-card p-4">
        <div className="flex justify-between mb-2">
          <label className="ds-label">Nuevos {vocab.supply}s activados por semana</label>
          <span className="text-emerald-400 font-mono font-bold">{config.new_restaurants_per_week}</span>
        </div>
        <input type="range" min={5} max={500} step={5} value={config.new_restaurants_per_week || 50}
          onChange={e => setConfig(p => ({ ...p, new_restaurants_per_week: Number(e.target.value) }))}
          className="w-full accent-emerald-500" />
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>5/sem</span><span>500/sem</span>
        </div>
      </div>

      <div className="ds-card p-4">
        <label className="ds-label block mb-2">GMV pico por {vocab.supply} por semana ({config.currency})</label>
        <input type="number" value={config.peak_gmv_per_restaurant_per_week || 18000}
          onChange={e => setConfig(p => ({ ...p, peak_gmv_per_restaurant_per_week: Number(e.target.value) }))}
          className="ds-input w-full" />
        <p className="text-xs text-gray-500 mt-2">GMV semanal que genera el {vocab.supply} cuando ya está maduro (semanas 10+)</p>
      </div>

      <div className="ds-card p-4">
        <label className="ds-label block mb-3">Curva de Maduración (% del GMV pico por semana de edad)</label>
        <div className="grid grid-cols-6 gap-1 mb-2">
          {(config.maturation_curve || []).map((v, i) => (
            <div key={i} className="text-center">
              <input type="number" min={0} max={1} step={0.01} value={v}
                onChange={e => {
                  const next = [...(config.maturation_curve || [])]
                  next[i] = Math.min(1, Math.max(0, Number(e.target.value)))
                  setConfig(p => ({ ...p, maturation_curve: next }))
                }}
                className="ds-input w-full text-center text-xs px-1 py-1" />
              <div className="text-[10px] text-gray-600 mt-1">S{i + 1}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 mt-3 flex-wrap">
          {(config.maturation_curve || []).map((v, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className="w-5 bg-emerald-500/30 rounded-sm" style={{ height: `${v * 40}px` }} />
            </div>
          ))}
          <span className="text-xs text-gray-600 ml-2">Visualización</span>
        </div>
      </div>
    </div>
  )
}

function S1Results({ result, config, vocab, scenario, scMultiplier }) {
  const s = result?.summary || {}
  const weekly = result?.weekly || []

  const chartData = weekly.map(w => ({
    semana: `S${w.week}`,
    nuevos: Math.round(w.new_cohort_contribution * scMultiplier / 1000),
    maduros: Math.round(w.mature_cohort_contribution * scMultiplier / 1000),
    restaurantes: Math.round(w.restaurant_count_active),
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="metric-card">
          <div className="metric-label">GMV Total</div>
          <div className="metric-value text-lg">{config.currency} {((s.total_gmv || 0) * scMultiplier / 1000000).toFixed(1)}M</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Revenue Total</div>
          <div className="metric-value text-lg">{config.currency} {((s.total_revenue || 0) * scMultiplier / 1000).toFixed(0)}K</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">{vocab.supply}s Activados</div>
          <div className="metric-value text-lg">{((s.total_restaurants_added || 0)).toLocaleString()}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">GMV Semana Final</div>
          <div className="metric-value text-lg">{config.currency} {((s.final_week_gmv || 0) * scMultiplier / 1000).toFixed(0)}K</div>
        </div>
      </div>

      <div className="ds-card p-4">
        <div className="ds-section-header -mx-4 -mt-4 mb-4">GMV por Cohorte (K {config.currency})</div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}K`} />
            <Tooltip formatter={(v, n) => [`${config.currency} ${v}K`, n === 'nuevos' ? `${vocab.supply}s nuevos` : `${vocab.supply}s maduros`]} />
            <Legend />
            <Area type="monotone" dataKey="maduros" stackId="a" stroke="#10b981" fill="#064e3b" name={`${vocab.supply}s maduros`} />
            <Area type="monotone" dataKey="nuevos" stackId="a" stroke="#34d399" fill="#065f46" name={`${vocab.supply}s nuevos`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">Progresión semanal</div>
        <table className="ds-table w-full text-xs">
          <thead>
            <tr>
              <th>Semana</th>
              <th>{vocab.supply}s activos</th>
              <th>GMV Total</th>
              <th>Revenue</th>
              <th>Cohort nuevos</th>
              <th>Cohort maduros</th>
            </tr>
          </thead>
          <tbody>
            {weekly.filter((_, i) => i % Math.max(1, Math.floor(weekly.length / 6)) === 0).map((w, i) => (
              <tr key={i}>
                <td className="text-gray-400">S{w.week}</td>
                <td className="font-mono">{w.restaurant_count_active.toLocaleString()}</td>
                <td className="font-mono text-gray-200">{config.currency} {((w.total_gmv * scMultiplier) / 1000).toFixed(0)}K</td>
                <td className="font-mono text-emerald-400">{config.currency} {((w.total_revenue * scMultiplier) / 1000).toFixed(0)}K</td>
                <td className="font-mono text-blue-400">{config.currency} {((w.new_cohort_contribution * scMultiplier) / 1000).toFixed(0)}K</td>
                <td className="font-mono text-teal-400">{config.currency} {((w.mature_cohort_contribution * scMultiplier) / 1000).toFixed(0)}K</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const modelConfig = {
  modelId: 'S1',
  modelName: 'Restaurant Onboarding & Maturation',
  perspective: 'S',
  apiPath: '/api/models/s1/calculate',
  description: 'Proyecta el GMV y revenue que generarán los restaurantes que estás activando hoy, considerando su curva de maduración.',
  InputsComponent: S1Inputs,
  ResultsComponent: S1Results,
  defaultConfig: {
    new_restaurants_per_week: 50,
    peak_gmv_per_restaurant_per_week: 18000,
    maturation_curve: [0.15, 0.25, 0.40, 0.55, 0.65, 0.72, 0.78, 0.83, 0.87, 0.90, 0.93, 0.95],
  },
}

export default function S1OnboardingWizard() {
  return <GenericWizard modelConfig={modelConfig} />
}
