import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import HelperTooltip from '../ui/HelperTooltip'

// ── Industry vocabulary ────────────────────────────────────────────────────────

export const INDUSTRY_VOCAB = {
  food_delivery:  { icon: '🍔', label: 'Food Delivery',       transaction: 'Orden',         transactions: 'Órdenes',       supply: 'Restaurante',   aovLabel: 'AOV',              defaultAov: 290,  currency: 'MXN', country: 'MX' },
  rideshare:      { icon: '🚗', label: 'Ridesharing',          transaction: 'Viaje',         transactions: 'Viajes',        supply: 'Conductor',     aovLabel: 'Tarifa Promedio',  defaultAov: 120,  currency: 'MXN', country: 'MX' },
  ecommerce:      { icon: '🛒', label: 'E-commerce',           transaction: 'Compra',        transactions: 'Compras',       supply: 'Vendedor',      aovLabel: 'Ticket Promedio',  defaultAov: 850,  currency: 'MXN', country: 'MX' },
  quick_commerce: { icon: '⚡', label: 'Quick Commerce',       transaction: 'Canasta',       transactions: 'Canastas',      supply: 'Tienda/Nodo',   aovLabel: 'Valor Canasta',    defaultAov: 650,  currency: 'MXN', country: 'MX' },
  beauty:         { icon: '💅', label: 'Beauty & Wellness',    transaction: 'Cita',          transactions: 'Citas',         supply: 'Profesional',   aovLabel: 'Precio Servicio',  defaultAov: 500,  currency: 'MXN', country: 'MX' },
  hotel:          { icon: '🏨', label: 'Hotel / STR',          transaction: 'Reserva',       transactions: 'Reservas',      supply: 'Propiedad',     aovLabel: 'Tarifa Noche',     defaultAov: 1800, currency: 'MXN', country: 'MX' },
  pharmacy:       { icon: '💊', label: 'Farmacia',             transaction: 'Pedido',        transactions: 'Pedidos',       supply: 'Farmacia',      aovLabel: 'Valor Pedido',     defaultAov: 420,  currency: 'MXN', country: 'MX' },
  saas_b2b:       { icon: '💼', label: 'SaaS B2B',             transaction: 'Suscripción',   transactions: 'Suscripciones', supply: 'Producto',      aovLabel: 'ARPU Mensual',     defaultAov: 250,  currency: 'USD', country: 'MX' },
  b2b_platform:   { icon: '🏪', label: 'B2B Platform',         transaction: 'Sub + GMV',     transactions: 'Transacciones', supply: 'Integración',   aovLabel: 'Revenue/Merchant', defaultAov: 300,  currency: 'USD', country: 'MX' },
  gig:            { icon: '🧑‍💻', label: 'Gig / Freelance',   transaction: 'Proyecto',      transactions: 'Proyectos',     supply: 'Freelancer',    aovLabel: 'Valor Proyecto',   defaultAov: 800,  currency: 'USD', country: 'MX' },
  hr_marketplace: { icon: '👔', label: 'HR Tech',              transaction: 'Contratación',  transactions: 'Contrataciones', supply: 'Empleador',    aovLabel: 'Costo Publicación', defaultAov: 150, currency: 'USD', country: 'MX' },
  streaming:      { icon: '🎬', label: 'Streaming / OTT',      transaction: 'Sesión',        transactions: 'Sesiones',      supply: 'Contenido',     aovLabel: 'ARPU Mensual',     defaultAov: 15,   currency: 'USD', country: 'MX' },
  edtech:         { icon: '📚', label: 'EdTech',               transaction: 'Lección',       transactions: 'Lecciones',     supply: 'Curso',         aovLabel: 'ARPU Mensual',     defaultAov: 12,   currency: 'USD', country: 'MX' },
  gaming:         { icon: '🎮', label: 'Mobile Gaming',        transaction: 'Sesión',        transactions: 'Sesiones',      supply: 'Juego',         aovLabel: 'ARPPU',            defaultAov: 8,    currency: 'USD', country: 'MX' },
  fitness:        { icon: '🏋️', label: 'Fitness Tech',         transaction: 'Clase',         transactions: 'Clases',        supply: 'Gimnasio',      aovLabel: 'Membresía Mensual', defaultAov: 35,  currency: 'USD', country: 'MX' },
  super_app:      { icon: '📱', label: 'Super App',            transaction: 'Transacción',   transactions: 'Transacciones', supply: 'Proveedor',     aovLabel: 'GMV/Usuario',      defaultAov: 450,  currency: 'MXN', country: 'MX' },
  fintech:        { icon: '💳', label: 'Fintech / Lending',    transaction: 'Préstamo',      transactions: 'Préstamos',     supply: 'Capital',       aovLabel: 'Monto Promedio',   defaultAov: 5000, currency: 'MXN', country: 'MX' },
  real_estate:    { icon: '🏠', label: 'Real Estate Tech',     transaction: 'Transacción',   transactions: 'Transacciones', supply: 'Agente',        aovLabel: 'Valor Transacción', defaultAov: 2500000, currency: 'MXN', country: 'MX' },
  telemedicine:   { icon: '🩺', label: 'Telemedicina',         transaction: 'Consulta',      transactions: 'Consultas',     supply: 'Médico',        aovLabel: 'ARPU Mensual',     defaultAov: 599,  currency: 'MXN', country: 'MX' },
  travel_ota:     { icon: '✈️', label: 'Travel / OTA',         transaction: 'Reserva',       transactions: 'Reservas',      supply: 'Hotel/Aerolínea', aovLabel: 'Valor Reserva',  defaultAov: 8500, currency: 'MXN', country: 'MX' },
}

const DEFAULT_VOCAB = INDUSTRY_VOCAB.food_delivery

const COUNTRIES = [
  { code: 'MX', name: 'México',    flag: '🇲🇽', aov: 290,   currency: 'MXN' },
  { code: 'BR', name: 'Brasil',    flag: '🇧🇷', aov: 52,    currency: 'BRL' },
  { code: 'CO', name: 'Colombia',  flag: '🇨🇴', aov: 32000, currency: 'COP' },
  { code: 'CL', name: 'Chile',     flag: '🇨🇱', aov: 12000, currency: 'CLP' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', aov: 8000,  currency: 'ARS' },
  { code: 'PE', name: 'Perú',      flag: '🇵🇪', aov: 42,    currency: 'PEN' },
]

const PERSPECTIVE_COLORS = {
  D: { badge: 'bg-blue-900/40 text-blue-300 border border-blue-800', header: 'text-blue-400', accent: 'blue' },
  S: { badge: 'bg-emerald-900/40 text-emerald-300 border border-emerald-800', header: 'text-emerald-400', accent: 'emerald' },
  P: { badge: 'bg-purple-900/40 text-purple-300 border border-purple-800', header: 'text-purple-400', accent: 'purple' },
}

const STEPS = [
  { id: 0, label: 'Config' },
  { id: 1, label: 'Inputs' },
  { id: 2, label: 'Resultados' },
]

const SCENARIOS = [
  { id: 'bear', label: 'Bear', multiplier: 0.6, color: 'text-red-400',     bg: 'bg-red-900/30 border-red-800' },
  { id: 'base', label: 'Base', multiplier: 1.0, color: 'text-blue-400',    bg: 'bg-blue-900/30 border-blue-800' },
  { id: 'bull', label: 'Bull', multiplier: 1.4, color: 'text-emerald-400', bg: 'bg-emerald-900/30 border-emerald-800' },
]

const PALETTE_OPTIONS = [
  { id: 'navy',   name: 'Azul Marino',        primary: '#1e3a5f', accent: '#f59e0b' },
  { id: 'green',  name: 'Verde Institucional', primary: '#14532d', accent: '#6366f1' },
  { id: 'red',    name: 'Rojo Corporativo',    primary: '#7f1d1d', accent: '#0ea5e9' },
  { id: 'purple', name: 'Morado Ejecutivo',    primary: '#4c1d95', accent: '#10b981' },
  { id: 'slate',  name: 'Gris Carbon',         primary: '#1f2937', accent: '#3b82f6' },
  { id: 'orange', name: 'Naranja Ejecutivo',   primary: '#7c2d12', accent: '#3b82f6' },
]

// ── URL hash helpers (permalink) ──────────────────────────────────────────────

function configToHash(config) {
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(config))))
  } catch {
    return ''
  }
}

function hashToConfig(hash) {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(hash))))
  } catch {
    return null
  }
}

// ── CSV export helper ─────────────────────────────────────────────────────────

function downloadCSV(rows, filename) {
  if (!rows || rows.length === 0) return
  const headers = Object.keys(rows[0])
  const lines = [headers.join(',')]
  rows.forEach(row => {
    lines.push(headers.map(h => {
      const v = row[h]
      if (typeof v === 'string' && (v.includes(',') || v.includes('"')))
        return `"${v.replace(/"/g, '""')}"`
      return v ?? ''
    }).join(','))
  })
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ── Key findings generator ────────────────────────────────────────────────────

function generateFindings(result, modelId, vocab) {
  const s = result?.summary || {}
  const findings = []
  if (s.total_revenue)                   findings.push(`Revenue total en el horizonte: ${s.currency || ''} ${(s.total_revenue / 1000).toFixed(0)}K`)
  if (s.total_orders)                    findings.push(`${(s.total_orders / 1000).toFixed(1)}K ${vocab.transactions.toLowerCase()} totales proyectadas`)
  if (s.best_channel)                    findings.push(`Canal más eficiente: ${s.best_channel}`)
  if (s.avg_ltv_cac)                     findings.push(`LTV/CAC promedio: ${s.avg_ltv_cac}x`)
  if (s.ltv_cac_ratio)                   findings.push(`LTV/CAC: ${s.ltv_cac_ratio}x — ${s.is_sustainable ? 'negocio sostenible' : 'revisar economía unitaria'}`)
  if (s.breakeven_weekly_orders)         findings.push(`Breakeven: ${(s.breakeven_weekly_orders / 1000).toFixed(0)}K ${vocab.transactions.toLowerCase()}/semana`)
  if (s.biggest_drop_step)              findings.push(`Mayor pérdida en el funnel: "${s.biggest_drop_step}"`)
  if (s.overall_conversion_rate)        findings.push(`Conversión total del funnel: ${s.overall_conversion_rate.toFixed(1)}%`)
  if (s.best_campaign)                  findings.push(`Campaña con mejor ROI: ${s.best_campaign}`)
  if (s.blended_roi !== undefined)       findings.push(`ROI combinado de campañas: ${(s.blended_roi * 100).toFixed(0)}%`)
  if (s.blended_cannibalization_rate_pct) findings.push(`Tasa de canibalización: ${s.blended_cannibalization_rate_pct.toFixed(0)}% de órdenes`)
  if (s.bottleneck_week)                 findings.push(`Cuello de botella en semana ${s.bottleneck_week} — flota saturada`)
  if (s.at_risk_count)                   findings.push(`${s.at_risk_count} restaurantes en riesgo de churn`)
  if (s.revenue_at_risk)                 findings.push(`Revenue en riesgo: ${(s.revenue_at_risk / 1000).toFixed(0)}K en el horizonte`)
  if (s.roi !== undefined)               findings.push(`ROI del programa: ${(s.roi * 100).toFixed(0)}%`)
  if (s.avg_health_score)                findings.push(`Score de salud promedio: ${s.avg_health_score}/100`)
  if (s.uplift_pct)                      findings.push(`Uplift del portafolio: +${s.uplift_pct.toFixed(1)}% revenue`)
  if (s.final_phase)                     findings.push(`Fase de liquidez: ${s.final_phase.replace('_', ' ')}`)
  if (s.final_share_pct)                 findings.push(`Market share final: ${s.final_share_pct.toFixed(1)}%`)
  if (s.total_restaurants_added)         findings.push(`${s.total_restaurants_added} restaurantes activados en el horizonte`)
  return findings.slice(0, 4)
}

// ── Scenario comparison table ─────────────────────────────────────────────────

function ScenarioTable({ result, config }) {
  const s = result?.summary || {}
  const numericKpis = Object.entries(s).filter(([, v]) => typeof v === 'number' && !Number.isNaN(v))
  if (numericKpis.length === 0) return null

  return (
    <div className="ds-card overflow-hidden">
      <div className="ds-section-header">
        Comparativa de Escenarios
        <HelperTooltip text="Bear = -40% sobre los valores base (escenario pesimista). Bull = +40% (escenario optimista). Úsalo para comunicar rangos de incertidumbre al equipo ejecutivo." side="left" />
      </div>
      <div className="overflow-x-auto">
        <table className="ds-table w-full text-xs">
          <thead>
            <tr>
              <th className="text-left">Métrica</th>
              <th className="text-center text-red-400">Bear (×0.6)</th>
              <th className="text-center text-blue-400">Base (×1.0)</th>
              <th className="text-center text-emerald-400">Bull (×1.4)</th>
              <th className="text-center">Amplitud</th>
            </tr>
          </thead>
          <tbody>
            {numericKpis.map(([k, v], i) => {
              const bear = v * 0.6
              const bull = v * 1.4
              const spread = bull - bear
              const spreadPct = v !== 0 ? ((spread / Math.abs(v)) * 100).toFixed(0) : '—'
              const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
              return (
                <tr key={k}>
                  <td className="text-gray-300 font-medium">{label}</td>
                  <td className="text-center text-red-400 font-mono">
                    {Math.abs(bear) >= 1000 ? `${(bear / 1000).toFixed(1)}K` : bear.toFixed(1)}
                  </td>
                  <td className="text-center text-blue-400 font-mono font-bold">
                    {Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toFixed(1)}
                  </td>
                  <td className="text-center text-emerald-400 font-mono">
                    {Math.abs(bull) >= 1000 ? `${(bull / 1000).toFixed(1)}K` : bull.toFixed(1)}
                  </td>
                  <td className="text-center text-gray-500 font-mono">±{spreadPct}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Sensitivity / Tornado chart ───────────────────────────────────────────────

function TornadoChart({ modelId, config }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(false)

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(`/api/models/${modelId.toLowerCase()}/sensitivity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!resp.ok) {
        const d = await resp.json().catch(() => ({}))
        throw new Error(d.detail || `Error ${resp.status}`)
      }
      const d = await resp.json()
      setData(d)
      setOpen(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!open && !data) {
    return (
      <div className="ds-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-200 mb-1 flex items-center gap-1">
              Análisis de Sensibilidad
              <HelperTooltip text="Muestra cuáles parámetros tienen más impacto en el KPI principal. Varía cada variable ±20% y mide el cambio en el resultado. Los 5 más impactantes se muestran como tornado chart." />
            </div>
            <p className="text-xs text-gray-500">¿Qué variables impactan más el resultado? Top-5 tornado chart.</p>
          </div>
          <button onClick={run} disabled={loading} className="btn-secondary text-xs disabled:opacity-50 flex-shrink-0">
            {loading ? 'Calculando...' : 'Calcular Sensibilidad →'}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs mt-2 font-mono">{error}</p>}
      </div>
    )
  }

  if (!data) return null

  const { tornado, kpi_key, base_kpi } = data
  if (!tornado || tornado.length === 0) return null

  const chartData = tornado.map(t => ({
    label: t.label,
    low:  t.pct_low,
    high: t.pct_high,
  }))

  return (
    <div className="ds-card p-4">
      <div className="ds-section-header -mx-4 -mt-4 mb-4">
        Sensibilidad — Top 5 Variables
        <HelperTooltip text={`Impacto porcentual sobre ${kpi_key.replace(/_/g, ' ')} al variar cada parámetro ±20%. Valor base: ${base_kpi?.toLocaleString()}.`} side="left" />
      </div>
      <div className="mb-3 text-xs text-gray-500">
        KPI: <span className="text-blue-400 font-mono">{kpi_key.replace(/_/g, ' ')}</span>
        &nbsp;|&nbsp;Valor base: <span className="text-blue-400 font-mono">{base_kpi?.toLocaleString()}</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 120, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickFormatter={v => `${v > 0 ? '+' : ''}${v}%`}
            domain={['dataMin - 5', 'dataMax + 5']} />
          <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#d1d5db' }} width={120} />
          <ReferenceLine x={0} stroke="#374151" strokeWidth={1} />
          <Tooltip
            formatter={(v, name) => [`${v > 0 ? '+' : ''}${v}%`, name === 'low' ? '-20% var.' : '+20% var.']}
            contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 11 }}
          />
          <Bar dataKey="low"  fill="#ef4444" radius={[2,2,2,2]} name="−20%" />
          <Bar dataKey="high" fill="#10b981" radius={[2,2,2,2]} name="+20%" />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-gray-600 mt-2 italic">
        Rojo = impacto de reducir el parámetro 20%. Verde = impacto de aumentarlo 20%.
      </p>
    </div>
  )
}

// ── Config upload/download ────────────────────────────────────────────────────

function ConfigTransfer({ config, setConfig, modelId }) {
  const fileRef = useRef(null)
  const [msg, setMsg] = useState(null)

  const downloadTemplate = () => {
    const scalars = Object.entries(config)
      .filter(([, v]) => typeof v !== 'object' || v === null)
    const csvLines = [
      'parametro,valor,descripcion',
      ...scalars.map(([k, v]) => `${k},${v},"${k.replace(/_/g, ' ')}"`)
    ]
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${modelId.toLowerCase()}_template.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const handleUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const lines = ev.target.result.split('\n').filter(Boolean)
        const parsed = {}
        lines.slice(1).forEach(line => {
          const parts = line.split(',')
          if (parts.length < 2) return
          const key = parts[0].trim()
          const raw = parts[1].trim()
          const num = Number(raw)
          parsed[key] = isNaN(num) ? raw : num
        })
        const validKeys = Object.keys(config).filter(k => parsed[k] !== undefined)
        if (validKeys.length === 0) {
          setMsg({ type: 'error', text: 'El archivo no contiene columnas reconocidas. Usa la plantilla descargada.' })
          return
        }
        const update = {}
        validKeys.forEach(k => { update[k] = parsed[k] })
        setConfig(prev => ({ ...prev, ...update }))
        setMsg({ type: 'ok', text: `${validKeys.length} parámetros actualizados desde el CSV.` })
        setTimeout(() => setMsg(null), 3000)
      } catch {
        setMsg({ type: 'error', text: 'Error al leer el CSV. Verifica el formato.' })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="ds-card p-4 border-dashed border-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-mono font-semibold text-gray-300">Datos desde archivo</span>
        <HelperTooltip text="Descarga la plantilla CSV con los parámetros del modelo. Rellena los valores y vuelve a subir el archivo para poblar los inputs automáticamente. Solo se aceptan las columnas de la plantilla (sin columnas extra)." />
      </div>
      <div className="flex gap-2 flex-wrap">
        <button onClick={downloadTemplate} className="btn-secondary text-xs flex items-center gap-1.5">
          Descargar plantilla CSV
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="btn-secondary text-xs flex items-center gap-1.5"
        >
          Subir CSV
        </button>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleUpload} className="hidden" />
      </div>
      {msg && (
        <p className={`text-xs mt-2 font-mono ${msg.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
          {msg.text}
        </p>
      )}
      <p className="text-[10px] text-gray-600 italic mt-2">
        Formato estándar: columnas fijas de la plantilla. No se aceptan columnas adicionales.
      </p>
    </div>
  )
}

// ── Shared Config Step ────────────────────────────────────────────────────────

function StepConfig({ config, setConfig, vocab, modelName, description }) {
  const handleCountry = (code) => {
    const c = COUNTRIES.find(x => x.code === code)
    setConfig(prev => ({ ...prev, country: code, aov: c.aov, currency: c.currency }))
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {vocab !== DEFAULT_VOCAB && (
        <div className="ds-card p-3 bg-gray-900/60 border-gray-700 flex items-center gap-3">
          <span className="text-2xl">{vocab.icon}</span>
          <div>
            <div className="text-xs font-semibold text-gray-200">{vocab.label}</div>
            <div className="text-[11px] text-gray-500">{vocab.transactions} · {vocab.supply} · {vocab.aovLabel}</div>
          </div>
          <span className="ml-auto text-[10px] font-mono text-gray-500 bg-gray-800 px-2 py-1 rounded">industria adaptada</span>
        </div>
      )}

      <div className="ds-card p-4 bg-blue-950/20 border-blue-900/40">
        <div className="text-xs font-semibold text-gray-200 mb-1">{modelName}</div>
        <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
      </div>

      <div className="ds-card p-4">
        <label className="ds-label block mb-2">
          Paleta de color del Excel
          <HelperTooltip text="Selecciona el color corporativo para el reporte Excel ejecutivo. No afecta los cálculos." />
        </label>
        <div className="flex gap-3 flex-wrap">
          {PALETTE_OPTIONS.map(p => (
            <button
              key={p.id}
              title={p.name}
              onClick={() => setConfig(prev => ({ ...prev, palette: p.id }))}
              className="flex flex-col items-center gap-1 group"
            >
              <div
                className="w-8 h-8 rounded-full transition-all"
                style={{
                  backgroundColor: p.primary,
                  boxShadow: config.palette === p.id
                    ? `0 0 0 2px #fff, 0 0 0 4px ${p.primary}`
                    : '0 0 0 1px rgba(255,255,255,0.15)',
                }}
              />
              <span className="text-[9px] text-gray-500 group-hover:text-gray-300 transition-colors">{p.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="ds-card p-4">
        <label className="ds-label block mb-2">
          País de operación
          <HelperTooltip text="Define el país para ajustar AOV y moneda a benchmarks locales. Puedes sobrescribir el AOV manualmente en el siguiente paso." />
        </label>
        <div className="grid grid-cols-3 gap-2">
          {COUNTRIES.map(c => (
            <button key={c.code} onClick={() => handleCountry(c.code)}
              className={`p-3 rounded-lg text-left text-sm border transition-all ${
                config.country === c.code
                  ? 'border-blue-500 bg-blue-950/40 text-gray-200'
                  : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700'
              }`}>
              <div>{c.flag} {c.name}</div>
              <div className="text-xs font-mono text-gray-500 mt-1">{c.aov} {c.currency}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="ds-card p-4">
        <div className="flex justify-between mb-2">
          <label className="ds-label flex items-center">
            Horizonte de Forecast
            <HelperTooltip text="Número de semanas a proyectar. 12 semanas = 1 trimestre (recomendado para reviews de negocio). 52 = proyección anual." />
          </label>
          <span className="text-blue-400 font-mono font-bold">{config.horizon_weeks} semanas</span>
        </div>
        <input type="range" min={4} max={52} step={1} value={config.horizon_weeks}
          onChange={e => setConfig(p => ({ ...p, horizon_weeks: Number(e.target.value) }))}
          className="w-full accent-blue-500" />
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>4 sem</span><span>52 sem</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="ds-card p-4">
          <label className="ds-label block mb-2 flex items-center">
            {vocab.aovLabel} ({config.currency})
            <HelperTooltip text={`Valor promedio por ${vocab.transaction.toLowerCase()}. Usado para convertir órdenes en revenue. Puedes sobrescribir el default del país.`} />
          </label>
          <input type="number" value={config.aov}
            onChange={e => setConfig(p => ({ ...p, aov: Number(e.target.value) }))}
            className="ds-input w-full" />
          <p className="text-xs text-gray-600 italic mt-2">Valor promedio por {vocab.transaction.toLowerCase()}</p>
        </div>
        <div className="ds-card p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="ds-label flex items-center">
              Take Rate
              <HelperTooltip text="Porcentaje de comisión que retiene la plataforma sobre el GMV. Food Delivery típico: 20–25%. E-commerce: 10–15%. SaaS puro: 70–85%." />
            </label>
            <span className="text-blue-400 font-mono font-bold text-sm">{(config.take_rate * 100).toFixed(1)}%</span>
          </div>
          <input type="range" min={0.05} max={0.50} step={0.005} value={config.take_rate}
            onChange={e => setConfig(p => ({ ...p, take_rate: Number(e.target.value) }))}
            className="w-full accent-blue-500" />
          <div className="flex justify-between text-[10px] text-gray-600 mt-1 mb-2">
            <span>5%</span><span>50%</span>
          </div>
          <div className="flex gap-1 flex-wrap">
            {[
              { label: 'Food DL', val: 0.22 },
              { label: 'E-comm', val: 0.12 },
              { label: 'SaaS', val: 0.78 },
            ].map(b => (
              <button key={b.label} onClick={() => setConfig(p => ({ ...p, take_rate: b.val }))}
                className="text-[10px] px-1.5 py-0.5 rounded border border-gray-700 text-gray-500 hover:border-blue-700 hover:text-blue-400 transition-all">
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Annotation layer ──────────────────────────────────────────────────────────

function AnnotationBox({ config, setConfig }) {
  return (
    <div className="ds-card p-4 border-amber-900/30">
      <label className="ds-label block mb-2 flex items-center">
        Anotaciones y Supuestos
        <HelperTooltip text="Escribe aquí los supuestos clave, contexto de mercado, o notas para quien lea el reporte. Se incluyen en el Excel exportado bajo 'Notas y Anotaciones'." />
      </label>
      <textarea
        rows={3}
        value={config.annotations || ''}
        onChange={e => setConfig(p => ({ ...p, annotations: e.target.value }))}
        placeholder="Ej: Supuestos basados en Q3 2024. AOV ajustado por inflación. Campaña de temporada excluida del baseline..."
        className="ds-input w-full resize-y text-xs leading-relaxed font-mono"
      />
      <p className="text-[10px] text-gray-600 italic mt-1">Se incluye en el reporte Excel exportado.</p>
    </div>
  )
}

// ── Share link copy ───────────────────────────────────────────────────────────

function ShareButton({ config }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    const hash = configToHash(config)
    const url = `${window.location.origin}${window.location.pathname}#cfg=${hash}`
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      // fallback
      const el = document.createElement('textarea')
      el.value = url
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button onClick={copy} className="btn-secondary text-xs flex items-center gap-1.5" title="Copiar enlace con parámetros actuales">
      {copied ? 'Copiado!' : 'Compartir enlace'}
    </button>
  )
}

// ── Main GenericWizard ────────────────────────────────────────────────────────

export default function GenericWizard({ modelConfig }) {
  const {
    modelId, modelName, perspective, apiPath, description,
    InputsComponent, ResultsComponent, defaultConfig,
  } = modelConfig

  const [searchParams] = useSearchParams()
  const industryId = searchParams.get('industry')
  const vocab = INDUSTRY_VOCAB[industryId] || DEFAULT_VOCAB

  // Restore config from URL hash if present
  const [config, setConfig] = useState(() => {
    const hash = window.location.hash
    const match = hash.match(/#cfg=(.+)/)
    if (match) {
      const restored = hashToConfig(match[1])
      if (restored) return restored
    }
    return {
      horizon_weeks: 12,
      aov: vocab.defaultAov,
      take_rate: 0.22,
      currency: vocab.currency,
      country: vocab.country,
      palette: 'navy',
      annotations: '',
      ...defaultConfig,
    }
  })

  const [step, setStep] = useState(0)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [scenario, setScenario] = useState('base')
  const [excelLoading, setExcelLoading] = useState(false)
  const [mode, setMode] = useState('base')

  const colors = PERSPECTIVE_COLORS[perspective] || PERSPECTIVE_COLORS.D
  const scMultiplier = SCENARIOS.find(s => s.id === scenario)?.multiplier ?? 1.0

  const handleCalculate = async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}))
        throw new Error(errData.detail || `Error ${resp.status}`)
      }
      const data = await resp.json()
      setResult(data)
      setStep(2)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExportJSON = () => {
    if (!result) return
    const blob = new Blob([JSON.stringify({ config, result }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${modelId}_forecast.json`; a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportExcel = async () => {
    setExcelLoading(true)
    try {
      const exportPath = `/api/models/${modelId.toLowerCase()}/export-excel`
      const resp = await fetch(exportPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}))
        throw new Error(errData.detail || `Error ${resp.status}`)
      }
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${modelId.toLowerCase()}_forecast.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Error exportando Excel: ' + e.message)
    } finally {
      setExcelLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (!result) return
    // Find the main data list
    const keys = ['weekly', 'weeks', 'items', 'cohorts', 'segments', 'tiers', 'zones',
                  'channels', 'restaurants', 'couriers', 'campaigns', 'periods', 'by_campaign']
    let rows = null
    for (const k of keys) {
      if (Array.isArray(result[k]) && result[k].length > 0) { rows = result[k]; break }
    }
    if (!rows) {
      // fallback: any array value
      for (const v of Object.values(result)) {
        if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object') { rows = v; break }
      }
    }
    if (rows) {
      downloadCSV(rows, `${modelId.toLowerCase()}_datos.csv`)
    } else {
      alert('No hay datos detallados para exportar como CSV.')
    }
  }

  const findings = result ? generateFindings(result, modelId, vocab) : []

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Sticky header */}
      <header className="border-b border-gray-800 bg-gray-900/50 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/new" className="btn-ghost text-xs">← Modelos</Link>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${colors.badge}`}>{modelId}</span>
            <span className="text-sm font-semibold text-gray-200 font-mono hidden sm:block">{modelName}</span>
          </div>
          <div className="flex items-center gap-1">
            {STEPS.map(s => (
              <button
                key={s.id}
                onClick={() => s.id < step || s.id === 0 ? setStep(s.id) : undefined}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all
                  ${step === s.id ? 'bg-blue-600 text-white' : step > s.id ? 'bg-blue-900/60 text-blue-400 cursor-pointer' : 'bg-gray-800 text-gray-500 cursor-default'}`}
              >
                {s.id + 1}
              </button>
            ))}
            <span className="text-xs text-gray-500 ml-1 font-mono">{STEPS[step]?.label}</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Step 0: Config */}
        {step === 0 && (
          <div>
            <h1 className={`text-xl font-bold mb-1 ${colors.header}`}>{modelName}</h1>
            <p className="text-gray-500 text-sm mb-6">{description}</p>
            <StepConfig config={config} setConfig={setConfig} vocab={vocab} modelName={modelName} description={description} />
            <div className="mt-6">
              <button onClick={() => setStep(1)} className="btn-primary">
                Continuar a Inputs →
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Inputs */}
        {step === 1 && (
          <div>
            <div className="flex items-center mb-1">
              <h1 className={`text-xl font-bold ${colors.header}`}>Parámetros del Modelo</h1>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-gray-500">Modo:</span>
                {['base', 'advanced'].map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`text-xs px-3 py-1 rounded border transition-all ${
                      mode === m
                        ? m === 'base' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-amber-600 border-amber-500 text-white'
                        : 'border-gray-700 text-gray-500 hover:text-gray-300'
                    }`}>
                    {m === 'base' ? 'Base' : 'Avanzado'}
                  </button>
                ))}
                <HelperTooltip text="Modo Base muestra los parámetros más importantes. Modo Avanzado desbloquea todos los parámetros del modelo incluyendo supuestos técnicos." />
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-4">Ajusta los inputs específicos de {modelName}.</p>

            <InputsComponent config={config} setConfig={setConfig} vocab={vocab} mode={mode} />

            <div className="mt-4 space-y-3">
              <AnnotationBox config={config} setConfig={setConfig} />
              <ConfigTransfer config={config} setConfig={setConfig} modelId={modelId} />
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep(0)} className="btn-secondary">← Atrás</button>
              <button onClick={handleCalculate} disabled={loading} className="btn-primary">
                {loading ? 'Calculando...' : 'Calcular Forecast →'}
              </button>
            </div>
            {error && (
              <div className="mt-4 ds-card border-red-800 bg-red-900/20 p-3 text-red-400 text-sm font-mono">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Results */}
        {step === 2 && result && (
          <div>
            {/* Scenario switcher */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs text-gray-500 font-mono">Escenario:</span>
              <div className="flex gap-1">
                {SCENARIOS.map(sc => (
                  <button
                    key={sc.id}
                    onClick={() => setScenario(sc.id)}
                    className={`px-3 py-1 text-xs font-mono font-bold rounded border transition-all ${
                      scenario === sc.id ? sc.bg + ' ' + sc.color : 'border-gray-700 text-gray-500 hover:border-gray-600'
                    }`}
                  >
                    {sc.label} {sc.id !== 'base' ? `(${sc.id === 'bear' ? '−40%' : '+40%'})` : ''}
                  </button>
                ))}
              </div>
              <HelperTooltip text="Los escenarios aplican un multiplicador a los valores del modelo. Bear = ×0.6 (pesimista), Base = ×1.0 (central), Bull = ×1.4 (optimista). Útil para presentaciones a directivos." />
              <span className="ml-auto text-[10px] font-mono text-gray-600">
                {scenario !== 'base' ? `Aplicando ${scMultiplier}x a valores incrementales` : 'Valores base del modelo'}
              </span>
            </div>

            {/* Key findings */}
            {findings.length > 0 && (
              <div className="ds-card p-4 mb-6 bg-gray-900/60">
                <div className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400 mb-3">Hallazgos Clave</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {findings.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>
                      <span className="text-sm text-gray-300">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Model-specific results */}
            <ResultsComponent result={result} config={config} vocab={vocab} scenario={scenario} scMultiplier={scMultiplier} />

            {/* Scenario comparison table */}
            <div className="mt-6">
              <ScenarioTable result={result} config={config} />
            </div>

            {/* Sensitivity chart */}
            <div className="mt-4">
              <TornadoChart modelId={modelId} config={config} />
            </div>

            {/* Footer actions */}
            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-gray-800 pt-6">
              <button onClick={() => setStep(1)} className="btn-secondary text-xs">← Editar Inputs</button>
              <button onClick={handleExportJSON} className="btn-secondary text-xs">Exportar JSON</button>
              <button onClick={handleExportCSV} className="btn-secondary text-xs">
                Exportar CSV
                <HelperTooltip text="Descarga los datos semanales detallados en formato CSV. Útil para importar en Excel, Sheets o Tableau." />
              </button>
              <button
                onClick={handleExportExcel}
                disabled={excelLoading}
                className="btn-primary text-xs disabled:opacity-50"
              >
                {excelLoading ? 'Generando...' : 'Exportar Excel (CEO) →'}
              </button>
              <ShareButton config={config} />
              <Link to="/new" className="text-xs text-gray-500 hover:text-gray-300 ml-auto">
                Nuevo Forecast →
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
