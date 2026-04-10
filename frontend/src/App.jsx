import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom'
import Wizard from './components/Wizard'
import HomePage from './components/HomePage'
import ResultsDashboard from './components/ResultsDashboard'
import MarkovWizard from './components/markov/MarkovWizard'
import { fmtOrders, fmtPct, formatDate } from './utils/formatters'

// ── Taxonomy data (mirrors HomePage) ────────────────────────────────────────

const TAXONOMY = {
  D: {
    label: 'Demanda', sublabel: 'El usuario como driver de órdenes', color: 'blue',
    models: [
      { id: 'D1', name: 'User Lifecycle Markov', question: '¿Cuántas órdenes el próximo trimestre y de dónde vienen?', status: 'full', link: '/markov' },
      { id: 'D2', name: 'Cohort Retention & LTV', question: '¿Cuándo recupero el CAC? ¿Qué canal de adquisición es más eficiente?', status: 'demo' },
      { id: 'D3', name: 'Funnel Conversion', question: '¿En qué paso del journey pierdo la mayoría de órdenes potenciales?', status: 'demo' },
      { id: 'D4', name: 'Frequency & Wallet Share', question: '¿Cuánta frecuencia adicional puedo extraer de usuarios existentes?', status: 'demo' },
      { id: 'D5', name: 'Reactivation & Winback', question: '¿Cuántas órdenes puedo recuperar de mi base dormida?', status: 'demo' },
    ],
  },
  S: {
    label: 'Oferta', sublabel: 'El restaurante como driver de órdenes', color: 'emerald',
    models: [
      { id: 'S1', name: 'Restaurant Onboarding & Maturation', question: '¿Cuántas órdenes generarán los restaurantes que estoy activando esta semana?', status: 'demo' },
      { id: 'S2', name: 'Portfolio & Selection Effect', question: '¿Más restaurantes o mejores restaurantes?', status: 'demo' },
      { id: 'S3', name: 'Restaurant Engagement & Performance', question: '¿Cómo subo el volumen de restaurantes existentes sin que la plataforma pague más?', status: 'demo' },
      { id: 'S4', name: 'Restaurant Health Score', question: '¿Qué restaurantes van a irse y cuántas órdenes estoy en riesgo de perder?', status: 'demo' },
    ],
  },
  P: {
    label: 'Plataforma', sublabel: 'Efectos emergentes de la interacción oferta-demanda', color: 'purple',
    models: [
      { id: 'P1', name: 'Network Effects & Liquidity', question: '¿Está este mercado en fase de oferta, demanda, o ya es maduro?', status: 'demo' },
      { id: 'P2', name: 'Incrementality & Cannibalization', question: '¿Cuántas de mis órdenes promovidas habrían pasado de todas formas?', status: 'demo' },
      { id: 'P3', name: 'Delivery Economics & Capacity', question: '¿En qué punto la flota se convierte en el cuello de botella de crecimiento?', status: 'demo' },
      { id: 'P4', name: 'Competitive Dynamics', question: '¿Qué pasa con mis órdenes si entra o sale un competidor?', status: 'demo' },
      { id: 'P5', name: 'Marketplace Equilibrium', question: '¿Es mi negocio sostenible o estoy subsidiando demanda artificial?', status: 'demo' },
    ],
  },
}

const COLOR = {
  blue:    { badge: 'bg-blue-900/40 text-blue-300 border border-blue-800', header: 'text-blue-400', dot: 'bg-blue-500' },
  emerald: { badge: 'bg-emerald-900/40 text-emerald-300 border border-emerald-800', header: 'text-emerald-400', dot: 'bg-emerald-500' },
  purple:  { badge: 'bg-purple-900/40 text-purple-300 border border-purple-800', header: 'text-purple-400', dot: 'bg-purple-500' },
}

// ── New Forecast — Model Selection Page ──────────────────────────────────────

function NewForecastPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="btn-ghost text-xs">← Inicio</Link>
            <span className="text-sm font-semibold text-gray-200 font-mono">Nuevo Forecast</span>
          </div>
          <Link to="/forecasts" className="btn-ghost text-xs">Mis Forecasts</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-100 mb-2">Elige un modelo</h1>
          <p className="text-gray-400 text-sm">14 modelos organizados en 3 perspectivas. Los modelos <span className="text-blue-400 font-semibold">completos</span> tienen wizard interactivo. Los de <span className="text-amber-400 font-semibold">demo</span> están disponibles en la página principal.</p>
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
                    return (
                      <button
                        key={model.id}
                        onClick={() => {
                          if (isFull && model.link) navigate(model.link)
                          else navigate('/', { state: { openModel: model.id } })
                        }}
                        className={`w-full text-left px-4 py-3 transition-colors group
                          ${isFull ? 'hover:bg-blue-900/20 cursor-pointer' : 'hover:bg-gray-800/40 cursor-pointer'}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`mt-0.5 flex-shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${c.badge}`}>{model.id}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`text-xs font-semibold leading-tight ${isFull ? 'text-gray-100' : 'text-gray-300'}`}>{model.name}</span>
                              {isFull && <span className="text-[9px] font-mono bg-blue-600 text-white px-1.5 py-0.5 rounded flex-shrink-0">WIZARD</span>}
                              {!isFull && <span className="text-[9px] font-mono bg-amber-700/60 text-amber-300 px-1.5 py-0.5 rounded flex-shrink-0">DEMO</span>}
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
            <p className="text-xs text-gray-400">Empieza con <span className="text-blue-400 font-semibold">D1 — User Lifecycle Markov</span>. Es el modelo más completo: integra todos los demás y produce un forecast semanal con desglose por iniciativa y costo.</p>
          </div>
          <button onClick={() => navigate('/markov')} className="btn-primary text-xs flex-shrink-0 ml-auto">
            Abrir D1 Markov →
          </button>
        </div>
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
      </Routes>
    </BrowserRouter>
  )
}
