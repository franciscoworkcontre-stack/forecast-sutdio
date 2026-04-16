import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import GenericWizard from './GenericWizard'

function P3Inputs({ config, setConfig, vocab, mode = 'base' }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="ds-card p-4">
          <label className="ds-label block mb-2">Couriers activos</label>
          <input type="number" value={config.couriers || 2000}
            onChange={e => setConfig(p => ({ ...p, couriers: Number(e.target.value) }))}
            className="ds-input w-full" />
        </div>
        <div className="ds-card p-4">
          <label className="ds-label block mb-2">Nuevos couriers/semana</label>
          <input type="number" value={config.new_couriers_per_week || 20}
            onChange={e => setConfig(p => ({ ...p, new_couriers_per_week: Number(e.target.value) }))}
            className="ds-input w-full" />
        </div>
        <div className="ds-card p-4">
          <div className="flex justify-between mb-2">
            <label className="ds-label">{vocab.transactions}/courier/hora</label>
            <span className="text-blue-400 font-mono">{config.orders_per_courier_per_hour}</span>
          </div>
          <input type="range" min={0.5} max={4} step={0.1} value={config.orders_per_courier_per_hour || 1.5}
            onChange={e => setConfig(p => ({ ...p, orders_per_courier_per_hour: Number(e.target.value) }))}
            className="w-full accent-blue-500" />
        </div>
        <div className="ds-card p-4">
          <div className="flex justify-between mb-2">
            <label className="ds-label">Horas activas/día</label>
            <span className="text-blue-400 font-mono">{config.active_hours_per_day}h</span>
          </div>
          <input type="range" min={4} max={20} step={0.5} value={config.active_hours_per_day || 8}
            onChange={e => setConfig(p => ({ ...p, active_hours_per_day: Number(e.target.value) }))}
            className="w-full accent-blue-500" />
        </div>
      </div>

      <div className="ds-card p-4">
        <label className="ds-label block mb-2">{vocab.transactions} semanales actuales</label>
        <input type="number" value={config.current_weekly_orders || 80000}
          onChange={e => setConfig(p => ({ ...p, current_weekly_orders: Number(e.target.value) }))}
          className="ds-input w-full" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="ds-card p-4">
          <div className="flex justify-between mb-2">
            <label className="ds-label">Crecimiento órdenes %/sem</label>
            <span className="text-emerald-400 font-mono">{config.order_growth_rate_pct_per_week}%</span>
          </div>
          <input type="range" min={0} max={10} step={0.5} value={config.order_growth_rate_pct_per_week || 2}
            onChange={e => setConfig(p => ({ ...p, order_growth_rate_pct_per_week: Number(e.target.value) }))}
            className="w-full accent-emerald-500" />
        </div>
        <div className="ds-card p-4">
          <label className="ds-label block mb-2">Costo entrega por {vocab.transaction} ({config.currency})</label>
          <input type="number" value={config.delivery_cost_per_order || 45}
            onChange={e => setConfig(p => ({ ...p, delivery_cost_per_order: Number(e.target.value) }))}
            className="ds-input w-full" />
        </div>
      </div>

      <div className="ds-card p-4">
        <label className="ds-label block mb-2">Subsidio plataforma por {vocab.transaction} ({config.currency})</label>
        <input type="number" value={config.platform_subsidy_per_order || 15}
          onChange={e => setConfig(p => ({ ...p, platform_subsidy_per_order: Number(e.target.value) }))}
          className="ds-input w-full" />
      </div>

      {mode === 'advanced' && (
        <div className="ds-card p-4 border-amber-900/40 bg-amber-950/10">
          <div className="text-xs font-mono font-semibold text-amber-400 mb-3">Avanzado — Impacto del tiempo de entrega en conversión</div>
          <div className="flex justify-between mb-1">
            <label className="ds-label">Elasticidad: % {vocab.transactions} perdidas por +10min entrega</label>
            <span className="text-amber-400 font-mono text-sm">{Math.round((config.delivery_time_elasticity || 0.12) * 100)}%</span>
          </div>
          <input type="range" min={0.02} max={0.40} step={0.02} value={config.delivery_time_elasticity || 0.12}
            onChange={e => setConfig(p => ({ ...p, delivery_time_elasticity: Number(e.target.value) }))}
            className="w-full accent-amber-500" />
          <p className="text-xs text-gray-500 mt-2">
            Benchmark: food delivery LATAM 10-20%, rideshare 5-15%. Cada 10 minutos adicionales reduce conversión en este %.
          </p>
        </div>
      )}
    </div>
  )
}

function P3Results({ result, config, vocab, scenario, scMultiplier }) {
  const s = result?.summary || {}
  const weekly = result?.weekly || []

  const chartData = weekly.map(w => ({
    semana: `S${w.week}`,
    ordenes: Math.round(w.orders * scMultiplier),
    capacidad: Math.round(w.capacity),
    utilizacion: Math.round(w.utilization * 100),
    contribucion: Math.round(w.contribution * scMultiplier / 1000),
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="metric-card">
          <div className="metric-label">Semana Cuello de Botella</div>
          <div className={`metric-value text-lg ${s.bottleneck_week ? 'text-red-400' : 'text-emerald-400'}`}>
            {s.bottleneck_week ? `Sem ${s.bottleneck_week}` : 'Sin restricción'}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Revenue Total</div>
          <div className="metric-value text-lg">{config.currency} {((s.total_revenue || 0) * scMultiplier / 1000).toFixed(0)}K</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Contribución</div>
          <div className={`metric-value text-lg ${(s.total_contribution || 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {config.currency} {((s.total_contribution || 0) * scMultiplier / 1000).toFixed(0)}K
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Margen Contribución</div>
          <div className={`metric-value text-lg ${(s.contribution_margin_pct || 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {s.contribution_margin_pct?.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="ds-card p-4">
        <div className="ds-section-header -mx-4 -mt-4 mb-4">{vocab.transactions} vs. Capacidad y Utilización</div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={v => v.toLocaleString()} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} domain={[0, 120]} />
            <Tooltip />
            <Legend />
            <ReferenceLine yAxisId="right" y={85} stroke="#f59e0b" strokeDasharray="3 3" />
            <Line yAxisId="left" type="monotone" dataKey="ordenes" stroke="#3b82f6" strokeWidth={2} name={vocab.transactions} dot={false} />
            <Line yAxisId="left" type="monotone" dataKey="capacidad" stroke="#6b7280" strokeDasharray="5 5" name="Capacidad" dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="utilizacion" stroke="#f59e0b" strokeWidth={2} name="Utilización %" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="ds-card p-4">
        <div className="ds-section-header -mx-4 -mt-4 mb-4">Contribución semanal ({config.currency}K)</div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}K`} />
            <Tooltip formatter={v => [`${config.currency} ${v}K`, 'Contribución']} />
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="contribucion" stroke="#10b981" strokeWidth={2} dot={false} name="Contribución" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const modelConfig = {
  modelId: 'P3',
  modelName: 'Delivery Economics & Capacity',
  perspective: 'P',
  apiPath: '/api/models/p3/calculate',
  description: 'Modela la capacidad de la flota, el punto de cuello de botella, y la economía unitaria por entrega.',
  InputsComponent: P3Inputs,
  ResultsComponent: P3Results,
  defaultConfig: {
    couriers: 2000,
    orders_per_courier_per_hour: 1.5,
    active_hours_per_day: 8.0,
    current_weekly_orders: 80000,
    order_growth_rate_pct_per_week: 2.0,
    delivery_cost_per_order: 45,
    platform_subsidy_per_order: 15,
    capacity_utilization_threshold: 0.85,
    new_couriers_per_week: 20,
  },
}

export default function P3DeliveryWizard() {
  return <GenericWizard modelConfig={modelConfig} />
}
