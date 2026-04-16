import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

// ── Industry vocabulary (shared across all wizard models) ─────────────────────

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
  { code: 'MX', name: 'México', flag: '🇲🇽', aov: 290, currency: 'MXN' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', aov: 52, currency: 'BRL' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', aov: 32000, currency: 'COP' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', aov: 12000, currency: 'CLP' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', aov: 8000, currency: 'ARS' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪', aov: 42, currency: 'PEN' },
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
  { id: 'bear', label: 'Bear', multiplier: 0.6, color: 'text-red-400', bg: 'bg-red-900/30 border-red-800' },
  { id: 'base', label: 'Base', multiplier: 1.0, color: 'text-blue-400', bg: 'bg-blue-900/30 border-blue-800' },
  { id: 'bull', label: 'Bull', multiplier: 1.4, color: 'text-emerald-400', bg: 'bg-emerald-900/30 border-emerald-800' },
]

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
        <label className="ds-label block mb-2">País de operación</label>
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
          <label className="ds-label">Horizonte de Forecast</label>
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
          <label className="ds-label block mb-2">{vocab.aovLabel} ({config.currency})</label>
          <input type="number" value={config.aov}
            onChange={e => setConfig(p => ({ ...p, aov: Number(e.target.value) }))}
            className="ds-input w-full" />
          <p className="text-xs text-gray-600 italic mt-2">Valor promedio por {vocab.transaction.toLowerCase()}</p>
        </div>
        <div className="ds-card p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="ds-label">Take Rate</label>
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

// ── Generic key findings generator ───────────────────────────────────────────

function generateFindings(result, modelId, vocab) {
  const s = result?.summary || {}
  const findings = []

  if (s.total_revenue) findings.push(`Revenue total en el horizonte: ${s.currency || ''} ${(s.total_revenue / 1000).toFixed(0)}K`)
  if (s.total_orders) findings.push(`${(s.total_orders / 1000).toFixed(1)}K ${vocab.transactions.toLowerCase()} totales proyectadas`)
  if (s.best_channel) findings.push(`Canal mas eficiente: ${s.best_channel}`)
  if (s.avg_ltv_cac) findings.push(`LTV/CAC promedio: ${s.avg_ltv_cac}x`)
  if (s.ltv_cac_ratio) findings.push(`LTV/CAC: ${s.ltv_cac_ratio}x — ${s.is_sustainable ? 'negocio sostenible' : 'revisar economía unitaria'}`)
  if (s.breakeven_weekly_orders) findings.push(`Breakeven: ${(s.breakeven_weekly_orders / 1000).toFixed(0)}K ${vocab.transactions.toLowerCase()}/semana`)
  if (s.biggest_drop_step) findings.push(`Mayor pérdida en el funnel: "${s.biggest_drop_step}"`)
  if (s.overall_conversion_rate) findings.push(`Conversión total del funnel: ${s.overall_conversion_rate.toFixed(1)}%`)
  if (s.best_campaign) findings.push(`Campaña con mejor ROI: ${s.best_campaign}`)
  if (s.blended_roi !== undefined) findings.push(`ROI combinado de campañas: ${(s.blended_roi * 100).toFixed(0)}%`)
  if (s.blended_cannibalization_rate_pct) findings.push(`Tasa de canibalización: ${s.blended_cannibalization_rate_pct.toFixed(0)}% de órdenes`)
  if (s.bottleneck_week) findings.push(`Cuello de botella en semana ${s.bottleneck_week} — flota saturada`)
  if (s.at_risk_count) findings.push(`${s.at_risk_count} restaurantes en riesgo de churn`)
  if (s.revenue_at_risk) findings.push(`Revenue en riesgo: ${(s.revenue_at_risk / 1000).toFixed(0)}K en el horizonte`)
  if (s.roi !== undefined) findings.push(`ROI del programa: ${(s.roi * 100).toFixed(0)}%`)
  if (s.avg_health_score) findings.push(`Score de salud promedio: ${s.avg_health_score}/100`)
  if (s.uplift_pct) findings.push(`Uplift del portafolio: +${s.uplift_pct.toFixed(1)}% revenue`)
  if (s.final_phase) findings.push(`Fase de liquidez: ${s.final_phase.replace('_', ' ')}`)
  if (s.final_share_pct) findings.push(`Market share final: ${s.final_share_pct.toFixed(1)}%`)
  if (s.total_restaurants_added) findings.push(`${s.total_restaurants_added} restaurantes activados en el horizonte`)

  return findings.slice(0, 4)
}

// ── Main GenericWizard component ──────────────────────────────────────────────

export default function GenericWizard({ modelConfig }) {
  const {
    modelId, modelName, perspective, apiPath, description,
    InputsComponent, ResultsComponent, defaultConfig,
  } = modelConfig

  const [searchParams] = useSearchParams()
  const industryId = searchParams.get('industry')
  const vocab = INDUSTRY_VOCAB[industryId] || DEFAULT_VOCAB

  const [step, setStep] = useState(0)
  const [config, setConfig] = useState(() => ({
    horizon_weeks: 12,
    aov: vocab.defaultAov,
    take_rate: 0.22,
    currency: vocab.currency,
    country: vocab.country,
    ...defaultConfig,
  }))
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [scenario, setScenario] = useState('base')

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
          {/* Step pills */}
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
        {/* Step 0: Config General */}
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

        {/* Step 1: Model-specific inputs */}
        {step === 1 && (
          <div>
            <h1 className={`text-xl font-bold mb-1 ${colors.header}`}>Parámetros del Modelo</h1>
            <p className="text-gray-500 text-sm mb-6">Ajusta los inputs específicos de {modelName}.</p>
            <InputsComponent config={config} setConfig={setConfig} vocab={vocab} />
            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep(0)} className="btn-secondary">← Atrás</button>
              <button
                onClick={handleCalculate}
                disabled={loading}
                className="btn-primary"
              >
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

            {/* Footer actions */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary text-xs">← Editar Inputs</button>
              <button onClick={handleExportJSON} className="btn-secondary text-xs">Exportar JSON</button>
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
