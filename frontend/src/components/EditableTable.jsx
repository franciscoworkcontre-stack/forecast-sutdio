/**
 * EditableTable — generic editable data table for curves.
 * Features: click-to-edit, tab navigation, paste from Excel, copy, CSV import/export.
 */
import React, { useState, useRef, useCallback } from 'react'

export default function EditableTable({ columns, rows, onChange, label = 'Values' }) {
  const [editingCell, setEditingCell] = useState(null) // {row, col}
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef(null)

  const startEdit = useCallback((rowIdx, colIdx, currentVal) => {
    setEditingCell({ row: rowIdx, col: colIdx })
    setEditValue(String(currentVal ?? ''))
    setTimeout(() => inputRef.current?.select(), 10)
  }, [])

  const commitEdit = useCallback((rowIdx, colIdx) => {
    const parsed = parseFloat(editValue)
    if (!isNaN(parsed)) {
      const newRows = rows.map((r, ri) =>
        ri === rowIdx ? r.map((c, ci) => ci === colIdx ? parsed : c) : r
      )
      onChange(newRows)
    }
    setEditingCell(null)
  }, [editValue, rows, onChange])

  const handleKeyDown = useCallback((e, rowIdx, colIdx) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      commitEdit(rowIdx, colIdx)
      // Move to next cell
      const nextCol = colIdx + 1
      const nextRow = nextCol >= columns.length ? rowIdx + 1 : rowIdx
      const actualNextCol = nextCol >= columns.length ? 0 : nextCol
      if (nextRow < rows.length) {
        startEdit(nextRow, actualNextCol, rows[nextRow][actualNextCol])
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null)
    }
  }, [commitEdit, startEdit, columns.length, rows])

  const handlePaste = useCallback((e) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text')
    const lines = text.trim().split('\n')
    if (!editingCell) return

    const { row: startRow, col: startCol } = editingCell
    const newRows = rows.map(r => [...r])

    lines.forEach((line, lineIdx) => {
      const cells = line.split('\t')
      cells.forEach((cell, cellIdx) => {
        const r = startRow + lineIdx
        const c = startCol + cellIdx
        if (r < newRows.length && c < columns.length) {
          const val = parseFloat(cell.trim())
          if (!isNaN(val)) {
            newRows[r][c] = val
          }
        }
      })
    })
    onChange(newRows)
    setEditingCell(null)
  }, [editingCell, rows, columns.length, onChange])

  const copyToClipboard = useCallback(() => {
    const tsv = rows.map(row => row.join('\t')).join('\n')
    navigator.clipboard.writeText(tsv).catch(() => {})
  }, [rows])

  const handleCsvImport = useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const lines = ev.target.result.trim().split('\n')
      const newRows = lines.slice(0, rows.length).map((line, ri) => {
        const cells = line.split(',')
        return cells.slice(0, columns.length).map((c, ci) => {
          const v = parseFloat(c.trim())
          return isNaN(v) ? (rows[ri]?.[ci] ?? 0) : v
        })
      })
      // Pad if needed
      while (newRows.length < rows.length) {
        newRows.push(new Array(columns.length).fill(0))
      }
      onChange(newRows)
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [rows, columns.length, onChange])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="ds-label">{label}</span>
        <div className="flex gap-2">
          <button type="button" onClick={copyToClipboard} className="btn-ghost text-xs py-0.5">
            Copy TSV
          </button>
          <label className="btn-ghost text-xs py-0.5 cursor-pointer">
            Import CSV
            <input type="file" accept=".csv" onChange={handleCsvImport} className="hidden" />
          </label>
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-gray-800">
        <table className="text-xs w-full">
          <thead>
            <tr className="bg-gray-900">
              <th className="px-2 py-1 text-left text-gray-500 font-medium border-b border-gray-800 w-12">#</th>
              {columns.map((col, ci) => (
                <th key={ci} className="px-2 py-1 text-right text-gray-400 font-medium border-b border-gray-800 font-mono">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900/30'}>
                <td className="px-2 py-1 text-gray-600 text-center">{ri + 1}</td>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="px-0 py-0 border-l border-gray-800/50"
                    onClick={() => startEdit(ri, ci, cell)}
                  >
                    {editingCell?.row === ri && editingCell?.col === ci ? (
                      <input
                        ref={inputRef}
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => commitEdit(ri, ci)}
                        onKeyDown={e => handleKeyDown(e, ri, ci)}
                        onPaste={handlePaste}
                        className="w-full px-2 py-1 bg-blue-900/30 border border-blue-500 text-blue-200
                                   font-mono text-xs text-right outline-none"
                      />
                    ) : (
                      <div className="px-2 py-1 font-mono text-right text-gray-300 cursor-cell
                                       hover:bg-gray-800 min-w-[60px]">
                        {typeof cell === 'number' ? cell.toFixed(3) : cell}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-600">Click to edit · Tab to advance · Paste Excel range</p>
    </div>
  )
}

/**
 * CurveEditor — single-row editable curve (e.g. fatigue curve, maturation curve).
 */
export function CurveEditor({ label, curve, onChange, maxWeeks = 12, step = 0.01, min = 0, max = 2 }) {
  const handleChange = (idx, value) => {
    const newCurve = [...curve]
    newCurve[idx] = parseFloat(value) || 0
    onChange(newCurve)
  }

  return (
    <div className="space-y-1">
      <label className="ds-label">{label}</label>
      <div className="flex gap-1 flex-wrap">
        {curve.map((v, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <span className="text-gray-600 text-[10px] font-mono">W{i + 1}</span>
            <input
              type="number"
              value={v}
              step={step}
              min={min}
              max={max}
              onChange={e => handleChange(i, e.target.value)}
              className="w-14 px-1 py-0.5 bg-gray-800 border border-gray-700 text-gray-200
                         text-xs font-mono text-right rounded focus:border-blue-500 focus:outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
