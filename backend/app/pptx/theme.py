"""
Design system for Forecast Studio PPTX decks.
Dark-first, next-level beyond MBB/BCG.
"""
from pptx.util import Pt
from pptx.dml.color import RGBColor

# ── Slide canvas ──────────────────────────────────────────────────────────────
# 16:9 widescreen (standard modern)
SLIDE_W = 12_192_000   # 13.33 inches in EMU
SLIDE_H =  6_858_000   #  7.50 inches in EMU

# ── Base dark palette (matches the tool's CSS design system) ──────────────────
DARK = {
    'bg':        RGBColor(0x0f, 0x17, 0x2a),   # gray-950  — main background
    'card':      RGBColor(0x1e, 0x29, 0x3b),   # slate-800 — card fill
    'border':    RGBColor(0x33, 0x41, 0x55),   # slate-700 — dividers
    'muted':     RGBColor(0x47, 0x55, 0x69),   # slate-600 — muted elements
    'secondary': RGBColor(0x94, 0xa3, 0xb8),   # slate-400 — secondary text
    'primary':   RGBColor(0xe2, 0xe8, 0xf0),   # slate-200 — primary text
    'white':     RGBColor(0xff, 0xff, 0xff),   # pure white — headline numbers
    'bear':      RGBColor(0xef, 0x44, 0x44),   # red-500
    'base':      RGBColor(0x3b, 0x82, 0xf6),   # blue-500
    'bull':      RGBColor(0x10, 0xb9, 0x81),   # emerald-500
    'warn':      RGBColor(0xf5, 0x9e, 0x0b),   # amber-500
}

# ── Perspective accent colors ─────────────────────────────────────────────────
PERSPECTIVE = {
    'D': RGBColor(0x3b, 0x82, 0xf6),   # blue-500
    'S': RGBColor(0x10, 0xb9, 0x81),   # emerald-500
    'P': RGBColor(0x8b, 0x5c, 0xf6),   # violet-500
}

PERSPECTIVE_DARK = {
    'D': RGBColor(0x1e, 0x3a, 0x8a),   # blue-900
    'S': RGBColor(0x06, 0x4e, 0x3b),   # emerald-900
    'P': RGBColor(0x2e, 0x10, 0x65),   # violet-950
}

PERSPECTIVE_LABEL = {
    'D': 'DEMANDA',
    'S': 'OFERTA',
    'P': 'PLATAFORMA',
}

# ── Palette map (matches frontend PALETTE_OPTIONS + Excel theme.py) ───────────
PALETTE_ACCENT = {
    'navy':   RGBColor(0x1e, 0x3a, 0x5f),
    'green':  RGBColor(0x14, 0x53, 0x2d),
    'red':    RGBColor(0x7f, 0x1d, 0x1d),
    'purple': RGBColor(0x4c, 0x1d, 0x95),
    'slate':  RGBColor(0x1f, 0x29, 0x37),
    'orange': RGBColor(0x7c, 0x2d, 0x12),
}

PALETTE_HIGHLIGHT = {
    'navy':   RGBColor(0xf5, 0x9e, 0x0b),   # amber
    'green':  RGBColor(0x63, 0x66, 0xf1),   # indigo
    'red':    RGBColor(0x0e, 0xa5, 0xe9),   # sky
    'purple': RGBColor(0x10, 0xb9, 0x81),   # emerald
    'slate':  RGBColor(0x3b, 0x82, 0xf6),   # blue
    'orange': RGBColor(0x3b, 0x82, 0xf6),   # blue
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
    'incremental_orders_total':         'Órdenes Incrementales',
}

# ── Per-model: which 4 summary keys to show as headline cards ─────────────────
HEADLINE_KPIS = {
    'D2': ['total_revenue', 'avg_ltv_cac', 'best_channel', 'total_orders'],
    'D3': ['total_orders', 'overall_conversion_rate', 'biggest_drop_step', 'total_revenue'],
    'D4': ['total_orders', 'total_revenue', 'total_users', 'horizon_weeks'],
    'D5': ['total_revenue', 'blended_roi', 'total_reactivated', 'total_campaign_cost'],
    'S1': ['total_orders', 'total_revenue', 'total_restaurants_added', 'avg_weekly_orders'],
    'S2': ['total_revenue', 'total_orders', 'uplift_pct', 'delta_orders'],
    'S3': ['incremental_revenue', 'roi', 'restaurants_in_program', 'program_cost'],
    'S4': ['at_risk_count', 'revenue_at_risk', 'avg_health_score', 'total_restaurants'],
    'P1': ['total_orders', 'total_revenue', 'final_fulfillment_rate', 'final_phase'],
    'P2': ['blended_roi', 'net_contribution', 'blended_cannibalization_rate_pct', 'total_weekly_incremental_revenue'],
    'P3': ['total_orders', 'total_revenue', 'bottleneck_week', 'total_couriers'],
    'P4': ['final_share_pct', 'revenue_vs_baseline', 'total_response_cost', 'initial_share_pct'],
    'P5': ['total_revenue', 'ltv_cac_ratio', 'is_sustainable', 'total_costs'],
}

# ── Per-model: which weekly series to chart ───────────────────────────────────
# series: list of field names in the weekly array
# Up to 2 series. First is primary (bar/line), second is secondary (right axis)
CHART_SERIES = {
    'D2': ['cumulative_revenue'],
    'D3': ['weekly_orders'],
    'D4': ['total_orders'],
    'D5': ['total_reactivated'],
    'S1': ['weekly_orders'],
    'S2': ['weekly_orders'],
    'S3': ['total_orders', 'baseline_orders'],
    'S4': [],  # uses scored_restaurants instead
    'P1': ['orders'],
    'P2': ['net_contribution'],
    'P3': ['actual_orders'],
    'P4': ['our_orders'],
    'P5': ['net_contribution'],
}

def get_accent(perspective: str, palette: str) -> RGBColor:
    """Primary accent = perspective color."""
    return PERSPECTIVE.get(perspective, DARK['base'])

def get_palette_highlight(palette: str) -> RGBColor:
    return PALETTE_HIGHLIGHT.get(palette, PALETTE_HIGHLIGHT['navy'])
