import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

/**
 * HelperTooltip — modern info tooltip with smart viewport-aware positioning.
 *
 * Usage: <HelperTooltip text="Explanation here" />
 * Props:
 *   text     — content (string or JSX)
 *   side     — preferred placement: 'top' | 'bottom' | 'right' | 'left' (default: 'top')
 *   size     — 'sm' | 'md' (default: 'sm')
 *   maxWidth — tooltip max width in px (default: 256)
 */
export default function HelperTooltip({ text, side = 'top', size = 'sm', maxWidth = 256 }) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const [resolvedSide, setResolvedSide] = useState(side)
  const triggerRef = useRef(null)
  const tooltipRef = useRef(null)
  const hideTimer = useRef(null)

  const GAP = 8  // px between trigger and tooltip

  const computePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const tw = Math.min(maxWidth, 320)
    const th = 80 // estimated tooltip height

    // Determine best side
    let s = side
    if (s === 'top'    && rect.top < th + GAP + 16)       s = 'bottom'
    if (s === 'bottom' && rect.bottom + th + GAP > vh - 8) s = 'top'
    if (s === 'left'   && rect.left < tw + GAP + 16)       s = 'right'
    if (s === 'right'  && rect.right + tw + GAP > vw - 8)  s = 'left'
    setResolvedSide(s)

    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2

    let top = 0, left = 0
    if (s === 'top')    { top = rect.top - GAP;                left = cx }
    if (s === 'bottom') { top = rect.bottom + GAP;             left = cx }
    if (s === 'left')   { top = cy;                            left = rect.left - GAP }
    if (s === 'right')  { top = cy;                            left = rect.right + GAP }

    setCoords({ top, left })
  }, [side, maxWidth])

  const show = () => {
    clearTimeout(hideTimer.current)
    computePosition()
    setVisible(true)
  }

  const hide = () => {
    hideTimer.current = setTimeout(() => setVisible(false), 80)
  }

  useEffect(() => () => clearTimeout(hideTimer.current), [])

  // Close on outside click
  useEffect(() => {
    if (!visible) return
    const handler = (e) => {
      if (!triggerRef.current?.contains(e.target) && !tooltipRef.current?.contains(e.target)) {
        setVisible(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [visible])

  const iconDim = size === 'md' ? 16 : 14

  // Tooltip transform & arrow position
  const tooltipStyle = {
    position: 'fixed',
    zIndex: 9999,
    maxWidth,
    pointerEvents: visible ? 'auto' : 'none',
    ...(resolvedSide === 'top'    && { bottom: `calc(100vh - ${coords.top}px)`,  left: coords.left, transform: 'translateX(-50%)' }),
    ...(resolvedSide === 'bottom' && { top: coords.top,  left: coords.left, transform: 'translateX(-50%)' }),
    ...(resolvedSide === 'left'   && { top: coords.top,  right: `calc(100vw - ${coords.left}px)`, transform: 'translateY(-50%)' }),
    ...(resolvedSide === 'right'  && { top: coords.top,  left: coords.left, transform: 'translateY(-50%)' }),
  }

  const arrowCls = {
    top:    'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-t-slate-700/80 border-x-transparent border-b-transparent',
    bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-b-slate-700/80 border-x-transparent border-t-transparent',
    left:   'right-0 top-1/2 -translate-y-1/2 translate-x-full border-l-slate-700/80 border-y-transparent border-r-transparent',
    right:  'left-0 top-1/2 -translate-y-1/2 -translate-x-full border-r-slate-700/80 border-y-transparent border-l-transparent',
  }[resolvedSide]

  const tooltipEl = visible ? (
    <div
      ref={tooltipRef}
      style={tooltipStyle}
      onMouseEnter={() => clearTimeout(hideTimer.current)}
      onMouseLeave={hide}
    >
      {/* Arrow */}
      <div
        className={`absolute w-0 h-0 border-4 ${arrowCls}`}
        style={{ borderTopColor: resolvedSide === 'top' ? '#334155' : 'transparent',
                 borderBottomColor: resolvedSide === 'bottom' ? '#334155' : 'transparent',
                 borderLeftColor: resolvedSide === 'left' ? '#334155' : 'transparent',
                 borderRightColor: resolvedSide === 'right' ? '#334155' : 'transparent' }}
      />
      {/* Panel */}
      <div
        className="
          bg-slate-900 border border-slate-700/80
          rounded-xl shadow-2xl shadow-black/60
          px-3 py-2.5
          text-[13px] text-slate-300 leading-relaxed
          animate-tooltip-in
        "
      >
        {text}
      </div>
    </div>
  ) : null

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex items-center justify-center ml-1 cursor-help flex-shrink-0 align-middle"
      onMouseEnter={show}
      onMouseLeave={hide}
      onClick={() => visible ? setVisible(false) : show()}
    >
      <svg
        width={iconDim}
        height={iconDim}
        viewBox="0 0 16 16"
        fill="none"
        aria-label="Más información"
        className="text-slate-500 hover:text-blue-400 transition-colors duration-150"
      >
        <circle
          cx="8" cy="8" r="7"
          stroke="currentColor"
          strokeWidth="1.5"
          className="opacity-80"
        />
        <text
          x="8" y="12"
          textAnchor="middle"
          fontSize="9"
          fontWeight="600"
          fontStyle="italic"
          fill="currentColor"
          fontFamily="Georgia, serif"
          className="opacity-90"
        >i</text>
      </svg>
      {typeof document !== 'undefined' && createPortal(tooltipEl, document.body)}
    </span>
  )
}
