import { useState, useCallback, useEffect, useRef } from 'react'
import { useDebounce } from './useDebounce'

const API_BASE = '/api'
const LS_KEY = 'forecast_studio_draft'

const DEFAULT_INPUTS = {
  name: 'New Forecast',
  horizon_weeks: 12,
  country: 'MX',
  base_orders_weekly: 10000,
  models_active: ['A1', 'A4'],
  promo_inputs: [
    {
      orders_base_weekly: 10000,
      promo_type: 'discount_pct',
      duration_weeks: 4,
      uplift_pct: 27.5,
      target_segment: 'all',
      who_funds: 'platform',
      cofund_split: 0.5,
    },
  ],
  acquisition_input: null,
  seasonality_input: {
    country: 'MX',
    use_holidays: true,
    use_rain_season: true,
    use_pay_cycles: true,
    use_temperature: true,
    trend_weekly_growth: 0.002,
  },
  unit_economics: null,
  scenarios_config: null,
  market_share_input: null,
  expansion_input: null,
}

export function useForecast() {
  const [inputs, setInputs] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      return saved ? JSON.parse(saved) : DEFAULT_INPUTS
    } catch {
      return DEFAULT_INPUTS
    }
  })

  const [forecast, setForecast] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [savedId, setSavedId] = useState(null)

  // Auto-save draft to localStorage (debounced)
  const debouncedInputs = useDebounce(inputs, 800)
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(debouncedInputs))
    } catch {}
  }, [debouncedInputs])

  const run = useCallback(async (overrideInputs = null) => {
    const payload = overrideInputs || inputs
    setIsLoading(true)
    setError(null)

    try {
      const resp = await fetch(`${API_BASE}/forecast/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ detail: resp.statusText }))
        throw new Error(errData.detail || 'Calculation failed')
      }

      const data = await resp.json()
      setForecast(data)
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [inputs])

  const save = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const resp = await fetch(`${API_BASE}/forecast/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs),
      })

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ detail: resp.statusText }))
        throw new Error(errData.detail || 'Save failed')
      }

      const data = await resp.json()
      setSavedId(data.id)
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [inputs])

  const exportExcel = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const resp = await fetch(`${API_BASE}/forecast/export-excel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs),
      })

      if (!resp.ok) {
        throw new Error('Excel export failed')
      }

      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `forecast_${inputs.name.replace(/\s+/g, '_')}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [inputs])

  const exportJSON = useCallback(() => {
    if (!forecast) return
    const json = JSON.stringify({ inputs, result: forecast }, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `forecast_${inputs.name.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [inputs, forecast])

  const loadForecast = useCallback(async (id) => {
    setIsLoading(true)
    setError(null)

    try {
      const resp = await fetch(`${API_BASE}/forecast/${id}`)
      if (!resp.ok) throw new Error('Forecast not found')
      const data = await resp.json()
      setForecast(data)
      setSavedId(id)
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const resetInputs = useCallback(() => {
    setInputs(DEFAULT_INPUTS)
    setForecast(null)
    setError(null)
    setSavedId(null)
  }, [])

  return {
    inputs,
    setInputs,
    forecast,
    setForecast,
    isLoading,
    error,
    setError,
    savedId,
    run,
    save,
    exportExcel,
    exportJSON,
    loadForecast,
    resetInputs,
    DEFAULT_INPUTS,
  }
}

export default useForecast
