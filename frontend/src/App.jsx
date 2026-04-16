import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import Wizard from './components/Wizard'
import HomePage from './components/HomePage'
import ResultsDashboard from './components/ResultsDashboard'
import MarkovWizard from './components/markov/MarkovWizard'
import D2CohortWizard from './components/models/D2CohortWizard'
import D3FunnelWizard from './components/models/D3FunnelWizard'
import D4FrequencyWizard from './components/models/D4FrequencyWizard'
import D5WinbackWizard from './components/models/D5WinbackWizard'
import S1OnboardingWizard from './components/models/S1OnboardingWizard'
import S2PortfolioWizard from './components/models/S2PortfolioWizard'
import S3EngagementWizard from './components/models/S3EngagementWizard'
import S4HealthWizard from './components/models/S4HealthWizard'
import P1NetworkWizard from './components/models/P1NetworkWizard'
import P2IncrementalityWizard from './components/models/P2IncrementalityWizard'
import P3DeliveryWizard from './components/models/P3DeliveryWizard'
import P4CompetitiveWizard from './components/models/P4CompetitiveWizard'
import P5EquilibriumWizard from './components/models/P5EquilibriumWizard'
import { fmtOrders, fmtPct, formatDate } from './utils/formatters'

// ── Taxonomy data (mirrors HomePage) ────────────────────────────────────────

const TAXONOMY = {
  D: {
    label: 'Demanda', sublabel: 'El usuario como driver de órdenes', color: 'blue',
    models: [
      { id: 'D1', name: 'User Lifecycle Markov', question: '¿Cuántas órdenes el próximo trimestre y de dónde vienen?', status: 'full', link: '/markov', level: 'advanced' },
      { id: 'D2', name: 'Cohort Retention & LTV', question: '¿Cuándo recupero el CAC? ¿Qué canal de adquisición es más eficiente?', status: 'full', link: '/models/d2', level: 'mid' },
      { id: 'D3', name: 'Funnel Conversion', question: '¿En qué paso del journey pierdo la mayoría de órdenes potenciales?', status: 'full', link: '/models/d3', level: 'foundational' },
      { id: 'D4', name: 'Frequency & Wallet Share', question: '¿Cuánta frecuencia adicional puedo extraer de usuarios existentes?', status: 'full', link: '/models/d4', level: 'foundational' },
      { id: 'D5', name: 'Reactivation & Winback', question: '¿Cuántas órdenes puedo recuperar de mi base dormida?', status: 'full', link: '/models/d5', level: 'mid' },
    ],
  },
  S: {
    label: 'Oferta', sublabel: 'El restaurante como driver de órdenes', color: 'emerald',
    models: [
      { id: 'S1', name: 'Restaurant Onboarding & Maturation', question: '¿Cuántas órdenes generarán los restaurantes que estoy activando esta semana?', status: 'full', link: '/models/s1', level: 'mid' },
      { id: 'S2', name: 'Portfolio & Selection Effect', question: '¿Más restaurantes o mejores restaurantes?', status: 'full', link: '/models/s2', level: 'mid' },
      { id: 'S3', name: 'Restaurant Engagement & Performance', question: '¿Cómo subo el volumen de restaurantes existentes sin que la plataforma pague más?', status: 'full', link: '/models/s3', level: 'foundational' },
      { id: 'S4', name: 'Restaurant Health Score', question: '¿Qué restaurantes van a irse y cuántas órdenes estoy en riesgo de perder?', status: 'full', link: '/models/s4', level: 'mid' },
    ],
  },
  P: {
    label: 'Plataforma', sublabel: 'Efectos emergentes de la interacción oferta-demanda', color: 'purple',
    models: [
      { id: 'P1', name: 'Network Effects & Liquidity', question: '¿Está este mercado en fase de oferta, demanda, o ya es maduro?', status: 'full', link: '/models/p1', level: 'advanced' },
      { id: 'P2', name: 'Incrementality & Cannibalization', question: '¿Cuántas de mis órdenes promovidas habrían pasado de todas formas?', status: 'full', link: '/models/p2', level: 'mid' },
      { id: 'P3', name: 'Delivery Economics & Capacity', question: '¿En qué punto la flota se convierte en el cuello de botella de crecimiento?', status: 'full', link: '/models/p3', level: 'mid' },
      { id: 'P4', name: 'Competitive Dynamics', question: '¿Qué pasa con mis órdenes si entra o sale un competidor?', status: 'full', link: '/models/p4', level: 'advanced' },
      { id: 'P5', name: 'Marketplace Equilibrium', question: '¿Es mi negocio sostenible o estoy subsidiando demanda artificial?', status: 'full', link: '/models/p5', level: 'mid' },
    ],
  },
}

const COLOR = {
  blue:    { badge: 'bg-blue-900/40 text-blue-300 border border-blue-800', header: 'text-blue-400', dot: 'bg-blue-500' },
  emerald: { badge: 'bg-emerald-900/40 text-emerald-300 border border-emerald-800', header: 'text-emerald-400', dot: 'bg-emerald-500' },
  purple:  { badge: 'bg-purple-900/40 text-purple-300 border border-purple-800', header: 'text-purple-400', dot: 'bg-purple-500' },
}

// ── Industries for /new selector (subset of HomePage INDUSTRIES) ─────────────

const SELECTOR_INDUSTRIES = [
  { id: 'food_delivery',  icon: '🍔', name: 'Food Delivery',       category: 'Marketplace',  topModels: ['D1','D3','P3'], transaction: 'Orden',        supply: 'Restaurante' },
  { id: 'rideshare',      icon: '🚗', name: 'Ridesharing',          category: 'Marketplace',  topModels: ['D3','S2','P5'], transaction: 'Viaje',        supply: 'Conductor' },
  { id: 'ecommerce',      icon: '🛒', name: 'E-commerce',           category: 'Marketplace',  topModels: ['D1','D2','S3'], transaction: 'Compra',       supply: 'Vendedor' },
  { id: 'quick_commerce', icon: '⚡', name: 'Quick Commerce',       category: 'Marketplace',  topModels: ['D1','D3','P3'], transaction: 'Canasta',      supply: 'Nodo/Tienda' },
  { id: 'beauty',         icon: '💅', name: 'Beauty & Wellness',    category: 'Marketplace',  topModels: ['S1','S2','P4'], transaction: 'Cita',         supply: 'Profesional' },
  { id: 'hotel',          icon: '🏨', name: 'Hotel / STR',          category: 'Marketplace',  topModels: ['D2','S1','S4'], transaction: 'Reserva',      supply: 'Host/Propiedad' },
  { id: 'pharmacy',       icon: '💊', name: 'Farmacia',             category: 'Marketplace',  topModels: ['D1','D5','P3'], transaction: 'Pedido',       supply: 'Farmacia' },
  { id: 'saas_b2b',       icon: '💼', name: 'SaaS B2B',             category: 'SaaS',         topModels: ['D1','D2','S1'], transaction: 'Suscripción',  supply: 'Software' },
  { id: 'b2b_platform',   icon: '🏪', name: 'B2B Platform',         category: 'SaaS',         topModels: ['S1','S2','P2'], transaction: 'Sub + Comisión', supply: 'Apps/Integraciones' },
  { id: 'gig',            icon: '🧑‍💻', name: 'Gig / Freelance',    category: 'SaaS',         topModels: ['S1','S2','P1'], transaction: 'Proyecto',     supply: 'Freelancer' },
  { id: 'hr_marketplace', icon: '👔', name: 'HR Tech / Empleo',     category: 'SaaS',         topModels: ['S1','S2','P1'], transaction: 'Contratación', supply: 'Empleador' },
  { id: 'streaming',      icon: '🎬', name: 'Streaming / OTT',      category: 'Consumer',     topModels: ['D1','D2','D5'], transaction: 'Sesión',       supply: 'Contenido' },
  { id: 'edtech',         icon: '📚', name: 'EdTech',               category: 'Consumer',     topModels: ['D1','D2','P4'], transaction: 'Lección/Sub',  supply: 'Creador' },
  { id: 'gaming',         icon: '🎮', name: 'Mobile Gaming',        category: 'Consumer',     topModels: ['D1','D3','P4'], transaction: 'IAP/Session',  supply: 'Desarrollador' },
  { id: 'fitness',        icon: '🏋️', name: 'Fitness Tech',         category: 'Consumer',     topModels: ['D1','D3','P4'], transaction: 'Clase/Membresía', supply: 'Gimnasio' },
  { id: 'super_app',      icon: '📱', name: 'Super App',            category: 'Consumer',     topModels: ['D3','D5','P5'], transaction: 'Multi-servicio', supply: 'Multi-vertical' },
  { id: 'fintech',        icon: '💳', name: 'Fintech / Lending',    category: 'Fintech',      topModels: ['D2','P1','P5'], transaction: 'Préstamo',     supply: 'Capital' },
  { id: 'real_estate',    icon: '🏠', name: 'Real Estate Tech',     category: 'Fintech',      topModels: ['S1','S2','P2'], transaction: 'Transacción',  supply: 'Agente' },
  { id: 'telemedicine',   icon: '🩺', name: 'Telemedicina',         category: 'Fintech',      topModels: ['D1','D5','P1'], transaction: 'Consulta',     supply: 'Médico' },
  { id: 'travel_ota',     icon: '✈️', name: 'Travel / OTA',         category: 'Fintech',      topModels: ['D2','P2','P5'], transaction: 'Reserva',      supply: 'Hotel/Aerolínea' },
]

const SELECTOR_CATEGORIES = ['Marketplace', 'SaaS', 'Consumer', 'Fintech']

// ── New Forecast — 2-step: Industry → Model ───────────────────────────────────

function NewForecastPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)           // 1 = industry, 2 = model
  const [industry, setIndustry] = useState(null)

  const handleIndustry = (ind) => {
    setIndustry(ind)
    setStep(2)
  }

  const handleModel = (model) => {
    if (model.status === 'full' && model.link) {
      const dest = industry ? `${model.link}?industry=${industry.id}` : model.link
      navigate(dest)
    } else {
      navigate('/', { state: { openModel: model.id } })
    }
  }

  const topModelIds = industry?.topModels ?? []

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step === 2
              ? <button onClick={() => setStep(1)} className="btn-ghost text-xs">← Industria</button>
              : <Link to="/" className="btn-ghost text-xs">← Inicio</Link>
            }
            <span className="text-sm font-semibold text-gray-200 font-mono">
              Nuevo Forecast
              {step === 2 && industry && (
                <span className="ml-2 text-gray-500">/ {industry.icon} {industry.name}</span>
              )}
            </span>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {[1,2].map(s => (
              <div key={s} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold
                ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500'}`}>
                {s}
              </div>
            ))}
            <span className="text-xs text-gray-500 ml-1">{step === 1 ? 'Industria' : 'Modelo'}</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">

        {/* ── Step 1: Industry Picker ── */}
        {step === 1 && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-100 mb-2">¿En qué industria operas?</h1>
              <p className="text-gray-400 text-sm">Los modelos se adaptan a tu industria con variables y benchmarks específicos.</p>
            </div>

            {SELECTOR_CATEGORIES.map(cat => (
              <div key={cat} className="mb-8">
                <div className="text-xs font-mono font-bold uppercase tracking-widest text-gray-500 mb-3">{cat}</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {SELECTOR_INDUSTRIES.filter(i => i.category === cat).map(ind => (
                    <button
                      key={ind.id}
                      onClick={() => handleIndustry(ind)}
                      className="ds-card p-3 text-left hover:border-blue-700 hover:bg-blue-900/10 transition-all group"
                    >
                      <div className="text-2xl mb-2 leading-none">{ind.icon}</div>
                      <div className="text-xs font-semibold text-gray-200 leading-tight mb-1">{ind.name}</div>
                      <div className="text-[10px] text-gray-500">{ind.transaction}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={() => { setIndustry(null); setStep(2) }}
              className="text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2 mt-2"
            >
              Saltar — ver todos los modelos sin filtro de industria
            </button>
          </>
        )}

        {/* ── Step 2: Model Picker ── */}
        {step === 2 && (
          <>
            <div className="mb-6">
              {industry ? (
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl">{industry.icon}</span>
                    <h1 className="text-2xl font-bold text-gray-100">Modelos para {industry.name}</h1>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Los modelos <span className="text-blue-400 font-semibold">recomendados</span> están diseñados para responder las preguntas clave de esta industria.
                    La terminología se adaptará automáticamente ({industry.transaction} · {industry.supply}).
                  </p>
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl font-bold text-gray-100 mb-1">Elige un modelo</h1>
                  <p className="text-gray-400 text-sm">14 modelos · 3 perspectivas MBB Consulting.</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(TAXONOMY).map(([key, persp]) => {
                const c = COLOR[persp.color]
                return (
                  <div key={key} className="ds-card overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/40">
                      <div className={`text-xs font-mono font-bold uppercase tracking-widest mb-0.5 ${c.header}`}>{key} — {persp.label}</div>
                      <div className="text-[11px] text-gray-500">{persp.sublabel}</div>
                    </div>
                    <div className="flex-1 divide-y divide-gray-800/60">
                      {persp.models.map(model => {
                        const isFull = model.status === 'full'
                        const isRecommended = topModelIds.includes(model.id)
                        return (
                          <button
                            key={model.id}
                            onClick={() => handleModel(model)}
                            className={`w-full text-left px-4 py-3 transition-colors group
                              ${isRecommended ? 'bg-blue-950/30 hover:bg-blue-900/25' : isFull ? 'hover:bg-blue-900/20' : 'hover:bg-gray-800/40'}`}
                          >
                            <div className="flex items-start gap-2">
                              <span className={`mt-0.5 flex-shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${c.badge}`}>{model.id}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                  <span className={`text-xs font-semibold leading-tight ${isFull || isRecommended ? 'text-gray-100' : 'text-gray-300'}`}>{model.name}</span>
                                  {isFull && <span className="text-[9px] font-mono bg-blue-600 text-white px-1.5 py-0.5 rounded flex-shrink-0">WIZARD</span>}
                                  {!isFull && <span className="text-[9px] font-mono bg-amber-700/60 text-amber-300 px-1.5 py-0.5 rounded flex-shrink-0">DEMO</span>}
                                  {isRecommended && <span className="text-[9px] font-mono bg-emerald-800 text-emerald-300 px-1.5 py-0.5 rounded flex-shrink-0">★ REC</span>}
                                  {model.level === 'foundational' && <span className="text-[9px] font-mono bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded flex-shrink-0">Base</span>}
                                  {model.level === 'mid' && <span className="text-[9px] font-mono bg-blue-900/60 text-blue-300 px-1.5 py-0.5 rounded flex-shrink-0">Mid</span>}
                                  {model.level === 'advanced' && <span className="text-[9px] font-mono bg-amber-900/60 text-amber-300 px-1.5 py-0.5 rounded flex-shrink-0">Advanced</span>}
                                </div>
                                <p className="text-[11px] text-gray-500 leading-snug">{model.question}</p>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-8 ds-card p-4 flex items-center gap-4 bg-gray-900/30">
              <div className="text-2xl">💡</div>
              <div>
                <div className="text-sm font-semibold text-gray-200 mb-0.5">¿No sabes cuál elegir?</div>
                <p className="text-xs text-gray-400">Empieza con <span className="text-blue-400 font-semibold">D1 — User Lifecycle Markov</span>. Es el modelo más completo y aplica a cualquier industria.</p>
              </div>
              <button
                onClick={() => navigate(industry ? `/markov?industry=${industry.id}` : '/markov')}
                className="btn-primary text-xs flex-shrink-0 ml-auto"
              >
                Abrir D1 Markov →
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

// ── Forecasts List Page ──────────────────────────────────────────────────────

function ForecastsList() {
  const [forecasts, setForecasts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/forecast/list')
      .then(r => r.json())
      .then(data => { setForecasts(data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this forecast?')) return
    await fetch(`/api/forecast/${id}`, { method: 'DELETE' })
    setForecasts(f => f.filter(x => x.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">📊</span>
            <h1 className="text-sm font-semibold text-gray-200 font-mono">Forecast Studio</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/new" className="btn-primary text-xs">+ New Forecast</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-200">Saved Forecasts</h2>
          <span className="text-sm text-gray-500">{forecasts.length} saved</span>
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="ds-card h-20 shimmer" />)}
          </div>
        )}

        {error && (
          <div className="ds-card border-red-800 bg-red-900/20 p-4 text-red-400 text-sm font-mono">
            {error}
          </div>
        )}

        {!loading && !error && forecasts.length === 0 && (
          <div className="ds-card p-12 text-center">
            <div className="text-4xl mb-4">📁</div>
            <p className="text-gray-500">No saved forecasts yet.</p>
            <Link to="/new" className="btn-primary mt-4 inline-block">Create First Forecast</Link>
          </div>
        )}

        {!loading && forecasts.length > 0 && (
          <div className="ds-card overflow-hidden">
            <table className="ds-table w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Country</th>
                  <th>Horizon</th>
                  <th>Models</th>
                  <th>Total Orders</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {forecasts.map((f, i) => (
                  <tr key={f.id} className={i % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900/30'}>
                    <td className="text-gray-200 font-medium">{f.name}</td>
                    <td className="font-mono text-blue-400">{f.country}</td>
                    <td className="font-mono">{f.horizon_weeks}w</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {f.models_active.map(m => (
                          <span key={m} className="ds-badge-blue text-[10px]">{m}</span>
                        ))}
                      </div>
                    </td>
                    <td className="font-mono font-semibold text-gray-100">{fmtOrders(f.total_orders)}</td>
                    <td className="text-gray-500 text-xs">{formatDate(f.created_at)}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/forecast/${f.id}`)}
                          className="btn-ghost text-xs"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="btn-danger text-xs py-0.5 px-2"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

// ── Forecast Detail Page ─────────────────────────────────────────────────────

function ForecastDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`/api/forecast/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Forecast not found')
        return r.json()
      })
      .then(data => { setForecast(data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [id])

  const handleExportExcel = async () => {
    const resp = await fetch(`/api/forecast/export-excel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(forecast?.inputs || {}),
    })
    if (resp.ok) {
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `forecast_${id}.xlsx`; a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleExportJSON = () => {
    if (!forecast) return
    const json = JSON.stringify(forecast, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `forecast_${id}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/forecasts')} className="btn-ghost text-xs">← Back</button>
            <span className="text-sm font-semibold text-gray-200 font-mono">
              {forecast?.name || 'Loading...'}
            </span>
          </div>
          <Link to="/new" className="btn-primary text-xs">+ New Forecast</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading && <div className="ds-card h-40 shimmer" />}
        {error && <div className="text-red-400 text-sm font-mono">{error}</div>}
        {forecast && (
          <ResultsDashboard
            forecast={forecast}
            inputs={forecast.inputs || {}}
            onExportExcel={handleExportExcel}
            onExportJSON={handleExportJSON}
            isLoading={false}
          />
        )}
      </main>
    </div>
  )
}

// ── Benchmarks / Settings Page ───────────────────────────────────────────────

function SettingsPage() {
  const [benchmarks, setBenchmarks] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/benchmarks')
      .then(r => r.json())
      .then(d => { setBenchmarks(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="btn-ghost text-xs">← Back</Link>
            <h1 className="text-sm font-semibold text-gray-200 font-mono">Benchmarks & Settings</h1>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading && <div className="ds-card h-40 shimmer" />}
        {benchmarks && (
          <div className="space-y-6">
            <div className="ds-card p-4">
              <div className="ds-section-header -mx-4 -mt-4 mb-4">Promo Uplift Benchmarks</div>
              <table className="ds-table w-full text-xs">
                <thead>
                  <tr>
                    <th>Promo Type</th>
                    <th>Low</th>
                    <th>Mid (Default)</th>
                    <th>High</th>
                    <th>Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(benchmarks.promo_uplift || {}).map(([k, v], i) => (
                    <tr key={k} className={i % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900/30'}>
                      <td className="font-mono text-blue-400">{k}</td>
                      <td className="text-red-400">{fmtPct(v.low)}</td>
                      <td className="text-amber-400 font-semibold">{fmtPct(v.mid)}</td>
                      <td className="text-emerald-400">{fmtPct(v.high)}</td>
                      <td className="text-gray-500">{v.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ds-card p-4">
              <div className="ds-section-header -mx-4 -mt-4 mb-4">Raw Benchmarks JSON</div>
              <pre className="text-xs font-mono text-gray-400 bg-gray-950 p-4 rounded border border-gray-800 overflow-auto max-h-96">
                {JSON.stringify(benchmarks, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ── App root ─────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/new" element={<NewForecastPage />} />
        <Route path="/new/combined" element={<Wizard />} />
        <Route path="/forecasts" element={<ForecastsList />} />
        <Route path="/forecast/:id" element={<ForecastDetail />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/markov" element={<MarkovWizard />} />
        <Route path="/models/d2" element={<D2CohortWizard />} />
        <Route path="/models/d3" element={<D3FunnelWizard />} />
        <Route path="/models/d4" element={<D4FrequencyWizard />} />
        <Route path="/models/d5" element={<D5WinbackWizard />} />
        <Route path="/models/s1" element={<S1OnboardingWizard />} />
        <Route path="/models/s2" element={<S2PortfolioWizard />} />
        <Route path="/models/s3" element={<S3EngagementWizard />} />
        <Route path="/models/s4" element={<S4HealthWizard />} />
        <Route path="/models/p1" element={<P1NetworkWizard />} />
        <Route path="/models/p2" element={<P2IncrementalityWizard />} />
        <Route path="/models/p3" element={<P3DeliveryWizard />} />
        <Route path="/models/p4" element={<P4CompetitiveWizard />} />
        <Route path="/models/p5" element={<P5EquilibriumWizard />} />
      </Routes>
    </BrowserRouter>
  )
}
