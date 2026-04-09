import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer, LabelList, Cell,
  ComposedChart
} from 'recharts'

// ── Scroll Reveal Hook ───────────────────────────────────────────────────────

function useScrollReveal(ref) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [ref])
  return visible
}

// ── Counter Hook ─────────────────────────────────────────────────────────────

function useCounter(target, trigger, duration = 1200) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!trigger) return
    let start = 0
    const steps = 40
    const increment = target / steps
    const interval = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(interval)
      } else {
        setCount(Math.floor(start))
      }
    }, duration / steps)
    return () => clearInterval(interval)
  }, [trigger, target, duration])
  return count
}

// ── Chart Data ───────────────────────────────────────────────────────────────

const heroData = Array.from({ length: 26 }, (_, i) => ({
  week: `W${i + 1}`,
  base: 45000 + i * 500 + Math.sin(i * 0.5) * 3000,
  withPromos: 52000 + i * 800 + Math.sin(i * 0.5) * 3000 + (i > 8 ? (i - 8) * 400 : 0),
  best: 58000 + i * 1100 + Math.sin(i * 0.5) * 2000,
  worst: 41000 + i * 300 + Math.sin(i * 0.5) * 2000,
}))

const countries = [
  {
    flag: '🇲🇽', name: 'México', facts: ['Quincena: 1 y 15', 'Día de Muertos: +35%', 'Aguinaldo: Dic'],
    pattern: [55, 62, 70, 80, 95, 100, 85],
  },
  {
    flag: '🇧🇷', name: 'Brasil', facts: ['Carnaval: -20%', 'Black Friday: +60%', 'Fin de semana: +40%'],
    pattern: [50, 58, 68, 75, 90, 100, 80],
  },
  {
    flag: '🇨🇴', name: 'Colombia', facts: ['Quincena: 15 y 30', 'Feria de Cali: +30%', 'Semana Santa: -15%'],
    pattern: [52, 60, 72, 78, 88, 100, 75],
  },
  {
    flag: '🇦🇷', name: 'Argentina', facts: ['Quincena: 15 y fin', 'Inflación: ajuste semanal', 'Verano: Dic-Mar'],
    pattern: [48, 55, 65, 72, 85, 100, 90],
  },
  {
    flag: '🇨🇱', name: 'Chile', facts: ['Fiestas Patrias: +40%', 'Pago: fin de mes', 'CyberMonday: +80%'],
    pattern: [50, 58, 70, 80, 92, 100, 82],
  },
  {
    flag: '🇵🇪', name: 'Perú', facts: ['Fiestas Patrias: Jul', 'Quincena: 15 y 30', 'Lima domina 60%'],
    pattern: [45, 55, 68, 76, 88, 100, 78],
  },
  {
    flag: '🇪🇨', name: 'Ecuador', facts: ['Dolarizado', 'Finados: Nov', 'Quito vs Guayaquil'],
    pattern: [50, 60, 70, 75, 85, 100, 72],
  },
  {
    flag: '🇺🇾', name: 'Uruguay', facts: ['Carnaval: Feb', 'Semana Turismo', 'Mercado pequeño'],
    pattern: [48, 56, 66, 72, 86, 100, 80],
  },
  {
    flag: '🇨🇷', name: 'Costa Rica', facts: ['Colón costarricense', 'Semana Santa: -10%', 'Lluvias: May-Nov'],
    pattern: [52, 62, 72, 78, 88, 100, 76],
  },
  {
    flag: '🇵🇦', name: 'Panamá', facts: ['Dolarizado', 'Carnaval: Feb', 'Ciudad de Panamá: 80%'],
    pattern: [50, 58, 68, 74, 86, 100, 78],
  },
  {
    flag: '🇩🇴', name: 'Rep. Dom.', facts: ['Quincena: 15 y 30', 'Semana Santa: -20%', 'Navidad: +50%'],
    pattern: [48, 55, 65, 72, 85, 100, 82],
  },
  {
    flag: '🇬🇹', name: 'Guatemala', facts: ['Semana Santa: -25%', 'Independencia: Sep', 'Lluvias: Jun-Oct'],
    pattern: [45, 54, 65, 74, 86, 100, 75],
  },
  {
    flag: '🇭🇳', name: 'Honduras', facts: ['Semana Santa: -15%', 'Tegucigalpa domina', 'Lluvias: May-Nov'],
    pattern: [44, 52, 64, 72, 84, 100, 73],
  },
  {
    flag: '🇸🇻', name: 'El Salvador', facts: ['Dolarizado', 'Fiestas Agostinas', 'Ciudad capital: 70%'],
    pattern: [46, 55, 66, 73, 85, 100, 74],
  },
  {
    flag: '🇧🇴', name: 'Bolivia', facts: ['Carnaval Oruro: Feb', 'La Paz + Santa Cruz', 'Altiplano: ciclo especial'],
    pattern: [42, 52, 63, 70, 82, 100, 70],
  },
  {
    flag: '🇵🇾', name: 'Paraguay', facts: ['Guaraní', 'Carnaval: Feb', 'Asunción domina'],
    pattern: [44, 53, 64, 71, 83, 100, 72],
  },
  {
    flag: '🇻🇪', name: 'Venezuela', facts: ['Hiperinflación', 'USD dominante', 'Caracas: 65%'],
    pattern: [40, 50, 62, 70, 82, 100, 68],
  },
]

// ── Hardcoded Chile Seasonal Data (52 weeks) ────────────────────────────────

const CL_SEASONAL = [
  1.02, 1.05, 1.03, 1.01, 0.98, 0.97, 0.95, 0.94, 0.96, 0.99,
  0.98, 0.97, 1.00, 1.03, 1.05, 1.04, 1.02, 1.00, 0.99, 0.98,
  0.97, 0.96, 0.98, 1.00, 1.02, 1.04, 1.06, 1.08, 1.05, 1.03,
  1.01, 0.99, 0.97, 0.98, 1.00, 1.02, 1.04, 1.45, 1.40, 1.20,
  1.10, 1.05, 1.02, 1.00, 0.98, 0.97, 0.96, 0.95, 0.98, 1.02,
  1.10, 0.72,
]

const MX_SEASONAL = [
  1.02, 1.00, 0.98, 0.97, 0.95, 0.96, 0.98, 1.00, 1.02, 1.05,
  1.08, 1.10, 1.07, 1.04, 1.05, 1.03, 1.00, 0.98, 0.97, 1.00,
  1.35, 1.15, 1.05, 1.02, 1.00, 0.98, 0.97, 0.96, 0.98, 1.00,
  1.02, 1.04, 1.05, 1.04, 1.02, 1.00, 0.99, 0.98, 0.97, 0.98,
  1.00, 1.02, 1.04, 1.06, 1.08, 1.06, 1.04, 1.08, 1.10, 1.15,
  1.25, 0.78,
]

const CO_SEASONAL = [
  1.00, 0.98, 0.97, 0.96, 0.97, 0.98, 1.00, 1.02, 1.04, 1.05,
  1.03, 1.00, 0.97, 0.95, 0.94, 0.96, 0.98, 1.00, 1.02, 1.04,
  1.05, 1.04, 1.02, 1.00, 0.99, 0.98, 0.97, 0.98, 1.00, 1.02,
  1.04, 1.06, 1.08, 1.07, 1.06, 1.05, 1.08, 1.12, 1.15, 1.30,
  1.20, 1.10, 1.05, 1.02, 1.00, 0.99, 0.98, 0.97, 0.99, 1.05,
  1.12, 0.80,
]

const AR_SEASONAL = [
  1.05, 1.08, 1.10, 1.08, 1.05, 1.02, 1.00, 0.98, 0.97, 0.96,
  0.97, 0.99, 1.01, 1.03, 1.04, 1.03, 1.02, 1.00, 0.99, 1.20,
  1.10, 1.05, 1.02, 1.00, 0.98, 0.97, 0.96, 0.97, 0.99, 1.01,
  1.03, 1.05, 1.06, 1.05, 1.04, 1.02, 1.00, 0.99, 0.98, 0.97,
  0.99, 1.02, 1.05, 1.08, 1.10, 1.08, 1.05, 1.02, 1.05, 1.10,
  1.20, 0.82,
]

const BR_SEASONAL = [
  0.92, 0.85, 0.78, 1.00, 1.02, 1.04, 1.05, 1.04, 1.02, 1.00,
  0.99, 0.98, 0.97, 0.98, 1.00, 1.02, 1.04, 1.06, 1.05, 1.03,
  1.01, 1.00, 0.99, 0.98, 0.97, 0.98, 1.00, 1.02, 1.04, 1.06,
  1.08, 1.07, 1.05, 1.04, 1.02, 1.00, 0.99, 0.98, 1.00, 1.02,
  1.04, 1.06, 1.08, 1.10, 1.12, 1.60, 1.30, 1.10, 1.05, 1.08,
  1.15, 0.75,
]

const PE_SEASONAL = [
  1.00, 0.98, 0.97, 0.96, 0.97, 0.98, 1.00, 1.02, 1.04, 1.05,
  1.04, 1.02, 1.00, 0.99, 0.98, 0.97, 0.98, 1.00, 1.02, 1.04,
  1.06, 1.05, 1.03, 1.02, 1.01, 1.00, 0.99, 1.40, 1.35, 1.20,
  1.10, 1.05, 1.02, 1.00, 0.99, 0.98, 0.97, 0.98, 1.00, 1.02,
  1.04, 1.05, 1.04, 1.02, 1.00, 0.99, 0.98, 0.97, 1.00, 1.06,
  1.12, 0.76,
]

const SEASONAL_BY_COUNTRY = { CL: CL_SEASONAL, MX: MX_SEASONAL, CO: CO_SEASONAL, AR: AR_SEASONAL, BR: BR_SEASONAL, PE: PE_SEASONAL }

// ── Custom Tooltip ────────────────────────────────────────────────────────────

function HeroTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  const fmt = (v) => v ? Math.round(v).toLocaleString('es-MX') : '—'
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl text-xs font-mono min-w-[180px]">
      <div className="text-gray-400 mb-2 font-semibold">{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex justify-between gap-4 mb-1">
          <span style={{ color: entry.stroke || entry.fill }}>{entry.name}</span>
          <span className="text-gray-200">{fmt(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Sparkline Component ───────────────────────────────────────────────────────

function Sparkline({ data }) {
  const max = Math.max(...data)
  return (
    <div className="flex items-end gap-0.5 h-6 mt-2">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 bg-blue-500 rounded-sm transition-all duration-300"
          style={{ height: `${(v / max) * 100}%`, opacity: 0.6 + (v / max) * 0.4 }}
        />
      ))}
    </div>
  )
}

// ── Waterfall Builder ─────────────────────────────────────────────────────────

function buildWaterfall(drivers) {
  let cum = 0
  const rows = []
  for (const d of drivers) {
    if (d.type === 'total') {
      // Total bar always starts from 0; bar height = |cum|; negative cum → bar goes downward
      rows.push({ name: d.name, spacer: cum >= 0 ? 0 : cum, bar: Math.abs(cum), delta: cum, type: d.type })
      break
    }
    // Positive delta: bar floats up from cum. Negative delta: bar hangs down (spacer = lower edge).
    const spacer = d.delta >= 0 ? cum : cum + d.delta
    const bar = Math.abs(d.delta)
    rows.push({ name: d.name, spacer, bar, delta: d.delta, type: d.type })
    cum += d.delta
  }
  return rows
}

// ── Error Boundary ────────────────────────────────────────────────────────────

class ChartErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e.message } }
  render() {
    if (this.state.error) return (
      <div className="flex items-center justify-center h-48 text-red-400 text-xs font-mono bg-red-950/20 rounded border border-red-900">
        Error en chart: {this.state.error}
      </div>
    )
    return this.props.children
  }
}

// ── Slider Component ──────────────────────────────────────────────────────────

function ModelSlider({ label, value, min, max, step = 1, format, explanation, onChange }) {
  const display = format ? format(value) : value.toLocaleString('es-MX')
  const minDisplay = format ? format(min) : min.toLocaleString('es-MX')
  const maxDisplay = format ? format(max) : max.toLocaleString('es-MX')
  return (
    <div className="ds-card p-4 mb-3">
      <div className="flex justify-between items-center mb-2">
        <label className="text-gray-300 text-sm font-medium">{label}</label>
        <span className="text-blue-400 font-mono text-lg font-bold">{display}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-gray-700 accent-blue-500 cursor-pointer mb-2"
      />
      <div className="flex justify-between text-xs text-gray-600 mb-2">
        <span>{minDisplay}</span>
        <span>{maxDisplay}</span>
      </div>
      {explanation && <p className="text-xs text-gray-500 italic">{explanation}</p>}
    </div>
  )
}

// ── Result Callout ────────────────────────────────────────────────────────────

function ResultCallout({ results }) {
  return (
    <div className="ds-card p-4 bg-blue-950/30 border-blue-800/50">
      <p className="text-xs text-gray-400 uppercase font-mono mb-2 tracking-widest">RESULTADO CLAVE</p>
      {results.map(r => (
        <div key={r.label} className="flex justify-between items-center py-1.5 border-b border-gray-800 last:border-0">
          <span className="text-gray-400 text-sm">{r.label}</span>
          <span className={`font-mono font-bold text-sm ${r.color || (r.positive !== false ? 'text-emerald-400' : 'text-red-400')}`}>{r.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Model A1: Promo Uplift ────────────────────────────────────────────────────

function ModelA1({ inputs, onChange }) {
  const { base, uplift, duracion } = inputs
  const fatigue = [1, 1, 0.9, 0.9, 0.75, 0.75, 0.75, 0.75, 0.6, 0.6, 0.6, 0.6]
  const residualCurve = [0.30, 0.20, 0.10, 0.10]

  const data = Array.from({ length: 12 }, (_, w) => {
    const inPromo = w < duracion
    const postPromo = !inPromo && w < duracion + 4
    const sinPromo = base
    const conPromo = inPromo ? Math.round(base * (1 + (uplift / 100) * fatigue[w])) : null
    const residual = postPromo ? Math.round(base * (1 + (uplift / 100) * residualCurve[w - duracion])) : null
    return { w: `S${w + 1}`, sinPromo, conPromo, residual }
  })

  const totalIncremental = data.reduce((acc, d) => {
    const orders = d.conPromo || d.residual || 0
    return acc + Math.max(0, orders - base)
  }, 0)

  const estimatedCost = totalIncremental * 2.5

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="ds-card p-4 mb-4">
          <p className="text-emerald-400 text-xs font-mono uppercase mb-1 tracking-widest">QUÉ HACE</p>
          <p className="text-gray-200 text-sm leading-relaxed">Calcula las órdenes adicionales que genera una campaña promocional semana a semana, incluyendo la fatiga (el efecto se reduce si la promo dura mucho) y lo que queda después de que termina.</p>
          <p className="text-amber-400 text-xs font-mono uppercase mt-3 mb-1 tracking-widest">CUÁNDO USARLO</p>
          <p className="text-gray-400 text-sm">Tienes un set de restaurantes activos y vas a lanzar una promo. Quieres saber cuántas órdenes incrementales esperar.</p>
        </div>
        <ModelSlider
          label="Órdenes base/semana"
          value={base} min={10000} max={100000} step={1000}
          format={v => v.toLocaleString('es-MX')}
          explanation="Tu volumen actual sin ninguna promo activa. Míralo en tu dashboard operacional como las últimas 2-4 semanas sin campaña."
          onChange={v => onChange({ ...inputs, base: v })}
        />
        <ModelSlider
          label="Uplift esperado (%)"
          value={uplift} min={5} max={60} step={1}
          format={v => `${v}%`}
          explanation="Cuánto más del normal esperas vender. Un descuento del 20% típicamente genera 15-30% uplift. Un 2x1 puede llegar a 40-50%."
          onChange={v => onChange({ ...inputs, uplift: v })}
        />
        <ModelSlider
          label="Duración (semanas)"
          value={duracion} min={1} max={12} step={1}
          format={v => `${v} sem`}
          explanation="Promos largas (>4 semanas) pierden efectividad por fatiga: usuarios se acostumbran y dejan de percibir el beneficio como especial."
          onChange={v => onChange({ ...inputs, duracion: v })}
        />
        <ResultCallout results={[
          { label: 'Órdenes incrementales totales', value: totalIncremental.toLocaleString('es-MX'), color: 'text-emerald-400' },
          { label: 'Costo estimado ($2.5 subsidio/orden)', value: `$${Math.round(estimatedCost).toLocaleString('es-MX')}`, color: 'text-amber-400' },
        ]} />
      </div>
      <div className="ds-card p-4">
        <p className="text-xs text-gray-400 uppercase font-mono mb-3 tracking-widest">ÓRDENES SEMANALES — 12 SEMANAS</p>
        <ChartErrorBoundary>
          <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="w" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v, n) => [v ? v.toLocaleString('es-MX') : null, n]}
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line type="monotone" dataKey="sinPromo" name="Sin promo" stroke="#6b7280" strokeDasharray="4 4" dot={false} strokeWidth={2} isAnimationActive={false} />
            <Line type="monotone" dataKey="conPromo" name="Con promo" stroke="#3b82f6" dot={false} strokeWidth={2.5} isAnimationActive={false} connectNulls={false} />
            <Line type="monotone" dataKey="residual" name="Residual post-promo" stroke="#34d399" strokeDasharray="3 3" dot={false} strokeWidth={2} isAnimationActive={false} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartErrorBoundary></div>
    </div>
  )
}

// ── Model A2: Restaurant Acquisition ─────────────────────────────────────────

function ModelA2({ inputs, onChange }) {
  const { restosPerWeek, steadyState, tipo } = inputs
  const matCurves = {
    dark_kitchen: [0.15, 0.30, 0.50, 0.65, 0.75, 0.83, 0.89, 0.94, 0.97, 1.0, 1.0, 1.0],
    tradicional:  [0.08, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.73, 0.80, 0.87, 0.93, 1.0],
    grocery:      [0.20, 0.38, 0.55, 0.68, 0.78, 0.86, 0.91, 0.95, 0.98, 1.0, 1.0, 1.0],
  }
  const curve = matCurves[tipo]

  const data = Array.from({ length: 16 }, (_, W) => {
    let total = 0
    for (let c = 0; c <= W; c++) {
      const age = W - c
      const matFactor = age < curve.length ? curve[age] : 1.0
      total += restosPerWeek * steadyState * matFactor
    }
    return { w: `S${W + 1}`, ordenes: Math.round(total) }
  })

  const week16 = data[15].ordenes
  const matureWeeks = curve.length - 1
  const matureCount = Math.max(0, 16 - matureWeeks) * restosPerWeek

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="ds-card p-4 mb-4">
          <p className="text-emerald-400 text-xs font-mono uppercase mb-1 tracking-widest">QUÉ HACE</p>
          <p className="text-gray-200 text-sm leading-relaxed">Proyecta las órdenes que generarán los restaurantes nuevos que estás onboarding. Cada restaurante arranca lento y tarda varias semanas en llegar a su potencial máximo.</p>
          <p className="text-amber-400 text-xs font-mono uppercase mt-3 mb-1 tracking-widest">CUÁNDO USARLO</p>
          <p className="text-gray-400 text-sm">Tienes un plan de adquisición (X restaurantes por mes) y necesitas saber cuándo verás el impacto en órdenes.</p>
        </div>
        <ModelSlider
          label="Restaurantes nuevos por semana"
          value={restosPerWeek} min={1} max={50} step={1}
          format={v => `${v} restos`}
          explanation="¿Cuántos restaurantes nuevos activarás cada semana? 10/semana = ~40/mes = ~500/año."
          onChange={v => onChange({ ...inputs, restosPerWeek: v })}
        />
        <ModelSlider
          label="Steady-state órdenes/semana por restaurante"
          value={steadyState} min={40} max={250} step={5}
          format={v => v.toLocaleString('es-MX')}
          explanation="Cuántas órdenes hace un restaurante maduro (después de 12 semanas). Dark kitchen grande: 180-250. Restaurante tradicional promedio: 40-80."
          onChange={v => onChange({ ...inputs, steadyState: v })}
        />
        <div className="ds-card p-4 mb-3">
          <label className="text-gray-300 text-sm font-medium block mb-2">Tipo de restaurante</label>
          <select
            value={tipo}
            onChange={e => onChange({ ...inputs, tipo: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="dark_kitchen">Dark Kitchen (madura en 8 semanas)</option>
            <option value="tradicional">Tradicional (madura en 12 semanas)</option>
            <option value="grocery">Grocery (madura en 10 semanas)</option>
          </select>
          <p className="text-xs text-gray-500 italic mt-2">Las dark kitchens maduran más rápido porque nacen optimizadas para delivery. Los tradicionales necesitan ajustar menú y operación.</p>
        </div>
        <ResultCallout results={[
          { label: 'Órdenes totales semana 16', value: week16.toLocaleString('es-MX'), color: 'text-emerald-400' },
          { label: 'Restaurantes ya maduros (plateau)', value: `${matureCount.toLocaleString('es-MX')} de ${(16 * restosPerWeek).toLocaleString('es-MX')} activados`, color: 'text-blue-400' },
        ]} />
      </div>
      <div className="ds-card p-4">
        <p className="text-xs text-gray-400 uppercase font-mono mb-3 tracking-widest">ÓRDENES ACUMULADAS — COHORTS DE NUEVOS RESTAURANTES</p>
        <ChartErrorBoundary>
          <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="w" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v) => [v.toLocaleString('es-MX'), 'Órdenes']}
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }}
            />
            <Area type="monotone" dataKey="ordenes" name="Órdenes de nuevos restaurantes" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2.5} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartErrorBoundary></div>
    </div>
  )
}

// ── Model A3: Canibalización ──────────────────────────────────────────────────

function ModelA3({ inputs, onChange }) {
  const { upliftA, upliftB, canib } = inputs
  const BASE = 50000
  const promoA = Math.round(BASE * upliftA / 100)
  const promoB = Math.round(BASE * upliftB / 100)
  const sumaBruta = promoA + promoB
  const neto = Math.round(BASE * (upliftA / 100 + upliftB / 100 - (upliftA / 100) * (upliftB / 100) * (canib / 100)))
  const perdidas = sumaBruta - neto
  const eficiencia = Math.round((neto / sumaBruta) * 100)

  const chartData = [
    { name: 'Promo A sola', ordenes: promoA, fill: '#3b82f6' },
    { name: 'Promo B sola', ordenes: promoB, fill: '#8b5cf6' },
    { name: 'Suma sin ajuste', ordenes: sumaBruta, fill: '#6b7280' },
    { name: 'Efecto neto real', ordenes: neto, fill: '#34d399' },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="ds-card p-4 mb-4">
          <p className="text-emerald-400 text-xs font-mono uppercase mb-1 tracking-widest">QUÉ HACE</p>
          <p className="text-gray-200 text-sm leading-relaxed">Cuando corres dos promos al mismo tiempo, el efecto real NO es la suma de ambas. Un usuario que ya decidió pedir por el 2x1 no genera una orden extra por el free delivery — ya estaba convencido.</p>
          <p className="text-amber-400 text-xs font-mono uppercase mt-3 mb-1 tracking-widest">CUÁNDO USARLO</p>
          <p className="text-gray-400 text-sm">Tienes múltiples promos activas simultáneamente y quieres saber el efecto neto real, no la suma optimista.</p>
        </div>
        <ModelSlider
          label="Uplift Promo A (%)"
          value={upliftA} min={5} max={50} step={1}
          format={v => `${v}%`}
          explanation="El uplift individual de tu primera promo, calculado como si fuera la única activa."
          onChange={v => onChange({ ...inputs, upliftA: v })}
        />
        <ModelSlider
          label="Uplift Promo B (%)"
          value={upliftB} min={5} max={50} step={1}
          format={v => `${v}%`}
          explanation="El uplift individual de tu segunda promo."
          onChange={v => onChange({ ...inputs, upliftB: v })}
        />
        <ModelSlider
          label="Factor de canibalización (%)"
          value={canib} min={0} max={70} step={1}
          format={v => `${v}%`}
          explanation="Qué % del uplift combinado se pierde por superposición. Promos similares para el mismo usuario: 40-60%. Promos para segmentos distintos (nuevos vs dormantes): 5-15%."
          onChange={v => onChange({ ...inputs, canib: v })}
        />
        <ResultCallout results={[
          { label: "Órdenes que 'desaparecen' por canibalización", value: perdidas.toLocaleString('es-MX'), color: 'text-red-400' },
          { label: 'Eficiencia del gasto dual', value: `${eficiencia}%`, color: eficiencia >= 80 ? 'text-emerald-400' : 'text-amber-400' },
        ]} />
      </div>
      <div className="ds-card p-4">
        <p className="text-xs text-gray-400 uppercase font-mono mb-3 tracking-widest">COMPARACIÓN DE ESCENARIOS — BASE 50,000 ÓRDENES</p>
        <ChartErrorBoundary>
          <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 15, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={v => [v.toLocaleString('es-MX'), 'Órdenes incrementales']} contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }} />
            <Bar dataKey="ordenes" isAnimationActive={false} radius={[4, 4, 0, 0]}>
              {chartData.map((d, i) => <Cell key={i} fill={d.fill} fillOpacity={0.85} />)}
              <LabelList dataKey="ordenes" position="top" formatter={v => `+${(v / 1000).toFixed(1)}k`} style={{ fill: '#9ca3af', fontSize: 11 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartErrorBoundary></div>
    </div>
  )
}

// ── Model A4: Estacionalidad ──────────────────────────────────────────────────

function ModelA4({ inputs, onChange }) {
  const { pais, semana, lluvia } = inputs
  const seasonalData = SEASONAL_BY_COUNTRY[pais] || CL_SEASONAL
  const BASE = 50000
  const rawFactor = seasonalData[semana - 1] || 1.0
  const finalFactor = lluvia ? rawFactor * 1.04 : rawFactor
  const projected = Math.round(BASE * finalFactor)

  const chartData = seasonalData.map((f, i) => ({
    semana: i + 1,
    factor: parseFloat(f.toFixed(3)),
    highlight: i + 1 === semana ? f : null,
  }))

  const getBarColor = (factor) => {
    if (factor >= 1.3) return '#34d399'
    if (factor >= 1.1) return '#86efac'
    if (factor >= 0.95) return '#9ca3af'
    if (factor >= 0.85) return '#fbbf24'
    return '#f87171'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="ds-card p-4 mb-4">
          <p className="text-emerald-400 text-xs font-mono uppercase mb-1 tracking-widest">QUÉ HACE</p>
          <p className="text-gray-200 text-sm leading-relaxed">Ajusta tu forecast por factores predecibles: qué día de la semana es, si hay feriado, si estamos en quincena, si hay lluvia. La demanda de food delivery varía ±40% solo por estos factores.</p>
          <p className="text-amber-400 text-xs font-mono uppercase mt-3 mb-1 tracking-widest">CUÁNDO USARLO</p>
          <p className="text-gray-400 text-sm">Siempre. La estacionalidad debe aplicarse a cualquier forecast — es la capa que convierte un número plano en una proyección realista.</p>
        </div>
        <div className="ds-card p-4 mb-3">
          <label className="text-gray-300 text-sm font-medium block mb-2">País</label>
          <select
            value={pais}
            onChange={e => onChange({ ...inputs, pais: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="CL">Chile (CL)</option>
            <option value="MX">México (MX)</option>
            <option value="CO">Colombia (CO)</option>
            <option value="AR">Argentina (AR)</option>
            <option value="BR">Brasil (BR)</option>
            <option value="PE">Perú (PE)</option>
          </select>
          <p className="text-xs text-gray-500 italic mt-2">Cada país tiene su propio calendario de feriados y ciclos de pago. Chile tiene Fiestas Patrias (+40%). México tiene el Día de las Madres (+35%).</p>
        </div>
        <ModelSlider
          label="Semana del año"
          value={semana} min={1} max={52} step={1}
          format={v => `Semana ${v}`}
          explanation="Selecciona la semana que te interesa analizar para ver el factor combinado de todos los efectos."
          onChange={v => onChange({ ...inputs, semana: v })}
        />
        <div className="ds-card p-4 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-300 text-sm font-medium block">¿Hay lluvia intensa esa semana?</label>
              <p className="text-xs text-gray-500 italic mt-1">Lluvia normal +5%, lluvia torrencial puede ser -15%. Aquí modelamos lluvia moderada (+4% neto).</p>
            </div>
            <button
              onClick={() => onChange({ ...inputs, lluvia: !lluvia })}
              className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ml-4 ${lluvia ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${lluvia ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
        <ResultCallout results={[
          { label: 'Factor de la semana seleccionada', value: `${finalFactor.toFixed(2)}x`, color: finalFactor >= 1.1 ? 'text-emerald-400' : finalFactor < 0.9 ? 'text-red-400' : 'text-blue-400' },
          { label: 'Proyección semana (base 50k)', value: projected.toLocaleString('es-MX') + ' órdenes', color: 'text-gray-200' },
        ]} />
      </div>
      <div className="ds-card p-4">
        <p className="text-xs text-gray-400 uppercase font-mono mb-3 tracking-widest">FACTOR ESTACIONAL — 52 SEMANAS · Semana seleccionada destacada</p>
        <ChartErrorBoundary>
          <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="semana" tick={{ fontSize: 8 }} interval={7} />
            <YAxis domain={[0.5, 1.6]} tick={{ fontSize: 10 }} tickFormatter={v => `${v.toFixed(1)}x`} />
            <Tooltip
              formatter={(v) => [`${v.toFixed(2)}x`, 'Factor estacional']}
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }}
            />
            <ReferenceLine y={1.0} stroke="#6b7280" strokeDasharray="4 4" label={{ value: 'Base', fill: '#9ca3af', fontSize: 10, position: 'insideRight' }} />
            <Bar dataKey="factor" isAnimationActive={false} radius={[2, 2, 0, 0]}>
              {chartData.map((d, i) => (
                <Cell
                  key={i}
                  fill={i + 1 === semana ? '#facc15' : getBarColor(d.factor)}
                  fillOpacity={i + 1 === semana ? 1.0 : 0.75}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartErrorBoundary></div>
    </div>
  )
}

// ── Model A5: Expansión Nueva Ciudad ─────────────────────────────────────────

function ModelA5({ inputs, onChange }) {
  const { tam, adopcion, couriers } = inputs

  const data = Array.from({ length: 52 }, (_, t) => {
    const targetAdoption = tam * (adopcion / 100)
    const logistic = targetAdoption / (1 + Math.exp(-0.15 * (t - 26)))
    const avgFrequency = 1.5 // órdenes por usuario por semana
    const demandaPotencial = Math.round(logistic * avgFrequency)
    const ordenesReales = Math.min(demandaPotencial, couriers)
    return {
      w: `S${t + 1}`,
      demanda: demandaPotencial,
      capacidad: couriers,
      real: ordenesReales,
    }
  })

  const constraintWeek = data.findIndex(d => d.demanda >= couriers)
  const totalYr1 = data.reduce((acc, d) => acc + d.real, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="ds-card p-4 mb-4">
          <p className="text-emerald-400 text-xs font-mono uppercase mb-1 tracking-widest">QUÉ HACE</p>
          <p className="text-gray-200 text-sm leading-relaxed">Modela el crecimiento de un mercado nuevo desde cero. Combina la curva de adopción de usuarios (S-curve) con la capacidad de supply (restaurantes y couriers). Identifica cuál de los dos es el cuello de botella.</p>
          <p className="text-amber-400 text-xs font-mono uppercase mt-3 mb-1 tracking-widest">CUÁNDO USARLO</p>
          <p className="text-gray-400 text-sm">Estás lanzando en una ciudad donde no tienes presencia. NO uses este modelo para agregar restaurantes a un mercado maduro — usa A2 para eso.</p>
        </div>
        <ModelSlider
          label="TAM (usuarios potenciales)"
          value={tam} min={50000} max={2000000} step={50000}
          format={v => `${(v / 1000).toFixed(0)}k usuarios`}
          explanation="Adultos con smartphone en la zona de cobertura que podrían pedir delivery. No es la ciudad completa — es tu área de entrega realista."
          onChange={v => onChange({ ...inputs, tam: v })}
        />
        <ModelSlider
          label="Objetivo de adopción a 12 meses (%)"
          value={adopcion} min={1} max={20} step={0.5}
          format={v => `${v}%`}
          explanation="Qué % del TAM esperas capturar en el primer año. Mercados maduros: 15-25% de adopción. Un mercado nuevo puede aspirar a 5-10% en el año 1."
          onChange={v => onChange({ ...inputs, adopcion: v })}
        />
        <ModelSlider
          label="Capacidad de couriers (órdenes/semana)"
          value={couriers} min={5000} max={200000} step={5000}
          format={v => `${(v / 1000).toFixed(0)}k`}
          explanation="El límite físico de tu flota. Si la demanda supera esto, el modelo la capea — mostrándote que necesitas más couriers antes de seguir creciendo."
          onChange={v => onChange({ ...inputs, couriers: v })}
        />
        <ResultCallout results={[
          {
            label: 'Semana en que alcanzas capacity',
            value: constraintWeek >= 0 ? `Semana ${constraintWeek + 1}` : 'No alcanzas el límite',
            color: constraintWeek >= 0 ? 'text-amber-400' : 'text-emerald-400',
          },
          { label: 'Órdenes acumuladas año 1', value: totalYr1.toLocaleString('es-MX'), color: 'text-blue-400' },
        ]} />
      </div>
      <div className="ds-card p-4">
        <p className="text-xs text-gray-400 uppercase font-mono mb-3 tracking-widest">CRECIMIENTO DE MERCADO NUEVO — 52 SEMANAS</p>
        <ChartErrorBoundary>
          <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="w" tick={{ fontSize: 8 }} interval={7} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v, n) => [v.toLocaleString('es-MX'), n]}
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Area type="monotone" dataKey="demanda" name="Demanda potencial" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} />
            <Area type="monotone" dataKey="real" name="Órdenes reales" stroke="#34d399" fill="#34d399" fillOpacity={0.25} strokeWidth={2.5} isAnimationActive={false} />
            <Line type="monotone" dataKey="capacidad" name="Capacity couriers" stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartErrorBoundary></div>
    </div>
  )
}

// ── Model B1: Unit Economics ──────────────────────────────────────────────────

function ModelB1({ inputs, onChange }) {
  const { aov, commission, courierCost, subsidy } = inputs
  const revenue = parseFloat((aov * commission / 100 + 1.5).toFixed(2))
  const costCourier = courierCost
  const costSupport = parseFloat((aov * 0.02).toFixed(2))
  const costSubsidy = subsidy
  const cm = parseFloat((revenue - costCourier - costSupport - costSubsidy).toFixed(2))

  // Build waterfall for single order breakdown
  const wfDrivers = [
    { name: 'Revenue', delta: revenue, type: 'base' },
    { name: '−Courier', delta: -costCourier, type: 'neg' },
    { name: '−Soporte', delta: -costSupport, type: 'neg' },
    { name: '−Subsidio', delta: -costSubsidy, type: 'neg' },
    { name: 'CM', delta: cm, type: 'total' },
  ]
  const wfData = buildWaterfall(wfDrivers)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="ds-card p-4 mb-4">
          <p className="text-emerald-400 text-xs font-mono uppercase mb-1 tracking-widest">QUÉ HACE</p>
          <p className="text-gray-200 text-sm leading-relaxed">Descompone el costo y el retorno de cada orden para saber si una iniciativa se paga sola. Calcula el payback: cuántas semanas tarda la contribución acumulada en superar la inversión inicial.</p>
          <p className="text-amber-400 text-xs font-mono uppercase mt-3 mb-1 tracking-widest">CUÁNDO USARLO</p>
          <p className="text-gray-400 text-sm">Antes de aprobar cualquier promo o plan de adquisición. Sin esto, puedes estar generando volumen que destruye valor.</p>
        </div>
        <ModelSlider
          label="Ticket promedio — AOV ($)"
          value={aov} min={5} max={50} step={0.5}
          format={v => `$${v.toFixed(1)}`}
          explanation="El valor promedio de cada orden. Restaurantes: $15-25. Grocery: $30-50. Farmacia: $20-35."
          onChange={v => onChange({ ...inputs, aov: v })}
        />
        <ModelSlider
          label="Comisión de la plataforma (%)"
          value={commission} min={15} max={35} step={0.5}
          format={v => `${v}%`}
          explanation="El porcentaje del AOV que retiene la plataforma. Típicamente 20-30% para restaurantes, puede ser menor para grandes cadenas."
          onChange={v => onChange({ ...inputs, commission: v })}
        />
        <ModelSlider
          label="Costo de courier por orden ($)"
          value={courierCost} min={1} max={8} step={0.1}
          format={v => `$${v.toFixed(1)}`}
          explanation="El costo variable de cada entrega. Incluye pago al courier, combustible y costo de matching. Varía mucho por ciudad y distancia promedio."
          onChange={v => onChange({ ...inputs, courierCost: v })}
        />
        <ModelSlider
          label="Subsidio de promo por orden ($)"
          value={subsidy} min={0} max={10} step={0.1}
          format={v => `$${v.toFixed(1)}`}
          explanation="Cuánto le 'devuelves' al usuario por cada orden en forma de descuento, cashback o free delivery. Es tu costo directo de la promo."
          onChange={v => onChange({ ...inputs, subsidy: v })}
        />
        <ResultCallout results={[
          { label: 'Contribution margin por orden', value: `$${cm.toFixed(2)}`, color: cm >= 0 ? 'text-emerald-400' : 'text-red-400' },
          { label: 'Revenue por orden (comisión + delivery fee)', value: `$${revenue.toFixed(2)}`, color: 'text-blue-400' },
        ]} />
      </div>
      <div className="ds-card p-4">
        <p className="text-xs text-gray-400 uppercase font-mono mb-3 tracking-widest">WATERFALL POR ORDEN — DESGLOSE DE COSTOS</p>
        <ChartErrorBoundary>
          <ResponsiveContainer width="100%" height={300}>
          <BarChart data={wfData} margin={{ top: 20, right: 20, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} tickFormatter={v => `$${v.toFixed(1)}`} />
            <Tooltip
              formatter={(val, name) => {
                if (name === 'spacer') return null
                return [`$${val.toFixed(2)}`, name]
              }}
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }}
            />
            <Bar dataKey="spacer" stackId="wf" fill="transparent" isAnimationActive={false} />
            <Bar dataKey="bar" stackId="wf" radius={[3, 3, 0, 0]} isAnimationActive={false}>
              {wfData.map((d, i) => (
                <Cell key={i} fill={
                  d.type === 'neg' ? '#f87171' :
                  d.type === 'total' ? (cm >= 0 ? '#34d399' : '#f87171') :
                  d.type === 'base' ? '#3b82f6' : '#6b7280'
                } />
              ))}
              <LabelList
                dataKey="delta"
                position="top"
                formatter={v => v >= 0 ? `+$${v.toFixed(2)}` : `-$${Math.abs(v).toFixed(2)}`}
                style={{ fill: '#9ca3af', fontSize: 10 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartErrorBoundary></div>
    </div>
  )
}

// ── Model B2: Escenarios ──────────────────────────────────────────────────────

function ModelB2({ inputs, onChange }) {
  const { variance, horizon } = inputs

  const data = Array.from({ length: horizon }, (_, t) => {
    const base = Math.round(50000 + t * 500 + Math.sin(t * 0.5) * 2000)
    const best = Math.round(base * Math.pow(1 + variance / 100, t / horizon))
    const worst = Math.round(base * Math.pow(1 - variance / 100, t / horizon))
    return { w: `S${t + 1}`, base, best, worst }
  })

  const lastBase = data[data.length - 1].base
  const lastBest = data[data.length - 1].best
  const lastWorst = data[data.length - 1].worst
  const amplitude = Math.round(((lastBest - lastWorst) / lastBase) * 100)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="ds-card p-4 mb-4">
          <p className="text-emerald-400 text-xs font-mono uppercase mb-1 tracking-widest">QUÉ HACE</p>
          <p className="text-gray-200 text-sm leading-relaxed">Toma tu forecast base y genera automáticamente un caso optimista y uno pesimista, variando los inputs clave. Te da un rango de confianza para presentar a liderazgo.</p>
          <p className="text-amber-400 text-xs font-mono uppercase mt-3 mb-1 tracking-widest">CUÁNDO USARLO</p>
          <p className="text-gray-400 text-sm">Cuando necesitas presentar un forecast a dirección o finanzas. Nunca presentes un solo número — siempre con rangos.</p>
        </div>
        <ModelSlider
          label="Variación de escenarios (%)"
          value={variance} min={10} max={40} step={1}
          format={v => `±${v}%`}
          explanation="Cuánto varía cada input entre el caso base y los extremos. ±20% es conservador pero creíble. ±30% cubre escenarios más disruptivos."
          onChange={v => onChange({ ...inputs, variance: v })}
        />
        <ModelSlider
          label="Horizonte de forecast (semanas)"
          value={horizon} min={4} max={26} step={1}
          format={v => `${v} semanas`}
          explanation="A más semanas, mayor es la divergencia entre escenarios. Esto es matemáticamente inevitable: la incertidumbre se acumula."
          onChange={v => onChange({ ...inputs, horizon: v })}
        />
        <ResultCallout results={[
          { label: `Rango semana ${horizon}`, value: `${lastWorst.toLocaleString('es-MX')} – ${lastBest.toLocaleString('es-MX')}`, color: 'text-gray-200' },
          { label: 'Amplitud del rango vs caso base', value: `${amplitude}%`, color: amplitude < 25 ? 'text-emerald-400' : amplitude < 50 ? 'text-amber-400' : 'text-red-400' },
        ]} />
      </div>
      <div className="ds-card p-4">
        <p className="text-xs text-gray-400 uppercase font-mono mb-3 tracking-widest">ESCENARIOS — LAS LÍNEAS DIVERGEN CON EL TIEMPO</p>
        <ChartErrorBoundary>
          <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="w" tick={{ fontSize: 9 }} interval={Math.floor(horizon / 5)} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v, n) => [v.toLocaleString('es-MX'), n]}
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Area type="monotone" dataKey="best" name="Mejor caso" stroke="#34d399" fill="#34d399" fillOpacity={0.05} strokeDasharray="4 4" strokeWidth={2} isAnimationActive={false} />
            <Area type="monotone" dataKey="base" name="Caso base" stroke="#9ca3af" fill="#9ca3af" fillOpacity={0.15} strokeWidth={2.5} isAnimationActive={false} />
            <Area type="monotone" dataKey="worst" name="Peor caso" stroke="#f87171" fill="#f87171" fillOpacity={0.05} strokeDasharray="4 4" strokeWidth={2} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartErrorBoundary></div>
    </div>
  )
}

// ── Model C1: Market Share ────────────────────────────────────────────────────

function ModelC1({ inputs, onChange }) {
  const { marketSize, share, evento, growth } = inputs

  const eventEffects = {
    none: { shareChange: 0, marketMultiplier: 1.0, label: 'Sin cambio' },
    comp_exits: { shareChange: 15, marketMultiplier: 1.0, label: 'Comp. sale: tu share sube +15pp' },
    new_comp: { shareChange: -5, marketMultiplier: 1.0, label: 'Nuevo competidor: -5pp' },
    price_war: { shareChange: 0, marketMultiplier: 1.15, label: 'Guerra de precios: mercado +15%' },
  }

  const effect = eventEffects[evento] || eventEffects.none
  const growthPerWeek = Math.pow(1 + growth / 100, 1 / 4) - 1

  const data = Array.from({ length: 24 }, (_, t) => {
    const totalMercado = Math.round(marketSize * Math.pow(1 + growthPerWeek, t) * (evento !== 'none' && t >= 12 ? effect.marketMultiplier : 1.0))
    const shareTransition = evento !== 'none' && t >= 4 && t < 12 ? (t - 4) / 8 : evento !== 'none' && t >= 12 ? 1 : 0
    const currentShare = (share + effect.shareChange * shareTransition) / 100
    const tusPlatforma = Math.round(totalMercado * currentShare)
    return { w: `S${t + 1}`, totalMercado, tusPlatforma }
  })

  const week24 = data[23]
  const week1 = data[0]
  const delta = week24.tusPlatforma - week1.tusPlatforma

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="ds-card p-4 mb-4">
          <p className="text-emerald-400 text-xs font-mono uppercase mb-1 tracking-widest">QUÉ HACE</p>
          <p className="text-gray-200 text-sm leading-relaxed">Estima tus órdenes como porcentaje de un mercado total que crece. Modela el impacto de eventos competitivos: si un competidor sale, si entra uno nuevo, si hay guerra de precios.</p>
          <p className="text-amber-400 text-xs font-mono uppercase mt-3 mb-1 tracking-widest">CUÁNDO USARLO</p>
          <p className="text-gray-400 text-sm">Cuando tu estrategia no opera en un vacío — cuando hay movimientos de competidores que afectan tu volumen.</p>
        </div>
        <ModelSlider
          label="Tamaño total del mercado (órdenes/sem)"
          value={marketSize} min={50000} max={1000000} step={25000}
          format={v => `${(v / 1000).toFixed(0)}k`}
          explanation="El total de órdenes de delivery de TODAS las plataformas en tu zona. Puedes estimarlo dividiendo tu volumen por tu share estimado."
          onChange={v => onChange({ ...inputs, marketSize: v })}
        />
        <ModelSlider
          label="Tu market share actual (%)"
          value={share} min={5} max={80} step={1}
          format={v => `${v}%`}
          explanation="Tu porcentaje del mercado total. En mercados LATAM, el líder típicamente tiene 35-60% de share."
          onChange={v => onChange({ ...inputs, share: v })}
        />
        <div className="ds-card p-4 mb-3">
          <label className="text-gray-300 text-sm font-medium block mb-2">Evento competitivo</label>
          <select
            value={evento}
            onChange={e => onChange({ ...inputs, evento: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="none">Ninguno</option>
            <option value="comp_exits">Competidor sale (+15pp share a repartir)</option>
            <option value="new_comp">Nuevo competidor entra (-5pp)</option>
            <option value="price_war">Guerra de precios (+15% mercado total)</option>
          </select>
          <p className="text-xs text-gray-500 italic mt-2">Los eventos competitivos no son instantáneos — el share se ajusta gradualmente en 4-8 semanas.</p>
        </div>
        <ModelSlider
          label="Crecimiento del mercado (%/mes)"
          value={growth} min={0} max={5} step={0.1}
          format={v => `${v.toFixed(1)}%/mes`}
          explanation="La adopción general de food delivery en la zona crece independientemente de las acciones de las plataformas."
          onChange={v => onChange({ ...inputs, growth: v })}
        />
        <ResultCallout results={[
          { label: 'Tus órdenes semana 24', value: week24.tusPlatforma.toLocaleString('es-MX'), color: 'text-emerald-400' },
          { label: 'Ganancia/pérdida vs semana 1', value: `${delta >= 0 ? '+' : ''}${delta.toLocaleString('es-MX')} órdenes/sem`, color: delta >= 0 ? 'text-emerald-400' : 'text-red-400' },
        ]} />
      </div>
      <div className="ds-card p-4">
        <p className="text-xs text-gray-400 uppercase font-mono mb-3 tracking-widest">MERCADO TOTAL VS TU PLATAFORMA — 24 SEMANAS</p>
        <ChartErrorBoundary>
          <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="w" tick={{ fontSize: 9 }} interval={4} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v, n) => [v.toLocaleString('es-MX'), n]}
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Area type="monotone" dataKey="totalMercado" name="Total mercado" stroke="#6b7280" fill="#6b7280" fillOpacity={0.1} strokeWidth={1.5} isAnimationActive={false} />
            <Area type="monotone" dataKey="tusPlatforma" name="Tu plataforma" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} strokeWidth={2.5} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartErrorBoundary></div>
    </div>
  )
}

// ── Models Registry ───────────────────────────────────────────────────────────

const MODEL_IDS = ['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'C1']
const MODEL_SHORT_NAMES = {
  A1: 'Promo Uplift',
  A2: 'Restaurantes',
  A3: 'Canibalización',
  A4: 'Estacionalidad',
  A5: 'Ciudad Nueva',
  B1: 'Unit Economics',
  B2: 'Escenarios',
  C1: 'Market Share',
}

// ── Interactive Waterfall Section ─────────────────────────────────────────────

function InteractiveWaterfall() {
  const [wf, setWf] = useState({
    base: 45000,
    promos: 12000,
    acquisition: 8000,
    canib: 4000,
    seasonal: 3500,
  })

  const drivers = [
    { name: '📦 Base', delta: wf.base, type: 'base' },
    { name: '🎯 Promos', delta: wf.promos, type: 'pos' },
    { name: '🏪 Restaurantes', delta: wf.acquisition, type: 'pos' },
    { name: '⚡ Canibalización', delta: -wf.canib, type: 'neg' },
    { name: '🌡️ Estacional', delta: wf.seasonal, type: wf.seasonal >= 0 ? 'pos' : 'neg' },
    { name: '= Total', delta: 0, type: 'total' },
  ]

  const wfData = buildWaterfall(drivers)
  const totalNeto = wf.base + wf.promos + wf.acquisition - wf.canib + wf.seasonal
  const vsBase = ((totalNeto - wf.base) / wf.base * 100).toFixed(1)
  const promoPct = ((wf.promos + wf.acquisition - wf.canib) / totalNeto * 100).toFixed(0)
  const estimatedCost = wf.promos * 2.5

  return (
    <div>
      {/* Result chips */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-900/30 border border-emerald-800/50">
          <span className="text-xs text-gray-400 font-mono">Total Neto</span>
          <span className="text-emerald-400 font-mono font-bold text-sm">{totalNeto.toLocaleString('es-MX')} órdenes</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-900/30 border border-blue-800/50">
          <span className="text-xs text-gray-400 font-mono">vs Base</span>
          <span className="text-blue-400 font-mono font-bold text-sm">{vsBase >= 0 ? '+' : ''}{vsBase}%</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-900/30 border border-amber-800/50">
          <span className="text-xs text-gray-400 font-mono">Costo est. promo</span>
          <span className="text-amber-400 font-mono font-bold text-sm">~${Math.round(estimatedCost).toLocaleString('es-MX')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className="space-y-3">
          {[
            {
              key: 'base', icon: '📦', label: 'Órdenes Base',
              min: 10000, max: 100000, step: 1000,
              hint: 'Tu volumen semanal sin ninguna iniciativa',
            },
            {
              key: 'promos', icon: '🎯', label: '+Uplift de Promos',
              min: 0, max: 30000, step: 500,
              hint: 'Órdenes adicionales de campañas activas esta semana',
            },
            {
              key: 'acquisition', icon: '🏪', label: '+Nuevos Restaurantes',
              min: 0, max: 20000, step: 500,
              hint: 'Órdenes de restaurantes en curva de maduración',
            },
            {
              key: 'canib', icon: '⚡', label: '−Canibalización',
              min: 0, max: 10000, step: 200,
              hint: 'Pedidos que se pierden por superposición de promos',
            },
            {
              key: 'seasonal', icon: '🌡️', label: '×Ajuste Estacional',
              min: -10000, max: 10000, step: 100,
              hint: 'Factor por feriados, lluvia, quincena (puede ser negativo)',
            },
          ].map(({ key, icon, label, min, max, step, hint }) => (
            <div key={key} className="ds-card p-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="text-sm font-medium text-gray-300">{icon} {label}</span>
                  <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
                </div>
                <span className="text-blue-400 font-mono font-bold text-sm ml-4 flex-shrink-0">
                  {wf[key] >= 0 ? '+' : ''}{wf[key].toLocaleString('es-MX')}
                </span>
              </div>
              <input
                type="range" min={min} max={max} step={step} value={wf[key]}
                onChange={e => setWf(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                className="w-full h-1.5 rounded-full appearance-none bg-gray-700 accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>{min >= 0 ? min.toLocaleString('es-MX') : min.toLocaleString('es-MX')}</span>
                <span>{max.toLocaleString('es-MX')}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Waterfall chart */}
        <div className="ds-card p-4">
          <p className="text-xs text-gray-400 uppercase font-mono mb-3 tracking-widest">CONTRIBUCIÓN POR DRIVER — WATERFALL DE ÓRDENES</p>
          <ChartErrorBoundary>
            <ResponsiveContainer width="100%" height={360}>
            <BarChart data={wfData} margin={{ top: 30, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(val, name, props) => {
                  if (name === 'spacer') return null
                  const entry = props?.payload
                  if (!entry) return [val, name]
                  const sign = entry.delta >= 0 ? '+' : ''
                  return [`${sign}${(entry.delta || 0).toLocaleString('es-MX')} órdenes`, entry.name]
                }}
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }}
              />
              <Bar dataKey="spacer" stackId="wf" fill="transparent" isAnimationActive={false} />
              <Bar dataKey="bar" stackId="wf" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                {wfData.map((d, i) => (
                  <Cell key={i} fill={
                    d.type === 'neg' ? '#f87171' :
                    d.type === 'total' ? '#34d399' :
                    d.type === 'base' ? '#6b7280' : '#3b82f6'
                  } />
                ))}
                <LabelList
                  dataKey="delta"
                  position="top"
                  formatter={v => v > 0 ? `+${(v / 1000).toFixed(0)}k` : `${(v / 1000).toFixed(0)}k`}
                  style={{ fill: '#9ca3af', fontSize: 11 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartErrorBoundary></div>
      </div>
    </div>
  )
}

// ── Main HomePage ─────────────────────────────────────────────────────────────

export default function HomePage() {
  const [excelToast, setExcelToast] = useState(false)
  const [activeModel, setActiveModel] = useState('A1')
  const [modelInputs, setModelInputs] = useState({
    A1: { base: 45000, uplift: 25, duracion: 4 },
    A2: { restosPerWeek: 10, steadyState: 120, tipo: 'dark_kitchen' },
    A3: { upliftA: 25, upliftB: 20, canib: 30 },
    A4: { pais: 'CL', semana: 38, lluvia: false },
    A5: { tam: 500000, adopcion: 8, couriers: 30000 },
    B1: { aov: 18, commission: 27, courierCost: 3.5, subsidy: 2.5 },
    B2: { variance: 20, horizon: 12 },
    C1: { marketSize: 200000, share: 35, evento: 'none', growth: 1.5 },
  })

  // Scroll reveal refs
  const statsRef = useRef(null)
  const modelsRef = useRef(null)
  const waterfallRef = useRef(null)
  const latamRef = useRef(null)
  const excelRef = useRef(null)
  const techRef = useRef(null)
  const ctaRef = useRef(null)

  const statsVisible = useScrollReveal(statsRef)
  const modelsVisible = useScrollReveal(modelsRef)
  const waterfallVisible = useScrollReveal(waterfallRef)
  const latamVisible = useScrollReveal(latamRef)
  const excelVisible = useScrollReveal(excelRef)
  const techVisible = useScrollReveal(techRef)
  const ctaVisible = useScrollReveal(ctaRef)

  // Counters
  const c1 = useCounter(8, statsVisible)
  const c2 = useCounter(17, statsVisible)
  const c3 = useCounter(52, statsVisible)
  const c4 = useCounter(9, statsVisible)

  const handleExcelDemo = () => {
    setExcelToast(true)
    setTimeout(() => setExcelToast(false), 3000)
  }

  const updateModelInputs = (id, vals) => {
    setModelInputs(prev => ({ ...prev, [id]: vals }))
  }

  const renderActiveModel = () => {
    const inp = modelInputs[activeModel]
    const upd = (vals) => updateModelInputs(activeModel, vals)
    switch (activeModel) {
      case 'A1': return <ModelA1 inputs={inp} onChange={upd} />
      case 'A2': return <ModelA2 inputs={inp} onChange={upd} />
      case 'A3': return <ModelA3 inputs={inp} onChange={upd} />
      case 'A4': return <ModelA4 inputs={inp} onChange={upd} />
      case 'A5': return <ModelA5 inputs={inp} onChange={upd} />
      case 'B1': return <ModelB1 inputs={inp} onChange={upd} />
      case 'B2': return <ModelB2 inputs={inp} onChange={upd} />
      case 'C1': return <ModelC1 inputs={inp} onChange={upd} />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">

      {/* ── SECTION 1: Navigation ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <span className="font-mono font-semibold text-gray-100 text-sm tracking-tight">Forecast Studio</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#modelos" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">Modelos</a>
            <a href="#latam" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">Países</a>
            <a href="#excel" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">Excel Export</a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/forecasts" className="btn-ghost text-xs">Ver Forecasts</Link>
            <Link to="/new" className="btn-primary text-xs">Nuevo Forecast →</Link>
          </div>
        </div>
      </nav>

      {/* ── SECTION 2: Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950/20 via-gray-950 to-gray-950 pt-16 pb-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-800/50 text-blue-400 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              8 modelos cuantitativos · LATAM-first
            </div>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-gray-50">
              Forecasting para<br />
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Food Delivery
              </span>
            </h1>

            <p className="text-gray-400 text-lg leading-relaxed max-w-md">
              8 modelos cuantitativos para proyectar órdenes, ROI y expansión.
              Diseñado para equipos de Estrategia y Operaciones en LATAM.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link to="/new" className="btn-primary px-6 py-2.5 text-sm font-semibold shadow-lg shadow-blue-900/30">
                Crear Forecast →
              </Link>
              <a href="#modelos" className="btn-ghost px-6 py-2.5 text-sm border border-gray-700">
                Ver Modelos
              </a>
            </div>

            <div className="flex flex-wrap gap-6 pt-2 border-t border-gray-800">
              {[
                { value: '8', label: 'Modelos' },
                { value: '17', label: 'Países LATAM' },
                { value: 'McKinsey', label: 'Excel Export' },
                { value: '100%', label: 'offline' },
              ].map((s) => (
                <div key={s.label}>
                  <div className="font-mono font-bold text-lg text-gray-100">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: hero chart */}
          <div className="ds-card p-4 shadow-xl shadow-blue-900/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-gray-400">Forecast · 26 semanas · Escenarios</span>
              <span className="ds-badge-blue text-[10px]">LIVE PREVIEW</span>
            </div>
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={heroData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="week" tick={{ fontSize: 9 }} interval={4} />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<HeroTooltip />} />
                <Legend iconType="line" wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="worst" name="Peor caso" stroke="#f87171" fill="#f87171" fillOpacity={0.05} strokeDasharray="4 4" isAnimationActive={true} animationDuration={1200} />
                <Area type="monotone" dataKey="base" name="Base" stroke="#6b7280" fill="#6b7280" fillOpacity={0.3} isAnimationActive={true} animationDuration={1200} animationBegin={100} />
                <Area type="monotone" dataKey="withPromos" name="Base + Promos" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} isAnimationActive={true} animationDuration={1200} animationBegin={200} />
                <Area type="monotone" dataKey="best" name="Mejor caso" stroke="#34d399" fill="#34d399" fillOpacity={0.05} strokeDasharray="4 4" isAnimationActive={true} animationDuration={1200} animationBegin={300} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartErrorBoundary></div>
        </div>
      </section>

      {/* ── SECTION 3: Animated Stats Counters ───────────────────────────── */}
      <section
        ref={statsRef}
        className={`py-16 border-y border-gray-800 bg-gray-900/30 transition-all duration-700 ${
          statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { count: c1, label: 'Modelos cuantitativos', suffix: '' },
              { count: c2, label: 'Países LATAM', suffix: '' },
              { count: c3, label: 'Semanas de horizonte', suffix: '' },
              { count: c4, label: 'Tabs Excel McKinsey', suffix: '' },
            ].map(({ count, label, suffix }) => (
              <div key={label} className="space-y-2">
                <div className="text-5xl font-mono font-bold text-blue-400">
                  {count}{suffix}
                </div>
                <div className="text-sm text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: Models — interactive tabs ─────────────────────────── */}
      <section
        id="modelos"
        ref={modelsRef}
        className={`py-20 transition-all duration-700 ${
          modelsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-100 mb-3">Los 8 modelos — explicados con datos reales</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Mueve los sliders para ver cómo cada input cambia el forecast en tiempo real
            </p>
          </div>

          {/* Tab bar */}
          <div className="flex flex-wrap gap-2 mb-6">
            {MODEL_IDS.map(id => (
              <button
                key={id}
                onClick={() => setActiveModel(id)}
                className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all ${
                  activeModel === id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                {id} {MODEL_SHORT_NAMES[id]}
              </button>
            ))}
          </div>

          {/* Active model panel */}
          <div>
            {renderActiveModel()}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: Interactive Waterfall ─────────────────────────────── */}
      <section
        ref={waterfallRef}
        className={`py-20 bg-gray-900/20 border-y border-gray-800 transition-all duration-700 ${
          waterfallVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-100 mb-3">Modelo Combinado — construye tu forecast capa por capa</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Cada iniciativa agrega (o resta) órdenes al total. Mueve los sliders para ver el impacto de cada driver.
            </p>
          </div>
          <InteractiveWaterfall />
        </div>
      </section>

      {/* ── SECTION 6: LATAM Coverage ─────────────────────────────────────── */}
      <section
        id="latam"
        ref={latamRef}
        className={`py-20 transition-all duration-700 ${
          latamVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-100 mb-3">17 países de LATAM configurados</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Feriados, ciclos de pago, temporadas de lluvia y patrones semanales pre-cargados por país.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {countries.map((country) => (
              <div
                key={country.name}
                className="ds-card p-3 cursor-default hover:border-blue-700 hover:bg-blue-950/30 transition-all duration-200 group"
              >
                <div className="text-2xl mb-1">{country.flag}</div>
                <div className="text-xs font-semibold text-gray-200 mb-1">{country.name}</div>
                <div className="space-y-0.5 mb-2">
                  {country.facts.map((f) => (
                    <div key={f} className="text-[10px] text-gray-500 leading-tight">{f}</div>
                  ))}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Sparkline data={country.pattern} />
                  <div className="flex justify-between text-[8px] text-gray-600 mt-0.5">
                    <span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 7: Excel McKinsey Export ─────────────────────────────── */}
      <section
        id="excel"
        ref={excelRef}
        className={`py-20 bg-gray-900/20 border-y border-gray-800 transition-all duration-700 ${
          excelVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-100 mb-3">Export McKinsey-style Excel en un click</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              9 tabs estructurados con conditional formatting, freeze panes y assumptions log.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Excel mockup */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
                <div className="bg-gray-800 px-4 py-2 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                  <span className="ml-3 text-xs text-gray-400 font-mono">forecast_mx_2025.xlsx</span>
                </div>
                <div className="bg-gray-950 overflow-x-auto">
                  <table className="w-full text-[10px] font-mono">
                    <thead>
                      <tr className="bg-blue-950 text-blue-100">
                        <th className="px-2 py-1.5 text-left font-bold whitespace-nowrap border-r border-blue-900">Semana</th>
                        <th className="px-2 py-1.5 text-left font-bold whitespace-nowrap border-r border-blue-900">Fecha</th>
                        <th className="px-2 py-1.5 text-right font-bold whitespace-nowrap border-r border-blue-900">Base</th>
                        <th className="px-2 py-1.5 text-right font-bold whitespace-nowrap border-r border-blue-900">+Promos</th>
                        <th className="px-2 py-1.5 text-right font-bold whitespace-nowrap border-r border-blue-900">+Adq.</th>
                        <th className="px-2 py-1.5 text-right font-bold whitespace-nowrap border-r border-blue-900">-Canib.</th>
                        <th className="px-2 py-1.5 text-right font-bold whitespace-nowrap border-r border-blue-900">×Est.</th>
                        <th className="px-2 py-1.5 text-right font-bold whitespace-nowrap border-r border-blue-900">Total Neto</th>
                        <th className="px-2 py-1.5 text-right font-bold whitespace-nowrap border-r border-blue-900">WoW%</th>
                        <th className="px-2 py-1.5 text-right font-bold whitespace-nowrap border-r border-blue-900">Revenue</th>
                        <th className="px-2 py-1.5 text-right font-bold whitespace-nowrap">CM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { w: 'W01', f: '03-Jan', base: '45,000', p: '+7,200', a: '+3,100', c: '-1,800', e: '×1.05', t: '53,500', wow: '+2.4%', rev: '$96,300', cm: '$24,075', wowPos: true },
                        { w: 'W02', f: '10-Jan', base: '45,500', p: '+8,100', a: '+3,400', c: '-2,100', e: '×1.05', t: '54,900', wow: '+2.6%', rev: '$98,820', cm: '$24,705', wowPos: true },
                        { w: 'W03', f: '17-Jan', base: '46,000', p: '+9,500', a: '+3,700', c: '-2,400', e: '×1.08', t: '56,800', wow: '+3.5%', rev: '$102,240', cm: '$25,560', wowPos: true },
                        { w: 'W04', f: '24-Jan', base: '46,500', p: '+12,000', a: '+4,100', c: '-3,100', e: '×1.10', t: '59,500', wow: '+4.8%', rev: '$107,100', cm: '$26,775', wowPos: true },
                        { w: 'W05', f: '31-Jan', base: '47,000', p: '+6,500', a: '+4,400', c: '-2,200', e: '×0.98', t: '55,700', wow: '-6.4%', rev: '$100,260', cm: '$25,065', wowPos: false },
                      ].map((row, i) => (
                        <tr key={row.w} className={i % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900/40'}>
                          <td className="px-2 py-1.5 text-blue-400 font-bold border-r border-gray-800">{row.w}</td>
                          <td className="px-2 py-1.5 text-gray-400 border-r border-gray-800">{row.f}</td>
                          <td className="px-2 py-1.5 text-right text-gray-300 border-r border-gray-800">{row.base}</td>
                          <td className="px-2 py-1.5 text-right text-blue-400 border-r border-gray-800">{row.p}</td>
                          <td className="px-2 py-1.5 text-right text-purple-400 border-r border-gray-800">{row.a}</td>
                          <td className="px-2 py-1.5 text-right text-red-400 border-r border-gray-800">{row.c}</td>
                          <td className="px-2 py-1.5 text-right text-amber-400 border-r border-gray-800">{row.e}</td>
                          <td className="px-2 py-1.5 text-right text-emerald-400 font-bold border-r border-gray-800">{row.t}</td>
                          <td className={`px-2 py-1.5 text-right font-bold border-r border-gray-800 ${row.wowPos ? 'text-emerald-400' : 'text-red-400'}`}>{row.wow}</td>
                          <td className="px-2 py-1.5 text-right text-gray-300 border-r border-gray-800">{row.rev}</td>
                          <td className="px-2 py-1.5 text-right text-emerald-300">{row.cm}</td>
                        </tr>
                      ))}
                      <tr className="bg-blue-950/60 border-t border-blue-800">
                        <td className="px-2 py-1.5 text-blue-300 font-bold border-r border-blue-900" colSpan={2}>TOTAL 5W</td>
                        <td className="px-2 py-1.5 text-right text-gray-200 font-bold border-r border-blue-900">230,000</td>
                        <td className="px-2 py-1.5 text-right text-blue-300 font-bold border-r border-blue-900">+43,300</td>
                        <td className="px-2 py-1.5 text-right text-purple-300 font-bold border-r border-blue-900">+18,700</td>
                        <td className="px-2 py-1.5 text-right text-red-300 font-bold border-r border-blue-900">-11,600</td>
                        <td className="px-2 py-1.5 text-right text-amber-300 font-bold border-r border-blue-900">—</td>
                        <td className="px-2 py-1.5 text-right text-emerald-300 font-bold border-r border-blue-900">280,400</td>
                        <td className="px-2 py-1.5 text-right text-gray-400 border-r border-blue-900">+1.4%</td>
                        <td className="px-2 py-1.5 text-right text-gray-200 font-bold border-r border-blue-900">$504,720</td>
                        <td className="px-2 py-1.5 text-right text-emerald-300 font-bold">$126,180</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="bg-gray-900 border-t border-gray-700 px-2 py-1 flex gap-1 overflow-x-auto">
                  {['Cover', 'Exec Summary', 'Weekly Detail', 'Monthly Rollup', 'Cohort Waterfall', 'Promo Detail', 'Scenarios', 'Unit Economics', 'Assumptions Log'].map((tab) => (
                    <div
                      key={tab}
                      className={`px-3 py-1 text-[10px] font-mono rounded-t whitespace-nowrap cursor-default ${
                        tab === 'Weekly Detail'
                          ? 'bg-gray-950 text-blue-400 border border-b-0 border-gray-700'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {tab}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side bullets */}
            <div className="space-y-6">
              <div className="space-y-3">
                {[
                  { icon: '✓', text: '9 tabs automáticos', color: 'text-emerald-400' },
                  { icon: '✓', text: 'Conditional formatting (verde/rojo)', color: 'text-emerald-400' },
                  { icon: '✓', text: 'Freeze panes + auto column widths', color: 'text-emerald-400' },
                  { icon: '✓', text: 'Print area configurado', color: 'text-emerald-400' },
                  { icon: '✓', text: 'Assumptions Log para auditoría', color: 'text-emerald-400' },
                ].map(({ icon, text, color }) => (
                  <div key={text} className="flex items-start gap-3">
                    <span className={`font-bold mt-0.5 ${color}`}>{icon}</span>
                    <span className="text-sm text-gray-300">{text}</span>
                  </div>
                ))}
              </div>

              <div className="ds-card p-4 bg-gradient-to-br from-emerald-950/30 to-gray-900 border-emerald-800/40">
                <div className="text-xs text-gray-400 mb-1 font-mono">Formato McKinsey</div>
                <div className="text-sm text-gray-200 leading-relaxed">
                  Listo para presentar a Dirección. Navy headers, fuente Calibri, márgenes estándar.
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={handleExcelDemo}
                  className="w-full btn-primary py-3 text-sm font-semibold"
                >
                  Descargar Excel de ejemplo →
                </button>
                {excelToast && (
                  <div className="absolute -top-12 left-0 right-0 bg-emerald-900 border border-emerald-700 rounded-lg px-4 py-2 text-emerald-300 text-xs font-mono text-center animate-fade-in">
                    ✓ En un forecast real, el Excel se generaría aquí
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 8: Technical Details ──────────────────────────────────── */}
      <section
        ref={techRef}
        className={`py-20 transition-all duration-700 ${
          techVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-100 mb-3">Arquitectura de fórmulas</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Cada modelo tiene una ecuación explícita. Sin cajas negras.
            </p>
          </div>

          <div className="ds-card p-6 mb-8 overflow-x-auto">
            <div className="text-[10px] font-mono text-gray-500 mb-3 uppercase tracking-widest">Formula · Forecast Final[W]</div>
            <pre className="text-sm leading-loose">
              <span className="text-gray-400">{'Forecast Final[W] ='}</span>{'\n'}
              {'  '}<span className="text-blue-400">[Órdenes_base]</span>{'\n'}
              {'  + Σ '}<span className="text-blue-400">promo_uplift</span><span className="text-gray-400">[w]</span>{' × '}<span className="text-blue-400">fatigue</span><span className="text-gray-400">[w]</span>{' × '}<span className="text-blue-400">penetration</span><span className="text-gray-400">[segment]</span>{'    '}<span className="text-amber-500">{'← A1'}</span>{'\n'}
              {'  + Σ '}<span className="text-blue-400">cohort</span><span className="text-gray-400">[c][w]</span>{' × '}<span className="text-blue-400">maturation</span><span className="text-gray-400">[w]</span>{' × ('}<span className="text-emerald-400">1</span>{' - '}<span className="text-blue-400">churn</span><span className="text-gray-400">[w]</span>{')'}{' '.repeat(10)}<span className="text-amber-500">{'← A2'}</span>{'\n'}
              {'  - '}<span className="text-blue-400">cannibalization</span>{'('}<span className="text-blue-400">promos_activas</span><span className="text-gray-400">[w]</span>{')'}{' '.repeat(25)}<span className="text-amber-500">{'← A3'}</span>{'\n'}
              {'  × '}<span className="text-blue-400">seasonal_factor</span><span className="text-gray-400">[w]</span>{' '.repeat(37)}<span className="text-amber-500">{'← A4'}</span>{'\n'}
              {'  '}<span className="text-emerald-400">min</span>{'('}<span className="text-blue-400">supply_capacity</span><span className="text-gray-400">[w]</span>{')'}{' '.repeat(33)}<span className="text-amber-500">{'← A5'}</span>{'\n'}
              {'  × '}<span className="text-blue-400">market_share</span><span className="text-gray-400">[w]</span>{' '.repeat(40)}<span className="text-amber-500">{'← C1'}</span>
            </pre>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '🔍',
                title: 'Validación doble',
                desc: 'Pydantic v2 en backend. Zod en frontend. Todo input validado antes de calcular.',
                badge: 'Pydantic v2 + Zod',
                color: 'border-blue-800/50',
              },
              {
                icon: '⚙️',
                title: '100% backend calc',
                desc: 'Python + NumPy. Todos los modelos corren server-side. El frontend solo visualiza.',
                badge: 'Python + NumPy',
                color: 'border-emerald-800/50',
              },
              {
                icon: '🗄️',
                title: 'SQLite local',
                desc: 'Sin dependencias externas. Los forecasts se guardan en SQLite. Corre offline.',
                badge: 'SQLite · sin cloud',
                color: 'border-purple-800/50',
              },
            ].map(({ icon, title, desc, badge, color }) => (
              <div key={title} className={`ds-card p-5 border ${color}`}>
                <div className="text-2xl mb-3">{icon}</div>
                <div className="font-semibold text-gray-100 mb-2">{title}</div>
                <div className="text-sm text-gray-400 leading-relaxed mb-3">{desc}</div>
                <code className="text-xs font-mono text-blue-400 bg-gray-950 px-2 py-1 rounded border border-gray-800">{badge}</code>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 8b: Featured — Markov Model ──────────────────────────── */}
      <section className="py-16 border-y border-gray-800 bg-gray-900/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <span className="ds-badge-blue text-xs mb-3 inline-block">NUEVO MODELO</span>
            <h2 className="text-2xl font-bold text-gray-100 mb-2">Markov + Funnel — el modelo más completo</h2>
            <p className="text-gray-400 max-w-lg mx-auto text-sm">
              Cadena de Markov con perfiles de usuario, funnel P1×P2 por entry point, levers con ramp-up configurable y P&L detallado. Para equipos con datos reales.
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <Link to="/markov" className="ds-card p-5 border-purple-800/60 bg-purple-950/20 hover:border-purple-600 transition-all block">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🧬</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-200">Modelo Markov v3</span>
                    <span className="ds-badge bg-purple-900/50 text-purple-400 border border-purple-800 text-[10px]">NUEVO</span>
                  </div>
                  <p className="text-xs text-gray-400">Cadena de Markov + Traffic Funnel + Levers + Acquisition Loop + P&L. El modelo más completo para equipos con datos reales de usuarios.</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {['Markov', 'Funnel P1×P2', 'Levers', 'Flywheel', 'P&L'].map(t => (
                      <span key={t} className="ds-badge-gray text-[10px]">{t}</span>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-purple-400 font-mono">→ Abrir wizard de 7 pasos</div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 9: CTA Footer ─────────────────────────────────────────── */}
      <section
        ref={ctaRef}
        className={`py-24 bg-gradient-to-br from-blue-950/30 via-gray-950 to-gray-950 border-t border-gray-800 transition-all duration-700 ${
          ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="w-12 h-1 bg-blue-500 mx-auto mb-8 rounded" />
          <h2 className="text-4xl font-bold text-gray-100 mb-4">
            ¿Listo para construir<br />tu forecast?
          </h2>
          <p className="text-gray-400 text-lg mb-8 leading-relaxed">
            Setup en 5 minutos. Sin cuenta. Sin API keys.<br />
            Corre 100% local o en Vercel.
          </p>
          <Link
            to="/new"
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-lg rounded-xl transition-colors shadow-xl shadow-blue-900/30"
          >
            → Crear mi primer forecast
          </Link>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500">
            <span>✓ Sin registro</span>
            <span>✓ 100% offline</span>
            <span>✓ Open source</span>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="py-6 border-t border-gray-800 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="font-mono text-sm text-gray-500">
            📊 Forecast Studio · Built for LATAM Food Delivery Operations
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <Link to="/forecasts" className="hover:text-gray-400 transition-colors">Mis Forecasts</Link>
            <Link to="/new" className="hover:text-gray-400 transition-colors">Nuevo Forecast</Link>
            <Link to="/settings" className="hover:text-gray-400 transition-colors">Settings</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
