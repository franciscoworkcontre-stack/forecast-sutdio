"""
Forecast Studio PPTX Generator — next-level dark-theme deck.
Generates a 5-slide presentation per model:
  1. Cover
  2. Headline Metrics (bento grid)
  3. Trend Chart
  4. Scenarios Bear/Base/Bull
  5. Insights + Assumptions
"""
import io
from datetime import datetime
from typing import Optional

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION
from pptx.chart.data import ChartData
from pptx.oxml.ns import qn
from lxml import etree

from .theme import (
    SLIDE_W, SLIDE_H, DARK, PERSPECTIVE, PERSPECTIVE_DARK, PERSPECTIVE_LABEL,
    PALETTE_ACCENT, PALETTE_HIGHLIGHT, KPI_LABELS, HEADLINE_KPIS, CHART_SERIES,
    get_accent, get_palette_highlight,
)

# ── Low-level shape helpers ───────────────────────────────────────────────────

def _rgb(r, g, b): return RGBColor(r, g, b)

def _solid_fill(shape, color: RGBColor):
    shape.fill.solid()
    shape.fill.fore_color.rgb = color

def _no_fill(shape):
    shape.fill.background()

def _no_line(shape):
    shape.line.fill.background()

def _rect(slide, x, y, w, h, fill: RGBColor, line_color: Optional[RGBColor] = None):
    shape = slide.shapes.add_shape(1, Inches(x), Inches(y), Inches(w), Inches(h))
    _solid_fill(shape, fill)
    if line_color:
        shape.line.color.rgb = line_color
        shape.line.width = Pt(0.5)
    else:
        _no_line(shape)
    return shape

def _text_box(slide, x, y, w, h, text, size, color: RGBColor,
              bold=False, italic=False, align=PP_ALIGN.LEFT, wrap=True):
    txBox = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = txBox.text_frame
    tf.word_wrap = wrap
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(size)
    run.font.color.rgb = color
    run.font.bold = bold
    run.font.italic = italic
    run.font.name = "Calibri"
    return txBox

def _set_slide_bg(slide, color: RGBColor):
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color

# ── Value formatting ──────────────────────────────────────────────────────────

def _fmt(v, currency='MXN'):
    if v is None: return '—'
    if isinstance(v, bool): return 'Sí' if v else 'No'
    if isinstance(v, str): return v[:20]
    if isinstance(v, float) and abs(v) < 1 and v != 0:
        return f'{v*100:.1f}%'
    if isinstance(v, (int, float)):
        av = abs(v)
        if av >= 1_000_000: return f'{currency} {v/1_000_000:.1f}M'
        if av >= 1_000:     return f'{currency} {v/1_000:.0f}K'
        if av >= 10:        return f'{v:,.0f}'
        return f'{v:.2f}'
    return str(v)

def _label(key: str) -> str:
    return KPI_LABELS.get(key, key.replace('_', ' ').title())

# ── Slide 1 — Cover ───────────────────────────────────────────────────────────

def _slide_cover(prs, model_id, model_name, perspective, palette, config, insights):
    slide_layout = prs.slide_layouts[6]  # blank
    slide = prs.slides.add_slide(slide_layout)
    _set_slide_bg(slide, DARK['bg'])

    accent   = get_accent(perspective, palette)
    p_dark   = PERSPECTIVE_DARK.get(perspective, DARK['card'])
    currency = config.get('currency', 'MXN')
    horizon  = config.get('horizon_weeks', 12)

    W = 13.33  # slide width in inches
    H = 7.5

    # Full-width top stripe — palette accent
    _rect(slide, 0, 0, W, 0.07, PALETTE_ACCENT.get(palette, DARK['card']))

    # Left accent column — perspective color
    _rect(slide, 0, 0.07, 0.18, H - 0.07, accent)

    # Bottom stripe
    _rect(slide, 0.18, H - 0.08, W - 0.18, 0.08, p_dark)

    # Perspective badge (top left after stripe)
    badge_x = 0.35
    _rect(slide, badge_x, 0.18, 2.0, 0.38, p_dark)
    _text_box(slide, badge_x + 0.1, 0.22, 1.8, 0.3,
              f'{perspective} — {PERSPECTIVE_LABEL.get(perspective, perspective)}',
              9, accent, bold=True)

    # Model ID — giant
    _text_box(slide, badge_x, 1.1, 4.0, 1.8,
              model_id, 96, accent, bold=True)

    # Horizontal rule below ID
    _rect(slide, badge_x, 2.95, 9.0, 0.035, accent)

    # Model name
    _text_box(slide, badge_x, 3.05, 11.5, 0.85,
              model_name, 26, DARK['white'], bold=True)

    # Primary insight (first insight as tagline)
    tagline = insights[0] if insights else f'{horizon}-week forecast'
    _text_box(slide, badge_x, 3.95, 11.5, 1.0,
              tagline, 13, DARK['secondary'], italic=True)

    # Config pills (bottom left)
    pills = [
        f'{horizon} semanas',
        f'AOV {currency} {config.get("aov", 0):,.0f}',
        f'Take rate {config.get("take_rate", 0)*100:.0f}%',
    ]
    pill_x = badge_x
    for pill in pills:
        w = len(pill) * 0.085 + 0.2
        _rect(slide, pill_x, 5.15, w, 0.32, DARK['card'])
        _text_box(slide, pill_x + 0.08, 5.18, w - 0.1, 0.28, pill, 8.5, DARK['secondary'])
        pill_x += w + 0.12

    # Date bottom right
    _text_box(slide, 10.5, H - 0.45, 2.5, 0.35,
              datetime.utcnow().strftime('%B %Y'), 8, DARK['muted'],
              align=PP_ALIGN.RIGHT)

    # "Forecast Studio" watermark
    _text_box(slide, badge_x, H - 0.45, 4.0, 0.35,
              'Forecast Studio', 8, DARK['muted'])

    return slide

# ── Slide 2 — Headline Metrics (bento grid) ───────────────────────────────────

def _slide_metrics(prs, model_id, model_name, perspective, palette, config, result):
    slide_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(slide_layout)
    _set_slide_bg(slide, DARK['bg'])

    accent   = get_accent(perspective, palette)
    currency = config.get('currency', 'MXN')
    summary  = result.get('summary', {})

    W = 13.33

    # Top accent stripe
    _rect(slide, 0, 0, W, 0.06, accent)

    # Slide label
    _text_box(slide, 0.35, 0.12, 3.0, 0.28,
              'MÉTRICAS CLAVE', 8, accent, bold=True)

    # Hypothesis title
    primary_kpis = HEADLINE_KPIS.get(model_id, list(summary.keys())[:4])
    non_null = [(k, summary[k]) for k in primary_kpis if k in summary and summary[k] is not None]
    if not non_null:
        non_null = [(k, v) for k, v in summary.items() if isinstance(v, (int, float, bool, str))][:4]

    _text_box(slide, 0.35, 0.45, 12.5, 0.55,
              f'{model_name} — resumen ejecutivo',
              16, DARK['white'], bold=True)

    # Divider
    _rect(slide, 0.35, 1.05, 12.6, 0.025, DARK['border'])

    # Build 4 metric cards in 2×2 grid
    cards = non_null[:4]
    while len(cards) < 4:
        cards.append(('—', None))

    positions = [
        (0.35, 1.2),   # top-left
        (6.85, 1.2),   # top-right
        (0.35, 4.1),   # bottom-left
        (6.85, 4.1),   # bottom-right
    ]
    card_w, card_h = 6.0, 2.55

    for i, ((key, val), (cx, cy)) in enumerate(zip(cards, positions)):
        # Card background
        _rect(slide, cx, cy, card_w, card_h, DARK['card'])

        # Top accent bar per card
        bar_color = accent if i < 2 else get_palette_highlight(palette)
        _rect(slide, cx, cy, card_w, 0.07, bar_color)

        # Label
        lbl = _label(key)
        _text_box(slide, cx + 0.18, cy + 0.16, card_w - 0.3, 0.3,
                  lbl.upper(), 8.5, DARK['secondary'], bold=True)

        # Value — big number
        formatted = _fmt(val, currency)
        # Shrink font if value is long
        font_sz = 46 if len(formatted) <= 8 else 34 if len(formatted) <= 14 else 24
        _text_box(slide, cx + 0.18, cy + 0.52, card_w - 0.3, 1.3,
                  formatted, font_sz, DARK['white'], bold=True)

        # Sub-label (key name in small)
        _text_box(slide, cx + 0.18, cy + 1.9, card_w - 0.3, 0.4,
                  key.replace('_', ' '), 8, DARK['muted'])

    return slide

# ── Slide 3 — Trend Chart ─────────────────────────────────────────────────────

def _slide_chart(prs, model_id, model_name, perspective, palette, config, result):
    slide_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(slide_layout)
    _set_slide_bg(slide, DARK['bg'])

    accent   = get_accent(perspective, palette)
    currency = config.get('currency', 'MXN')
    weekly   = result.get('weekly', [])

    W = 13.33

    # Top accent stripe
    _rect(slide, 0, 0, W, 0.06, accent)
    _text_box(slide, 0.35, 0.12, 3.0, 0.28,
              'EVOLUCIÓN TEMPORAL', 8, accent, bold=True)

    _text_box(slide, 0.35, 0.45, 12.5, 0.55,
              f'{model_name} — proyección semana a semana',
              16, DARK['white'], bold=True)

    _rect(slide, 0.35, 1.05, 12.6, 0.025, DARK['border'])

    # Chart background card
    _rect(slide, 0.35, 1.2, 12.6, 5.7, DARK['card'])

    if weekly:
        series_keys = CHART_SERIES.get(model_id, [])
        # Auto-detect if not configured
        if not series_keys:
            series_keys = [k for k in (weekly[0].keys() if weekly else [])
                           if k != 'week' and isinstance(weekly[0].get(k), (int, float))][:2]

        series_keys = [k for k in series_keys if weekly and k in weekly[0]][:2]

        if series_keys:
            categories = [f'S{w.get("week", i+1)}' for i, w in enumerate(weekly)]

            chart_data = ChartData()
            chart_data.categories = categories

            for sk in series_keys:
                values = tuple(float(w.get(sk, 0) or 0) for w in weekly)
                chart_data.add_series(_label(sk), values)

            chart_type = XL_CHART_TYPE.LINE if len(series_keys) == 1 else XL_CHART_TYPE.LINE
            graphic_frame = slide.shapes.add_chart(
                chart_type,
                Inches(0.6), Inches(1.4),
                Inches(12.1), Inches(5.3),
                chart_data,
            )
            chart = graphic_frame.chart

            # Style chart
            chart.chart_area.fill.solid()
            chart.chart_area.fill.fore_color.rgb = DARK['card']
            chart.plot_area.fill.solid()
            chart.plot_area.fill.fore_color.rgb = DARK['card']

            chart.has_legend = len(series_keys) > 1
            if chart.has_legend:
                chart.legend.position = XL_LEGEND_POSITION.BOTTOM
                chart.legend.include_in_layout = False

            # Style series colors
            series_colors = [accent, get_palette_highlight(palette)]
            for i, series in enumerate(chart.series):
                series.format.line.color.rgb = series_colors[i % len(series_colors)]
                series.format.line.width = Pt(2.5)
                series.smooth = True

            # Style axes
            for ax in list(chart.value_axis.__class__.__mro__):
                pass
            try:
                va = chart.value_axis
                va.tick_labels.font.color.rgb = DARK['secondary']
                va.tick_labels.font.size = Pt(9)
                va.format.line.color.rgb = DARK['border']
            except Exception:
                pass
            try:
                ca = chart.category_axis
                ca.tick_labels.font.color.rgb = DARK['secondary']
                ca.tick_labels.font.size = Pt(9)
                ca.format.line.color.rgb = DARK['border']
            except Exception:
                pass
        else:
            _text_box(slide, 0.6, 3.5, 12.0, 0.6,
                      'Sin datos semanales disponibles para este modelo.',
                      12, DARK['muted'], align=PP_ALIGN.CENTER)
    else:
        _text_box(slide, 0.6, 3.5, 12.0, 0.6,
                  'Corre el modelo para ver la proyección semanal.',
                  12, DARK['muted'], align=PP_ALIGN.CENTER)

    return slide

# ── Slide 4 — Scenarios Bear / Base / Bull ────────────────────────────────────

def _slide_scenarios(prs, model_id, model_name, perspective, palette, config, result):
    slide_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(slide_layout)
    _set_slide_bg(slide, DARK['bg'])

    accent   = get_accent(perspective, palette)
    currency = config.get('currency', 'MXN')
    summary  = result.get('summary', {})

    W = 13.33

    # Top stripe
    _rect(slide, 0, 0, W, 0.06, accent)
    _text_box(slide, 0.35, 0.12, 3.0, 0.28,
              'ESCENARIOS', 8, accent, bold=True)

    _text_box(slide, 0.35, 0.45, 12.5, 0.55,
              'Bear (×0.6) · Base (×1.0) · Bull (×1.4)',
              16, DARK['white'], bold=True)
    _rect(slide, 0.35, 1.05, 12.6, 0.025, DARK['border'])

    SCENARIOS = [
        ('BEAR',  0.6,  DARK['bear']),
        ('BASE',  1.0,  DARK['base']),
        ('BULL',  1.4,  DARK['bull']),
    ]

    numeric_kpis = [(k, v) for k, v in summary.items()
                    if isinstance(v, (int, float)) and not isinstance(v, bool)][:8]

    col_w  = 3.9
    col_xs = [0.35, 4.55, 8.75]

    for (label, mult, col_color), cx in zip(SCENARIOS, col_xs):
        # Column header card
        _rect(slide, cx, 1.15, col_w, 0.55, col_color)
        _text_box(slide, cx + 0.15, 1.22, col_w - 0.3, 0.4,
                  label, 18, DARK['white'], bold=True, align=PP_ALIGN.CENTER)

        multiplier_text = f'×{mult:.1f}'
        _text_box(slide, cx + col_w - 0.75, 1.22, 0.65, 0.4,
                  multiplier_text, 10, DARK['white'])

        # KPI rows
        row_y = 1.82
        for k, base_v in numeric_kpis:
            scaled = base_v * mult
            delta_pct = (mult - 1.0) * 100

            _rect(slide, cx, row_y, col_w, 0.6, DARK['card'])
            _rect(slide, cx, row_y, col_w, 0.025,
                  col_color if label == 'BASE' else DARK['border'])

            _text_box(slide, cx + 0.12, row_y + 0.04, col_w - 0.6, 0.22,
                      _label(k), 8, DARK['secondary'])

            formatted = _fmt(scaled, currency)
            _text_box(slide, cx + 0.12, row_y + 0.26, col_w - 0.3, 0.28,
                      formatted, 13, DARK['white'], bold=True)

            if label != 'BASE':
                delta_str = f'{delta_pct:+.0f}%'
                d_color = DARK['bull'] if delta_pct > 0 else DARK['bear']
                _text_box(slide, cx + col_w - 0.65, row_y + 0.28, 0.55, 0.22,
                          delta_str, 8, d_color, bold=True)

            row_y += 0.66

    return slide

# ── Slide 5 — Insights + Assumptions ─────────────────────────────────────────

def _slide_insights(prs, model_id, model_name, perspective, palette, config, result, insights):
    slide_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(slide_layout)
    _set_slide_bg(slide, DARK['bg'])

    accent    = get_accent(perspective, palette)
    highlight = get_palette_highlight(palette)
    currency  = config.get('currency', 'MXN')

    W = 13.33

    # Top stripe
    _rect(slide, 0, 0, W, 0.06, accent)
    _text_box(slide, 0.35, 0.12, 3.0, 0.28,
              'INSIGHTS & SUPUESTOS', 8, accent, bold=True)

    _text_box(slide, 0.35, 0.45, 7.5, 0.55,
              'Hallazgos clave del modelo',
              16, DARK['white'], bold=True)
    _rect(slide, 0.35, 1.05, 12.6, 0.025, DARK['border'])

    # Insight bullets (left panel)
    insight_colors = [accent, highlight, DARK['warn']]
    iy = 1.25
    for i, text in enumerate(insights[:4]):
        # Number circle
        _rect(slide, 0.35, iy, 0.38, 0.38,
              insight_colors[i % len(insight_colors)])
        _text_box(slide, 0.37, iy + 0.04, 0.34, 0.3,
                  str(i + 1), 13, DARK['white'], bold=True, align=PP_ALIGN.CENTER)

        # Insight text card
        _rect(slide, 0.85, iy - 0.04, 7.1, 0.52, DARK['card'])
        _text_box(slide, 0.98, iy + 0.0, 6.9, 0.5,
                  text, 10.5, DARK['primary'])
        iy += 0.7

    # Right panel — Assumptions
    _rect(slide, 8.35, 1.1, 4.6, 6.0, DARK['card'])
    _rect(slide, 8.35, 1.1, 4.6, 0.07, accent)

    _text_box(slide, 8.5, 1.2, 4.3, 0.35,
              'SUPUESTOS CLAVE', 9, accent, bold=True)

    scalar_keys = [(k, v) for k, v in config.items()
                   if isinstance(v, (int, float, str, bool))
                   and k not in ('palette', 'annotations', 'country')]
    ay = 1.65
    for k, v in scalar_keys[:12]:
        formatted_v = str(v) if isinstance(v, (str, bool)) else (
            f'{v*100:.0f}%' if isinstance(v, float) and abs(v) < 1 and v != 0
            else f'{v:,}' if isinstance(v, (int, float)) and abs(v) >= 100
            else f'{v:.2f}'
        )
        _text_box(slide, 8.5, ay, 2.4, 0.3,
                  k.replace('_', ' '), 8, DARK['secondary'])
        _text_box(slide, 11.0, ay, 1.7, 0.3,
                  formatted_v, 8, DARK['primary'], bold=True, align=PP_ALIGN.RIGHT)
        _rect(slide, 8.5, ay + 0.3, 4.2, 0.01, DARK['border'])
        ay += 0.34

    # Annotations if present
    annotations = config.get('annotations', '').strip()
    if annotations and iy < 5.5:
        iy += 0.3
        _rect(slide, 0.35, iy, 7.6, 0.06, DARK['border'])
        iy += 0.18
        _text_box(slide, 0.35, iy, 1.5, 0.28,
                  'NOTAS', 8, DARK['secondary'], bold=True)
        iy += 0.3
        _text_box(slide, 0.35, iy, 7.6, 1.5, annotations,
                  9, DARK['secondary'], wrap=True)

    # Footer
    _text_box(slide, 0.35, 7.15, 8.0, 0.25,
              'Estos resultados son outputs del modelo — validar con datos operacionales antes de tomar decisiones.',
              7.5, DARK['muted'])

    return slide

# ── Public API ────────────────────────────────────────────────────────────────

def generate_pptx_generic(
    result: dict,
    config: dict,
    model_id: str,
    model_name: str,
    perspective: str,
    insights: list,
    palette: str = 'navy',
) -> bytes:
    """
    Generate a 5-slide dark-theme PPTX for any wizard model.
    Returns raw bytes ready to stream as HTTP response.
    """
    prs = Presentation()
    prs.slide_width  = Emu(SLIDE_W)
    prs.slide_height = Emu(SLIDE_H)

    mid = model_id.upper()
    persp = perspective.upper() if perspective else 'D'

    _slide_cover    (prs, mid, model_name, persp, palette, config, insights)
    _slide_metrics  (prs, mid, model_name, persp, palette, config, result)
    _slide_chart    (prs, mid, model_name, persp, palette, config, result)
    _slide_scenarios(prs, mid, model_name, persp, palette, config, result)
    _slide_insights (prs, mid, model_name, persp, palette, config, result, insights)

    buf = io.BytesIO()
    prs.save(buf)
    buf.seek(0)
    return buf.read()
