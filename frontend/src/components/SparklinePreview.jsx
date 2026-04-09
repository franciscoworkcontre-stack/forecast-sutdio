/**
 * SparklinePreview — minimal line chart preview (no axes, just the line).
 * Used for showing curves inline next to input fields.
 */
import React from 'react'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'

export default function SparklinePreview({ data, color = '#60a5fa', height = 40, showTooltip = false }) {
  if (!data || data.length === 0) return null

  const chartData = data.map((v, i) => ({ i, v }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        {showTooltip && (
          <Tooltip
            formatter={(v) => [v.toFixed(3)]}
            labelFormatter={(i) => `W${i + 1}`}
            contentStyle={{
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '4px',
              fontSize: '11px',
              padding: '4px 8px',
            }}
          />
        )}
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function FatigueCurvePreview({ fatigueCurve, horizon = 12 }) {
  // Build the actual per-week fatigue from curve
  const defaultFatigue = { 1: 1.0, 2: 1.0, 3: 0.90, 4: 0.90, 5: 0.75, 6: 0.75, 7: 0.75, 8: 0.75, 9: 0.60, 10: 0.60, 11: 0.60, 12: 0.60 }

  const data = []
  for (let w = 1; w <= horizon; w++) {
    let factor
    if (fatigueCurve && fatigueCurve.length > 0) {
      factor = w <= fatigueCurve.length ? fatigueCurve[w - 1] : fatigueCurve[fatigueCurve.length - 1]
    } else {
      const keys = Object.keys(defaultFatigue).map(Number).sort((a, b) => a - b)
      const applicable = keys.filter(k => k <= w)
      factor = applicable.length > 0 ? defaultFatigue[applicable[applicable.length - 1]] : 0.60
    }
    data.push(factor)
  }

  return <SparklinePreview data={data} color="#60a5fa" height={36} showTooltip />
}
