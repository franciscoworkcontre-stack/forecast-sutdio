import React, { useState } from 'react'

const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : ''

export default function FeedbackModal({ onClose }) {
  const [nps, setNps] = useState(null)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (nps === null) { setError('Por favor selecciona un puntaje NPS.'); return }
    setSending(true)
    setError(null)
    try {
      const resp = await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nps, message, email, company }),
      })
      if (!resp.ok) {
        const d = await resp.json().catch(() => ({}))
        throw new Error(d.detail || `Error ${resp.status}`)
      }
      setSent(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-sm font-bold text-gray-100 font-mono">Feedback</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">Tu opinión mejora el producto</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-lg font-bold leading-none">×</button>
        </div>

        {sent ? (
          <div className="px-5 py-10 text-center">
            <div className="text-4xl mb-3">🙏</div>
            <p className="text-gray-200 font-semibold text-sm mb-1">¡Gracias por tu feedback!</p>
            <p className="text-gray-500 text-xs">Lo revisaremos muy pronto.</p>
            <button onClick={onClose} className="btn-primary mt-5 text-xs">Cerrar</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5">
            {/* NPS */}
            <div>
              <label className="ds-label block mb-2 text-gray-300">
                ¿Cuánto recomendarías Forecast Studio a un colega?
                <span className="text-gray-500 font-normal"> (0 = nada, 10 = definitivamente)</span>
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNps(n)}
                    className={`w-8 h-8 rounded-lg text-xs font-mono font-bold border transition-all ${
                      nps === n
                        ? n >= 9 ? 'bg-emerald-600 border-emerald-500 text-white'
                          : n >= 7 ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-red-700 border-red-600 text-white'
                        : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>0 — No recomendaría</span>
                <span>10 — Definitivamente</span>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="ds-label block mb-1">
                ¿Qué podría ser mejor? <span className="text-gray-600 font-normal">(opcional)</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                placeholder="Escribe tu sugerencia, bug o comentario..."
                className="ds-input w-full resize-none text-xs leading-relaxed"
              />
            </div>

            {/* Email + Company (optional) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="ds-label block mb-1">Email <span className="text-gray-600 font-normal">(opcional)</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="ds-input w-full text-xs"
                />
              </div>
              <div>
                <label className="ds-label block mb-1">Empresa <span className="text-gray-600 font-normal">(opcional)</span></label>
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="ACME Inc."
                  className="ds-input w-full text-xs"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-xs font-mono bg-red-900/20 border border-red-800 rounded p-2">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button type="button" onClick={onClose} className="btn-secondary text-xs">Cancelar</button>
              <button
                type="submit"
                disabled={sending || nps === null}
                className="btn-primary text-xs disabled:opacity-40"
              >
                {sending ? 'Enviando...' : 'Enviar Feedback →'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
