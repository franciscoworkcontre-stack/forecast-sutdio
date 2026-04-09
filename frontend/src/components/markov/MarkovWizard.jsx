import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer
} from 'recharts'

// ── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 0, label: 'Pack', title: 'Assumptions Pack' },
  { id: 1, label: 'Config', title: 'Configuración General' },
  { id: 2, label: 'Usuarios', title: 'Base de Usuarios & Matriz' },
  { id: 3, label: 'Funnel', title: 'Traffic Funnel' },
  { id: 4, label: 'Levers', title: 'Levers / Promos' },
  { id: 5, label: 'P&L', title: 'Costos & P&L' },
  { id: 6, label: 'Resultados', title: 'Resultados' },
]

const DEFAULT_PROFILES = [
  { id: 'A', name: 'EFO (1ra orden)', initial_users: 50000 },
  { id: 'B', name: '2da Orden', initial_users: 30000 },
  { id: 'C', name: 'Churneado', initial_users: 80000 },
  { id: 'D', name: 'Baja Frecuencia', initial_users: 120000 },
  { id: 'E', name: 'Alta Frecuencia', initial_users: 60000 },
  { id: 'F', name: 'Inactivo', initial_users: 40000 },
]

const DEFAULT_MATRIX = [
  [0.00, 0.70, 0.10, 0.15, 0.05, 0.00],
  [0.00, 0.00, 0.10, 0.60, 0.30, 0.00],
  [0.05, 0.00, 0.60, 0.25, 0.05, 0.05],
  [0.00, 0.00, 0.15, 0.65, 0.15, 0.05],
  [0.00, 0.00, 0.05, 0.15, 0.75, 0.05],
  [0.00, 0.00, 0.10, 0.05, 0.00, 0.85],
]

const DEFAULT_FUNNEL = {
  A: { open_app_pct: 0.55, avg_weekly_sessions: 1.0, see_vertical_pct: 0.25, entry_topic: 0.45, entry_feed: 0.40, entry_filter: 0.15, p1_topic: 0.35, p1_feed: 0.30, p1_filter: 0.25, p2_topic: 0.18, p2_feed: 0.15, p2_filter: 0.12 },
  B: { open_app_pct: 0.60, avg_weekly_sessions: 1.2, see_vertical_pct: 0.30, entry_topic: 0.40, entry_feed: 0.40, entry_filter: 0.20, p1_topic: 0.37, p1_feed: 0.32, p1_filter: 0.27, p2_topic: 0.20, p2_feed: 0.17, p2_filter: 0.14 },
  C: { open_app_pct: 0.20, avg_weekly_sessions: 0.5, see_vertical_pct: 0.15, entry_topic: 0.45, entry_feed: 0.40, entry_filter: 0.15, p1_topic: 0.25, p1_feed: 0.20, p1_filter: 0.18, p2_topic: 0.12, p2_feed: 0.10, p2_filter: 0.08 },
  D: { open_app_pct: 0.45, avg_weekly_sessions: 1.0, see_vertical_pct: 0.22, entry_topic: 0.40, entry_feed: 0.40, entry_filter: 0.20, p1_topic: 0.32, p1_feed: 0.28, p1_filter: 0.22, p2_topic: 0.16, p2_feed: 0.13, p2_filter: 0.11 },
  E: { open_app_pct: 0.70, avg_weekly_sessions: 2.5, see_vertical_pct: 0.40, entry_topic: 0.35, entry_feed: 0.40, entry_filter: 0.25, p1_topic: 0.40, p1_feed: 0.35, p1_filter: 0.30, p2_topic: 0.22, p2_feed: 0.19, p2_filter: 0.16 },
  F: { open_app_pct: 0.08, avg_weekly_sessions: 0.2, see_vertical_pct: 0.05, entry_topic: 0.50, entry_feed: 0.35, entry_filter: 0.15, p1_topic: 0.15, p1_feed: 0.12, p1_filter: 0.10, p2_topic: 0.08, p2_feed: 0.06, p2_filter: 0.05 },
}

const DEFAULT_LEVERS = [
  { id: 'popup', name: 'Food Pop-Up', lever_type: 'traffic', active: false, base_uplift: 0.12 },
  { id: 'pgot', name: 'PGoT (Push Personalizado)', lever_type: 'traffic', active: false, base_uplift: 0.08 },
  { id: 'cross_sell', name: 'Cross-sell (Rides/Otros)', lever_type: 'traffic', active: false, base_uplift: 0.05 },
  { id: 'ddc', name: 'DDC Free (Free Delivery)', lever_type: 'conversion', active: false, base_uplift: 0.08 },
  { id: 'coupon', name: 'Cupón de Descuento', lever_type: 'conversion', active: false, base_uplift: 0.12 },
  { id: 'bxsy', name: 'BxSy (2x1 / Bundle)', lever_type: 'conversion', active: false, base_uplift: 0.15 },
]

const DEFAULT_COSTS = {
  A: { pct_w_coupon: 0.30, coupon_p2c: 35, coupon_redeem: 0.60, pct_w_ddc: 0.20, ddc_p2c: 25, pct_w_bxsy: 0.15, bxsy_b2c: 40, bxsy_redeem: 0.80 },
  B: { pct_w_coupon: 0.30, coupon_p2c: 35, coupon_redeem: 0.60, pct_w_ddc: 0.20, ddc_p2c: 25, pct_w_bxsy: 0.15, bxsy_b2c: 40, bxsy_redeem: 0.80 },
  C: { pct_w_coupon: 0.30, coupon_p2c: 35, coupon_redeem: 0.60, pct_w_ddc: 0.20, ddc_p2c: 25, pct_w_bxsy: 0.15, bxsy_b2c: 40, bxsy_redeem: 0.80 },
  D: { pct_w_coupon: 0.30, coupon_p2c: 35, coupon_redeem: 0.60, pct_w_ddc: 0.20, ddc_p2c: 25, pct_w_bxsy: 0.15, bxsy_b2c: 40, bxsy_redeem: 0.80 },
  E: { pct_w_coupon: 0.30, coupon_p2c: 35, coupon_redeem: 0.60, pct_w_ddc: 0.20, ddc_p2c: 25, pct_w_bxsy: 0.15, bxsy_b2c: 40, bxsy_redeem: 0.80 },
  F: { pct_w_coupon: 0.30, coupon_p2c: 35, coupon_redeem: 0.60, pct_w_ddc: 0.20, ddc_p2c: 25, pct_w_bxsy: 0.15, bxsy_b2c: 40, bxsy_redeem: 0.80 },
}

// ── Step 0: Assumptions Pack ─────────────────────────────────────────────────

function StepAssumptionsPack({ config, setConfig, onNext }) {
  const [packs, setPacks] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch('/api/markov/assumptions-packs')
      .then(r => r.json())
      .then(setPacks)
      .catch(() => {})
  }, [])

  const applyPack = async (packId) => {
    try {
      const pack = await fetch(`/api/markov/assumptions-packs/${packId}`).then(r => r.json())
      setConfig(prev => ({
        ...prev,
        profiles: pack.profiles_default?.profiles ?? prev.profiles,
        transition_matrix: pack.transition_matrix_presets?.conservative?.matrix ?? prev.transition_matrix,
        funnel_params: pack.funnel_benchmarks ?? prev.funnel_params,
      }))
      setSelected(packId)
    } catch {
      // silently fail — user can still continue with defaults
    }
  }

  return (
    <div>
      <p className="text-gray-400 text-sm mb-6">
        Elige un pack de supuestos pre-armado para tu mercado o continúa con los defaults. Puedes modificar cualquier valor en los pasos siguientes.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {packs.map(pack => (
          <button key={pack.id} onClick={() => applyPack(pack.id)}
            className={`ds-card p-4 text-left transition-all hover:border-blue-700 ${selected === pack.id ? 'border-blue-500 bg-blue-950/30' : ''}`}>
            <div className="text-sm font-semibold text-gray-200 mb-1">{pack.name}</div>
            <div className="text-xs text-gray-500">{pack.description}</div>
            {selected === pack.id && <div className="mt-2 text-xs text-blue-400 font-mono">✓ Aplicado</div>}
          </button>
        ))}
        <button onClick={onNext}
          className="ds-card p-4 text-left hover:border-gray-600 transition-all">
          <div className="text-sm font-semibold text-gray-400 mb-1">Usar defaults</div>
          <div className="text-xs text-gray-600">Continuar con los valores pre-cargados sin aplicar un pack</div>
        </button>
      </div>

      <button onClick={onNext} className="btn-primary">Continuar →</button>
    </div>
  )
}

// ── Step 1: Config General ───────────────────────────────────────────────────

function StepConfig({ config, setConfig, onNext, onBack }) {
  const COUNTRIES = [
    { code: 'MX', name: '🇲🇽 México', aov: 290, currency: 'MXN' },
    { code: 'BR', name: '🇧🇷 Brasil', aov: 52, currency: 'BRL' },
    { code: 'CO', name: '🇨🇴 Colombia', aov: 32000, currency: 'COP' },
    { code: 'CL', name: '🇨🇱 Chile', aov: 12000, currency: 'CLP' },
    { code: 'AR', name: '🇦🇷 Argentina', aov: 8000, currency: 'ARS' },
    { code: 'PE', name: '🇵🇪 Perú', aov: 42, currency: 'PEN' },
  ]

  const handleCountry = (code) => {
    const c = COUNTRIES.find(x => x.code === code)
    setConfig(prev => ({ ...prev, country: code, aov: c.aov, currency: c.currency }))
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="ds-card p-4">
        <label className="ds-label block mb-2">Nombre del Forecast</label>
        <input type="text" value={config.name}
          onChange={e => setConfig(p => ({ ...p, name: e.target.value }))}
          className="ds-input w-full" placeholder="Mi Forecast Q1 2025" />
      </div>

      <div className="ds-card p-4">
        <label className="ds-label block mb-2">País</label>
        <div className="grid grid-cols-3 gap-2">
          {COUNTRIES.map(c => (
            <button key={c.code} onClick={() => handleCountry(c.code)}
              className={`p-3 rounded-lg text-left text-sm border transition-all ${
                config.country === c.code
                  ? 'border-blue-500 bg-blue-950/40 text-gray-200'
                  : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700'
              }`}>
              <div>{c.name}</div>
              <div className="text-xs font-mono text-gray-500 mt-1">AOV: {c.aov} {c.currency}</div>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600 italic mt-2">Seleccionar país pre-carga el AOV benchmark y la moneda</p>
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
          <label className="ds-label block mb-2">AOV — Ticket Promedio ({config.currency})</label>
          <input type="number" value={config.aov}
            onChange={e => setConfig(p => ({ ...p, aov: Number(e.target.value) }))}
            className="ds-input w-full" />
          <p className="text-xs text-gray-600 italic mt-2">Valor promedio de cada orden en {config.currency}. Se usa para calcular GMV y Revenue.</p>
        </div>
        <div className="ds-card p-4">
          <label className="ds-label block mb-2">Take Rate (%)</label>
          <input type="number" step="0.01" min="0" max="1" value={config.take_rate}
            onChange={e => setConfig(p => ({ ...p, take_rate: Number(e.target.value) }))}
            className="ds-input w-full" />
          <p className="text-xs text-gray-600 italic mt-2">% del GMV que retiene la plataforma. Típico: 15-30%.</p>
        </div>
      </div>

      <div className="ds-card p-4">
        <div className="flex justify-between mb-2">
          <label className="ds-label">Factor de Overlap entre Levers</label>
          <span className="text-blue-400 font-mono">{(config.overlap_factor * 100).toFixed(0)}%</span>
        </div>
        <input type="range" min={0} max={0.5} step={0.01} value={config.overlap_factor}
          onChange={e => setConfig(p => ({ ...p, overlap_factor: Number(e.target.value) }))}
          className="w-full accent-blue-500" />
        <p className="text-xs text-gray-600 italic mt-2">
          Cuando múltiples levers están activos, sus efectos se superponen y no son perfectamente aditivos. 0% = aditivo puro. Default: 15%.
        </p>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary">← Atrás</button>
        <button onClick={onNext} className="btn-primary">Continuar →</button>
      </div>
    </div>
  )
}

// ── Step 2: User Base & Transition Matrix ────────────────────────────────────

function StepUserMatrix({ config, setConfig, onNext, onBack }) {
  const profiles = config.profiles
  const matrix = config.transition_matrix

  const updateCell = (i, j, val) => {
    const newMatrix = matrix.map(row => [...row])
    newMatrix[i][j] = Math.max(0, Math.min(1, Number(val) || 0))
    setConfig(p => ({ ...p, transition_matrix: newMatrix }))
  }

  const rowSum = (i) => (matrix[i] || []).reduce((a, b) => a + b, 0)

  const PRESETS = {
    conservative: [
      [0.00, 0.70, 0.10, 0.15, 0.05, 0.00],
      [0.00, 0.00, 0.10, 0.60, 0.30, 0.00],
      [0.05, 0.00, 0.60, 0.25, 0.05, 0.05],
      [0.00, 0.00, 0.15, 0.65, 0.15, 0.05],
      [0.00, 0.00, 0.05, 0.15, 0.75, 0.05],
      [0.00, 0.00, 0.10, 0.05, 0.00, 0.85],
    ],
    aggressive: [
      [0.00, 0.80, 0.05, 0.12, 0.03, 0.00],
      [0.00, 0.00, 0.05, 0.50, 0.45, 0.00],
      [0.08, 0.00, 0.50, 0.30, 0.10, 0.02],
      [0.00, 0.00, 0.08, 0.60, 0.30, 0.02],
      [0.00, 0.00, 0.02, 0.10, 0.86, 0.02],
      [0.00, 0.00, 0.05, 0.03, 0.00, 0.92],
    ],
  }

  const allRowsValid = profiles.every((_, i) => Math.abs(rowSum(i) - 1.0) <= 0.001)

  return (
    <div className="space-y-6">
      {/* User base section */}
      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">Base de Usuarios — Semana 0</div>
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-4">
            Ingresa cuántos usuarios hay en cada perfil al inicio del forecast. Estos datos deben venir de tu herramienta de analytics o SQL.
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase border-b border-gray-800">
                <th className="text-left pb-2 pr-4 font-medium">ID</th>
                <th className="text-left pb-2 pr-4 font-medium">Nombre del Perfil</th>
                <th className="text-right pb-2 font-medium">Usuarios en Week 0</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p, i) => (
                <tr key={p.id} className="border-b border-gray-800/50">
                  <td className="py-2 pr-4">
                    <span className="ds-badge-blue">{p.id}</span>
                  </td>
                  <td className="py-2 pr-4">
                    <input type="text" value={p.name}
                      onChange={e => {
                        const np = [...profiles]
                        np[i] = { ...np[i], name: e.target.value }
                        setConfig(prev => ({ ...prev, profiles: np }))
                      }}
                      className="bg-transparent border-b border-gray-700 text-gray-200 text-sm focus:outline-none focus:border-blue-500 w-full" />
                  </td>
                  <td className="py-2 text-right">
                    <input type="number" value={p.initial_users}
                      onChange={e => {
                        const np = [...profiles]
                        np[i] = { ...np[i], initial_users: Number(e.target.value) }
                        setConfig(prev => ({ ...prev, profiles: np }))
                      }}
                      className="ds-input w-36 text-right" />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="pt-3 text-gray-400 text-xs font-mono">TOTAL</td>
                <td className="pt-3 text-right text-gray-200 font-mono font-bold">
                  {profiles.reduce((a, p) => a + p.initial_users, 0).toLocaleString('es-MX')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Transition matrix section */}
      <div className="ds-card overflow-hidden">
        <div className="ds-section-header flex items-center justify-between">
          <span>Transition Matrix (Cadena de Markov)</span>
          <div className="flex gap-2">
            <button onClick={() => setConfig(p => ({ ...p, transition_matrix: PRESETS.conservative }))}
              className="text-xs btn-ghost py-0.5">Conservadora</button>
            <button onClick={() => setConfig(p => ({ ...p, transition_matrix: PRESETS.aggressive }))}
              className="text-xs btn-ghost py-0.5">Agresiva</button>
          </div>
        </div>
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-4">
            Cada celda [i,j] = probabilidad de que un usuario del perfil <strong>i</strong> (fila) pase al perfil <strong>j</strong> (columna) cada semana. <strong>Cada fila debe sumar exactamente 1.0.</strong>
          </p>
          <div className="overflow-x-auto">
            <table className="text-xs font-mono">
              <thead>
                <tr>
                  <th className="text-gray-500 pb-2 pr-2 text-left w-24">De \ A →</th>
                  {profiles.map(p => (
                    <th key={p.id} className="pb-2 px-1 text-center text-gray-400 w-16">{p.id}</th>
                  ))}
                  <th className="pb-2 px-2 text-center text-gray-500">Suma</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((fromP, i) => {
                  const sum = rowSum(i)
                  const valid = Math.abs(sum - 1.0) <= 0.001
                  return (
                    <tr key={fromP.id}>
                      <td className="pr-2 py-1">
                        <span className="ds-badge-blue mr-1">{fromP.id}</span>
                      </td>
                      {profiles.map((toP, j) => {
                        const val = matrix[i]?.[j] ?? 0
                        return (
                          <td key={toP.id} className="px-1 py-1">
                            <input
                              type="number" step="0.01" min="0" max="1"
                              value={val}
                              onChange={e => updateCell(i, j, e.target.value)}
                              className="w-14 text-center text-xs rounded border focus:outline-none focus:border-blue-500 py-1"
                              style={{
                                background: val > 0 ? `rgba(59,130,246,${Math.min(val * 1.5, 0.5)})` : '#1f2937',
                                borderColor: val > 0 ? `rgba(59,130,246,${val + 0.2})` : '#374151',
                                color: val > 0.4 ? '#fff' : '#9ca3af',
                              }}
                            />
                          </td>
                        )
                      })}
                      <td className="px-2 py-1 text-center">
                        <span className={`ds-badge ${valid ? 'ds-badge-green' : 'ds-badge-red'}`}>
                          {sum.toFixed(3)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {!allRowsValid && (
            <div className="mt-3 px-3 py-2 bg-red-950/30 border border-red-800 rounded text-xs text-red-400">
              ⚠ Algunas filas no suman 1.0. El modelo requiere que cada fila de la matriz sume exactamente 1.0 (±0.001).
            </div>
          )}
          {allRowsValid && (
            <div className="mt-3 px-3 py-2 bg-emerald-950/30 border border-emerald-800 rounded text-xs text-emerald-400">
              ✓ Matriz válida — todas las filas suman 1.0
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary">← Atrás</button>
        <button onClick={onNext} className="btn-primary" disabled={!allRowsValid}>
          Continuar →
        </button>
      </div>
    </div>
  )
}

// ── Step 3: Traffic Funnel ───────────────────────────────────────────────────

function StepFunnel({ config, setConfig, onNext, onBack }) {
  const profiles = config.profiles
  const funnel = config.funnel_params

  const update = (profileId, field, val) => {
    setConfig(prev => ({
      ...prev,
      funnel_params: {
        ...prev.funnel_params,
        [profileId]: { ...prev.funnel_params[profileId], [field]: Number(val) }
      }
    }))
  }

  const TOOLTIPS = {
    open_app_pct: 'De todos los usuarios del perfil, qué % abre la app al menos una vez esa semana. Frecuentes: 60-80%. Churneados: 10-25%.',
    avg_weekly_sessions: 'Cuántas veces en promedio abre la app cada usuario activo por semana. Alta frecuencia: 2-4 sesiones. Nuevos: 0.8-1.5.',
    see_vertical_pct: 'De las sesiones, qué % resulta en que el usuario ve la sección de food delivery. Impacta directo el tráfico al funnel.',
    entry_topic: 'Qué % del tráfico entra por el Topic Page (página principal de la vertical). Los tres entry points deben sumar ≈ 1.0.',
    p1_topic: 'P1 = Click-through rate. De los que ven la sección, qué % hace click en un restaurante. Típico: 25-45%.',
    p2_topic: 'P2 = Purchase rate. De los que entran a un restaurante, qué % completa la orden. Típico: 10-25%.',
  }

  const COLUMNS = [
    { key: 'open_app_pct', label: '% Open App', group: 'Actividad', tooltip: TOOLTIPS.open_app_pct },
    { key: 'avg_weekly_sessions', label: 'Sessions/sem', group: 'Actividad', tooltip: TOOLTIPS.avg_weekly_sessions },
    { key: 'see_vertical_pct', label: '% Ver Vertical', group: 'Actividad', tooltip: TOOLTIPS.see_vertical_pct },
    { key: 'entry_topic', label: 'Topic', group: 'Entry Share', tooltip: TOOLTIPS.entry_topic },
    { key: 'entry_feed', label: 'Feed', group: 'Entry Share' },
    { key: 'entry_filter', label: 'Filter', group: 'Entry Share' },
    { key: 'p1_topic', label: 'P1 Topic', group: 'Conversión', tooltip: TOOLTIPS.p1_topic },
    { key: 'p1_feed', label: 'P1 Feed', group: 'Conversión' },
    { key: 'p1_filter', label: 'P1 Filter', group: 'Conversión' },
    { key: 'p2_topic', label: 'P2 Topic', group: 'Conversión', tooltip: TOOLTIPS.p2_topic },
    { key: 'p2_feed', label: 'P2 Feed', group: 'Conversión' },
    { key: 'p2_filter', label: 'P2 Filter', group: 'Conversión' },
  ]

  return (
    <div className="space-y-4">
      <div className="ds-card p-4 bg-blue-950/20 border-blue-900/50">
        <p className="text-xs text-blue-300">
          <strong>Cómo funciona el funnel:</strong> Usuarios → % que abren app → sesiones → % que ven la vertical → se distribuyen por entry point → P1 (click) → P2 (compra) → Órdenes.
          Los <strong>entry shares deben sumar ~1.0 por fila</strong>. P1 y P2 son tasas entre 0 y 1.
        </p>
      </div>

      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">Parámetros del Funnel por Perfil</div>
        <div className="overflow-x-auto p-2">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr>
                <th className="text-left px-2 py-1 w-24" />
                <th colSpan={3} className="text-center py-1 text-gray-500 uppercase tracking-widest border-b border-gray-800">Actividad</th>
                <th colSpan={3} className="text-center py-1 text-gray-500 uppercase tracking-widest border-b border-gray-800">Entry Share</th>
                <th colSpan={6} className="text-center py-1 text-gray-500 uppercase tracking-widest border-b border-gray-800">Conversión (P1 × P2)</th>
              </tr>
              <tr className="border-b border-gray-800">
                <th className="text-left px-2 py-1 text-gray-400">Perfil</th>
                {COLUMNS.map(c => (
                  <th key={c.key} className="px-1 py-1 text-gray-400 text-center" title={c.tooltip || ''}>
                    {c.label}{c.tooltip ? ' ?' : ''}
                  </th>
                ))}
                <th className="px-2 py-1 text-gray-400 text-center">Ords/sem</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => {
                const fp = funnel[p.id] || {}
                const entrySum = (fp.entry_topic || 0) + (fp.entry_feed || 0) + (fp.entry_filter || 0)
                const entrySumValid = Math.abs(entrySum - 1.0) <= 0.05

                const users = p.initial_users
                const open = users * (fp.open_app_pct || 0)
                const sess = open * (fp.avg_weekly_sessions || 0)
                const sv = sess * (fp.see_vertical_pct || 0)
                const ords = sv * (
                  (fp.entry_topic || 0) * (fp.p1_topic || 0) * (fp.p2_topic || 0) +
                  (fp.entry_feed || 0) * (fp.p1_feed || 0) * (fp.p2_feed || 0) +
                  (fp.entry_filter || 0) * (fp.p1_filter || 0) * (fp.p2_filter || 0)
                )

                return (
                  <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                    <td className="px-2 py-1.5">
                      <span className="ds-badge-blue">{p.id}</span>
                      <span className="text-gray-500 ml-1 text-[10px]">{p.name.split(' ')[0]}</span>
                    </td>
                    {COLUMNS.map(c => {
                      const val = fp[c.key] ?? 0
                      const isEntryShare = c.key.startsWith('entry_')
                      return (
                        <td key={c.key} className="px-1 py-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={c.key === 'avg_weekly_sessions' ? 10 : 1}
                            value={val}
                            onChange={e => update(p.id, c.key, e.target.value)}
                            className={`w-14 text-center text-xs rounded border py-1 bg-gray-800 focus:outline-none focus:border-blue-500 ${
                              isEntryShare && !entrySumValid ? 'border-amber-700' : 'border-gray-700'
                            } text-gray-200`}
                          />
                        </td>
                      )
                    })}
                    <td className="px-2 py-1 text-center">
                      <span className={`font-bold ${ords > 0 ? 'text-blue-400' : 'text-gray-600'}`}>
                        {Math.round(ords).toLocaleString('es-MX')}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary">← Atrás</button>
        <button onClick={onNext} className="btn-primary">Continuar →</button>
      </div>
    </div>
  )
}

// ── Step 4: Levers ───────────────────────────────────────────────────────────

function StepLevers({ config, setConfig, onNext, onBack }) {
  const levers = config.levers
  const ramp = config.ramp_config
  const acq = config.acquisition

  const updateLever = (id, field, val) => {
    setConfig(prev => ({
      ...prev,
      levers: prev.levers.map(l => l.id === id ? { ...l, [field]: val } : l)
    }))
  }

  const rampData = Array.from({ length: ramp.ramp_weeks + 4 }, (_, w) => {
    let factor
    if (ramp.curve_type === 'linear') factor = Math.min(w / ramp.ramp_weeks, 1.0)
    else if (ramp.curve_type === 'logarithmic') factor = Math.min(Math.log1p(w) / Math.log1p(ramp.ramp_weeks), 1.0)
    else factor = w >= ramp.ramp_weeks ? 1.0 : 0.0
    return { w: `S${w + 1}`, ramp: parseFloat(factor.toFixed(3)) }
  })

  const activeLevers = levers.filter(l => l.active)
  const trafficActive = activeLevers.filter(l => l.lever_type === 'traffic' || l.lever_type === 'both')
  const convActive = activeLevers.filter(l => l.lever_type === 'conversion' || l.lever_type === 'both')

  const computeMultiplier = (leversArr) => {
    if (!leversArr.length) return 1.0
    const raw = leversArr.reduce((s, l) => s + l.base_uplift, 0)
    const overlap = config.overlap_factor * (leversArr.length - 1) / leversArr.length
    return 1.0 + raw * (1 - overlap)
  }

  return (
    <div className="space-y-6">
      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">Levers Activos</div>
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-4">
            Los Traffic Levers aumentan cuánta gente ve la vertical (multiplicador de visibilidad).
            Los Conversion Levers aumentan P1×P2 (multiplicador de conversión). Ambos tipos tienen ramp-up gradual.
          </p>
          <div className="space-y-2">
            {levers.map(l => (
              <div key={l.id} className={`flex items-center gap-4 p-3 rounded-lg border transition-all ${
                l.active ? 'border-blue-800/60 bg-blue-950/20' : 'border-gray-800 bg-gray-900'
              }`}>
                <button onClick={() => updateLever(l.id, 'active', !l.active)}
                  className={`w-10 h-5 rounded-full relative flex-shrink-0 transition-colors ${l.active ? 'bg-blue-600' : 'bg-gray-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${l.active ? 'left-5' : 'left-0.5'}`} />
                </button>

                <input value={l.name} onChange={e => updateLever(l.id, 'name', e.target.value)}
                  className="bg-transparent text-gray-200 text-sm font-medium focus:outline-none border-b border-transparent focus:border-gray-600 flex-1" />

                <span className={`ds-badge text-[10px] flex-shrink-0 ${
                  l.lever_type === 'traffic' ? 'ds-badge-blue' :
                  l.lever_type === 'conversion' ? 'ds-badge-green' : 'ds-badge-amber'
                }`}>
                  {l.lever_type === 'traffic' ? '↑ Tráfico' : l.lever_type === 'conversion' ? '↑ Conversión' : '↑ Ambos'}
                </span>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-500">Uplift:</span>
                  <input type="number" step="0.01" min="0" max="5"
                    value={l.base_uplift}
                    onChange={e => updateLever(l.id, 'base_uplift', Number(e.target.value))}
                    className="ds-input w-20 text-center text-sm" />
                  <span className="text-xs text-gray-500 font-mono">({(l.base_uplift * 100).toFixed(0)}%)</span>
                </div>
              </div>
            ))}
          </div>

          {activeLevers.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-blue-950/30 border border-blue-900/50 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Traffic Multiplier (semana {ramp.ramp_weeks}+)</div>
                <div className="text-xl font-mono font-bold text-blue-400">{computeMultiplier(trafficActive).toFixed(2)}×</div>
                <div className="text-xs text-gray-600">{trafficActive.length} levers activos</div>
              </div>
              <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Conv Multiplier (semana {ramp.ramp_weeks}+)</div>
                <div className="text-xl font-mono font-bold text-emerald-400">{computeMultiplier(convActive).toFixed(2)}×</div>
                <div className="text-xs text-gray-600">{convActive.length} levers activos</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">Ramp-Up de Levers</div>
        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <label className="ds-label">Semanas de Ramp-Up</label>
                <span className="text-blue-400 font-mono">{ramp.ramp_weeks} semanas</span>
              </div>
              <input type="range" min={1} max={20} value={ramp.ramp_weeks}
                onChange={e => setConfig(p => ({ ...p, ramp_config: { ...p.ramp_config, ramp_weeks: Number(e.target.value) } }))}
                className="w-full accent-blue-500" />
              <p className="text-xs text-gray-600 italic mt-1">
                Los levers no alcanzan su efecto pleno inmediatamente. En semana 1 el uplift es parcial; en semana {ramp.ramp_weeks} es completo.
              </p>
            </div>
            <div>
              <label className="ds-label block mb-2">Tipo de Curva</label>
              <div className="flex gap-2">
                {['linear', 'logarithmic', 'step'].map(t => (
                  <button key={t} onClick={() => setConfig(p => ({ ...p, ramp_config: { ...p.ramp_config, curve_type: t } }))}
                    className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${
                      ramp.curve_type === t ? 'bg-blue-600 border-blue-500 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2 font-mono uppercase">Preview de Ramp-Up</p>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={rampData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="w" tick={{ fontSize: 9 }} interval={Math.floor(rampData.length / 5)} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 9 }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                <Area type="monotone" dataKey="ramp" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={`ds-card p-4 transition-all ${acq.active ? 'border-purple-800/60 bg-purple-950/10' : ''}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-sm font-semibold text-gray-200">Acquisition Loop (Flywheel)</div>
            <div className="text-xs text-gray-500 mt-1">
              Las órdenes incrementales generan nuevos usuarios que se re-inyectan en la base. Actívalo si esperas que tus levers atraigan usuarios nuevos.
            </div>
          </div>
          <button onClick={() => setConfig(p => ({ ...p, acquisition: { ...p.acquisition, active: !p.acquisition.active } }))}
            className={`w-12 h-6 rounded-full relative ml-4 flex-shrink-0 transition-colors ${acq.active ? 'bg-purple-600' : 'bg-gray-700'}`}>
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${acq.active ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>
        {acq.active && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            {[
              { key: 'efo_share', label: 'EFO Share', tooltip: '% de órdenes totales que son primeras órdenes del usuario. Típico: 15-25% en mercados maduros, 25-35% en crecimiento.', fmt: v => `${(v * 100).toFixed(0)}%`, min: 0, max: 0.5, step: 0.01 },
              { key: 'alpha', label: 'Alpha (α)', tooltip: 'Qué % de las órdenes incrementales se traduce en usuarios nuevos permanentes. Típico: 30-50%.', fmt: v => `${(v * 100).toFixed(0)}%`, min: 0, max: 1, step: 0.01 },
              { key: 'wow_cap', label: 'WoW Cap', tooltip: 'Límite de crecimiento semana a semana de nuevos usuarios. 50% = no pueden más que doblar cada semana.', fmt: v => `${(v * 100).toFixed(0)}%`, min: 0, max: 2, step: 0.05 },
              { key: 'new_user_orders_ratio', label: 'Órdenes/nuevo user', tooltip: 'Cuántas órdenes hace un nuevo usuario en su primera semana activa.', fmt: v => v.toFixed(1), min: 0.1, max: 5, step: 0.1 },
            ].map(f => (
              <div key={f.key} className="bg-gray-950/50 rounded-lg p-3">
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-gray-400">{f.label}</label>
                  <span className="text-purple-400 font-mono text-sm font-bold">{f.fmt(acq[f.key])}</span>
                </div>
                <input type="range" min={f.min} max={f.max} step={f.step} value={acq[f.key]}
                  onChange={e => setConfig(p => ({ ...p, acquisition: { ...p.acquisition, [f.key]: Number(e.target.value) } }))}
                  className="w-full accent-purple-500" />
                <p className="text-[10px] text-gray-600 italic mt-1">{f.tooltip}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary">← Atrás</button>
        <button onClick={onNext} className="btn-primary">Continuar →</button>
      </div>
    </div>
  )
}

// ── Step 5: Costos & P&L ─────────────────────────────────────────────────────

function StepCosts({ config, setConfig, onRun, onBack, loading, error }) {
  const profiles = config.profiles
  const costs = config.costs

  const COST_DEFAULTS = { pct_w_coupon: 0.30, coupon_p2c: 35, coupon_redeem: 0.60, pct_w_ddc: 0.20, ddc_p2c: 25, pct_w_bxsy: 0.15, bxsy_b2c: 40, bxsy_redeem: 0.80 }

  const update = (profileId, field, val) => {
    setConfig(prev => ({
      ...prev,
      costs: { ...prev.costs, [profileId]: { ...(prev.costs[profileId] || {}), [field]: Number(val) } }
    }))
  }

  useEffect(() => {
    const missing = profiles.filter(p => !costs[p.id])
    if (missing.length) {
      setConfig(prev => ({
        ...prev,
        costs: { ...prev.costs, ...Object.fromEntries(missing.map(p => [p.id, { ...COST_DEFAULTS }])) }
      }))
    }
  }, [profiles])

  const COST_COLS = [
    { key: 'pct_w_coupon', label: '% w/Cupón', tooltip: 'Qué % de los usuarios de este perfil redime cupones' },
    { key: 'coupon_p2c', label: 'Costo Cupón', tooltip: `Costo por cupón redimido (${config.currency})` },
    { key: 'coupon_redeem', label: 'Redención Cupón', tooltip: 'De los que tienen cupón, qué % lo usa' },
    { key: 'pct_w_ddc', label: '% w/DDC', tooltip: 'Qué % de usuarios de este perfil usa el Free Delivery Club' },
    { key: 'ddc_p2c', label: 'Costo DDC', tooltip: `Costo por orden con free delivery (${config.currency})` },
    { key: 'pct_w_bxsy', label: '% w/BxSy', tooltip: 'Qué % de usuarios aprovecha las promos 2x1 o bundle' },
    { key: 'bxsy_b2c', label: 'Costo BxSy', tooltip: `Costo del subsidio BxSy por orden (${config.currency})` },
    { key: 'bxsy_redeem', label: 'Redención BxSy' },
  ]

  return (
    <div className="space-y-6">
      <div className="ds-card p-4 bg-amber-950/20 border-amber-900/50">
        <p className="text-xs text-amber-300">
          Esta pantalla define cuánto cuesta cada tipo de promo por perfil. El modelo usa estos valores para calcular el <strong>Contribution Margin = Net Revenue − Total Spend</strong>. Ajusta los porcentajes según tu mix de promos.
        </p>
      </div>

      <div className="ds-card overflow-hidden">
        <div className="ds-section-header">Costos de Promos por Perfil</div>
        <div className="overflow-x-auto p-2">
          <table className="text-xs font-mono">
            <thead>
              <tr>
                <th className="text-left px-2 py-1 w-20 text-gray-400">Perfil</th>
                <th colSpan={3} className="text-center py-1 text-gray-500 border-b border-gray-800 uppercase tracking-wider">Cupón</th>
                <th colSpan={2} className="text-center py-1 text-gray-500 border-b border-gray-800 uppercase tracking-wider">DDC</th>
                <th colSpan={3} className="text-center py-1 text-gray-500 border-b border-gray-800 uppercase tracking-wider">BxSy</th>
              </tr>
              <tr className="border-b border-gray-800">
                <th className="px-2 py-1" />
                {COST_COLS.map(c => (
                  <th key={c.key} className="px-1 py-1 text-gray-400 text-center" title={c.tooltip}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => {
                const c = costs[p.id] || COST_DEFAULTS
                return (
                  <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                    <td className="px-2 py-1.5">
                      <span className="ds-badge-blue">{p.id}</span>
                    </td>
                    {COST_COLS.map(col => (
                      <td key={col.key} className="px-1 py-1">
                        <input
                          type="number"
                          step={col.key.includes('pct') || col.key.includes('redeem') ? 0.05 : 1}
                          min={0}
                          max={col.key.includes('pct') || col.key.includes('redeem') ? 1 : 999}
                          value={c[col.key] ?? COST_DEFAULTS[col.key]}
                          onChange={e => update(p.id, col.key, e.target.value)}
                          className="w-16 text-center text-xs rounded border border-gray-700 py-1 bg-gray-800 text-gray-200 focus:outline-none focus:border-blue-500"
                        />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div className="ds-card p-4 bg-red-950/30 border-red-800 text-red-400 text-sm font-mono">
          ⚠ {error}
        </div>
      )}

      <div className="flex gap-3 items-center">
        <button onClick={onBack} className="btn-secondary">← Atrás</button>
        <button onClick={onRun} disabled={loading}
          className="btn-primary px-8 flex items-center gap-2">
          {loading ? (
            <><span className="animate-spin inline-block">◌</span> Calculando...</>
          ) : (
            <>Calcular Forecast ▶</>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Step 6: Results ──────────────────────────────────────────────────────────

function MarkovResults({ result, config, onBack }) {
  const [tab, setTab] = useState('weekly')
  const { weeks, summary } = result

  const profileColors = { A: '#3b82f6', B: '#8b5cf6', C: '#f87171', D: '#f59e0b', E: '#34d399', F: '#6b7280' }

  const weeklyData = weeks.map(w => ({
    w: `S${w.week}`,
    total: Math.round(w.orders_total),
    base: Math.round(w.orders_base),
    incremental: Math.round(w.orders_incremental),
    contribution_pct: parseFloat((w.contribution_pct * 100).toFixed(1)),
    traffic_mult: parseFloat(w.traffic_mult.toFixed(3)),
    conv_mult: parseFloat(w.conv_mult.toFixed(3)),
  }))

  const profileData = weeks.map(w => {
    const row = { w: `S${w.week}` }
    Object.entries(w.profile_orders || {}).forEach(([pid, v]) => { row[pid] = Math.round(v) })
    return row
  })

  const userEvolutionData = weeks.map(w => {
    const row = { w: `S${w.week}` }
    Object.entries(w.profile_users || {}).forEach(([pid, v]) => { row[pid] = Math.round(v) })
    return row
  })

  const pylData = weeks.map(w => ({
    w: `S${w.week}`,
    net_revenue: Math.round(w.net_revenue),
    coupon: Math.round(w.coupon_spend),
    ddc: Math.round(w.ddc_spend),
    bxsy: Math.round(w.bxsy_spend),
    contribution: Math.round(w.contribution_dollar),
  }))

  return (
    <div>
      {/* KPI summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {[
          { label: 'Total Órdenes', value: Math.round(summary.total_orders).toLocaleString('es-MX'), color: 'text-gray-100' },
          { label: 'Incrementales', value: Math.round(summary.total_incremental).toLocaleString('es-MX'), color: 'text-blue-400' },
          { label: 'Revenue Neto', value: `${config.currency} ${Math.round(summary.total_revenue).toLocaleString('es-MX')}`, color: 'text-gray-100' },
          { label: 'Total Spend', value: `${config.currency} ${Math.round(summary.total_spend).toLocaleString('es-MX')}`, color: 'text-red-400' },
          { label: 'Contribution $', value: `${config.currency} ${Math.round(summary.total_contribution).toLocaleString('es-MX')}`, color: summary.total_contribution >= 0 ? 'text-emerald-400' : 'text-red-400' },
          { label: 'Contribution %', value: `${(summary.avg_contribution_pct * 100).toFixed(1)}%`, color: summary.avg_contribution_pct >= 0.05 ? 'text-emerald-400' : 'text-amber-400' },
          { label: 'Cost/Order', value: `${config.currency} ${summary.avg_cost_per_order.toFixed(1)}`, color: 'text-gray-300' },
        ].map(k => (
          <div key={k.label} className="metric-card">
            <div className="metric-label">{k.label}</div>
            <div className={`metric-value text-base ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-4 border-b border-gray-800">
        {[
          { id: 'weekly', label: 'Evolución Semanal' },
          { id: 'profiles', label: 'Por Perfil' },
          { id: 'usuarios', label: 'Usuarios' },
          { id: 'pyl', label: 'P&L' },
          { id: 'multipliers', label: 'Levers' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`ds-tab ${tab === t.id ? 'ds-tab-active' : ''}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Weekly Evolution */}
      {tab === 'weekly' && (
        <div className="space-y-4">
          <div className="ds-card p-4">
            <p className="text-xs text-gray-400 font-mono uppercase mb-3">Órdenes Semanales — Base vs Total vs Incremental</p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="w" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v, n) => [v.toLocaleString('es-MX'), n]} contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="base" name="Base" stroke="#6b7280" fill="#6b7280" fillOpacity={0.2} strokeWidth={2} dot={false} isAnimationActive={false} />
                <Area type="monotone" dataKey="total" name="Total Eff" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2.5} dot={false} isAnimationActive={false} />
                <Area type="monotone" dataKey="incremental" name="Incremental" stroke="#34d399" fill="#34d399" fillOpacity={0.3} strokeWidth={2} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="ds-card overflow-hidden">
            <div className="ds-section-header">Detalle Semanal</div>
            <div className="overflow-x-auto">
              <table className="ds-table w-full text-xs">
                <thead>
                  <tr>
                    <th>Semana</th>
                    <th>Órdenes Total</th>
                    <th>Base</th>
                    <th>Incremental</th>
                    <th>GMV</th>
                    <th>Net Revenue</th>
                    <th>Total Spend</th>
                    <th>Contribution $</th>
                    <th>Contribution %</th>
                    <th>Cost/Order</th>
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((w, i) => (
                    <tr key={w.week} className={i % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900/30'}>
                      <td><span className="ds-badge-gray font-mono">S{w.week}</span></td>
                      <td className="font-semibold">{Math.round(w.orders_total).toLocaleString('es-MX')}</td>
                      <td className="text-gray-500">{Math.round(w.orders_base).toLocaleString('es-MX')}</td>
                      <td className="text-blue-400">+{Math.round(w.orders_incremental).toLocaleString('es-MX')}</td>
                      <td>{Math.round(w.gmv).toLocaleString('es-MX')}</td>
                      <td>{Math.round(w.net_revenue).toLocaleString('es-MX')}</td>
                      <td className="text-red-400">{Math.round(w.total_spend).toLocaleString('es-MX')}</td>
                      <td className={w.contribution_dollar >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {Math.round(w.contribution_dollar).toLocaleString('es-MX')}
                      </td>
                      <td className={w.contribution_pct >= 0.05 ? 'text-emerald-400' : 'text-amber-400'}>
                        {(w.contribution_pct * 100).toFixed(1)}%
                      </td>
                      <td>{w.cost_per_order.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: By Profile orders */}
      {tab === 'profiles' && (
        <div className="ds-card p-4">
          <p className="text-xs text-gray-400 font-mono uppercase mb-3">Órdenes por Perfil — Área Apilada</p>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={profileData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="w" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {config.profiles.map(p => (
                <Area key={p.id} type="monotone" dataKey={p.id} name={p.name} stackId="1"
                  stroke={profileColors[p.id] || '#6b7280'} fill={profileColors[p.id] || '#6b7280'}
                  fillOpacity={0.7} strokeWidth={1} dot={false} isAnimationActive={false} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tab: User Evolution */}
      {tab === 'usuarios' && (
        <div className="ds-card p-4">
          <p className="text-xs text-gray-400 font-mono uppercase mb-3">Evolución de Usuarios por Perfil</p>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={userEvolutionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="w" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {config.profiles.map(p => (
                <Area key={p.id} type="monotone" dataKey={p.id} name={p.name} stackId="1"
                  stroke={profileColors[p.id] || '#6b7280'} fill={profileColors[p.id] || '#6b7280'}
                  fillOpacity={0.7} strokeWidth={1} dot={false} isAnimationActive={false} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tab: P&L */}
      {tab === 'pyl' && (
        <div className="ds-card p-4">
          <p className="text-xs text-gray-400 font-mono uppercase mb-3">P&L Semanal — Revenue vs Spend vs Contribution</p>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={pylData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="w" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="net_revenue" name="Net Revenue" stackId="rev" fill="#3b82f6" fillOpacity={0.8} isAnimationActive={false} />
              <Bar dataKey="coupon" name="Coupon Spend" stackId="cost" fill="#f87171" fillOpacity={0.8} isAnimationActive={false} />
              <Bar dataKey="ddc" name="DDC Spend" stackId="cost" fill="#f59e0b" fillOpacity={0.8} isAnimationActive={false} />
              <Bar dataKey="bxsy" name="BxSy Spend" stackId="cost" fill="#ef4444" fillOpacity={0.8} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tab: Multipliers */}
      {tab === 'multipliers' && (
        <div className="ds-card p-4">
          <p className="text-xs text-gray-400 font-mono uppercase mb-3">Evolución de Multiplicadores (Ramp-Up)</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="w" tick={{ fontSize: 10 }} />
              <YAxis domain={[0.9, 'auto']} tick={{ fontSize: 10 }} tickFormatter={v => `${v.toFixed(2)}×`} />
              <Tooltip formatter={(v, n) => [`${v}×`, n]} contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <ReferenceLine y={1} stroke="#4b5563" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="traffic_mult" name="Traffic Mult" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="conv_mult" name="Conv Mult" stroke="#34d399" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <button onClick={onBack} className="btn-secondary">← Editar Inputs</button>
        <button onClick={() => {
          const json = JSON.stringify({ config, result }, null, 2)
          const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
          const a = document.createElement('a')
          a.href = url
          a.download = `markov_${config.name.replace(/ /g, '_')}.json`
          a.click()
          URL.revokeObjectURL(url)
        }} className="btn-secondary">
          ↓ Exportar JSON
        </button>
        <Link to="/new" className="btn-primary">+ Nuevo Forecast</Link>
      </div>
    </div>
  )
}

// ── MarkovWizard (main component) ────────────────────────────────────────────

export default function MarkovWizard() {
  const [step, setStep] = useState(0)
  const [config, setConfig] = useState({
    name: 'Mi Forecast Markov',
    country: 'MX',
    horizon_weeks: 12,
    aov: 290,
    take_rate: 0.22,
    currency: 'MXN',
    overlap_factor: 0.15,
    profiles: DEFAULT_PROFILES,
    transition_matrix: DEFAULT_MATRIX,
    funnel_params: DEFAULT_FUNNEL,
    levers: DEFAULT_LEVERS,
    ramp_config: { ramp_weeks: 10, curve_type: 'linear' },
    acquisition: {
      active: false,
      efo_share: 0.20,
      alpha: 0.40,
      new_user_orders_ratio: 1.0,
      wow_cap: 0.50,
      profile_split: { A: 0.70, B: 0.30 },
    },
    costs: DEFAULT_COSTS,
    use_seasonality: false,
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const runForecast = async () => {
    setLoading(true)
    setError(null)
    try {
      const body = {
        name: config.name,
        country: config.country,
        horizon_weeks: config.horizon_weeks,
        aov: config.aov,
        take_rate: config.take_rate,
        currency: config.currency,
        overlap_factor: config.overlap_factor,
        profiles: config.profiles,
        transition_matrix: {
          profile_ids: config.profiles.map(p => p.id),
          matrix: config.transition_matrix,
        },
        funnel_params: config.profiles.map(p => ({
          profile_id: p.id,
          ...config.funnel_params[p.id],
        })),
        levers: config.levers,
        ramp_config: config.ramp_config,
        acquisition: config.acquisition,
        costs: config.profiles.map(p => ({
          profile_id: p.id,
          ...config.costs[p.id],
        })),
      }
      const resp = await fetch('/api/markov/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!resp.ok) {
        const err = await resp.json()
        throw new Error(err.detail || 'Error calculando forecast')
      }
      const data = await resp.json()
      setResult(data)
      setStep(6)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const canNavigateTo = (i) => i < step || result != null

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-900/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-gray-500 hover:text-gray-300 text-sm">← Inicio</Link>
            <span className="text-gray-700">/</span>
            <span className="text-sm font-mono text-gray-200">Modelo Markov v3</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {STEPS.map((s, i) => (
              <button key={s.id}
                onClick={() => canNavigateTo(i) ? setStep(i) : null}
                className={`px-2 py-1 text-xs font-mono rounded transition-all ${
                  step === i ? 'bg-blue-600 text-white' :
                  i < step ? 'bg-gray-800 text-gray-400 hover:text-gray-200 cursor-pointer' :
                  'text-gray-700 cursor-default'
                }`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-xl font-semibold text-gray-100 mb-1">{STEPS[step].title}</h1>
        <div className="mb-6">
          <div className="flex gap-1 mt-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className={`h-1 flex-1 rounded-full transition-all ${
                i < step ? 'bg-blue-500' :
                i === step ? 'bg-blue-700' :
                'bg-gray-800'
              }`} />
            ))}
          </div>
        </div>

        {step === 0 && (
          <StepAssumptionsPack config={config} setConfig={setConfig} onNext={() => setStep(1)} />
        )}
        {step === 1 && (
          <StepConfig config={config} setConfig={setConfig} onNext={() => setStep(2)} onBack={() => setStep(0)} />
        )}
        {step === 2 && (
          <StepUserMatrix config={config} setConfig={setConfig} onNext={() => setStep(3)} onBack={() => setStep(1)} />
        )}
        {step === 3 && (
          <StepFunnel config={config} setConfig={setConfig} onNext={() => setStep(4)} onBack={() => setStep(2)} />
        )}
        {step === 4 && (
          <StepLevers config={config} setConfig={setConfig} onNext={() => setStep(5)} onBack={() => setStep(3)} />
        )}
        {step === 5 && (
          <StepCosts config={config} setConfig={setConfig} onRun={runForecast} onBack={() => setStep(4)} loading={loading} error={error} />
        )}
        {step === 6 && result && (
          <MarkovResults result={result} config={config} onBack={() => setStep(5)} />
        )}
      </main>
    </div>
  )
}
