"""
Design system for Forecast Studio PPTX decks.
Clean white-first design — BCG Smart Simplicity style.
"""
from pptx.util import Pt
from pptx.dml.color import RGBColor

# ── Slide canvas ──────────────────────────────────────────────────────────────
SLIDE_W = 12_192_000   # 13.33 inches in EMU
SLIDE_H =  6_858_000   #  7.50 inches in EMU

# ── Light (white) palette ─────────────────────────────────────────────────────
LIGHT = {
    'bg':         RGBColor(0xff, 0xff, 0xff),   # pure white
    'surface':    RGBColor(0xf8, 0xfa, 0xfc),   # slate-50 — card bg
    'border':     RGBColor(0xe2, 0xe8, 0xf0),   # slate-200 — dividers
    'muted':      RGBColor(0x94, 0xa3, 0xb8),   # slate-400 — muted text
    'secondary':  RGBColor(0x64, 0x74, 0x8b),   # slate-500 — secondary text
    'primary':    RGBColor(0x1e, 0x29, 0x3b),   # slate-800 — primary text
    'headline':   RGBColor(0x0f, 0x17, 0x2a),   # slate-950 — headline / big numbers
    'bear':       RGBColor(0xdc, 0x26, 0x26),   # red-600
    'base':       RGBColor(0x25, 0x63, 0xeb),   # blue-600
    'bull':       RGBColor(0x05, 0x96, 0x69),   # emerald-600
    'warn':       RGBColor(0xd9, 0x77, 0x06),   # amber-600
}

# Keep DARK as alias so any leftover import doesn't crash
DARK = LIGHT

# ── Perspective accent colors (vivid, work on white bg) ───────────────────────
PERSPECTIVE = {
    'D': RGBColor(0x25, 0x63, 0xeb),   # blue-600
    'S': RGBColor(0x05, 0x96, 0x69),   # emerald-600
    'P': RGBColor(0x79, 0x16, 0xee),   # violet-600
}

PERSPECTIVE_LIGHT = {
    'D': RGBColor(0xef, 0xf6, 0xff),   # blue-50
    'S': RGBColor(0xec, 0xfd, 0xf5),   # emerald-50
    'P': RGBColor(0xf5, 0xf3, 0xff),   # violet-50
}

# Keep dark variant for any leftover reference
PERSPECTIVE_DARK = PERSPECTIVE_LIGHT

PERSPECTIVE_LABEL = {
    'D': 'DEMANDA',
    'S': 'OFERTA',
    'P': 'PLATAFORMA',
}

# ── Palette accent colors (used for cover bar) ────────────────────────────────
PALETTE_ACCENT = {
    'navy':   RGBColor(0x1e, 0x3a, 0x5f),
    'green':  RGBColor(0x05, 0x96, 0x69),
    'red':    RGBColor(0xdc, 0x26, 0x26),
    'purple': RGBColor(0x79, 0x16, 0xee),
    'slate':  RGBColor(0x47, 0x55, 0x69),
    'orange': RGBColor(0xea, 0x58, 0x0c),
}

PALETTE_HIGHLIGHT = {
    'navy':   RGBColor(0xd9, 0x77, 0x06),   # amber-600
    'green':  RGBColor(0x25, 0x63, 0xeb),   # blue-600
    'red':    RGBColor(0x05, 0x96, 0x69),   # emerald-600
    'purple': RGBColor(0x05, 0x96, 0x69),   # emerald-600
    'slate':  RGBColor(0x25, 0x63, 0xeb),   # blue-600
    'orange': RGBColor(0x25, 0x63, 0xeb),   # blue-600
}

# ── KPI display metadata ──────────────────────────────────────────────────────
KPI_LABELS = {
    'total_revenue':                    'Revenue Total',
    'total_orders':                     'Órdenes Totales',
    'avg_ltv_cac':                      'LTV / CAC',
    'best_channel':                     'Mejor Canal',
    'payback_weeks':                    'Payback (sem)',
    'overall_conversion_rate':          'Conversión Funnel',
    'biggest_drop_step':                'Mayor Caída en',
    'blended_roi':                      'ROI Combinado',
    'blended_cannibalization_rate_pct': 'Canibalización',
    'total_weekly_incremental_revenue': 'Rev. Incremental/sem',
    'net_contribution':                 'Net Contribution',
    'at_risk_count':                    'Proveedores en Riesgo',
    'revenue_at_risk':                  'Revenue en Riesgo',
    'avg_health_score':                 'Score Salud Promedio',
    'total_restaurants':                'Total Proveedores',
    'final_fulfillment_rate':           'Fulfillment Final',
    'final_phase':                      'Fase Final',
    'final_share_pct':                  'Market Share Final',
    'initial_share_pct':                'Market Share Inicial',
    'revenue_vs_baseline':              'Revenue vs Baseline',
    'total_response_cost':              'Costo de Respuesta',
    'ltv_cac_ratio':                    'LTV / CAC',
    'is_sustainable':                   'Sostenible',
    'roi':                              'ROI del Programa',
    'incremental_revenue':              'Revenue Incremental',
    'program_cost':                     'Costo del Programa',
    'restaurants_in_program':           'Proveedores en Prog.',
    'total_restaurants_added':          'Proveedores Activados',
    'bottleneck_week':                  'Cuello Botella Sem.',
    'uplift_pct':                       'Uplift Portfolio',
    'total_costs':                      'Costos Totales',
    'total_weekly_cost':                'Costo Semanal Promos',
    'final_couriers':                   'Repartidores Finales',
    'total_gross_revenue':              'Revenue Bruto',
    'total_net_contribution':           'Net Contribution',
    'total_with_changes_revenue':       'Revenue c/ Cambios',
    'total_baseline_revenue':           'Revenue Baseline',
    'total_uplift_revenue':             'Revenue Uplift',
    'total_gmv':                        'GMV Total',
    'final_week_gmv':                   'GMV Última Semana',
    'incremental_orders_total':         'Órdenes Incrementales',
    'total_incremental':                'Órdenes Incrementales',
    'total_incremental_orders':         'Órdenes Incrementales',
    'total_reactivated_users':          'Usuarios Reactivados',
    'total_cost':                       'Costo Total Campañas',
    'total_contribution':               'Contribución Total',
    'avg_contribution_pct':             'Margen Contribución',
    'avg_cost_per_order':               'Costo por Orden',
    'total_gastos':                     'Gastos Totales',
    'n_profiles':                       'Perfiles Activos',
    'n_active_levers':                  'Levers Activos',
}

# ── Per-model: which 4 summary keys to show as headline cards ─────────────────
HEADLINE_KPIS = {
    'D1': ['total_orders', 'total_revenue', 'total_contribution', 'avg_contribution_pct'],
    'D2': ['total_revenue', 'avg_ltv_cac', 'best_channel', 'horizon_weeks'],
    'D3': ['total_orders', 'overall_conversion_rate', 'biggest_drop_step', 'total_revenue'],
    'D4': ['total_incremental_orders', 'total_revenue', 'incremental_revenue', 'horizon_weeks'],
    'D5': ['total_revenue', 'blended_roi', 'total_reactivated_users', 'total_cost'],
    'S1': ['total_restaurants_added', 'total_revenue', 'total_gmv', 'final_week_gmv'],
    'S2': ['uplift_pct', 'total_with_changes_revenue', 'total_baseline_revenue', 'total_uplift_revenue'],
    'S3': ['incremental_revenue', 'roi', 'restaurants_in_program', 'program_cost'],
    'S4': ['at_risk_count', 'revenue_at_risk', 'avg_health_score', 'total_restaurants'],
    'P1': ['total_orders', 'total_revenue', 'final_fulfillment_rate', 'final_phase'],
    'P2': ['blended_roi', 'blended_cannibalization_rate_pct', 'total_weekly_incremental_revenue', 'total_weekly_cost'],
    'P3': ['bottleneck_week', 'total_revenue', 'total_contribution', 'final_couriers'],
    'P4': ['final_share_pct', 'revenue_vs_baseline', 'total_response_cost', 'initial_share_pct'],
    'P5': ['ltv_cac_ratio', 'is_sustainable', 'total_gross_revenue', 'total_net_contribution'],
}

# ── Per-model: which weekly series to chart ───────────────────────────────────
CHART_SERIES = {
    'D1': ['orders_total', 'contribution_dollar'],
    'D2': ['total_revenue'],
    'D3': ['orders', 'revenue'],
    'D4': ['total_orders', 'incremental'],
    'D5': ['incremental_orders', 'revenue'],
    'S1': ['total_gmv', 'total_revenue'],
    'S2': ['baseline_orders', 'with_changes_orders'],
    'S3': ['total_orders', 'baseline_orders'],
    'S4': [],
    'P1': ['orders'],
    'P2': ['true_incremental_orders', 'incremental_revenue'],
    'P3': ['orders'],
    'P4': ['our_orders'],
    'P5': ['orders', 'gross_revenue'],
}

def get_accent(perspective: str, palette: str) -> RGBColor:
    return PERSPECTIVE.get(perspective, LIGHT['base'])

def get_palette_highlight(palette: str) -> RGBColor:
    return PALETTE_HIGHLIGHT.get(palette, PALETTE_HIGHLIGHT['navy'])
