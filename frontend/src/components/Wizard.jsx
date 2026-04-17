/**
 * Wizard — 4-step forecast creation flow.
 * Step 1: Model selection + general config
 * Step 2: Model-specific inputs
 * Step 3: Run & preview
 */
import React, { useState, useEffect } from 'react'
import ConfigStep from './ConfigStep'
import InputTabs from './InputTabs'
import ResultsDashboard from './ResultsDashboard'
import { useForecast } from '../hooks/useForecast'

const STEPS = [
  { id: 1, label: 'Configure', desc: 'Name, horizon, models' },
  { id: 2, label: 'Inputs', desc: 'Per-model parameters' },
  { id: 3, label: 'Run', desc: 'Execute & review' },
]

function StepIndicator({ currentStep, onStepClick }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => (
        <React.Fragment key={step.id}>
          <button
            onClick={() => currentStep > step.id - 1 && onStepClick(step.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all
              ${currentStep === step.id ? 'bg-blue-900/40 text-blue-300' :
                currentStep > step.id ? 'text-gray-400 hover:text-gray-200 cursor-pointer' :
                'text-gray-600 cursor-default'}`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold
              ${currentStep === step.id ? 'bg-blue-600 text-white' :
                currentStep > step.id ? 'bg-gray-700 text-gray-300' :
                'bg-gray-800 text-gray-600'}`}>
              {currentStep > step.id ? '✓' : step.id}
            </span>
            <div className="text-left">
              <div className="text-xs font-medium leading-tight">{step.label}</div>
              <div className="text-[10px] text-gray-600 leading-tight">{step.desc}</div>
            </div>
          </button>
          {i < STEPS.length - 1 && (
            <div className={`h-px w-8 ${currentStep > step.id ? 'bg-gray-600' : 'bg-gray-800'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export default function Wizard() {
  const [step, setStep] = useState(1)
  const {
    inputs, setInputs,
    forecast, isLoading, error,
    run, save, exportExcel, exportJSON,
  } = useForecast()
  const [saveMsg, setSaveMsg] = useState(null)

  const canProceed = () => {
    if (step === 1) {
      return inputs.name?.length > 0 && inputs.horizon_weeks >= 4 && (inputs.models_active || []).length > 0
    }
    return true
  }

  const handleRun = async () => {
    const result = await run()
    if (result) {
      // Stay on step 3 to see results
    }
  }

  const handleSave = async () => {
    const result = await save()
    if (result) {
      setSaveMsg(`Saved! ID: ${result.id}`)
      setTimeout(() => setSaveMsg(null), 4000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">📊</span>
            <div>
              <h1 className="text-sm font-semibold text-gray-200 font-mono">Forecast Studio</h1>
              <p className="text-xs text-gray-500">Modelos cuantitativos para cualquier vertical</p>
            </div>
          </div>

          <StepIndicator currentStep={step} onStepClick={setStep} />

          <div className="flex items-center gap-2">
            <a href="/forecasts" className="btn-ghost text-xs">Saved Forecasts</a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Step 1: Configure */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-200">Forecast Configuration</h2>
                <p className="text-sm text-gray-500 mt-0.5">Select active models and set global parameters.</p>
              </div>
            </div>

            <ConfigStep inputs={inputs} setInputs={setInputs} />

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                disabled={!canProceed()}
                className="btn-primary"
              >
                Next: Configure Inputs →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Model Inputs */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-200">Model Parameters</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Configure inputs for each active model.
                  Active: <span className="font-mono text-blue-400">{(inputs.models_active || []).join(', ')}</span>
                </p>
              </div>
            </div>

            <div className="ds-card p-4">
              <InputTabs inputs={inputs} setInputs={setInputs} />
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(1)} className="btn-secondary">
                ← Back
              </button>
              <button onClick={() => setStep(3)} className="btn-primary">
                Next: Run Forecast →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Run & Results */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-200">Forecast Results</h2>
                <p className="text-sm text-gray-500 mt-0.5 font-mono">
                  {inputs.name} · {inputs.horizon_weeks}w · {inputs.country}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {saveMsg && (
                  <span className="text-xs text-emerald-400 font-mono">{saveMsg}</span>
                )}
                <button onClick={() => setStep(2)} className="btn-secondary text-xs">
                  ← Edit Inputs
                </button>
                <button onClick={handleSave} disabled={isLoading || !forecast} className="btn-secondary text-xs">
                  Save
                </button>
                <button
                  onClick={handleRun}
                  disabled={isLoading}
                  className={`btn-primary flex items-center gap-2 ${isLoading ? 'opacity-75' : ''}`}
                >
                  {isLoading ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Running...
                    </>
                  ) : forecast ? 'Re-run Forecast' : 'Run Forecast'}
                </button>
              </div>
            </div>

            {/* Error display */}
            {error && (
              <div className="ds-card border-red-800 bg-red-900/20 p-4">
                <div className="flex items-start gap-2">
                  <span className="text-red-400 font-mono text-sm">Error:</span>
                  <pre className="text-red-300 text-xs font-mono whitespace-pre-wrap">{error}</pre>
                </div>
              </div>
            )}

            {/* Loading skeleton */}
            {isLoading && !forecast && (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="ds-card h-20 shimmer" />
                ))}
              </div>
            )}

            {/* No forecast yet */}
            {!forecast && !isLoading && !error && (
              <div className="ds-card p-12 text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">Ready to run</h3>
                <p className="text-gray-500 text-sm mb-6">
                  Click "Run Forecast" to execute the model with your current configuration.
                </p>
                <div className="ds-card p-3 text-xs text-gray-600 font-mono text-left max-w-lg mx-auto">
                  <div className="text-gray-400 mb-2">Configured:</div>
                  <div>models_active: [{(inputs.models_active || []).join(', ')}]</div>
                  <div>horizon: {inputs.horizon_weeks} weeks</div>
                  <div>country: {inputs.country}</div>
                  <div>base_orders: {(inputs.base_orders_weekly || 0).toLocaleString()}/week</div>
                </div>
                <button onClick={handleRun} className="btn-primary mt-6">
                  Run Forecast
                </button>
              </div>
            )}

            {/* Results */}
            {forecast && (
              <ResultsDashboard
                forecast={forecast}
                inputs={inputs}
                onExportExcel={exportExcel}
                onExportJSON={exportJSON}
                isLoading={isLoading}
              />
            )}
          </div>
        )}
      </main>
    </div>
  )
}
