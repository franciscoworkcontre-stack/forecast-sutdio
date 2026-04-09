import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom'
import Wizard from './components/Wizard'
import HomePage from './components/HomePage'
import ResultsDashboard from './components/ResultsDashboard'
import MarkovWizard from './components/markov/MarkovWizard'
import { fmtOrders, fmtPct, formatDate } from './utils/formatters'

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
        <Route path="/new" element={<Wizard />} />
        <Route path="/forecasts" element={<ForecastsList />} />
        <Route path="/forecast/:id" element={<ForecastDetail />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/markov" element={<MarkovWizard />} />
      </Routes>
    </BrowserRouter>
  )
}
