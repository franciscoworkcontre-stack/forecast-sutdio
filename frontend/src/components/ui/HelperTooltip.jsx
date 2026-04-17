import React, { useState, useRef, useEffect } from 'react'

/**
 * HelperTooltip — small (i) icon with hover tooltip.
 * Usage: <HelperTooltip text="Explanation here" />
 * Props:
 *   text  — tooltip content (string or JSX)
 *   side  — 'top' | 'right' | 'bottom' | 'left' (default: 'top')
 *   size  — 'sm' | 'md' (default: 'sm')
 */
export default function HelperTooltip({ text, side = 'top', size = 'sm' }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!visible) return
    const close = (e) => { if (!ref.current?.contains(e.target)) setVisible(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [visible])

  const posClass = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
  }[side] ?? 'bottom-full left-1/2 -translate-x-1/2 mb-2'

  const arrowClass = {
    top:    'top-full left-1/2 -translate-x-1/2 border-t-gray-700 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-700 border-x-transparent border-t-transparent',
    right:  'right-full top-1/2 -translate-y-1/2 border-r-gray-700 border-y-transparent border-l-transparent',
    left:   'left-full top-1/2 -translate-y-1/2 border-l-gray-700 border-y-transparent border-r-transparent',
  }[side] ?? 'top-full left-1/2 -translate-x-1/2 border-t-gray-700 border-x-transparent border-b-transparent'

  const iconSize = size === 'md' ? 'w-4 h-4 text-[11px]' : 'w-3.5 h-3.5 text-[10px]'

  return (
    <span ref={ref} className="relative inline-flex items-center ml-1 cursor-help" style={{ verticalAlign: 'middle' }}>
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(v => !v)}
        className={`${iconSize} rounded-full bg-gray-700 hover:bg-blue-700 text-gray-300 hover:text-white flex items-center justify-center font-bold transition-colors flex-shrink-0`}
        aria-label="Más información"
      >
        i
      </button>
      {visible && (
        <div
          className={`absolute z-50 w-56 ${posClass}`}
          onMouseEnter={() => setVisible(true)}
          onMouseLeave={() => setVisible(false)}
        >
          <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-3 text-xs text-gray-200 leading-relaxed">
            {text}
          </div>
          <div className={`absolute w-0 h-0 border-4 ${arrowClass}`} />
        </div>
      )}
    </span>
  )
}
