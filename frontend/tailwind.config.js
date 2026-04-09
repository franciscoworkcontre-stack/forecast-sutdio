/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // DS/Eng dark theme tokens
        'ds-bg': '#030712',          // main background
        'ds-panel': '#111827',       // cards/panels
        'ds-input': '#1f2937',       // inputs
        'ds-border': '#374151',      // borders
        'ds-text': '#f9fafb',        // primary text
        'ds-muted': '#9ca3af',       // secondary/labels
        'ds-positive': '#34d399',    // green
        'ds-negative': '#f87171',    // red
        'ds-warning': '#fbbf24',     // amber
        'ds-formula': '#60a5fa',     // blue (formulas)
        'ds-highlight': '#7c3aed',   // purple
      },
    },
  },
  plugins: [],
}
