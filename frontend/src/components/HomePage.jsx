import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer
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

const demandData = [
  { w: 'S1', base: 42000, promo: 52000 },
  { w: 'S2', base: 43000, promo: 56000 },
  { w: 'S3', base: 44000, promo: 58000 },
  { w: 'S4', base: 44000, promo: 55000 },
  { w: 'S5', base: 45000, promo: 53000 },
  { w: 'S6', base: 45000, promo: 54000 },
  { w: 'S7', base: 46000, promo: 57000 },
  { w: 'S8', base: 46000, promo: 58000 },
]

const roiData = [
  { w: 'S1', roi: -85 }, { w: 'S2', roi: -65 }, { w: 'S3', roi: -40 },
  { w: 'S4', roi: -18 }, { w: 'S5', roi: 5 }, { w: 'S6', roi: 28 },
  { w: 'S7', roi: 48 }, { w: 'S8', roi: 65 }, { w: 'S9', roi: 80 },
  { w: 'S10', roi: 92 }, { w: 'S11', roi: 105 }, { w: 'S12', roi: 118 },
]

const marketData = [
  { name: 'Tu plataforma', value: 38 },
  { name: 'Competidor A', value: 30 },
  { name: 'Competidor B', value: 22 },
  { name: 'Otros', value: 10 },
]

const PIE_COLORS = ['#3b82f6', '#f87171', '#fb923c', '#6b7280']

const waterfallData = [
  { name: 'Base', value: 45000, fill: '#6b7280', start: 0 },
  { name: '+Promos', value: 12000, fill: '#3b82f6', start: 45000 },
  { name: '+Adquisición', value: 8000, fill: '#8b5cf6', start: 57000 },
  { name: '-Canibalización', value: -4000, fill: '#f87171', start: 65000 },
  { name: '×Estacionalidad', value: 3500, fill: '#f59e0b', start: 61000 },
  { name: 'Total Neto', value: 64500, fill: '#34d399', start: 0 },
]

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

// ── Waterfall Chart Helpers ───────────────────────────────────────────────────

function WaterfallLabel({ x, y, width, value, index }) {
  if (!value) return null
  const item = waterfallData[index]
  const isTotal = item.name === 'Total Neto'
  const isNeg = item.value < 0
  const display = isTotal
    ? Math.round(item.value).toLocaleString('es-MX')
    : (isNeg ? '-' : '+') + Math.abs(item.value).toLocaleString('es-MX')
  return (
    <text
      x={x + width / 2}
      y={isNeg ? y + 16 : y - 6}
      fill={isTotal ? '#34d399' : isNeg ? '#f87171' : '#d1d5db'}
      textAnchor="middle"
      fontSize={10}
      fontFamily="monospace"
    >
      {display}
    </text>
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

// ── ROI Dual Line ─────────────────────────────────────────────────────────────

function ROITooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  const val = payload[0]?.value
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 shadow-xl text-xs font-mono">
      <div className="text-gray-400 mb-1">{label}</div>
      <div style={{ color: val < 0 ? '#f87171' : '#34d399' }}>ROI: {val > 0 ? '+' : ''}{val}%</div>
    </div>
  )
}

// ── Main HomePage ─────────────────────────────────────────────────────────────

export default function HomePage() {
  const [waterfallKey, setWaterfallKey] = useState(0)
  const [excelToast, setExcelToast] = useState(false)

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

  // Prepare waterfall: spacer + actual value
  const waterfallFormatted = waterfallData.map(d => ({
    ...d,
    spacer: d.name === 'Total Neto' ? 0 : Math.min(d.start, d.start + d.value),
    bar: Math.abs(d.value),
  }))

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
        {/* Background glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: text */}
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

            {/* Stats row */}
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

          {/* Right: chart */}
          <div className="ds-card p-4 shadow-xl shadow-blue-900/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-gray-400">Forecast · 26 semanas · Escenarios</span>
              <span className="ds-badge-blue text-[10px]">LIVE PREVIEW</span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={heroData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="week" tick={{ fontSize: 9 }} interval={4} />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<HeroTooltip />} />
                <Legend iconType="line" wrapperStyle={{ fontSize: 10 }} />
                <Area
                  type="monotone" dataKey="worst" name="Peor caso"
                  stroke="#f87171" fill="#f87171" fillOpacity={0.05}
                  strokeDasharray="4 4"
                  isAnimationActive={true} animationDuration={1200}
                />
                <Area
                  type="monotone" dataKey="base" name="Base"
                  stroke="#6b7280" fill="#6b7280" fillOpacity={0.3}
                  isAnimationActive={true} animationDuration={1200} animationBegin={100}
                />
                <Area
                  type="monotone" dataKey="withPromos" name="Base + Promos"
                  stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3}
                  isAnimationActive={true} animationDuration={1200} animationBegin={200}
                />
                <Area
                  type="monotone" dataKey="best" name="Mejor caso"
                  stroke="#34d399" fill="#34d399" fillOpacity={0.05}
                  strokeDasharray="4 4"
                  isAnimationActive={true} animationDuration={1200} animationBegin={300}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
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

      {/* ── SECTION 4: Model Categories ───────────────────────────────────── */}
      <section
        id="modelos"
        ref={modelsRef}
        className={`py-20 transition-all duration-700 ${
          modelsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-100 mb-3">8 modelos en 3 categorías</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Cada categoría cubre una dimensión del negocio. Activa solo los modelos que necesitas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card A: Demanda */}
            <div
              className="rounded-xl border border-blue-800/50 bg-blue-950/30 p-5 hover:border-blue-600/70 transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/20"
              style={{ animationDelay: '0ms' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">📈</span>
                <h3 className="font-semibold text-gray-100">Modelos de Demanda</h3>
              </div>
              <div className="flex flex-wrap gap-1 mb-4">
                {['A1 Promo Uplift', 'A2 Adquisición', 'A3 Canibalización', 'A4 Estacionalidad', 'A5 Expansión'].map(m => (
                  <span key={m} className="ds-badge-blue text-[10px]">{m}</span>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={demandData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="w" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => v.toLocaleString('es-MX')} contentStyle={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 6, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="base" name="Base" fill="#6b7280" fillOpacity={0.8} isAnimationActive={true} animationDuration={800} />
                  <Bar dataKey="promo" name="Con Promos" fill="#3b82f6" fillOpacity={0.9} isAnimationActive={true} animationDuration={800} animationBegin={100} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Card B: Financiero */}
            <div
              className="rounded-xl border border-emerald-800/50 bg-emerald-950/30 p-5 hover:border-emerald-600/70 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-900/20"
              style={{ animationDelay: '150ms' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">💰</span>
                <h3 className="font-semibold text-gray-100">Unit Economics & ROI</h3>
              </div>
              <div className="flex flex-wrap gap-1 mb-4">
                {['B1 Unit Economics', 'B2 Escenarios Best/Base/Worst'].map(m => (
                  <span key={m} className="ds-badge-green text-[10px]">{m}</span>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={roiData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" />
                  <XAxis dataKey="w" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${v}%`} />
                  <Tooltip content={<ROITooltip />} />
                  <ReferenceLine y={0} stroke="#34d399" strokeDasharray="4 4" label={{ value: 'Payback', fill: '#34d399', fontSize: 9 }} />
                  <Line
                    type="monotone" dataKey="roi" name="ROI acum."
                    stroke="#34d399" strokeWidth={2} dot={false}
                    isAnimationActive={true} animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Card C: Mercado */}
            <div
              className="rounded-xl border border-purple-800/50 bg-purple-950/30 p-5 hover:border-purple-600/70 transition-all duration-300 hover:shadow-lg hover:shadow-purple-900/20"
              style={{ animationDelay: '300ms' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🏆</span>
                <h3 className="font-semibold text-gray-100">Dinámica Competitiva</h3>
              </div>
              <div className="flex flex-wrap gap-1 mb-4">
                {['C1 Market Share'].map(m => (
                  <span key={m} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-purple-900/50 text-purple-400 border border-purple-800">{m}</span>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={marketData} cx="50%" cy="50%"
                    innerRadius={35} outerRadius={60}
                    dataKey="value" nameKey="name"
                    isAnimationActive={true} animationDuration={800}
                  >
                    {marketData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={{ background: '#0f172a', border: '1px solid #4b2d7f', borderRadius: 6, fontSize: 11 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 9 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40">
                <span className="text-xs text-gray-400 flex-1">Escenario: Comp. B sale del mercado</span>
                <span className="font-mono text-xs text-emerald-400 font-semibold">↑ +8pp share</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 5: Waterfall Demo ─────────────────────────────────────── */}
      <section
        ref={waterfallRef}
        className={`py-20 bg-gray-900/20 border-y border-gray-800 transition-all duration-700 ${
          waterfallVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-100 mb-3">El modelo combinado</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Cada driver se suma (o resta) para llegar al total neto. Visualiza la contribución de cada componente.
            </p>
          </div>

          <div className="ds-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-gray-400">Contribución por driver · semana ejemplo</span>
              <button
                onClick={() => setWaterfallKey(k => k + 1)}
                className="btn-ghost text-xs border border-gray-700 px-3 py-1.5"
              >
                ↺ Animar
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300} key={waterfallKey}>
              <BarChart data={waterfallFormatted} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(val, name, props) => {
                    const orig = waterfallData[props.dataIndex]
                    if (name === 'spacer') return null
                    return [
                      `${orig.value > 0 ? '+' : ''}${orig.value.toLocaleString('es-MX')} órdenes`,
                      orig.name
                    ]
                  }}
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }}
                />
                <ReferenceLine y={45000} stroke="#6b7280" strokeDasharray="4 4" label={{ value: 'Base', fill: '#9ca3af', fontSize: 10 }} />
                {/* Spacer bar (invisible) */}
                <Bar dataKey="spacer" stackId="a" fill="transparent" isAnimationActive={true} animationDuration={600} />
                {/* Actual value bar */}
                <Bar dataKey="bar" stackId="a" isAnimationActive={true} animationDuration={900} label={<WaterfallLabel />}>
                  {waterfallFormatted.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
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
                {/* Window chrome */}
                <div className="bg-gray-800 px-4 py-2 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                  <span className="ml-3 text-xs text-gray-400 font-mono">forecast_mx_2025.xlsx</span>
                </div>
                {/* Spreadsheet area */}
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
                      {/* Totals row */}
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
                {/* Sheet tabs */}
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
