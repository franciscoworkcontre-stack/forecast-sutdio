import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
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

// ── Taxonomy Data (MBB Consulting Framework) ──────────────────────────────────

const COLOR_STYLES = {
  blue:    { headerBg: 'bg-blue-950/30',    text: 'text-blue-400',    active: 'bg-blue-900/20 border-blue-700' },
  emerald: { headerBg: 'bg-emerald-950/30', text: 'text-emerald-400', active: 'bg-emerald-900/20 border-emerald-700' },
  purple:  { headerBg: 'bg-purple-950/30',  text: 'text-purple-400',  active: 'bg-purple-900/20 border-purple-700' },
}

// ── 20 Industries ────────────────────────────────────────────────────────────

const INDUSTRIES = [
  {
    id: 'food_delivery', icon: '🍔', name: 'Food Delivery', category: 'marketplace',
    demand: 'Usuarios', supply: 'Restaurantes', transaction: 'Orden',
    models: ['D1', 'D3', 'P3'],
    vars: { aov: 'AOV', take_rate: 'Take Rate', courier_cost: 'Costo Courier' },
    insight: 'Tiempo de entrega <20min = +15-25% órdenes sin promo',
    color: 'orange',
  },
  {
    id: 'rideshare', icon: '🚗', name: 'Ridesharing', category: 'marketplace',
    demand: 'Pasajeros', supply: 'Conductores', transaction: 'Viaje',
    models: ['D3', 'S2', 'P5'],
    vars: { aov: 'Tarifa/Viaje', take_rate: 'Comisión', courier_cost: 'Pago Conductor' },
    insight: 'Exceso de oferta destruye eficiencia de CAC; déficit dispara precios y daña retención',
    color: 'blue',
  },
  {
    id: 'ecommerce', icon: '🛒', name: 'E-commerce', category: 'marketplace',
    demand: 'Compradores', supply: 'Vendedores', transaction: 'Orden',
    models: ['D1', 'D2', 'S3'],
    vars: { aov: 'Valor Orden', take_rate: 'Comisión + Fees', courier_cost: 'Costo Fulfillment' },
    insight: 'Vendedores de baja calidad dañan retención del comprador antes de alcanzar escala',
    color: 'yellow',
  },
  {
    id: 'quick_commerce', icon: '⚡', name: 'Quick Commerce', category: 'marketplace',
    demand: 'Shoppers', supply: 'Nodos / Tiendas', transaction: 'Canasta',
    models: ['D1', 'D3', 'P3'],
    vars: { aov: 'Valor Canasta', take_rate: 'Comisión + Delivery', courier_cost: 'Costo Fulfillment' },
    insight: 'CAC debe recuperarse en 3-5 órdenes; frecuencia > AOV como lever principal',
    color: 'cyan',
  },
  {
    id: 'super_app', icon: '📱', name: 'Super App', category: 'marketplace',
    demand: 'Usuarios', supply: 'Proveedores multi-vertical', transaction: 'Transacción cross-servicio',
    models: ['D3', 'D5', 'P5'],
    vars: { aov: 'GMV Mensual/User', take_rate: 'Take Rate Blended', courier_cost: 'Costo Operacional' },
    insight: 'Usuarios multi-servicio tienen LTV 4-5x mayor; requieren balance de unit economics cross-vertical',
    color: 'purple',
  },
  {
    id: 'beauty_wellness', icon: '💅', name: 'Beauty & Wellness', category: 'marketplace',
    demand: 'Clientes', supply: 'Profesionales / Salones', transaction: 'Reserva / Cita',
    models: ['S1', 'S2', 'P4'],
    vars: { aov: 'Precio Servicio', take_rate: 'Comisión', courier_cost: 'N/A' },
    insight: 'Retención es profesional-driven: clientes siguen al terapeuta, no a la plataforma',
    color: 'pink',
  },
  {
    id: 'saas_b2b', icon: '💼', name: 'SaaS B2B', category: 'saas',
    demand: 'Empresas / Clientes', supply: 'Software (single-sided)', transaction: 'Suscripción',
    models: ['D1', 'D2', 'S1'],
    vars: { aov: 'ARPU Mensual', take_rate: 'N/A', courier_cost: 'Costo CS' },
    insight: 'NRR >120% via upsell/expansion compensa churn; payback <12 meses es el umbral de viabilidad',
    color: 'blue',
  },
  {
    id: 'b2b_platform', icon: '🏪', name: 'B2B SaaS Platform', category: 'saas',
    demand: 'Merchants / Sellers', supply: 'Apps / Integraciones', transaction: 'Suscripción + Comisión GMV',
    models: ['S1', 'S2', 'P2'],
    vars: { aov: 'Revenue/Merchant', take_rate: 'Platform Take Rate', courier_cost: 'Onboarding Cost' },
    insight: 'Plataforma Shopify-style: NRR 110-135% via GMV growth; retención alta (85-95%) si el seller es rentable',
    color: 'green',
  },
  {
    id: 'gig_freelance', icon: '🧑‍💻', name: 'Gig / Freelance', category: 'saas',
    demand: 'Clientes / Compradores', supply: 'Freelancers / Proveedores', transaction: 'Proyecto / Gig',
    models: ['S1', 'S2', 'P1'],
    vars: { aov: 'Valor Proyecto', take_rate: 'Comisión Plataforma', courier_cost: 'N/A' },
    insight: 'Freelancers tienen bajo switching cost (25-40% churn anual); clients retienen 40-60% vía calidad de supply',
    color: 'indigo',
  },
  {
    id: 'hr_marketplace', icon: '👔', name: 'HR Tech / Empleo', category: 'saas',
    demand: 'Candidatos', supply: 'Empleadores / Reclutadores', transaction: 'Postulación / Contratación',
    models: ['S1', 'S2', 'P1'],
    vars: { aov: 'Costo Publicación', take_rate: 'Suscripción Recruiter', courier_cost: 'N/A' },
    insight: 'Retención de empleadores (75-85%) es alta por switching costs; candidatos dejan la plataforma al ser contratados',
    color: 'slate',
  },
  {
    id: 'streaming', icon: '🎬', name: 'Streaming / OTT', category: 'consumer',
    demand: 'Suscriptores', supply: 'Contenido / Studios', transaction: 'Suscripción / Sesión',
    models: ['D1', 'D2', 'D5'],
    vars: { aov: 'ARPU Mensual', take_rate: 'N/A', courier_cost: 'Content Spend %' },
    insight: 'Churn impulsado por frescura de contenido; personalización explica >80% del engagement y es el lever principal',
    color: 'red',
  },
  {
    id: 'edtech', icon: '📚', name: 'EdTech', category: 'consumer',
    demand: 'Estudiantes', supply: 'Creadores / Cursos', transaction: 'Inscripción / Lección / Suscripción',
    models: ['D1', 'D2', 'P4'],
    vars: { aov: 'ARPU Mensual', take_rate: 'N/A', courier_cost: 'Costo Contenido' },
    insight: 'D7 retention (11-13%) separa apps viables de las que no; hábito > calidad de contenido como driver de retención',
    color: 'emerald',
  },
  {
    id: 'mobile_gaming', icon: '🎮', name: 'Mobile Gaming', category: 'consumer',
    demand: 'Jugadores', supply: 'Desarrolladores / Creadores', transaction: 'IAP / Battle Pass / Ad',
    models: ['D1', 'D3', 'P4'],
    vars: { aov: 'ARPPU', take_rate: 'N/A', courier_cost: 'UA Cost' },
    insight: '98% de usuarios son gratis; D1-D7 retention es el binding constraint, no la monetización',
    color: 'violet',
  },
  {
    id: 'sports_fitness', icon: '🏋️', name: 'Fitness Tech', category: 'consumer',
    demand: 'Miembros', supply: 'Gimnasios / Instructores', transaction: 'Reserva / Membresía',
    models: ['D1', 'D3', 'P4'],
    vars: { aov: 'Membresía Mensual', take_rate: 'Comisión Clases', courier_cost: 'N/A' },
    insight: 'Miembros que van 2x/semana tienen 50% menos churn que 1x/semana; activación temprana es el KPI crítico',
    color: 'lime',
  },
  {
    id: 'fintech_lending', icon: '💳', name: 'Fintech / Lending', category: 'financial',
    demand: 'Prestatarios', supply: 'Capital / Prestamistas', transaction: 'Préstamo / Crédito',
    models: ['D2', 'P1', 'P5'],
    vars: { aov: 'Monto Préstamo', take_rate: 'Margen + Originación', courier_cost: 'Default Rate' },
    insight: 'Rentabilidad escala via repeat borrowing y expansión de línea; CAC de Nubank <$7 es outlier de categoría',
    color: 'teal',
  },
  {
    id: 'hotel_str', icon: '🏨', name: 'Hotel / Short-term Rental', category: 'marketplace',
    demand: 'Huéspedes', supply: 'Hosts / Propiedades', transaction: 'Reserva / Estadía',
    models: ['D2', 'S1', 'S4'],
    vars: { aov: 'Tarifa Nocturna', take_rate: 'Comisión Booking', courier_cost: 'N/A' },
    insight: 'Supply es el cuello de botella: churn de hosts (20%) es impulsado por regulación y carga de gestión',
    color: 'amber',
  },
  {
    id: 'pharmacy', icon: '💊', name: 'Farmacia / Health Commerce', category: 'marketplace',
    demand: 'Pacientes', supply: 'Farmacias / Laboratorios', transaction: 'Pedido / Receta',
    models: ['D1', 'D5', 'P3'],
    vars: { aov: 'Valor Pedido', take_rate: 'Comisión + Delivery', courier_cost: 'Costo Entrega' },
    insight: 'Retención alta (60-75%) por recetas crónicas; LTV se expande con adherencia y múltiples condiciones',
    color: 'sky',
  },
  {
    id: 'real_estate', icon: '🏠', name: 'Real Estate Tech', category: 'financial',
    demand: 'Compradores / Arrendatarios', supply: 'Agentes / Brokers', transaction: 'Listado / Transacción',
    models: ['S1', 'S2', 'P2'],
    vars: { aov: 'Valor Transacción', take_rate: 'Split Comisión', courier_cost: 'N/A' },
    insight: 'Top agents retienen 85-90%; buyers tienen baja repeat rate (10-20%) por baja frecuencia de compra',
    color: 'stone',
  },
  {
    id: 'telemedicine', icon: '🩺', name: 'Telemedicina', category: 'financial',
    demand: 'Pacientes', supply: 'Médicos / Proveedores', transaction: 'Consulta / Suscripción',
    models: ['D1', 'D5', 'P1'],
    vars: { aov: 'ARPU Mensual', take_rate: 'Comisión Recetas', courier_cost: 'Costo Compliance' },
    insight: 'LTV escala via expansión de condición (hair → ansiedad → peso) sin incremento proporcional de CAC',
    color: 'cyan',
  },
  {
    id: 'travel_ota', icon: '✈️', name: 'Travel / OTA', category: 'financial',
    demand: 'Viajeros', supply: 'Hoteles / Aerolíneas', transaction: 'Reserva',
    models: ['D2', 'P2', 'P5'],
    vars: { aov: 'Valor Reserva', take_rate: 'Comisión OTA', courier_cost: 'N/A' },
    insight: 'D30 retention 2.8-5% — la más baja de todas las industrias; profitabilidad depende enteramente del CAC',
    color: 'indigo',
  },
]

const IND_CATEGORIES = {
  marketplace: { label: 'Marketplace & Delivery', color: 'text-orange-400' },
  saas:        { label: 'SaaS & Plataformas B2B', color: 'text-blue-400' },
  consumer:    { label: 'Consumer Tech', color: 'text-purple-400' },
  financial:   { label: 'Fintech, Salud & Viajes', color: 'text-emerald-400' },
}

const TAXONOMY = {
  D: {
    label: 'Demanda', sublabel: 'El usuario como driver de órdenes', color: 'blue',
    models: [
      {
        id: 'D1', name: 'User Lifecycle Markov',
        question: '¿Cuántas órdenes el próximo trimestre y de dónde vienen?',
        context: 'Usuarios en estados discretos (nuevos, activos, baja/alta frecuencia, dormidos, churned). Cada semana transicionan entre estados con probabilidades medibles. Las iniciativas modifican esas probabilidades.',
        insight: 'Descompone "+20% en órdenes" en acciones concretas: mueve 3k usuarios de baja a alta frecuencia, reduce churn 5pp, atrae 2k nuevos por semana. Cada iniciativa tiene un costo y un ROI separado.',
        status: 'full', demoId: null, link: '/markov', linkLabel: 'Abrir Wizard de 7 pasos →', level: 'advanced',
      },
      {
        id: 'D2', name: 'Cohort Retention & LTV',
        question: '¿Cuándo recupero el CAC? ¿Qué canal de adquisición es más eficiente?',
        context: 'Cada cohort semanal tiene curva de retención y frecuencia propia. El LTV total en cualquier semana es la suma de contribuciones de todos los cohorts activos.',
        insight: 'Una mejora de 5pp en retención W4 no solo añade usuarios ese día, sino indefinidamente. El NPV es siempre mayor de lo que parece. Este modelo produce el argumento cuantitativo para redirigir budget de adquisición a retención.',
        status: 'full', demoId: null, link: '/models/d2', linkLabel: 'Abrir Wizard →', level: 'mid',
      },
      {
        id: 'D3', name: 'Funnel Conversion',
        question: '¿En qué paso del journey pierdo la mayoría de órdenes potenciales?',
        context: 'Apertura de app → búsqueda → menú → carrito → checkout → repetición. Cada paso tiene una tasa de conversión medible vs benchmark de industria.',
        insight: 'Si tu checkout está en 55% y el benchmark es 75%, eso equivale a +36% más órdenes sin adquirir un solo usuario nuevo. El constraint de conversión es el lever más capital-eficiente de resolver.',
        status: 'full', demoId: null, link: '/models/d3', linkLabel: 'Abrir Wizard →', level: 'foundational',
      },
      {
        id: 'D4', name: 'Frequency & Wallet Share',
        question: '¿Cuánta frecuencia adicional puedo extraer de usuarios existentes?',
        context: 'Punto de partida: 21 ocasiones de comida por semana. ¿Cuántas son addressables para delivery? ¿Cuántas captura tu plataforma? El gap es el upside de frecuencia.',
        insight: 'En LATAM, delivery captura solo 5-8% de las ocasiones de comida. El techo teórico es 4-5x el nivel actual. Cada lever (desayunos, late-night, suscripción) cierra una fracción de ese gap.',
        status: 'full', demoId: null, link: '/models/d4', linkLabel: 'Abrir Wizard →', level: 'foundational',
      },
      {
        id: 'D5', name: 'Reactivation & Winback',
        question: '¿Cuántas órdenes puedo recuperar de mi base dormida?',
        context: 'El 40-60% de usuarios registrados están dormidos. Tienen probabilidad de reactivación decayente. Campañas de winback aumentan esa probabilidad a diferentes costos.',
        insight: 'La ventana dorada es semanas 4-8 post-último pedido. Antes vuelven solos. Después de 26 semanas, el costo de reactivación supera el LTV esperado del usuario reactivado.',
        status: 'full', demoId: null, link: '/models/d5', linkLabel: 'Abrir Wizard →', level: 'mid',
      },
    ],
  },
  S: {
    label: 'Oferta', sublabel: 'El restaurante como driver de órdenes', color: 'emerald',
    models: [
      {
        id: 'S1', name: 'Restaurant Onboarding & Maturation',
        question: '¿Cuántas órdenes generarán los restaurantes que estoy activando esta semana?',
        context: 'Cada restaurante sigue una curva de maduración (% del steady-state por semana de vida). La velocidad depende del tipo: dark kitchen madura en 8 semanas, tradicional en 12-16.',
        insight: 'El métrico predictivo clave es "órdenes en Semana 4". Un restaurante por debajo del mínimo en W4 tiene >80% de probabilidad de churnar antes de W12. Establece un checkpoint W4 y duplica soporte para los que están rezagados.',
        status: 'full', demoId: null, link: '/models/s1', linkLabel: 'Abrir Wizard →', level: 'mid',
      },
      {
        id: 'S2', name: 'Portfolio & Selection Effect',
        question: '¿Más restaurantes o mejores restaurantes? ¿Volumen o variedad de categorías?',
        context: 'La demanda responde al número de restaurantes con rendimientos decrecientes por categoría. El restaurante #100 de pizza genera mucho menos demanda incremental que el primero de comida árabe.',
        insight: 'Dos puntos de inflexión: "mínimo viable" (~15-20 restaurantes, 5+ categorías) y "techo de variedad" (~80-120). Entre ellos, cada restaurante tiene ROI medible. Fuera de ese rango, el equipo de BD no debería priorizar más unidades.',
        status: 'full', demoId: null, link: '/models/s2', linkLabel: 'Abrir Wizard →', level: 'mid',
      },
      {
        id: 'S3', name: 'Restaurant Engagement & Performance',
        question: '¿Cómo subo el volumen de restaurantes existentes sin que la plataforma pague más?',
        context: 'Levers gratuitos para la plataforma: fotos de menú, optimización de tiempos de preparación, promos auto-financiadas por el restaurante, extensión de horarios, ads dentro de la app.',
        insight: 'Un restaurante que optimiza menú + operaciones + promos auto-financiadas ve 40-80% más órdenes. Es el lever de crecimiento más capital-eficiente en un marketplace maduro.',
        status: 'full', demoId: null, link: '/models/s3', linkLabel: 'Abrir Wizard →', level: 'foundational',
      },
      {
        id: 'S4', name: 'Restaurant Health Score',
        question: '¿Qué restaurantes van a irse y cuántas órdenes estoy en riesgo de perder?',
        context: 'Score 0-100 basado en tendencia de órdenes (4 semanas), engagement con la plataforma, métricas operacionales (acceptance rate, cancelaciones) y exposición competitiva.',
        insight: 'No todo churn de restaurante vale lo mismo. Perder un restaurante de 300 órdenes/semana con usuarios leales cuesta 5-10x más que perder uno de 20 órdenes genéricas. Focaliza retención en los 10-15 restaurantes ancla por ciudad por trimestre.',
        status: 'full', demoId: null, link: '/models/s4', linkLabel: 'Abrir Wizard →', level: 'mid',
      },
    ],
  },
  P: {
    label: 'Plataforma', sublabel: 'Efectos emergentes de la interacción oferta-demanda', color: 'purple',
    models: [
      {
        id: 'P1', name: 'Network Effects & Liquidity',
        question: '¿Está este mercado en fase de oferta, demanda, o ya es maduro?',
        context: 'Cuatro fases: pre-liquidez (supply-led), liquidez temprana (balanced), madurez (demand-led), saturación (eficiencia). La estrategia de inversión correcta depende de la fase actual.',
        insight: 'El error más caro en food delivery: invertir en adquisición de usuarios en un mercado Fase 1. Los usuarios bajan la app, ven 5 restaurantes con 50 minutos de entrega, y nunca vuelven. Regla: nunca >20% del presupuesto de ciudad en demanda antes de 15 restaurantes/km².',
        status: 'full', demoId: null, link: '/models/p1', linkLabel: 'Abrir Wizard →', level: 'advanced',
      },
      {
        id: 'P2', name: 'Incrementality & Cannibalization',
        question: '¿Cuántas de mis órdenes promovidas habrían pasado de todas formas?',
        context: 'Descompone órdenes observadas en: orgánicas (sin promo), verdaderamente incrementales, adelantadas de la semana siguiente, y canibalizadas entre promos activas.',
        insight: 'Todas las empresas sobreestiman el impacto de sus promos en 40-70%. Cupones broadcast tienen 80%+ de canibalización orgánica. El ROI real de promos es 2-3x más bajo que el análisis naive. La solución: promos trigger-based y segmentadas.',
        status: 'full', demoId: null, link: '/models/p2', linkLabel: 'Abrir Wizard →', level: 'mid',
      },
      {
        id: 'P3', name: 'Delivery Economics & Capacity',
        question: '¿En qué punto la flota de couriers se convierte en el cuello de botella de crecimiento?',
        context: 'Loop de equilibrio: supply de couriers → tiempo de entrega → conversión → demanda → earnings → supply. Tiene dos equilibrios posibles: virtuoso y colapso (doom loop).',
        insight: '10 minutos menos en entrega promedio = +15-25% en órdenes, sin promo alguna. En la mayoría de mercados LATAM, este impacto supera el de todo el presupuesto combinado de marketing.',
        status: 'full', demoId: null, link: '/models/p3', linkLabel: 'Abrir Wizard →', level: 'mid',
      },
      {
        id: 'P4', name: 'Competitive Dynamics',
        question: '¿Qué pasa con mis órdenes si entra o sale un competidor?',
        context: 'Modela el share de mercado bajo cuatro escenarios: entrada de competidor, salida de competidor, guerra de precios, y expansión de categoría (ej: grocery).',
        insight: 'Cuando un competidor sale, capturas 40-70% de sus órdenes en 3 meses. El 20-30% restante se pierde permanentemente — esos usuarios dejan de pedir delivery. Esta es la justificación cuantitativa para participar en M&A defensivo.',
        status: 'full', demoId: null, link: '/models/p4', linkLabel: 'Abrir Wizard →', level: 'advanced',
      },
      {
        id: 'P5', name: 'Marketplace Equilibrium',
        question: '¿Es mi negocio sostenible o estoy subsidiando demanda artificial?',
        context: 'Test simultáneo de los tres lados: usuarios (retención orgánica, NPS), restaurantes (churn, promos auto-financiadas), couriers (earnings vs alternativas). Más unit economics de la plataforma.',
        insight: 'La prueba definitiva: ¿qué pasa si eliminas todas las promos mañana? Empresa saludable: -10-20% de órdenes. Empresa no-saludable: -30-50%. La brecha es la "burbuja de subsidios" — no es un marketplace real.',
        status: 'full', demoId: null, link: '/models/p5', linkLabel: 'Abrir Wizard →', level: 'mid',
      },
    ],
  },
}

// ── Model D2: Cohort Retention & LTV ─────────────────────────────────────────

function ModelD2({ inputs, onChange }) {
  const { newUsersPerWeek, cac, retW4, maxFreq, contribution, horizon } = inputs

  // Retention curve parametric
  const retention = (w) => {
    if (w === 0) return 1.0
    if (w <= 4) return 1.0 - (1.0 - retW4 / 100) * (w / 4)
    return (retW4 / 100) * Math.pow(0.92, w - 4)
  }
  // Frequency curve: starts 0.5, rises to maxFreq by week 10
  const frequency = (w) => Math.min(maxFreq, 0.5 + (maxFreq - 0.5) * Math.min(1, w / 10))

  // Build 5 cohorts (acquired at weeks 0,4,8,12,16)
  const cohortStarts = [0, 4, 8, 12, 16]
  const data = Array.from({ length: horizon }, (_, W) => {
    let total = 0
    cohortStarts.forEach(start => {
      if (W >= start) {
        const age = W - start
        total += newUsersPerWeek * retention(age) * frequency(age)
      }
    })
    return { w: `S${W + 1}`, orders: Math.round(total) }
  })

  // LTV calculation for single cohort
  let ltv = 0
  let paybackWeek = null
  const totalCAC = newUsersPerWeek * cac
  for (let w = 0; w < horizon; w++) {
    const orders = newUsersPerWeek * retention(w) * frequency(w)
    ltv += orders * contribution
    if (!paybackWeek && ltv >= totalCAC) paybackWeek = w + 1
  }
  const ltvPerUser = ltv / newUsersPerWeek

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="ds-card p-4 mb-4">
          <p className="text-emerald-400 text-xs font-mono uppercase mb-1 tracking-widest">QUÉ HACE</p>
          <p className="text-gray-200 text-sm leading-relaxed">Rastrea cohortes de usuarios semana a semana. Cada grupo adquirido tiene su propia curva de retención y frecuencia. El total de órdenes en cualquier semana es la suma de contribuciones de todos los cohortes activos.</p>
          <p className="text-amber-400 text-xs font-mono uppercase mt-3 mb-1 tracking-widest">CUÁNDO USARLO</p>
          <p className="text-gray-400 text-sm">Inviertes en adquisición y el CFO pregunta cuándo recuperas el CAC. O necesitas comparar la calidad de usuarios por canal.</p>
        </div>
        <ModelSlider label="Nuevos usuarios/semana" value={newUsersPerWeek} min={500} max={20000} step={500} format={v => v.toLocaleString('es-MX')} explanation="Cuántos usuarios nuevos adquieres cada semana. Este número se repite para cada cohorte." onChange={v => onChange({ ...inputs, newUsersPerWeek: v })} />
        <ModelSlider label="CAC por usuario ($)" value={cac} min={1} max={30} step={0.5} format={v => `$${v.toFixed(1)}`} explanation="Costo de adquisición promedio por usuario. Incluye marketing, promos de primer pedido y costo de onboarding." onChange={v => onChange({ ...inputs, cac: v })} />
        <ModelSlider label="Retención en Semana 4 (%)" value={retW4} min={10} max={70} step={1} format={v => `${v}%`} explanation="El % de usuarios del cohorte que siguen activos en la semana 4. Benchmark LATAM: 25-40%. Usuarios adquiridos con cupón: 15-25%." onChange={v => onChange({ ...inputs, retW4: v })} />
        <ModelSlider label="Frecuencia máxima (órd/usuario/sem)" value={maxFreq} min={0.5} max={4.0} step={0.1} format={v => `${v.toFixed(1)}x`} explanation="La frecuencia a la que converge un usuario habituado. Power users: 3-4x. Usuarios ocasionales: 0.5-1x." onChange={v => onChange({ ...inputs, maxFreq: v })} />
        <ModelSlider label="Contribución por orden ($)" value={contribution} min={0.5} max={15} step={0.5} format={v => `$${v.toFixed(1)}`} explanation="Ingresos netos por orden después de costos de courier y soporte. El punto de equilibrio de unit economics." onChange={v => onChange({ ...inputs, contribution: v })} />
        <ResultCallout results={[
          { label: 'LTV por usuario (acumulado)', value: `$${ltvPerUser.toFixed(2)}`, color: ltvPerUser >= cac ? 'text-emerald-400' : 'text-red-400' },
          { label: 'Semana de payback del CAC', value: paybackWeek ? `Semana ${paybackWeek}` : `No recuperas en ${horizon} semanas`, color: paybackWeek ? 'text-emerald-400' : 'text-red-400' },
          { label: 'Ratio LTV / CAC', value: `${(ltvPerUser / cac).toFixed(2)}x`, color: ltvPerUser / cac >= 3 ? 'text-emerald-400' : ltvPerUser / cac >= 1 ? 'text-amber-400' : 'text-red-400' },
        ]} />
      </div>
      <div className="ds-card p-4">
        <p className="text-xs text-gray-400 uppercase font-mono mb-3 tracking-widest">ÓRDENES TOTALES — 5 COHORTES ACUMULADOS</p>
        <ChartErrorBoundary>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="w" tick={{ fontSize: 9 }} interval={Math.floor(horizon / 6)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [v.toLocaleString('es-MX'), 'Órdenes totales']} contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }} />
              <Area type="monotone" dataKey="orders" name="Órdenes (5 cohortes)" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2.5} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartErrorBoundary>
      </div>
    </div>
  )
}

// ── Model D4: Frequency & Wallet Share ───────────────────────────────────────

function ModelD4({ inputs, onChange }) {
  const { usuarios, frecActual, desayuno, latNight, suscripcion, precio } = inputs

  const DAYPARTS = [
    { name: 'Desayunos', addressablePct: 0.12, currentSharePct: 0.04, active: desayuno, color: '#f59e0b' },
    { name: 'Almuerzo', addressablePct: 0.35, currentSharePct: 0.18, active: true, color: '#3b82f6' },
    { name: 'Cena', addressablePct: 0.50, currentSharePct: 0.22, active: true, color: '#8b5cf6' },
    { name: 'Late Night', addressablePct: 0.18, currentSharePct: 0.03, active: latNight, color: '#6366f1' },
  ]

  const LEVERS = [
    { name: 'Desayunos', active: desayuno, uplift: 0.25, desc: '+0.25 órd/usuario/sem' },
    { name: 'Late-Night', active: latNight, uplift: 0.15, desc: '+0.15 órd/usuario/sem' },
    { name: 'Suscripción/Membership', active: suscripcion, uplift: 0.40, desc: '+0.40 órd/usuario/sem (suscriptores)' },
    { name: 'Reducción de precio/distancia mín.', active: precio, uplift: 0.20, desc: '+0.20 órd/usuario/sem' },
  ]

  const activeUplift = LEVERS.filter(l => l.active).reduce((acc, l) => acc + l.uplift, 0)
  const freqNew = Math.min(frecActual + activeUplift, 7.0)
  const incrementalOrdenes = Math.round(usuarios * (freqNew - frecActual))
  const TOTAL_OCCASIONS = 21
  const shareActual = (frecActual / TOTAL_OCCASIONS * 100).toFixed(1)
  const shareNew = (freqNew / TOTAL_OCCASIONS * 100).toFixed(1)

  const chartData = DAYPARTS.map(dp => ({
    name: dp.name,
    actual: Math.round(usuarios * dp.addressablePct * dp.currentSharePct),
    potencial: Math.round(usuarios * dp.addressablePct * (dp.active ? dp.currentSharePct * 2.0 : dp.currentSharePct * 1.2)),
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="ds-card p-4 mb-4">
          <p className="text-emerald-400 text-xs font-mono uppercase mb-1 tracking-widest">QUÉ HACE</p>
          <p className="text-gray-200 text-sm leading-relaxed">Mapea cuántas de las 21 ocasiones de comida semanales captura tu plataforma por daypart. Calcula el upside si activas nuevos momentos (desayunos, late-night) o lanzas membresía.</p>
          <p className="text-amber-400 text-xs font-mono uppercase mt-3 mb-1 tracking-widest">CUÁNDO USARLO</p>
          <p className="text-gray-400 text-sm">Mercado maduro donde adquisición es cara. El crecimiento debe venir de más órdenes por usuario, no de más usuarios.</p>
        </div>
        <ModelSlider label="Usuarios activos/semana" value={usuarios} min={10000} max={1000000} step={10000} format={v => `${(v / 1000).toFixed(0)}k`} explanation="Usuarios que hacen al menos una apertura de la app por semana. No es la base total registrada." onChange={v => onChange({ ...inputs, usuarios: v })} />
        <ModelSlider label="Frecuencia actual (órd/usuario/sem)" value={frecActual} min={0.5} max={4.0} step={0.1} format={v => `${v.toFixed(1)}x`} explanation="Órdenes reales divididas por usuarios activos. En LATAM: 1.0-2.0x. Captura el 7-10% de ocasiones de comida." onChange={v => onChange({ ...inputs, frecActual: v })} />
        <div className="ds-card p-4 mb-3">
          <p className="text-gray-300 text-sm font-medium mb-3">Levers de frecuencia a activar</p>
          {[
            { key: 'desayuno', label: 'Desayunos / Morning', uplift: '+0.25 órd/sem', hint: 'Requiere supply en horas 6-10am. Bajo take-rate inicial pero alta frecuencia potencial.' },
            { key: 'latNight', label: 'Late Night (>9pm)', uplift: '+0.15 órd/sem', hint: 'Segmento joven urbano. Requiere couriers nocturnos y restaurantes con horario extendido.' },
            { key: 'suscripcion', label: 'Membresía / Suscripción', uplift: '+0.40 órd/sem', hint: 'El lever de frecuencia más potente. Suscriptores piden 1.5-2x más que no-suscriptores.' },
            { key: 'precio', label: 'Reducción precio/min. order', uplift: '+0.20 órd/sem', hint: 'Desbloquea ocasiones de monto bajo (snacks, café). Reduce barrera de entrada por conveniencia.' },
          ].map(({ key, label, uplift, hint }) => (
            <div key={key} className="flex items-start gap-3 mb-3 last:mb-0">
              <button onClick={() => onChange({ ...inputs, [key]: !inputs[key] })} className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 relative ${inputs[key] ? 'bg-blue-600' : 'bg-gray-700'}`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${inputs[key] ? 'left-6' : 'left-1'}`} />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2"><span className="text-gray-200 text-sm">{label}</span><span className="text-emerald-400 text-xs font-mono">{uplift}</span></div>
                <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
              </div>
            </div>
          ))}
        </div>
        <ResultCallout results={[
          { label: 'Share de ocasiones de comida ACTUAL', value: `${shareActual}%`, color: 'text-gray-300' },
          { label: 'Share de ocasiones CON levers', value: `${shareNew}%`, color: 'text-emerald-400' },
          { label: 'Órdenes incrementales/semana', value: `+${incrementalOrdenes.toLocaleString('es-MX')}`, color: 'text-blue-400' },
        ]} />
      </div>
      <div className="ds-card p-4">
        <p className="text-xs text-gray-400 uppercase font-mono mb-3 tracking-widest">ÓRDENES POR DAYPART — ACTUAL VS POTENCIAL</p>
        <ChartErrorBoundary>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={v => [v.toLocaleString('es-MX'), '']} contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="actual" name="Actual" fill="#6b7280" radius={[0, 3, 3, 0]} isAnimationActive={false} />
              <Bar dataKey="potencial" name="Potencial (con levers)" fill="#3b82f6" radius={[0, 3, 3, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </ChartErrorBoundary>
      </div>
    </div>
  )
}

// ── Model D5: Reactivation & Winback ─────────────────────────────────────────

function ModelD5({ inputs, onChange }) {
  const { dormidos, semanasDormidos, campaña, ventana } = inputs

  const CAMPAIGN_UPLIFTS = { organic: 0, push: 0.03, email: 0.06, coupon: 0.11 }
  const CAMPAIGN_COSTS = { organic: 0, push: 0.5, email: 1.5, coupon: 8.0 }
  const CAMPAIGN_LABELS = { organic: 'Sin campaña (orgánico)', push: 'Push notification', email: 'Email con oferta', coupon: 'Cupón grande ($8+ off)' }

  // Decay curve data (4 to 52 weeks dormant)
  const decayData = Array.from({ length: 12 }, (_, i) => {
    const w = 4 + i * 4
    const base = 0.045 * Math.exp(-0.10 * (w - 4))
    const withCampaign = Math.min(0.30, base + CAMPAIGN_UPLIFTS[campaña])
    return { w: `${w}sem`, organic: parseFloat((base * 100).toFixed(2)), campaign: parseFloat((withCampaign * 100).toFixed(2)) }
  })

  const baseRate = 0.045 * Math.exp(-0.10 * (semanasDormidos - 4))
  const campaignRate = Math.min(0.30, baseRate + CAMPAIGN_UPLIFTS[campaña])
  const reactivated = Math.round(dormidos * campaignRate)
  const campaignCost = reactivated * CAMPAIGN_COSTS[campaña]
  const postRetention = campaña === 'coupon' ? 0.28 : 0.42
  const ordersW4 = Math.round(reactivated * postRetention * 1.0)
  const ordersTotal4W = Math.round(reactivated * 1.1 * 3.5)
  const roi = campaignCost > 0 ? ((ordersTotal4W * 3.5 - campaignCost) / campaignCost * 100) : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="ds-card p-4 mb-4">
          <p className="text-emerald-400 text-xs font-mono uppercase mb-1 tracking-widest">QUÉ HACE</p>
          <p className="text-gray-200 text-sm leading-relaxed">Modela la probabilidad de reactivar usuarios dormidos con campañas de winback. La probabilidad de reactivación decae exponencialmente con el tiempo. Cada tipo de campaña añade un uplift diferente — a diferente costo.</p>
          <p className="text-amber-400 text-xs font-mono uppercase mt-3 mb-1 tracking-widest">CUÁNDO USARLO</p>
          <p className="text-gray-400 text-sm">Cuando tu base dormida supera el 40% del total registrado. Antes de lanzar winback, compara el LTV esperado del reactivado vs el costo de adquirir uno nuevo.</p>
        </div>
        <ModelSlider label="Usuarios dormidos" value={dormidos} min={10000} max={2000000} step={10000} format={v => `${(v / 1000).toFixed(0)}k`} explanation="Usuarios registrados que no han pedido en las últimas 4+ semanas. Típicamente el 40-60% de la base total." onChange={v => onChange({ ...inputs, dormidos: v })} />
        <ModelSlider label="Semanas promedio sin pedir" value={semanasDormidos} min={4} max={52} step={1} format={v => `${v} semanas`} explanation="El tiempo promedio de inactividad de tu segmento dormido. Más semanas = menor probabilidad de reactivación." onChange={v => onChange({ ...inputs, semanasDormidos: v })} />
        <div className="ds-card p-4 mb-3">
          <label className="text-gray-300 text-sm font-medium block mb-2">Tipo de campaña de winback</label>
          {Object.entries(CAMPAIGN_LABELS).map(([key, label]) => (
            <button key={key} onClick={() => onChange({ ...inputs, campaña: key })} className={`w-full text-left px-3 py-2 rounded mb-1.5 text-sm transition-all border ${campaña === key ? 'border-blue-500 bg-blue-950/40 text-gray-200' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>
              <div className="flex justify-between">
                <span>{label}</span>
                <span className="text-xs text-emerald-400 font-mono">+{(CAMPAIGN_UPLIFTS[key] * 100).toFixed(0)}pp · ${CAMPAIGN_COSTS[key].toFixed(1)}/user</span>
              </div>
            </button>
          ))}
          <p className="text-xs text-gray-500 mt-1 italic">Cupones grandes reactivan más pero los usuarios reactivados con cupón tienen 35% menos retención post-reactivación.</p>
        </div>
        <ResultCallout results={[
          { label: 'Usuarios reactivados estimados', value: reactivated.toLocaleString('es-MX'), color: 'text-emerald-400' },
          { label: 'Costo total de campaña', value: `$${campaignCost.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`, color: 'text-amber-400' },
          { label: 'Órdenes esperadas (4 semanas post-reactivación)', value: ordersTotal4W.toLocaleString('es-MX'), color: 'text-blue-400' },
          { label: 'ROI estimado (4 semanas)', value: `${roi.toFixed(0)}%`, color: roi >= 100 ? 'text-emerald-400' : roi >= 0 ? 'text-amber-400' : 'text-red-400' },
        ]} />
      </div>
      <div className="ds-card p-4">
        <p className="text-xs text-gray-400 uppercase font-mono mb-3 tracking-widest">TASA DE REACTIVACIÓN VS SEMANAS DORMIDO</p>
        <ChartErrorBoundary>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={decayData} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="w" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v, n) => [`${v.toFixed(2)}%`, n]} contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="organic" name="Orgánico (sin campaña)" stroke="#6b7280" strokeDasharray="4 4" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="campaign" name={`Con ${CAMPAIGN_LABELS[campaña]}`} stroke="#3b82f6" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartErrorBoundary>
      </div>
    </div>
  )
}

// ── Model S2: Portfolio & Selection Effect ────────────────────────────────────

function ModelS2({ inputs, onChange }) {
  const { categoria, nRestaurants, usuarios, propension } = inputs

  const K_VALUES = { pizza: 0.15, sushi: 0.08, saludable: 0.06, grocery: 0.04 }
  const CAT_LABELS = { pizza: 'Pizza / Burgers (satura rápido)', sushi: 'Sushi / Japonesa', saludable: 'Saludable / Ensaladas (nicho)', grocery: 'Grocery / Supermercado (muy lento)' }
  const k = K_VALUES[categoria]
  const potential = usuarios * (propension / 100) * 1.5

  const chartData = Array.from({ length: 20 }, (_, i) => {
    const n = i * 5 + 1
    const demand = Math.round(potential * (1 - Math.exp(-k * n)))
    return { n: `${n}`, demand }
  })

  const currentDemand = Math.round(potential * (1 - Math.exp(-k * nRestaurants)))
  const nextDemand = Math.round(potential * (1 - Math.exp(-k * (nRestaurants + 1))))
  const marginalImpact = nextDemand - currentDemand
  const saturationN = Math.round(-Math.log(0.05) / k)
  const saturationDemand = Math.round(potential * 0.95)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="ds-card p-4 mb-4">
          <p className="text-emerald-400 text-xs font-mono uppercase mb-1 tracking-widest">QUÉ HACE</p>
          <p className="text-gray-200 text-sm leading-relaxed">Modela el efecto de rendimientos decrecientes al agregar restaurantes por categoría. El restaurante #50 de pizza genera mucho menos demanda incremental que el primero. La velocidad de saturación varía dramáticamente por categoría.</p>
          <p className="text-amber-400 text-xs font-mono uppercase mt-3 mb-1 tracking-widest">CUÁNDO USARLO</p>
          <p className="text-gray-400 text-sm">El equipo de BD pregunta en qué categoría priorizar. La respuesta depende de cuántos restaurantes ya hay y dónde estás en la curva de saturación.</p>
        </div>
        <div className="ds-card p-4 mb-3">
          <label className="text-gray-300 text-sm font-medium block mb-2">Categoría</label>
          <select value={categoria} onChange={e => onChange({ ...inputs, categoria: e.target.value })} className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500">
            {Object.entries(CAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <p className="text-xs text-gray-500 italic mt-2">k={k.toFixed(2)} — Velocidad de saturación. Pizza satura en ~20 restaurantes. Grocery puede seguir creciendo con 150+.</p>
        </div>
        <ModelSlider label="Restaurantes actuales en esta categoría" value={nRestaurants} min={1} max={100} step={1} format={v => `${v} restos`} explanation="Cuántos restaurantes de esta categoría ya tienes activos en la zona que analizas." onChange={v => onChange({ ...inputs, nRestaurants: v })} />
        <ModelSlider label="Usuarios en la zona" value={usuarios} min={10000} max={500000} step={10000} format={v => `${(v / 1000).toFixed(0)}k`} explanation="Usuarios activos de delivery en el área de cobertura de los restaurantes de esta categoría." onChange={v => onChange({ ...inputs, usuarios: v })} />
        <ModelSlider label="Propensión a esta categoría (%)" value={propension} min={5} max={60} step={1} format={v => `${v}%`} explanation="% de usuarios que tienen interés en este tipo de comida. Pizza: ~40%. Sushi: ~20%. Saludable: ~15%." onChange={v => onChange({ ...inputs, propension: v })} />
        <ResultCallout results={[
          { label: 'Demanda actual (con tus restaurantes)', value: `${currentDemand.toLocaleString('es-MX')} órd/sem`, color: 'text-gray-200' },
          { label: 'Impacto marginal del próximo restaurante', value: `+${marginalImpact.toLocaleString('es-MX')} órd/sem`, color: marginalImpact > 10 ? 'text-emerald-400' : 'text-amber-400' },
          { label: `Saturación al 95% (requiere ~${saturationN} restaurantes)`, value: `${saturationDemand.toLocaleString('es-MX')} órd/sem máx`, color: 'text-blue-400' },
        ]} />
      </div>
      <div className="ds-card p-4">
        <p className="text-xs text-gray-400 uppercase font-mono mb-3 tracking-widest">CURVA DE SATURACIÓN — DEMANDA VS # DE RESTAURANTES</p>
        <ChartErrorBoundary>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="n" tick={{ fontSize: 9 }} label={{ value: 'Restaurantes', position: 'insideBottom', offset: -2, fill: '#6b7280', fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [v.toLocaleString('es-MX'), 'Órdenes/sem']} contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }} />
              <ReferenceLine x={String(Math.min(nRestaurants, 96))} stroke="#facc15" strokeWidth={2} label={{ value: 'Hoy', fill: '#facc15', fontSize: 10 }} />
              <Area type="monotone" dataKey="demand" name="Demanda" stroke="#34d399" fill="#34d399" fillOpacity={0.2} strokeWidth={2.5} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartErrorBoundary>
      </div>
    </div>
  )
}

// ── Model S3: Restaurant Engagement & Performance ─────────────────────────────

function ModelS3({ inputs, onChange }) {
  const { baseOrders, fotos, horarios, prepTime, promoRestaurant, ads, menuComplete } = inputs

  const LEVERS = [
    { key: 'fotos', label: 'Fotos profesionales de menú', uplift: 0.22, cost: 'Costo bajo', hint: 'El lever más subestimado. Un menú con fotos profesionales genera 22% más clics. Sin costo para la plataforma.' },
    { key: 'horarios', label: 'Extensión de horarios', uplift: 0.18, cost: 'Sin costo plataforma', hint: 'Abrir desayunos o late-night agrega nuevas sesiones de demanda que antes no existían.' },
    { key: 'prepTime', label: 'Optimización tiempo de preparación', uplift: 0.09, cost: 'Sin costo plataforma', hint: 'Reducir 5 minutos de prep tiempo mejora ranking algorítmico y experiencia de usuario.' },
    { key: 'promoRestaurant', label: 'Promo auto-financiada (20% off)', uplift: 0.35, cost: 'Lo paga el restaurante', hint: 'El restaurante asume el descuento. Alta visibilidad en la plataforma. Roi claro para el restaurante.' },
    { key: 'ads', label: 'Anuncio patrocinado en la app', uplift: 0.22, cost: 'Lo paga el restaurante', hint: 'Aumenta impresiones 40-60%. El restaurante paga por click/conversión.' },
    { key: 'menuComplete', label: 'Completitud de menú (descripciones, alérgenos, personalización)', uplift: 0.09, cost: 'Sin costo', hint: 'Menús completos aumentan add-to-cart rate. Reduce abandono por falta de información.' },
  ]

  const activeLevers = LEVERS.filter(l => inputs[l.key])
  // Compound with slight overlap (not additive)
  let mult = 1.0
  activeLevers.forEach((l, i) => {
    const overlapFactor = Math.pow(0.85, i)
    mult *= (1 + l.uplift * overlapFactor)
  })
  const finalOrders = Math.round(baseOrders * mult)
  const upliftPct = ((mult - 1) * 100).toFixed(1)

  const wfDrivers = [{ name: 'Base', delta: baseOrders, type: 'base' }, ...activeLevers.map((l, i) => ({ name: l.label.split(' ')[0], delta: Math.round(baseOrders * l.uplift * Math.pow(0.85, i)), type: 'pos' })), { name: '= Total', delta: 0, type: 'total' }]
  const wfData = buildWaterfall(wfDrivers)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="ds-card p-4 mb-4">
          <p className="text-emerald-400 text-xs font-mono uppercase mb-1 tracking-widest">QUÉ HACE</p>
          <p className="text-gray-200 text-sm leading-relaxed">Cuantifica el impacto de mejorar la performance de restaurantes existentes sin costo para la plataforma. La mayoría de los levers los paga el restaurante o no tienen costo directo.</p>
          <p className="text-amber-400 text-xs font-mono uppercase mt-3 mb-1 tracking-widest">CUÁNDO USARLO</p>
          <p className="text-gray-400 text-sm">Cuando el mercado tiene suficientes restaurantes pero están subutilizados. El "Restaurant Success Program" típicamente da 15-25% de crecimiento en órdenes de same-store.</p>
        </div>
        <ModelSlider label="Órdenes base del restaurante/semana" value={baseOrders} min={10} max={500} step={5} format={v => `${v} órd/sem`} explanation="El volumen actual del restaurante sin mejoras. Mediana en LATAM: 60-80. Cadenas grandes: 200-400." onChange={v => onChange({ ...inputs, baseOrders: v })} />
        <div className="ds-card p-4 mb-3">
          <p className="text-gray-300 text-sm font-medium mb-3">Levers a activar</p>
          {LEVERS.map(lever => (
            <div key={lever.key} className="flex items-start gap-3 mb-2.5 last:mb-0">
              <button onClick={() => onChange({ ...inputs, [lever.key]: !inputs[lever.key] })} className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 relative ${inputs[lever.key] ? 'bg-emerald-600' : 'bg-gray-700'}`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${inputs[lever.key] ? 'left-6' : 'left-1'}`} />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap"><span className="text-gray-200 text-xs">{lever.label}</span><span className="text-emerald-400 text-[10px] font-mono">+{(lever.uplift*100).toFixed(0)}%</span><span className="text-gray-600 text-[10px]">{lever.cost}</span></div>
                <p className="text-[10px] text-gray-500 mt-0.5">{lever.hint}</p>
              </div>
            </div>
          ))}
        </div>
        <ResultCallout results={[
          { label: 'Órdenes con todos los levers seleccionados', value: `${finalOrders.toLocaleString('es-MX')} órd/sem`, color: 'text-emerald-400' },
          { label: 'Uplift total (con overlap)', value: `+${upliftPct}%`, color: 'text-blue-400' },
          { label: 'Levers activos', value: `${activeLevers.length} de ${LEVERS.length}`, color: 'text-gray-300' },
        ]} />
      </div>
      <div className="ds-card p-4">
        <p className="text-xs text-gray-400 uppercase font-mono mb-3 tracking-widest">CONTRIBUCIÓN POR LEVER — WATERFALL</p>
        <ChartErrorBoundary>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={wfData} margin={{ top: 25, right: 20, left: 5, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} angle={-25} textAnchor="end" />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}`} />
              <Tooltip formatter={(val, name) => { if (name === 'spacer') return null; return [val, 'órdenes'] }} contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }} />
              <Bar dataKey="spacer" stackId="wf" fill="transparent" isAnimationActive={false} />
              <Bar dataKey="bar" stackId="wf" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                {wfData.map((d, i) => <Cell key={i} fill={d.type === 'neg' ? '#f87171' : d.type === 'total' ? '#34d399' : d.type === 'base' ? '#6b7280' : '#10b981'} />)}
                <LabelList dataKey="delta" position="top" formatter={v => v > 0 ? `+${v}` : `${v}`} style={{ fill: '#9ca3af', fontSize: 9 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartErrorBoundary>
      </div>
    </div>
  )
}

// ── Model S4: Restaurant Health Score ────────────────────────────────────────

function ModelS4({ inputs, onChange }) {
  const { orderTrend, acceptanceRate, cancelRate, onlineHours, multiPlatform, weeklyOrders } = inputs

  // Score calculation
  let score = 0
  // Order trend (25 pts)
  if (orderTrend > 5) score += 25
  else if (orderTrend >= -5) score += 12
  else if (orderTrend >= -15) score += 0
  else score -= 15
  // Operational (35 pts)
  score += Math.round((acceptanceRate - 60) / 40 * 20) // 0-20 pts
  score += Math.round(Math.max(0, (5 - cancelRate) / 5) * 15) // 0-15 pts
  // Engagement (20 pts)
  score += Math.round((onlineHours - 50) / 50 * 20) // 0-20 pts
  // Competitive (20 pts)
  score += multiPlatform ? 0 : 15
  score = Math.max(0, Math.min(100, score))

  const churnProb = score <= 25 ? 70 : score <= 50 ? 35 : score <= 75 ? 12 : 3
  const lostOrders = Math.round(weeklyOrders * (1 - 0.55) * (churnProb / 100) * 12) // 12 weeks expected orders * substitution
  const action = score <= 25 ? '🔴 Intervención inmediata' : score <= 50 ? '🟡 Outreach proactivo' : score <= 75 ? '🟢 Monitorear' : '🔵 Champion — usar como referencia'

  const gaugeData = [{ name: 'Score', value: score, fill: score <= 25 ? '#f87171' : score <= 50 ? '#fbbf24' : score <= 75 ? '#34d399' : '#60a5fa' }, { name: 'Resto', value: 100 - score, fill: '#1f2937' }]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="ds-card p-4 mb-4">
          <p className="text-emerald-400 text-xs font-mono uppercase mb-1 tracking-widest">QUÉ HACE</p>
          <p className="text-gray-200 text-sm leading-relaxed">Calcula un score de salud 0-100 para cada restaurante basado en señales de riesgo de churn. Predice la probabilidad de que el restaurante deje la plataforma y cuántas órdenes perderías.</p>
          <p className="text-amber-400 text-xs font-mono uppercase mt-3 mb-1 tracking-widest">CUÁNDO USARLO</p>
          <p className="text-gray-400 text-sm">Cuando el churn de restaurantes supera el 20% anual. Prioriza el equipo de retención en los restaurantes con mayor "churn-adjusted order value".</p>
        </div>
        <ModelSlider label="Tendencia de órdenes últimas 4 semanas (%)" value={orderTrend} min={-30} max={30} step={1} format={v => `${v >= 0 ? '+' : ''}${v}%`} explanation="Crecimiento (o caída) de órdenes en las últimas 4 semanas vs las 4 anteriores. El predictor #1 de churn." onChange={v => onChange({ ...inputs, orderTrend: v })} />
        <ModelSlider label="Acceptance rate (%)" value={acceptanceRate} min={60} max={100} step={1} format={v => `${v}%`} explanation="% de órdenes aceptadas automáticamente. Por debajo de 80% la plataforma degrada el ranking. Benchmark: >95%." onChange={v => onChange({ ...inputs, acceptanceRate: v })} />
        <ModelSlider label="Tasa de cancelación (%)" value={cancelRate} min={0} max={15} step={0.5} format={v => `${v}%`} explanation="Órdenes canceladas post-aceptación. >5% es señal de alerta. >10% suele resultar en suspensión." onChange={v => onChange({ ...inputs, cancelRate: v })} />
        <ModelSlider label="Horas online semanales (%)" value={onlineHours} min={50} max={100} step={1} format={v => `${v}%`} explanation="% del horario disponible en que el restaurante está activo en la plataforma. <70% indica desenganche." onChange={v => onChange({ ...inputs, onlineHours: v })} />
        <ModelSlider label="Órdenes actuales/semana" value={weeklyOrders} min={5} max={500} step={5} format={v => `${v} órd/sem`} explanation="El volumen actual del restaurante — determina cuántas órdenes están en riesgo si churna." onChange={v => onChange({ ...inputs, weeklyOrders: v })} />
        <div className="ds-card p-4 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-300 text-sm font-medium block">¿Está en otras plataformas también?</label>
              <p className="text-xs text-gray-500 mt-0.5">Restaurantes en múltiples plataformas tienen más alternativas y churnan más fácil.</p>
            </div>
            <button onClick={() => onChange({ ...inputs, multiPlatform: !multiPlatform })} className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ml-4 ${multiPlatform ? 'bg-amber-600' : 'bg-gray-700'}`}>
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${multiPlatform ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
        <ResultCallout results={[
          { label: 'Health Score', value: `${score}/100`, color: score <= 25 ? 'text-red-400' : score <= 50 ? 'text-amber-400' : score <= 75 ? 'text-emerald-400' : 'text-blue-400' },
          { label: 'Probabilidad de churn (12 semanas)', value: `${churnProb}%`, color: churnProb >= 50 ? 'text-red-400' : churnProb >= 20 ? 'text-amber-400' : 'text-emerald-400' },
          { label: 'Órdenes en riesgo (neto, 12 sem)', value: `${lostOrders.toLocaleString('es-MX')}`, color: 'text-red-400' },
          { label: 'Acción recomendada', value: action, color: 'text-gray-200' },
        ]} />
      </div>
      <div className="ds-card p-4">
        <p className="text-xs text-gray-400 uppercase font-mono mb-3 tracking-widest">HEALTH SCORE — DESGLOSE POR COMPONENTE</p>
        <ChartErrorBoundary>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { component: 'Tendencia órdenes', pts: Math.max(0, orderTrend > 5 ? 25 : orderTrend >= -5 ? 12 : 0), max: 25 },
              { component: 'Acceptance rate', pts: Math.round((acceptanceRate - 60) / 40 * 20), max: 20 },
              { component: 'Cancelaciones', pts: Math.round(Math.max(0, (5 - cancelRate) / 5) * 15), max: 15 },
              { component: 'Online hours', pts: Math.round((onlineHours - 50) / 50 * 20), max: 20 },
              { component: 'Exclusividad', pts: multiPlatform ? 0 : 15, max: 15 },
            ]} layout="vertical" margin={{ top: 5, right: 40, left: 110, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
              <XAxis type="number" domain={[0, 30]} tick={{ fontSize: 9 }} />
              <YAxis type="category" dataKey="component" tick={{ fontSize: 10 }} width={110} />
              <Tooltip formatter={(v, n) => [v, n === 'pts' ? 'Puntos' : 'Máx']} contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="max" name="Máximo posible" fill="#1f2937" radius={[0, 3, 3, 0]} isAnimationActive={false} />
              <Bar dataKey="pts" name="Puntos obtenidos" radius={[0, 3, 3, 0]} isAnimationActive={false}>
                {[0,1,2,3,4].map(i => <Cell key={i} fill={score <= 25 ? '#f87171' : score <= 50 ? '#fbbf24' : '#34d399'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartErrorBoundary>
      </div>
    </div>
  )
}

// ── Model P3: Delivery Economics & Capacity ───────────────────────────────────

function ModelP3({ inputs, onChange }) {
  const { couriers, onlineRate, ordersPerCourier, prepTime, transitTime, demanda } = inputs

  const capacity = Math.round(couriers * (onlineRate / 100) * ordersPerCourier)
  const actual = Math.min(demanda, capacity)
  const lost = demanda - actual
  const utilization = demanda / capacity

  const waitTime = utilization < 0.70 ? 4 : utilization < 0.85 ? 9 : utilization < 0.95 ? 18 : 30
  const deliveryTime = prepTime + transitTime + waitTime
  const convFactor = deliveryTime < 20 ? 1.15 : deliveryTime < 30 ? 1.0 : deliveryTime < 40 ? 0.85 : deliveryTime < 50 ? 0.65 : 0.45
  const adjustedDemand = Math.round(demanda * convFactor)
  const lostPct = ((lost / demanda) * 100).toFixed(1)

  // Build hourly profile data
  const hourlyProfile = [
    { h: '8am', demand: Math.round(demanda * 0.12), cap: capacity },
    { h: '10am', demand: Math.round(demanda * 0.08), cap: capacity },
    { h: '12pm', demand: Math.round(demanda * 0.28), cap: capacity },
    { h: '2pm', demand: Math.round(demanda * 0.22), cap: capacity },
    { h: '4pm', demand: Math.round(demanda * 0.10), cap: capacity },
    { h: '6pm', demand: Math.round(demanda * 0.30), cap: capacity },
    { h: '8pm', demand: Math.round(demanda * 0.35), cap: capacity },
    { h: '10pm', demand: Math.round(demanda * 0.20), cap: capacity },
  ].map(d => ({ ...d, actual: Math.min(d.demand, d.cap), lost: Math.max(0, d.demand - d.cap) }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="ds-card p-4 mb-4">
          <p className="text-emerald-400 text-xs font-mono uppercase mb-1 tracking-widest">QUÉ HACE</p>
          <p className="text-gray-200 text-sm leading-relaxed">Modela el equilibrio entre supply de couriers y demanda de órdenes. La capacidad limitada genera tiempos de espera que reducen la conversión, creando un "doom loop" si no se gestiona.</p>
          <p className="text-amber-400 text-xs font-mono uppercase mt-3 mb-1 tracking-widest">CUÁNDO USARLO</p>
          <p className="text-gray-400 text-sm">Cuando el tiempo promedio de entrega sube 2+ semanas consecutivas o cuando recibes quejas de "no hay couriers". Antes de lanzar campañas grandes en horas pico.</p>
        </div>
        <ModelSlider label="Couriers registrados" value={couriers} min={100} max={5000} step={50} format={v => v.toLocaleString('es-MX')} explanation="Total de couriers en la plataforma. No todos estarán online al mismo tiempo — la tasa de activación varía por hora." onChange={v => onChange({ ...inputs, couriers: v })} />
        <ModelSlider label="Tasa online en hora pico (%)" value={onlineRate} min={50} max={100} step={1} format={v => `${v}%`} explanation="% de couriers que están activos durante la hora pico (almuerzo o cena). Benchmark: 75-90%." onChange={v => onChange({ ...inputs, onlineRate: v })} />
        <ModelSlider label="Entregas por courier por hora" value={ordersPerCourier} min={1.0} max={4.0} step={0.1} format={v => `${v.toFixed(1)}x`} explanation="Depende de la densidad de la zona. Ciudad densa: 2.5-3.5. Zona dispersa: 1.5-2.0." onChange={v => onChange({ ...inputs, ordersPerCourier: v })} />
        <ModelSlider label="Tiempo de preparación promedio (min)" value={prepTime} min={5} max={30} step={1} format={v => `${v} min`} explanation="El tiempo que tarda el restaurante en preparar el pedido. El mayor driver de tiempo total de entrega." onChange={v => onChange({ ...inputs, prepTime: v })} />
        <ModelSlider label="Tiempo de tránsito promedio (min)" value={transitTime} min={5} max={40} step={1} format={v => `${v} min`} explanation="De la puerta del restaurante a la del cliente. Depende de distancia media y tráfico de la ciudad." onChange={v => onChange({ ...inputs, transitTime: v })} />
        <ModelSlider label="Demanda sin restricción (órd/hora pico)" value={demanda} min={100} max={5000} step={50} format={v => v.toLocaleString('es-MX')} explanation="Cuántas órdenes se harían si no hubiera ningún constraint de capacidad ni tiempo de espera." onChange={v => onChange({ ...inputs, demanda: v })} />
        <ResultCallout results={[
          { label: 'Capacidad máxima en hora pico', value: `${capacity.toLocaleString('es-MX')} órd/hora`, color: 'text-gray-300' },
          { label: 'Órdenes perdidas por capacidad', value: `${lost.toLocaleString('es-MX')} (${lostPct}%)`, color: lost > 0 ? 'text-red-400' : 'text-emerald-400' },
          { label: 'Tiempo de entrega estimado', value: `${deliveryTime} min`, color: deliveryTime <= 30 ? 'text-emerald-400' : deliveryTime <= 40 ? 'text-amber-400' : 'text-red-400' },
          { label: 'Factor de conversión por tiempo de entrega', value: `${convFactor.toFixed(2)}x`, color: convFactor >= 1.0 ? 'text-emerald-400' : convFactor >= 0.75 ? 'text-amber-400' : 'text-red-400' },
        ]} />
      </div>
      <div className="ds-card p-4">
        <p className="text-xs text-gray-400 uppercase font-mono mb-3 tracking-widest">DEMANDA VS CAPACIDAD — PERFIL DIARIO</p>
        <ChartErrorBoundary>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyProfile} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="h" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(1)}k`} />
              <Tooltip formatter={(v, n) => [v.toLocaleString('es-MX'), n]} contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="actual" name="Órdenes reales" fill="#3b82f6" stackId="a" radius={[0,0,0,0]} isAnimationActive={false} />
              <Bar dataKey="lost" name="Órdenes perdidas (sin capacity)" fill="#f87171" stackId="a" radius={[3,3,0,0]} isAnimationActive={false} />
              <Line type="monotone" dataKey="cap" data={hourlyProfile} name="Capacidad" stroke="#34d399" strokeDasharray="5 5" strokeWidth={2} dot={false} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </ChartErrorBoundary>
      </div>
    </div>
  )
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

// ── Render Demo by ID ─────────────────────────────────────────────────────────

function renderDemoById(demoId, inputs, onChange) {
  switch (demoId) {
    case 'A1': return <ModelA1 inputs={inputs} onChange={onChange} />
    case 'A2': return <ModelA2 inputs={inputs} onChange={onChange} />
    case 'A3': return <ModelA3 inputs={inputs} onChange={onChange} />
    case 'A4': return <ModelA4 inputs={inputs} onChange={onChange} />
    case 'A5': return <ModelA5 inputs={inputs} onChange={onChange} />
    case 'B1': return <ModelB1 inputs={inputs} onChange={onChange} />
    case 'B2': return <ModelB2 inputs={inputs} onChange={onChange} />
    case 'C1': return <ModelC1 inputs={inputs} onChange={onChange} />
    case 'D2': return <ModelD2 inputs={inputs} onChange={onChange} />
    case 'D4': return <ModelD4 inputs={inputs} onChange={onChange} />
    case 'D5': return <ModelD5 inputs={inputs} onChange={onChange} />
    case 'S2': return <ModelS2 inputs={inputs} onChange={onChange} />
    case 'S3': return <ModelS3 inputs={inputs} onChange={onChange} />
    case 'S4': return <ModelS4 inputs={inputs} onChange={onChange} />
    case 'P3': return <ModelP3 inputs={inputs} onChange={onChange} />
    default: return null
  }
}

// ── Main HomePage ─────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [excelToast, setExcelToast] = useState(false)
  const [selectedModel, setSelectedModel] = useState(location.state?.openModel || null)
  const [modelInputs, setModelInputs] = useState({
    A1: { base: 45000, uplift: 25, duracion: 4 },
    A2: { restosPerWeek: 10, steadyState: 120, tipo: 'dark_kitchen' },
    A3: { upliftA: 25, upliftB: 20, canib: 30 },
    A4: { pais: 'CL', semana: 38, lluvia: false },
    A5: { tam: 500000, adopcion: 8, couriers: 30000 },
    B1: { aov: 18, commission: 27, courierCost: 3.5, subsidy: 2.5 },
    B2: { variance: 20, horizon: 12 },
    C1: { marketSize: 200000, share: 35, evento: 'none', growth: 1.5 },
    D2: { newUsersPerWeek: 5000, cac: 8, retW4: 35, maxFreq: 1.5, contribution: 3.5, horizon: 26 },
    D4: { usuarios: 200000, frecActual: 1.5, desayuno: false, latNight: false, suscripcion: false, precio: false },
    D5: { dormidos: 500000, semanasDormidos: 8, campaña: 'email', ventana: 6 },
    S2: { categoria: 'sushi', nRestaurants: 15, usuarios: 100000, propension: 20 },
    S3: { baseOrders: 80, fotos: false, horarios: false, prepTime: false, promoRestaurant: false, ads: false, menuComplete: false },
    S4: { orderTrend: -8, acceptanceRate: 88, cancelRate: 4, onlineHours: 75, multiPlatform: true, weeklyOrders: 120 },
    P3: { couriers: 800, onlineRate: 80, ordersPerCourier: 2.0, prepTime: 15, transitTime: 15, demanda: 1500 },
  })

  // Scroll reveal refs
  const statsRef = useRef(null)
  const modelsRef = useRef(null)
  const waterfallRef = useRef(null)
  const latamRef = useRef(null)
  const excelRef = useRef(null)
  const industriesRef = useRef(null)
  const techRef = useRef(null)
  const ctaRef = useRef(null)

  const statsVisible = useScrollReveal(statsRef)
  const modelsVisible = useScrollReveal(modelsRef)
  const waterfallVisible = useScrollReveal(waterfallRef)
  const latamVisible = useScrollReveal(latamRef)
  const excelVisible = useScrollReveal(excelRef)
  const industriesVisible = useScrollReveal(industriesRef)
  const techVisible = useScrollReveal(techRef)
  const ctaVisible = useScrollReveal(ctaRef)

  // Counters
  const c1 = useCounter(14, statsVisible)
  const c2 = useCounter(20, statsVisible)
  const c3 = useCounter(52, statsVisible)
  const c4 = useCounter(9, statsVisible)

  // Auto-scroll to taxonomy section when arriving from model selector
  useEffect(() => {
    if (location.state?.openModel && modelsRef.current) {
      setTimeout(() => modelsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200)
    }
  }, [])

  const handleExcelDemo = () => {
    setExcelToast(true)
    setTimeout(() => setExcelToast(false), 3000)
  }

  const updateModelInputs = (id, vals) => {
    setModelInputs(prev => ({ ...prev, [id]: vals }))
  }

  const handleModelSelect = (model) => {
    if (model.status === 'full' && model.link) {
      navigate(model.link)
    } else {
      setSelectedModel(prev => prev === model.id ? null : model.id)
    }
  }

  // Find a taxonomy model by its id
  const findTaxonomyModel = (id) => {
    for (const [key, persp] of Object.entries(TAXONOMY)) {
      const found = persp.models.find(m => m.id === id)
      if (found) return { model: found, persp, key }
    }
    return null
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
            <a href="#industrias" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">Industrias</a>
            <a href="#latam" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">Países</a>
            <a href="#exports" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">Exports</a>
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
              14 modelos · 20 industrias · LATAM-first
            </div>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-gray-50">
              Forecasting para<br />
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                cualquier marketplace
              </span>
            </h1>

            <p className="text-gray-400 text-lg leading-relaxed max-w-md">
              14 modelos cuantitativos aplicables a 20 industrias. Desde food delivery hasta SaaS, fintech y OTAs — mismo framework, variables adaptadas.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link to="/new" className="btn-primary px-6 py-2.5 text-sm font-semibold shadow-lg shadow-blue-900/30">
                Crear Forecast →
              </Link>
              <a href="#industrias" className="btn-ghost px-6 py-2.5 text-sm border border-gray-700">
                Ver Industrias
              </a>
            </div>

            <div className="flex flex-wrap gap-6 pt-2 border-t border-gray-800">
              {[
                { value: '14', label: 'Modelos' },
                { value: '20', label: 'Industrias' },
                { value: 'MBB', label: 'Excel · PPT' },
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
              { count: c2, label: 'Industrias cubiertas', suffix: '' },
              { count: c3, label: 'Semanas de horizonte', suffix: '' },
              { count: c4, label: 'Tabs Excel · 5 slides PPT por modelo', suffix: '' },
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

      {/* ── SECTION 4: Model Taxonomy ─────────────────────────────────────── */}
      <section
        id="modelos"
        ref={modelsRef}
        className={`py-20 transition-all duration-700 ${
          modelsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-400 text-xs font-mono mb-4">
              MBB Consulting · 14 modelos cuantitativos · 3 perspectivas
            </div>
            <h2 className="text-3xl font-bold text-gray-100 mb-3">¿Cuál es tu pregunta de negocio?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm leading-relaxed">
              Cada modelo responde una pregunta específica. Selecciona el modelo que se alinea
              con tu decisión — los marcados con <span className="text-blue-400 font-mono">DEMO</span> tienen
              una simulación interactiva, y <span className="text-purple-400 font-mono">WIZARD</span> tiene
              un wizard completo de 7 pasos.
            </p>
          </div>

          {/* 3-column taxonomy grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            {Object.entries(TAXONOMY).map(([key, persp]) => {
              const cs = COLOR_STYLES[persp.color]
              return (
                <div key={key} className="rounded-xl border border-gray-800 overflow-hidden">
                  <div className={`px-4 py-3 ${cs.headerBg} border-b border-gray-800`}>
                    <div className={`${cs.text} font-mono font-bold text-sm tracking-wide`}>{key} — {persp.label}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{persp.sublabel}</div>
                  </div>
                  {persp.models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleModelSelect(model)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-800/60 last:border-0 transition-all hover:bg-gray-800/40 ${
                        selectedModel === model.id ? 'bg-gray-800/70' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={`font-mono text-[11px] font-bold ${cs.text} flex-shrink-0`}>{model.id}</span>
                            <span className="text-gray-200 text-xs font-semibold leading-tight">{model.name}</span>
                          </div>
                          <p className="text-gray-500 text-[11px] leading-snug">{model.question}</p>
                        </div>
                        <div className="flex-shrink-0 mt-0.5 flex flex-col gap-0.5 items-end">
                          {model.status === 'full' && (
                            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border bg-purple-900/50 text-purple-300 border-purple-800">WIZARD</span>
                          )}
                          {model.status === 'demo' && (
                            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border bg-blue-900/50 text-blue-400 border-blue-800">DEMO</span>
                          )}
                          {model.status === 'roadmap' && (
                            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border bg-gray-800 text-gray-600 border-gray-700">PRONTO</span>
                          )}
                          {model.level === 'foundational' && (
                            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border bg-gray-800 text-gray-400 border-gray-700">Base</span>
                          )}
                          {model.level === 'mid' && (
                            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border bg-blue-900/40 text-blue-300 border-blue-800">Mid</span>
                          )}
                          {model.level === 'advanced' && (
                            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border bg-amber-900/40 text-amber-300 border-amber-800">Advanced</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>

          {/* Detail / Demo panel */}
          {selectedModel ? (() => {
            const found = findTaxonomyModel(selectedModel)
            if (!found) return null
            const { model, persp } = found
            const cs = COLOR_STYLES[persp.color]
            const demoInputs = model.demoId ? (modelInputs[model.demoId] || {}) : {}
            const demoOnChange = model.demoId ? (vals) => updateModelInputs(model.demoId, vals) : null

            return (
              <div className="rounded-xl border border-gray-700 overflow-hidden">
                {/* Header */}
                <div className={`px-5 py-4 ${cs.headerBg} border-b border-gray-700`}>
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`font-mono text-sm font-bold ${cs.text}`}>{model.id}</span>
                        <span className="text-gray-100 font-semibold">{model.name}</span>
                      </div>
                      <p className={`text-xs font-semibold ${cs.text} mb-1`}>{model.question}</p>
                      <p className="text-gray-400 text-xs leading-relaxed max-w-xl">{model.context}</p>
                    </div>
                    <div className="lg:max-w-xs px-4 py-3 rounded-lg bg-gray-900/60 border border-gray-700 flex-shrink-0">
                      <div className="text-gray-500 text-[10px] font-mono uppercase tracking-widest mb-1.5">💡 Insight clave</div>
                      <p className={`text-xs leading-relaxed ${cs.text}`}>{model.insight}</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                {model.status === 'demo' && model.demoId && (
                  <div className="p-6">
                    {renderDemoById(model.demoId, demoInputs, demoOnChange)}
                  </div>
                )}

                {model.status === 'roadmap' && (
                  <div className="p-12 text-center">
                    <div className="text-gray-700 text-3xl mb-3">⏳</div>
                    <p className="text-gray-400 text-sm font-semibold mb-1">Modelo en roadmap</p>
                    <p className="text-gray-600 text-xs max-w-md mx-auto leading-relaxed">{model.context}</p>
                  </div>
                )}
              </div>
            )
          })() : (
            <div className="border border-dashed border-gray-800 rounded-xl p-8 text-center">
              <p className="text-gray-600 text-sm">Selecciona un modelo de la tabla para ver su descripción detallada y demo interactiva</p>
            </div>
          )}
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

      {/* ── SECTION 7: Exports ──────────────────────────────────────────── */}
      <section
        id="exports"
        ref={excelRef}
        className={`py-20 bg-gray-900/20 border-y border-gray-800 transition-all duration-700 ${
          excelVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-100 mb-3">Outputs listos para boardroom en un click</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Excel MBB con 9 tabs estructurados + deck PPT dark con 5 slides por modelo. Hipótesis Minto Pyramid, KPIs headline y gráfico de serie semanal incluidos.
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
              <div className="space-y-1 mb-2">
                <div className="text-[10px] font-mono text-blue-400 uppercase tracking-widest mb-2">Excel · 9 tabs</div>
                {[
                  '9 tabs automáticos (Cover → Assumptions Log)',
                  'Conditional formatting verde/rojo',
                  'Freeze panes + auto column widths',
                  'Assumptions Log para auditoría',
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <span className="font-bold mt-0.5 text-emerald-400">✓</span>
                    <span className="text-sm text-gray-300">{text}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 mb-4">
                <div className="text-[10px] font-mono text-violet-400 uppercase tracking-widest mb-2">PPT · 5 slides</div>
                {[
                  'Cover con nombre del modelo y perspectiva',
                  'KPI cards headline (4 métricas)',
                  'Gráfico de serie semanal',
                  'Tabla de escenarios comparativos',
                  'Insights — títulos Minto Pyramid',
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <span className="font-bold mt-0.5 text-violet-400">✓</span>
                    <span className="text-sm text-gray-300">{text}</span>
                  </div>
                ))}
              </div>

              <div className="ds-card p-4 bg-gradient-to-br from-violet-950/30 to-gray-900 border-violet-800/40">
                <div className="text-xs text-gray-400 mb-1 font-mono">Dark theme · Minto Pyramid</div>
                <div className="text-sm text-gray-200 leading-relaxed">
                  El título de cada slide es la hipótesis derivada de los datos — no un label, una conclusión.
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={handleExcelDemo}
                  className="w-full btn-primary py-3 text-sm font-semibold"
                >
                  Ver demo de exports →
                </button>
                {excelToast && (
                  <div className="absolute -top-12 left-0 right-0 bg-emerald-900 border border-emerald-700 rounded-lg px-4 py-2 text-emerald-300 text-xs font-mono text-center animate-fade-in">
                    ✓ Crea un forecast real para generar Excel y PPT
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 8: Industries ─────────────────────────────────────────── */}
      <section
        id="industrias"
        ref={industriesRef}
        className={`py-20 bg-gray-950 border-t border-gray-800/60 transition-all duration-700 ${
          industriesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/30 border border-purple-800/50 text-purple-400 text-xs font-mono mb-4">
              14 modelos × 20 industrias
            </div>
            <h2 className="text-3xl font-bold text-gray-100 mb-3">Un framework, cualquier industria</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm leading-relaxed">
              Los modelos de Markov, cohortes, funnel y supply side aplican a cualquier marketplace o plataforma. Solo cambian las variables — la lógica es la misma.
            </p>
          </div>

          {Object.entries(IND_CATEGORIES).map(([catKey, cat]) => {
            const catIndustries = INDUSTRIES.filter(i => i.category === catKey)
            return (
              <div key={catKey} className="mb-10">
                <div className={`text-xs font-mono font-bold uppercase tracking-widest mb-3 ${cat.color}`}>
                  {cat.label}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {catIndustries.map(ind => (
                    <div key={ind.id} className="ds-card p-3 hover:border-gray-600 transition-colors group">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-xl leading-none">{ind.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-gray-200 leading-tight">{ind.name}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5 truncate">{ind.demand} → {ind.supply}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {ind.models.map(m => (
                          <span key={m} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">{m}</span>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-500 leading-snug line-clamp-2">{ind.insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          <div className="mt-6 ds-card p-5 bg-gradient-to-r from-blue-950/30 to-purple-950/20 border-blue-800/40">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-100 mb-1">¿Tu industria no está aquí?</div>
                <p className="text-xs text-gray-400">Los modelos son agnósticos a la industria. Si tienes usuarios, proveedores y transacciones, el framework aplica. Abre un forecast y adapta las variables a tu contexto.</p>
              </div>
              <Link to="/new" className="btn-primary text-xs flex-shrink-0 whitespace-nowrap">
                Crear Forecast →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 9: Technical Details ──────────────────────────────────── */}
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
              {'  + Σ '}<span className="text-blue-400">promo_uplift</span><span className="text-gray-400">[w]</span>{' × '}<span className="text-blue-400">fatigue</span><span className="text-gray-400">[w]</span>{' × '}<span className="text-blue-400">penetration</span><span className="text-gray-400">[segment]</span>{'    '}<span className="text-amber-500">{'← D3/P2'}</span>{'\n'}
              {'  + Σ '}<span className="text-blue-400">cohort</span><span className="text-gray-400">[c][w]</span>{' × '}<span className="text-blue-400">maturation</span><span className="text-gray-400">[w]</span>{' × ('}<span className="text-emerald-400">1</span>{' - '}<span className="text-blue-400">churn</span><span className="text-gray-400">[w]</span>{')'}{' '.repeat(10)}<span className="text-amber-500">{'← S1/D2'}</span>{'\n'}
              {'  - '}<span className="text-blue-400">cannibalization</span>{'('}<span className="text-blue-400">promos_activas</span><span className="text-gray-400">[w]</span>{')'}{' '.repeat(25)}<span className="text-amber-500">{'← P2'}</span>{'\n'}
              {'  × '}<span className="text-blue-400">seasonal_factor</span><span className="text-gray-400">[w]</span>{' '.repeat(37)}<span className="text-amber-500">{'← D1'}</span>{'\n'}
              {'  '}<span className="text-emerald-400">min</span>{'('}<span className="text-blue-400">supply_capacity</span><span className="text-gray-400">[w]</span>{')'}{' '.repeat(33)}<span className="text-amber-500">{'← P3'}</span>{'\n'}
              {'  × '}<span className="text-blue-400">market_share</span><span className="text-gray-400">[w]</span>{' '.repeat(40)}<span className="text-amber-500">{'← P4'}</span>
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

      {/* ── SECTION 10: CTA Footer ─────────────────────────────────────────── */}
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
