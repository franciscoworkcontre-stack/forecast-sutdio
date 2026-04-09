/**
 * ResultsDashboard — comprehensive results visualization.
 * Charts: waterfall, time series, cohort heatmap, tornado, ROI timeline.
 * Table: full weekly detail, sortable.
 */
import React, { useState, useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell, ReferenceLine, AreaChart, Area
} from 'recharts'
import { fmtOrders, fmtMoney, fmtPct, fmtWow, fmtWeek, deltaClass, formatDate } from '../utils/formatters'

// ── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, delta, deltaLabel, positive = true }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {sub && <div className="text-xs text-gray-500 font-mono">{sub}</div>}
      {delta != null && (
        <div className={`text-xs font-mono ${positive ? 'text-emerald-400' : 'text-amber-400'}`}>
          {delta} {deltaLabel}
        </div>
      )}
    </div>
  )
}

// ── Custom Tooltip ───────────────────────────────────────────────────────────

function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl text-xs">
      <p className="text-gray-400 mb-2 font-mono">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-400">{p.name}:</span>
          <span className="font-mono text-gray-200">{typeof p.value === 'number' ? p.value.toLocaleString('en-US', { maximumFractionDigits: 0 }) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Waterfall Chart ──────────────────────────────────────────────────────────

function WaterfallChart({ weeks }) {
  const data = weeks.map(w => ({
    name: `W${w.week + 1}`,
    base: Math.round(w.base_orders),
    promo: Math.round(w.promo_orders),
    acquisition: Math.round(w.acquisition_orders),
    cannibalization: Math.round(w.cannibalization),
    total: Math.round(w.total_orders),
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} barSize={8}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} />
        <YAxis tickFormatter={v => fmtOrders(v)} tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
        <Tooltip content={<DarkTooltip />} />
        <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
        <Bar dataKey="base" name="Base" stackId="a" fill="#1e3a5f" />
        <Bar dataKey="promo" name="Promo" stackId="a" fill="#059669" />
        <Bar dataKey="acquisition" name="Acquisition" stackId="a" fill="#d97706" />
        <Bar dataKey="cannibalization" name="Cannibalization" stackId="a" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Time Series Chart ────────────────────────────────────────────────────────

function TimeSeriesChart({ weeks, scenarios }) {
  const data = weeks.map((w, i) => {
    const row = {
      name: `W${w.week + 1}`,
      total: Math.round(w.total_orders),
    }
    if (scenarios) {
      row.upside = Math.round(scenarios.upside[i]?.total_orders || 0)
      row.downside = Math.round(scenarios.downside[i]?.total_orders || 0)
    }
    return row
  })

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} />
        <YAxis tickFormatter={v => fmtOrders(v)} tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
        <Tooltip content={<DarkTooltip />} />
        <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
        {scenarios && (
          <>
            <Line type="monotone" dataKey="upside" name="Upside" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
            <Line type="monotone" dataKey="downside" name="Downside" stroke="#f87171" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
          </>
        )}
        <Area type="monotone" dataKey="total" name="Base" stroke="#3b82f6" strokeWidth={2} fill="url(#totalGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ── Cohort Heatmap ───────────────────────────────────────────────────────────

function CohortHeatmap({ cohortMatrix, horizon }) {
  if (!cohortMatrix || cohortMatrix.length === 0) return null

  // Find max value for color scaling
  const allVals = cohortMatrix.flat().filter(v => v > 0)
  const maxVal = Math.max(...allVals, 1)

  const getColor = (value) => {
    if (value <= 0) return 'transparent'
    const intensity = value / maxVal
    const r = Math.round(31 + intensity * (30 - 31))
    const g = Math.round(78 + intensity * (58 - 78))
    const b = Math.round(121 + intensity * (200 - 121))
    return `rgba(${r},${g},${b},${0.3 + intensity * 0.7})`
  }

  const displayCohorts = cohortMatrix.slice(0, Math.min(cohortMatrix.length, 20))
  const displayWeeks = Math.min(horizon, 20)

  return (
    <div className="overflow-auto">
      <table className="text-[10px] font-mono border-collapse">
        <thead>
          <tr>
            <th className="px-2 py-1 text-gray-500 text-right sticky left-0 bg-gray-950">Cohort</th>
            {Array.from({ length: displayWeeks }, (_, w) => (
              <th key={w} className="px-1 py-1 text-gray-500 text-center min-w-[40px]">W{w + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayCohorts.map((row, c) => (
            <tr key={c}>
              <td className="px-2 py-0.5 text-gray-500 text-right sticky left-0 bg-gray-950">W{c + 1}</td>
              {row.slice(0, displayWeeks).map((val, w) => (
                <td
                  key={w}
                  className="px-1 py-0.5 text-center"
                  style={{ background: getColor(val) }}
                  title={`Cohort W${c+1}, Week W${w+1}: ${Math.round(val)} orders`}
                >
                  {val > 0 ? Math.round(val) : ''}
                </td>
              ))}
            </tr>
          ))}
          {/* Total row */}
          <tr className="border-t border-gray-700">
            <td className="px-2 py-1 text-gray-400 font-bold sticky left-0 bg-gray-950">Total</td>
            {Array.from({ length: displayWeeks }, (_, w) => {
              const total = displayCohorts.reduce((sum, row) => sum + (row[w] || 0), 0)
              return (
                <td key={w} className="px-1 py-1 text-center text-blue-400 font-bold"
                    style={{ background: getColor(total) }}>
                  {Math.round(total)}
                </td>
              )
            })}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// ── Tornado Chart ────────────────────────────────────────────────────────────

function TornadoChart({ tornado }) {
  if (!tornado || tornado.length === 0) return null

  const maxVal = Math.max(...tornado.map(t => Math.max(Math.abs(t.upside_delta), Math.abs(t.downside_delta))))

  return (
    <div className="space-y-1.5">
      {tornado.slice(0, 8).map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="text-gray-500 w-40 text-right truncate font-mono">{entry.variable}</span>
          <div className="flex-1 flex items-center gap-0.5">
            {/* Downside bar (left) */}
            <div className="flex justify-end" style={{ width: '50%' }}>
              <div
                className="h-5 bg-red-500/60 rounded-l flex items-center justify-end pr-1"
                style={{ width: `${Math.abs(entry.downside_delta) / maxVal * 100}%`, minWidth: '2px' }}
              >
                <span className="text-red-300 text-[10px] font-mono whitespace-nowrap">
                  {fmtOrders(entry.downside_delta)}
                </span>
              </div>
            </div>
            {/* Upside bar (right) */}
            <div className="flex" style={{ width: '50%' }}>
              <div
                className="h-5 bg-emerald-500/60 rounded-r flex items-center pl-1"
                style={{ width: `${entry.upside_delta / maxVal * 100}%`, minWidth: '2px' }}
              >
                <span className="text-emerald-300 text-[10px] font-mono whitespace-nowrap">
                  +{fmtOrders(entry.upside_delta)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
      <div className="flex justify-between text-[10px] text-gray-600 font-mono mt-2 px-40">
        <span>← Downside</span>
        <span>Upside →</span>
      </div>
    </div>
  )
}

// ── ROI Timeline ─────────────────────────────────────────────────────────────

function ROITimeline({ unitEconomics }) {
  if (!unitEconomics || unitEconomics.length === 0) return null

  let cumCM = 0
  const data = unitEconomics.map(ue => {
    cumCM += ue.contribution_margin
    return {
      name: `W${ue.week + 1}`,
      cm: Math.round(ue.contribution_margin),
      cumulative: Math.round(cumCM),
      cm_pct: (ue.contribution_margin_pct * 100).toFixed(1),
    }
  })

  const breakEvenWeek = data.findIndex(d => d.cumulative >= 0)

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="cmGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} />
        <YAxis tickFormatter={v => fmtMoney(v)} tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
        <Tooltip content={<DarkTooltip />} />
        <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="4 2" />
        {breakEvenWeek >= 0 && (
          <ReferenceLine x={data[breakEvenWeek]?.name} stroke="#34d399" strokeDasharray="4 2" label={{ value: 'Break-even', fill: '#34d399', fontSize: 10 }} />
        )}
        <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
        <Area type="monotone" dataKey="cumulative" name="Cumulative CM" stroke="#10b981" strokeWidth={2} fill="url(#cmGrad)" dot={false} />
        <Bar dataKey="cm" name="Weekly CM" fill="#1d4ed8" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ── Weekly Data Table ────────────────────────────────────────────────────────

function WeeklyTable({ weeks, unitEconomics }) {
  const [sortBy, setSortBy] = useState('week')
  const [sortDir, setSortDir] = useState('asc')
  const [showUE, setShowUE] = useState(false)

  const sorted = useMemo(() => {
    return [...weeks].sort((a, b) => {
      const va = a[sortBy] ?? 0
      const vb = b[sortBy] ?? 0
      return sortDir === 'asc' ? va - vb : vb - va
    })
  }, [weeks, sortBy, sortDir])

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  const SortHeader = ({ col, children }) => (
    <th
      className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider
                 bg-gray-900 border-b border-gray-800 sticky top-0 cursor-pointer hover:text-gray-200
                 select-none whitespace-nowrap"
      onClick={() => handleSort(col)}
    >
      {children} {sortBy === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </th>
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{weeks.length} weeks</span>
        {unitEconomics && (
          <button type="button" onClick={() => setShowUE(u => !u)} className="btn-ghost text-xs">
            {showUE ? 'Hide Unit Economics' : 'Show Unit Economics'}
          </button>
        )}
      </div>
      <div className="overflow-auto max-h-96 rounded border border-gray-800">
        <table className="ds-table w-full text-xs">
          <thead>
            <tr>
              <SortHeader col="week">Week</SortHeader>
              <SortHeader col="base_orders">Base</SortHeader>
              <SortHeader col="promo_orders">Promo</SortHeader>
              <SortHeader col="acquisition_orders">Acq</SortHeader>
              <SortHeader col="cannibalization">Cann.</SortHeader>
              <SortHeader col="seasonal_factor">S.Factor</SortHeader>
              <SortHeader col="total_orders">Total</SortHeader>
              <SortHeader col="wow_pct">WoW %</SortHeader>
              {showUE && unitEconomics && (
                <>
                  <SortHeader col="gross_revenue">Gross Rev</SortHeader>
                  <SortHeader col="contribution_margin">CM</SortHeader>
                  <SortHeader col="contribution_margin_pct">CM %</SortHeader>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.map((w, i) => {
              const ue = showUE && unitEconomics ? unitEconomics[w.week] : null
              return (
                <tr key={w.week} className={i % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900/30'}>
                  <td className="text-blue-400 font-mono">W{w.week + 1}</td>
                  <td>{fmtOrders(w.base_orders)}</td>
                  <td className={w.promo_orders > 0 ? 'text-emerald-400' : ''}>{fmtOrders(w.promo_orders)}</td>
                  <td className={w.acquisition_orders > 0 ? 'text-amber-400' : ''}>{fmtOrders(w.acquisition_orders)}</td>
                  <td className={w.cannibalization > 0 ? 'text-red-400' : ''}>{fmtOrders(w.cannibalization)}</td>
                  <td className="text-blue-300">{w.seasonal_factor?.toFixed(3) ?? '—'}</td>
                  <td className="text-gray-100 font-semibold">{fmtOrders(w.total_orders)}</td>
                  <td className={w.wow_pct != null ? deltaClass(w.wow_pct) : 'text-gray-600'}>
                    {w.wow_pct != null ? fmtWow(w.wow_pct) : '—'}
                  </td>
                  {showUE && ue && (
                    <>
                      <td className="text-emerald-400">{fmtMoney(ue.gross_revenue)}</td>
                      <td className={ue.contribution_margin >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {fmtMoney(ue.contribution_margin)}
                      </td>
                      <td className={ue.contribution_margin_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {fmtPct(ue.contribution_margin_pct)}
                      </td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main ResultsDashboard ────────────────────────────────────────────────────

export default function ResultsDashboard({ forecast, inputs, onExportExcel, onExportJSON, isLoading }) {
  const [activeSection, setActiveSection] = useState('overview')

  if (!forecast) return null

  const { weeks, summary, unit_economics_by_week, scenarios, cohort_matrix, sensitivity_tornado } = forecast
  const activeModels = inputs?.models_active || []

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'timeseries', label: 'Time Series' },
    { id: 'waterfall', label: 'Waterfall' },
    ...(activeModels.includes('A2') && cohort_matrix ? [{ id: 'cohort', label: 'Cohort Matrix' }] : []),
    ...(activeModels.includes('B2') && scenarios ? [{ id: 'scenarios', label: 'Scenarios' }] : []),
    ...(activeModels.includes('B1') && unit_economics_by_week ? [{ id: 'uniteconomics', label: 'Unit Economics' }] : []),
    { id: 'table', label: 'Data Table' },
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-200 font-mono">{forecast.name}</h2>
        <div className="flex gap-2">
          <button onClick={onExportJSON} disabled={isLoading} className="btn-secondary text-xs">
            Export JSON
          </button>
          <button onClick={onExportExcel} disabled={isLoading} className="btn-primary text-xs">
            Export Excel
          </button>
        </div>
      </div>

      {/* Metric bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <MetricCard
          label="Total Orders"
          value={fmtOrders(summary.total_orders)}
          sub={`${fmtOrders(summary.avg_weekly_orders)}/wk avg`}
        />
        <MetricCard
          label="Peak Week"
          value={`W${summary.peak_week + 1}`}
          sub={fmtOrders(summary.peak_orders)}
        />
        <MetricCard
          label="Promo Volume"
          value={fmtOrders(summary.promo_total_orders)}
          sub="incremental orders"
          positive={true}
        />
        <MetricCard
          label="Promo Cost"
          value={fmtMoney(summary.promo_total_cost)}
          sub="platform spend"
          positive={false}
        />
        <MetricCard
          label="Promo ROI"
          value={summary.promo_roi != null ? fmtPct(summary.promo_roi) : 'N/A'}
          sub={summary.payback_weeks ? `${summary.payback_weeks}w payback` : ''}
          positive={summary.promo_roi > 0}
        />
        <MetricCard
          label="Weekly CAGR"
          value={fmtPct(summary.cagr_weekly)}
          sub="compounded"
          positive={summary.cagr_weekly >= 0}
        />
      </div>

      {/* Section nav */}
      <div className="flex border-b border-gray-800 overflow-x-auto">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`ds-tab whitespace-nowrap ${activeSection === s.id ? 'ds-tab-active' : ''}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Section content */}
      <div className="animate-fade-in">
        {activeSection === 'overview' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="ds-card p-4">
              <div className="ds-section-header -mx-4 -mt-4 mb-4">Total Orders by Week</div>
              <TimeSeriesChart weeks={weeks} scenarios={scenarios} />
            </div>
            <div className="ds-card p-4">
              <div className="ds-section-header -mx-4 -mt-4 mb-4">Order Composition</div>
              <WaterfallChart weeks={weeks.slice(0, 16)} />
            </div>
          </div>
        )}

        {activeSection === 'timeseries' && (
          <div className="ds-card p-4">
            <div className="ds-section-header -mx-4 -mt-4 mb-4">Weekly Order Forecast{scenarios ? ' (with Scenarios)' : ''}</div>
            <TimeSeriesChart weeks={weeks} scenarios={scenarios} />
            {scenarios && (
              <div className="mt-4 grid grid-cols-3 gap-4 text-xs text-gray-500">
                <div>
                  <span className="inline-block w-3 h-0.5 bg-emerald-400 mr-1 align-middle" />
                  Upside: {fmtOrders(scenarios.upside.reduce((s, w) => s + w.total_orders, 0))} total
                </div>
                <div>
                  <span className="inline-block w-3 h-0.5 bg-blue-400 mr-1 align-middle" />
                  Base: {fmtOrders(summary.total_orders)} total
                </div>
                <div>
                  <span className="inline-block w-3 h-0.5 bg-red-400 mr-1 align-middle" />
                  Downside: {fmtOrders(scenarios.downside.reduce((s, w) => s + w.total_orders, 0))} total
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'waterfall' && (
          <div className="ds-card p-4">
            <div className="ds-section-header -mx-4 -mt-4 mb-4">Order Waterfall — Base + Promo + Acquisition - Cannibalization</div>
            <WaterfallChart weeks={weeks} />
          </div>
        )}

        {activeSection === 'cohort' && cohort_matrix && (
          <div className="ds-card p-4">
            <div className="ds-section-header -mx-4 -mt-4 mb-4">
              Cohort Matrix — orders[cohort][week] heat map
            </div>
            <div className="text-xs text-gray-500 mb-3 font-mono">
              Rows = restaurant cohorts (by join week), Columns = forecast weeks.
              Color intensity = order volume (white → navy).
            </div>
            <CohortHeatmap cohortMatrix={cohort_matrix} horizon={weeks.length} />
          </div>
        )}

        {activeSection === 'scenarios' && scenarios && (
          <div className="space-y-4">
            <div className="ds-card p-4">
              <div className="ds-section-header -mx-4 -mt-4 mb-4">Scenario Bands</div>
              <TimeSeriesChart weeks={weeks} scenarios={scenarios} />
            </div>
            {sensitivity_tornado && sensitivity_tornado.length > 0 && (
              <div className="ds-card p-4">
                <div className="ds-section-header -mx-4 -mt-4 mb-4">
                  Sensitivity Tornado (±{((inputs?.scenarios_config?.sensitivity_range_pct || 0.20) * 100).toFixed(0)}% per variable)
                </div>
                <TornadoChart tornado={sensitivity_tornado} />
              </div>
            )}
          </div>
        )}

        {activeSection === 'uniteconomics' && unit_economics_by_week && (
          <div className="space-y-4">
            <div className="ds-card p-4">
              <div className="ds-section-header -mx-4 -mt-4 mb-4">Cumulative Contribution Margin</div>
              <ROITimeline unitEconomics={unit_economics_by_week} />
            </div>
            <div className="ds-card p-4">
              <div className="ds-section-header -mx-4 -mt-4 mb-4">Unit Economics by Week</div>
              <div className="overflow-auto max-h-96 rounded border border-gray-800">
                <table className="ds-table w-full text-xs">
                  <thead>
                    <tr>
                      {['Week', 'Orders', 'Gross Rev', 'Commission', 'Delivery', 'Ad Rev', 'Courier', 'Support', 'Tech', 'Subsidy', 'CM', 'CM %', 'EBITDA'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-900 border-b border-gray-800 sticky top-0 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {unit_economics_by_week.map((ue, i) => (
                      <tr key={ue.week} className={i % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900/30'}>
                        <td className="text-blue-400 font-mono">W{ue.week + 1}</td>
                        <td>{fmtOrders(ue.total_orders)}</td>
                        <td className="text-emerald-400">{fmtMoney(ue.gross_revenue)}</td>
                        <td>{fmtMoney(ue.commission_revenue)}</td>
                        <td>{fmtMoney(ue.delivery_fee_revenue)}</td>
                        <td>{fmtMoney(ue.ad_revenue)}</td>
                        <td className="text-red-400">{fmtMoney(ue.courier_cost)}</td>
                        <td>{fmtMoney(ue.support_cost)}</td>
                        <td>{fmtMoney(ue.tech_cost)}</td>
                        <td>{fmtMoney(ue.subsidy_cost)}</td>
                        <td className={ue.contribution_margin >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                          {fmtMoney(ue.contribution_margin)}
                        </td>
                        <td className={ue.contribution_margin_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {fmtPct(ue.contribution_margin_pct)}
                        </td>
                        <td className={ue.ebitda >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {fmtMoney(ue.ebitda)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-700 bg-gray-900">
                      <td className="px-3 py-2 font-bold text-gray-300">TOTAL</td>
                      <td className="px-3 py-2 font-mono font-bold">{fmtOrders(unit_economics_by_week.reduce((s, u) => s + u.total_orders, 0))}</td>
                      <td className="px-3 py-2 font-mono text-emerald-400 font-bold">{fmtMoney(unit_economics_by_week.reduce((s, u) => s + u.gross_revenue, 0))}</td>
                      <td colSpan={8} />
                      <td className="px-3 py-2 font-mono font-bold" style={{ color: unit_economics_by_week.reduce((s, u) => s + u.contribution_margin, 0) >= 0 ? '#34d399' : '#f87171' }}>
                        {fmtMoney(unit_economics_by_week.reduce((s, u) => s + u.contribution_margin, 0))}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'table' && (
          <div className="ds-card p-4">
            <div className="ds-section-header -mx-4 -mt-4 mb-4">Full Weekly Detail</div>
            <WeeklyTable weeks={weeks} unitEconomics={unit_economics_by_week} />
          </div>
        )}
      </div>
    </div>
  )
}
