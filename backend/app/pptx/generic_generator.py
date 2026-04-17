"""
Forecast Studio PPTX Generator — clean white-background deck.
BCG Smart Simplicity style: white bg, strong accent, big numbers.

5 slides per model:
  1. Cover
  2. Headline Metrics (2×2 bento)
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
    SLIDE_W, SLIDE_H, LIGHT, PERSPECTIVE, PERSPECTIVE_LIGHT, PERSPECTIVE_LABEL,
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

def _rect(slide, x, y, w, h, fill: RGBColor, line_color: Optional[RGBColor] = None, line_w: float = 0.5):
    shape = slide.shapes.add_shape(1, Inches(x), Inches(y), Inches(w), Inches(h))
    _solid_fill(shape, fill)
    if line_color:
        shape.line.color.rgb = line_color
        shape.line.width = Pt(line_w)
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
    _set_slide_bg(slide, LIGHT['bg'])

    accent   = get_accent(perspective, palette)
    currency = config.get('currency', 'MXN')
    horizon  = config.get('horizon_weeks', 12)

    W = 13.33
    H = 7.5

    # ── Left accent spine (thick colored bar) ─────────────────────────────────
    _rect(slide, 0, 0, 0.55, H, accent)

    # ── Very thin top border line ─────────────────────────────────────────────
    _rect(slide, 0.55, 0, W - 0.55, 0.04, LIGHT['border'])

    # ── Perspective badge ─────────────────────────────────────────────────────
    badge_label = f'{perspective} — {PERSPECTIVE_LABEL.get(perspective, perspective)}'
    _text_box(slide, 0.8, 0.22, 4.0, 0.32,
              badge_label, 8.5, accent, bold=True)

    # ── Model ID — giant ──────────────────────────────────────────────────────
    _text_box(slide, 0.75, 0.62, 5.0, 2.0,
              model_id, 108, accent, bold=True)

    # ── Horizontal rule ───────────────────────────────────────────────────────
    _rect(slide, 0.8, 2.72, 11.8, 0.025, accent)

    # ── Model name ────────────────────────────────────────────────────────────
    _text_box(slide, 0.8, 2.82, 11.5, 0.75,
              model_name, 26, LIGHT['headline'], bold=True)

    # ── Tagline (first insight) ───────────────────────────────────────────────
    tagline = insights[0] if insights else f'Proyección {horizon} semanas'
    if len(tagline) > 100:
        tagline = tagline[:98] + '…'
    _text_box(slide, 0.8, 3.62, 11.2, 0.7,
              tagline, 13, LIGHT['secondary'], italic=True)

    # ── Config pills row ──────────────────────────────────────────────────────
    pills = [
        f'{horizon} semanas',
        f'AOV {currency} {config.get("aov", 0):,.0f}',
        f'Take rate {config.get("take_rate", 0)*100:.0f}%',
    ]
    pill_x = 0.8
    for pill in pills:
        w = len(pill) * 0.088 + 0.28
        _rect(slide, pill_x, 4.55, w, 0.34,
              LIGHT['surface'], line_color=LIGHT['border'])
        _text_box(slide, pill_x + 0.1, 4.58, w - 0.12, 0.28,
                  pill, 8.5, LIGHT['secondary'])
        pill_x += w + 0.14

    # ── Bottom bar ────────────────────────────────────────────────────────────
    _rect(slide, 0.55, H - 0.5, W - 0.55, 0.5, LIGHT['surface'])
    _rect(slide, 0.55, H - 0.5, W - 0.55, 0.025, LIGHT['border'])

    _text_box(slide, 0.8, H - 0.42, 5.0, 0.32,
              'Forecast Studio', 8.5, LIGHT['muted'])
    _text_box(slide, 9.5, H - 0.42, 3.5, 0.32,
              datetime.utcnow().strftime('%B %Y'), 8.5, LIGHT['muted'],
              align=PP_ALIGN.RIGHT)

    return slide

# ── Slide 2 — Headline Metrics (2×2 bento) ───────────────────────────────────

def _slide_metrics(prs, model_id, model_name, perspective, palette, config, result, insights=None):
    slide_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(slide_layout)
    _set_slide_bg(slide, LIGHT['bg'])

    accent   = get_accent(perspective, palette)
    currency = config.get('currency', 'MXN')
    summary  = result.get('summary', {})

    W = 13.33

    # ── Left accent spine ─────────────────────────────────────────────────────
    _rect(slide, 0, 0, 0.18, 7.5, accent)

    # ── Eyebrow label ─────────────────────────────────────────────────────────
    _text_box(slide, 0.35, 0.18, 3.0, 0.28,
              'MÉTRICAS CLAVE', 7.5, accent, bold=True)

    # ── Action title ──────────────────────────────────────────────────────────
    hypothesis = (insights[0] if insights and len(insights) > 0 else None) or f'{model_name} — resumen ejecutivo'
    if len(hypothesis) > 90:
        hypothesis = hypothesis[:88] + '…'
    _text_box(slide, 0.35, 0.5, 12.6, 0.6,
              hypothesis, 16, LIGHT['headline'], bold=True)

    # ── Thin divider ──────────────────────────────────────────────────────────
    _rect(slide, 0.35, 1.15, 12.6, 0.02, LIGHT['border'])

    # ── KPI cards ─────────────────────────────────────────────────────────────
    primary_kpis = HEADLINE_KPIS.get(model_id, list(summary.keys())[:4])
    non_null = [(k, summary[k]) for k in primary_kpis if k in summary and summary[k] is not None]
    if not non_null:
        non_null = [(k, v) for k, v in summary.items()
                    if isinstance(v, (int, float, bool, str))][:4]

    cards = non_null[:4]
    while len(cards) < 4:
        cards.append(('—', None))

    positions = [
        (0.35, 1.30),   # top-left
        (6.85, 1.30),   # top-right
        (0.35, 4.15),   # bottom-left
        (6.85, 4.15),   # bottom-right
    ]
    card_w, card_h = 6.1, 2.6

    highlight = get_palette_highlight(palette)

    for i, ((key, val), (cx, cy)) in enumerate(zip(cards, positions)):
        # Card: white with light border
        _rect(slide, cx, cy, card_w, card_h,
              LIGHT['surface'], line_color=LIGHT['border'])

        # Left accent strip on card
        bar_color = accent if i % 2 == 0 else highlight
        _rect(slide, cx, cy, 0.06, card_h, bar_color)

        # Label — small, uppercase, gray
        lbl = _label(key)
        _text_box(slide, cx + 0.2, cy + 0.22, card_w - 0.35, 0.28,
                  lbl.upper(), 8, LIGHT['muted'], bold=True)

        # Value — big number, dark
        formatted = _fmt(val, currency)
        font_sz = 44 if len(formatted) <= 8 else 32 if len(formatted) <= 14 else 22
        num_color = bar_color if i == 0 else LIGHT['headline']
        _text_box(slide, cx + 0.2, cy + 0.55, card_w - 0.35, 1.5,
                  formatted, font_sz, num_color, bold=True)

    # ── Footer ────────────────────────────────────────────────────────────────
    _rect(slide, 0, 7.3, W, 0.2, LIGHT['surface'])
    _rect(slide, 0, 7.3, W, 0.02, LIGHT['border'])
    _text_box(slide, 0.35, 7.33, 8.0, 0.15,
              'Forecast Studio', 7, LIGHT['muted'])

    return slide

# ── Slide 3 — Trend Chart ─────────────────────────────────────────────────────

def _slide_chart(prs, model_id, model_name, perspective, palette, config, result, insights=None):
    slide_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(slide_layout)
    _set_slide_bg(slide, LIGHT['bg'])

    accent   = get_accent(perspective, palette)
    currency = config.get('currency', 'MXN')
    weekly   = result.get('weekly', [])

    W = 13.33

    # ── Left accent spine ─────────────────────────────────────────────────────
    _rect(slide, 0, 0, 0.18, 7.5, accent)

    # ── Eyebrow + title ───────────────────────────────────────────────────────
    _text_box(slide, 0.35, 0.18, 3.5, 0.28,
              'EVOLUCIÓN TEMPORAL', 7.5, accent, bold=True)

    hypothesis = (insights[1] if insights and len(insights) > 1 else None) or f'{model_name} — proyección semana a semana'
    if len(hypothesis) > 90:
        hypothesis = hypothesis[:88] + '…'
    _text_box(slide, 0.35, 0.5, 12.6, 0.58,
              hypothesis, 16, LIGHT['headline'], bold=True)

    _rect(slide, 0.35, 1.15, 12.6, 0.02, LIGHT['border'])

    # ── Chart area ────────────────────────────────────────────────────────────
    if weekly:
        series_keys = CHART_SERIES.get(model_id, [])
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

            graphic_frame = slide.shapes.add_chart(
                XL_CHART_TYPE.LINE,
                Inches(0.4), Inches(1.32),
                Inches(12.55), Inches(5.78),
                chart_data,
            )
            chart = graphic_frame.chart

            # White chart background
            try:
                chart.chart_area.fill.solid()
                chart.chart_area.fill.fore_color.rgb = LIGHT['bg']
            except Exception:
                pass
            try:
                chart.plot_area.fill.solid()
                chart.plot_area.fill.fore_color.rgb = LIGHT['bg']
            except Exception:
                pass

            chart.has_legend = len(series_keys) > 1
            if chart.has_legend:
                chart.legend.position = XL_LEGEND_POSITION.BOTTOM
                chart.legend.include_in_layout = False

            # Series colors — vivid on white
            series_colors = [accent, get_palette_highlight(palette)]
            for i, series in enumerate(chart.series):
                series.format.line.color.rgb = series_colors[i % len(series_colors)]
                series.format.line.width = Pt(2.5)
                series.smooth = True

            # Axis styling — dark text on white
            try:
                va = chart.value_axis
                va.tick_labels.font.color.rgb = LIGHT['secondary']
                va.tick_labels.font.size = Pt(9)
                va.format.line.color.rgb = LIGHT['border']
            except Exception:
                pass
            try:
                ca = chart.category_axis
                ca.tick_labels.font.color.rgb = LIGHT['secondary']
                ca.tick_labels.font.size = Pt(9)
                ca.format.line.color.rgb = LIGHT['border']
            except Exception:
                pass
        else:
            _text_box(slide, 0.6, 3.8, 12.0, 0.6,
                      'Sin datos semanales disponibles para este modelo.',
                      12, LIGHT['muted'], align=PP_ALIGN.CENTER)
    else:
        _text_box(slide, 0.6, 3.8, 12.0, 0.6,
                  'Corre el modelo para ver la proyección semanal.',
                  12, LIGHT['muted'], align=PP_ALIGN.CENTER)

    # ── Footer ────────────────────────────────────────────────────────────────
    _rect(slide, 0, 7.3, W, 0.2, LIGHT['surface'])
    _rect(slide, 0, 7.3, W, 0.02, LIGHT['border'])
    _text_box(slide, 0.35, 7.33, 8.0, 0.15, 'Forecast Studio', 7, LIGHT['muted'])

    return slide

# ── Slide 4 — Scenarios Bear / Base / Bull ────────────────────────────────────

def _slide_scenarios(prs, model_id, model_name, perspective, palette, config, result, insights=None):
    slide_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(slide_layout)
    _set_slide_bg(slide, LIGHT['bg'])

    accent   = get_accent(perspective, palette)
    currency = config.get('currency', 'MXN')
    summary  = result.get('summary', {})

    W = 13.33

    # ── Left accent spine ─────────────────────────────────────────────────────
    _rect(slide, 0, 0, 0.18, 7.5, accent)

    # ── Eyebrow + title ───────────────────────────────────────────────────────
    _text_box(slide, 0.35, 0.18, 3.0, 0.28,
              'ESCENARIOS', 7.5, accent, bold=True)

    hypothesis = (insights[2] if insights and len(insights) > 2 else None) or 'Bear (×0.6) · Base (×1.0) · Bull (×1.4)'
    if len(hypothesis) > 90:
        hypothesis = hypothesis[:88] + '…'
    _text_box(slide, 0.35, 0.5, 12.6, 0.58,
              hypothesis, 16, LIGHT['headline'], bold=True)
    _rect(slide, 0.35, 1.15, 12.6, 0.02, LIGHT['border'])

    # ── Scenario columns ──────────────────────────────────────────────────────
    SCENARIOS = [
        ('BEAR',  0.6,  LIGHT['bear']),
        ('BASE',  1.0,  accent),
        ('BULL',  1.4,  LIGHT['bull']),
    ]

    numeric_kpis = [(k, v) for k, v in summary.items()
                    if isinstance(v, (int, float)) and not isinstance(v, bool)][:7]

    col_w  = 4.0
    col_xs = [0.35, 4.62, 8.9]

    for (label, mult, col_color), cx in zip(SCENARIOS, col_xs):
        # Column header — colored, white text
        _rect(slide, cx, 1.28, col_w, 0.62, col_color)
        _text_box(slide, cx + 0.15, 1.33, col_w - 0.5, 0.32,
                  label, 18, LIGHT['bg'], bold=True)
        mult_txt = f'×{mult:.1f}'
        _text_box(slide, cx + col_w - 0.72, 1.35, 0.6, 0.26,
                  mult_txt, 10, LIGHT['bg'], bold=True)

        # KPI rows
        row_y = 2.02
        for j, (k, base_v) in enumerate(numeric_kpis):
            scaled = base_v * mult
            delta_pct = (mult - 1.0) * 100

            # Alternating row bg
            row_fill = LIGHT['surface'] if j % 2 == 0 else LIGHT['bg']
            _rect(slide, cx, row_y, col_w, 0.62, row_fill,
                  line_color=LIGHT['border'], line_w=0.25)

            # Left colored strip on each row for BASE column
            if label == 'BASE':
                _rect(slide, cx, row_y, 0.04, 0.62, col_color)

            _text_box(slide, cx + 0.14, row_y + 0.05, col_w - 0.6, 0.22,
                      _label(k), 7.5, LIGHT['muted'])

            formatted = _fmt(scaled, currency)
            _text_box(slide, cx + 0.14, row_y + 0.28, col_w - 0.35, 0.28,
                      formatted, 13, LIGHT['headline'], bold=True)

            if label != 'BASE':
                delta_str = f'{delta_pct:+.0f}%'
                d_color = LIGHT['bull'] if delta_pct > 0 else LIGHT['bear']
                _text_box(slide, cx + col_w - 0.7, row_y + 0.30, 0.58, 0.22,
                          delta_str, 8, d_color, bold=True)

            row_y += 0.64

    # ── Footer ────────────────────────────────────────────────────────────────
    _rect(slide, 0, 7.3, W, 0.2, LIGHT['surface'])
    _rect(slide, 0, 7.3, W, 0.02, LIGHT['border'])
    _text_box(slide, 0.35, 7.33, 8.0, 0.15, 'Forecast Studio', 7, LIGHT['muted'])

    return slide

# ── Slide 5 — Insights + Assumptions ─────────────────────────────────────────

def _slide_insights(prs, model_id, model_name, perspective, palette, config, result, insights):
    slide_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(slide_layout)
    _set_slide_bg(slide, LIGHT['bg'])

    accent    = get_accent(perspective, palette)
    highlight = get_palette_highlight(palette)
    currency  = config.get('currency', 'MXN')

    W = 13.33

    # ── Left accent spine ─────────────────────────────────────────────────────
    _rect(slide, 0, 0, 0.18, 7.5, accent)

    # ── Eyebrow + title ───────────────────────────────────────────────────────
    _text_box(slide, 0.35, 0.18, 4.0, 0.28,
              'INSIGHTS & SUPUESTOS', 7.5, accent, bold=True)

    hypothesis = (insights[3] if insights and len(insights) > 3 else None) or 'Hallazgos clave del modelo'
    if len(hypothesis) > 90:
        hypothesis = hypothesis[:88] + '…'
    _text_box(slide, 0.35, 0.5, 7.8, 0.58,
              hypothesis, 16, LIGHT['headline'], bold=True)
    _rect(slide, 0.35, 1.15, 12.6, 0.02, LIGHT['border'])

    # ── Insight bullets (left panel) ──────────────────────────────────────────
    insight_colors = [accent, highlight, LIGHT['warn'], LIGHT['bear']]
    iy = 1.32
    for i, text in enumerate(insights[:4]):
        ic = insight_colors[i % len(insight_colors)]

        # Left border strip (instead of circle)
        _rect(slide, 0.35, iy, 0.055, 0.62, ic)

        # Card
        _rect(slide, 0.42, iy, 7.5, 0.62,
              LIGHT['surface'], line_color=LIGHT['border'], line_w=0.25)

        # Number badge
        _rect(slide, 0.42, iy, 0.42, 0.62, ic)
        _text_box(slide, 0.42, iy + 0.15, 0.42, 0.32,
                  str(i + 1), 14, LIGHT['bg'], bold=True, align=PP_ALIGN.CENTER)

        # Insight text
        _text_box(slide, 0.92, iy + 0.08, 6.95, 0.5,
                  text, 10.5, LIGHT['primary'])

        iy += 0.74

    # ── Right panel — Assumptions ─────────────────────────────────────────────
    _rect(slide, 8.25, 1.28, 4.85, 5.85,
          LIGHT['surface'], line_color=LIGHT['border'])
    _rect(slide, 8.25, 1.28, 4.85, 0.055, accent)

    _text_box(slide, 8.42, 1.38, 4.5, 0.32,
              'SUPUESTOS CLAVE', 8, accent, bold=True)

    # Thin divider under header
    _rect(slide, 8.42, 1.72, 4.5, 0.015, LIGHT['border'])

    scalar_keys = [(k, v) for k, v in config.items()
                   if isinstance(v, (int, float, str, bool))
                   and k not in ('palette', 'annotations', 'country')]
    ay = 1.78
    for k, v in scalar_keys[:14]:
        formatted_v = str(v) if isinstance(v, (str, bool)) else (
            f'{v*100:.0f}%' if isinstance(v, float) and abs(v) < 1 and v != 0
            else f'{v:,}' if isinstance(v, (int, float)) and abs(v) >= 100
            else f'{v:.2f}'
        )
        _text_box(slide, 8.42, ay, 2.6, 0.28,
                  k.replace('_', ' '), 8, LIGHT['secondary'])
        _text_box(slide, 11.12, ay, 1.8, 0.28,
                  formatted_v, 8, LIGHT['headline'], bold=True, align=PP_ALIGN.RIGHT)
        _rect(slide, 8.42, ay + 0.28, 4.5, 0.012, LIGHT['border'])
        ay += 0.33

    # ── Annotations ───────────────────────────────────────────────────────────
    annotations = config.get('annotations', '').strip()
    if annotations and iy < 5.6:
        iy += 0.25
        _rect(slide, 0.35, iy, 7.6, 0.02, LIGHT['border'])
        iy += 0.2
        _text_box(slide, 0.35, iy, 1.5, 0.28,
                  'NOTAS', 7.5, LIGHT['secondary'], bold=True)
        iy += 0.28
        _text_box(slide, 0.35, iy, 7.6, 1.5, annotations,
                  9, LIGHT['secondary'], wrap=True)

    # ── Footer ────────────────────────────────────────────────────────────────
    _rect(slide, 0, 7.3, W, 0.2, LIGHT['surface'])
    _rect(slide, 0, 7.3, W, 0.02, LIGHT['border'])
    _text_box(slide, 0.35, 7.33, 10.0, 0.15,
              'Estos resultados son outputs del modelo — validar con datos operacionales antes de tomar decisiones.',
              7, LIGHT['muted'])

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
    Generate a 5-slide white-background PPTX for any wizard model.
    Returns raw bytes ready to stream as HTTP response.
    """
    prs = Presentation()
    prs.slide_width  = Emu(SLIDE_W)
    prs.slide_height = Emu(SLIDE_H)

    mid   = model_id.upper()
    persp = perspective.upper() if perspective else 'D'

    _slide_cover    (prs, mid, model_name, persp, palette, config, insights)
    _slide_metrics  (prs, mid, model_name, persp, palette, config, result, insights)
    _slide_chart    (prs, mid, model_name, persp, palette, config, result, insights)
    _slide_scenarios(prs, mid, model_name, persp, palette, config, result, insights)
    _slide_insights (prs, mid, model_name, persp, palette, config, result, insights)

    buf = io.BytesIO()
    prs.save(buf)
    buf.seek(0)
    return buf.read()
