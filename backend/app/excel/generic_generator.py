"""
Generic MBB-grade Excel generator for all wizard models (D2-P5).
Generates a 2-tab workbook: Resumen Ejecutivo + Datos Detallados.
"""
import io
from datetime import datetime

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

from .theme import get_palette


def _fill(hex_color: str) -> PatternFill:
    return PatternFill(start_color=hex_color, end_color=hex_color, fill_type="solid")


def _header_font(color: str = "FFFFFF", size: int = 11, bold: bool = True) -> Font:
    return Font(name="Calibri", size=size, bold=bold, color=color)


def _body_font(size: int = 10, bold: bool = False) -> Font:
    return Font(name="Calibri", size=size, bold=bold, color="222222")


def _auto_width(ws, max_width: int = 40):
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            try:
                val = str(cell.value) if cell.value is not None else ""
                max_len = max(max_len, len(val))
            except Exception:
                pass
        ws.column_dimensions[col_letter].width = min(max_len + 3, max_width)


def _write_header_row(ws, row: int, values: list, palette: dict):
    primary = palette['primary']
    font_color = palette['font_header']
    for col, val in enumerate(values, start=1):
        cell = ws.cell(row=row, column=col, value=val)
        cell.fill = _fill(primary)
        cell.font = _header_font(color=font_color)
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    ws.row_dimensions[row].height = 22


def _write_section_title(ws, row: int, title: str, col_span: int, palette: dict):
    secondary = palette['secondary']
    font_color = palette['font_header']
    cell = ws.cell(row=row, column=1, value=title)
    cell.fill = _fill(secondary)
    cell.font = _header_font(color=font_color, size=10)
    cell.alignment = Alignment(horizontal="left", vertical="center")
    if col_span > 1:
        ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=col_span)
    ws.row_dimensions[row].height = 18


def _fmt_value(v) -> str:
    if isinstance(v, float):
        if abs(v) < 10:
            return f"{v:.2f}"
        return f"{v:,.0f}"
    if isinstance(v, int):
        return f"{v:,}"
    return str(v) if v is not None else ""


def generate_generic_excel(
    result: dict,
    model_name: str,
    model_id: str,
    config: dict,
    palette_key: str = 'navy',
) -> bytes:
    """
    Generate a 2-tab Excel workbook for any wizard model result.
    Returns bytes suitable for HTTP response.
    """
    palette = get_palette(palette_key)
    primary = palette['primary']
    light = palette['light']
    accent = palette['accent']
    font_color = palette['font_header']

    wb = Workbook()
    wb.remove(wb.active)

    # ── Tab 1: Resumen Ejecutivo ──────────────────────────────────────────────

    ws1 = wb.create_sheet("Resumen Ejecutivo")
    ws1.sheet_view.showGridLines = False

    row = 1
    # Title bar
    title_cell = ws1.cell(row=row, column=1, value=f"{model_id} — {model_name}")
    title_cell.fill = _fill(primary)
    title_cell.font = Font(name="Calibri", size=14, bold=True, color=font_color)
    title_cell.alignment = Alignment(horizontal="left", vertical="center")
    ws1.merge_cells(start_row=row, start_column=1, end_row=row, end_column=6)
    ws1.row_dimensions[row].height = 30
    row += 1

    # Subtitle with date
    sub_cell = ws1.cell(row=row, column=1, value=f"Generado: {datetime.now().strftime('%d/%m/%Y %H:%M')}  |  Forecast Studio")
    sub_cell.fill = _fill(palette['secondary'])
    sub_cell.font = _header_font(color=font_color, size=9, bold=False)
    sub_cell.alignment = Alignment(horizontal="left", vertical="center")
    ws1.merge_cells(start_row=row, start_column=1, end_row=row, end_column=6)
    ws1.row_dimensions[row].height = 16
    row += 2

    # Key metrics section
    summary = result.get('summary', {})
    if summary:
        _write_section_title(ws1, row, "Metricas Clave", 4, palette)
        row += 1
        _write_header_row(ws1, row, ["Metrica", "Valor"], palette)
        row += 1
        for i, (k, v) in enumerate(summary.items()):
            bg = light if i % 2 == 0 else "FFFFFF"
            k_cell = ws1.cell(row=row, column=1, value=str(k).replace('_', ' ').title())
            k_cell.fill = _fill(bg)
            k_cell.font = _body_font(bold=True)
            v_cell = ws1.cell(row=row, column=2, value=_fmt_value(v))
            v_cell.fill = _fill(bg)
            v_cell.font = _body_font()
            row += 1
        row += 1

    # Config params section
    if config:
        _write_section_title(ws1, row, "Parametros de Configuracion", 4, palette)
        row += 1
        _write_header_row(ws1, row, ["Parametro", "Valor"], palette)
        row += 1
        skip_keys = {'palette', 'channels', 'segments', 'campaigns', 'buckets', 'tiers',
                     'events', 'restaurant_types', 'zone_configs', 'signals'}
        for i, (k, v) in enumerate(config.items()):
            if k in skip_keys or isinstance(v, (list, dict)):
                continue
            bg = light if i % 2 == 0 else "FFFFFF"
            k_cell = ws1.cell(row=row, column=1, value=str(k).replace('_', ' ').title())
            k_cell.fill = _fill(bg)
            k_cell.font = _body_font(bold=True)
            v_cell = ws1.cell(row=row, column=2, value=_fmt_value(v))
            v_cell.fill = _fill(bg)
            v_cell.font = _body_font()
            row += 1

    _auto_width(ws1)

    # ── Tab 2: Datos Detallados ───────────────────────────────────────────────

    ws2 = wb.create_sheet("Datos Detallados")
    ws2.sheet_view.showGridLines = False

    row2 = 1
    title2 = ws2.cell(row=row2, column=1, value=f"Datos Detallados — {model_name}")
    title2.fill = _fill(primary)
    title2.font = Font(name="Calibri", size=12, bold=True, color=font_color)
    title2.alignment = Alignment(horizontal="left", vertical="center")
    ws2.merge_cells(start_row=row2, start_column=1, end_row=row2, end_column=12)
    ws2.row_dimensions[row2].height = 26
    row2 += 2

    # Find the main data list in result
    data_list = None
    data_key = None
    for key in ('weeks', 'items', 'cohorts', 'segments', 'tiers', 'zones', 'channels',
                'restaurants', 'couriers', 'campaigns', 'periods'):
        val = result.get(key)
        if isinstance(val, list) and len(val) > 0:
            data_list = val
            data_key = key
            break

    # Fallback: find any list value
    if data_list is None:
        for k, v in result.items():
            if isinstance(v, list) and len(v) > 0 and k != 'summary':
                data_list = v
                data_key = k
                break

    if data_list and isinstance(data_list[0], dict):
        headers = list(data_list[0].keys())
        _write_header_row(ws2, row2, [h.replace('_', ' ').title() for h in headers], palette)
        ws2.freeze_panes = f"A{row2 + 1}"
        row2 += 1
        for i, item in enumerate(data_list):
            bg = light if i % 2 == 0 else "FFFFFF"
            is_accent_row = False
            # Highlight accent on first and last rows
            if i == 0 or i == len(data_list) - 1:
                is_accent_row = True
            for col, hk in enumerate(headers, start=1):
                val = item.get(hk)
                cell = ws2.cell(row=row2, column=col, value=val)
                cell.fill = _fill(accent + "22") if is_accent_row else _fill(bg)
                cell.font = _body_font(bold=is_accent_row)
                if isinstance(val, float):
                    if abs(val) >= 1000:
                        cell.number_format = '#,##0'
                    elif abs(val) <= 1:
                        cell.number_format = '0.00%' if 'pct' in hk or 'rate' in hk else '0.000'
                    else:
                        cell.number_format = '#,##0.00'
            row2 += 1
    else:
        no_data = ws2.cell(row=row2, column=1, value="No hay datos detallados disponibles para este modelo.")
        no_data.font = _body_font()

    _auto_width(ws2)

    # Save and return bytes
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf.read()
