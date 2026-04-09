"""Chart builders for the Excel report."""
from openpyxl.chart import BarChart, LineChart, Reference
from openpyxl.chart.series import SeriesLabel


def add_waterfall_chart(ws, data_min_row, data_max_row, col_week, col_base, col_promo, col_acq, col_total, chart_anchor="A20"):
    """Stacked bar chart showing base + promo + acquisition = total."""
    chart = BarChart()
    chart.type = "col"
    chart.grouping = "stacked"
    chart.title = "Order Waterfall by Week"
    chart.y_axis.title = "Orders"
    chart.x_axis.title = "Week"
    chart.style = 10
    chart.width = 24
    chart.height = 14

    # Base orders series
    base_ref = Reference(ws, min_col=col_base, min_row=data_min_row - 1, max_row=data_max_row)
    base_series = base_ref
    chart.add_data(base_ref, titles_from_data=True)

    # Promo series
    promo_ref = Reference(ws, min_col=col_promo, min_row=data_min_row - 1, max_row=data_max_row)
    chart.add_data(promo_ref, titles_from_data=True)

    # Acquisition series
    acq_ref = Reference(ws, min_col=col_acq, min_row=data_min_row - 1, max_row=data_max_row)
    chart.add_data(acq_ref, titles_from_data=True)

    # Category labels (weeks)
    cats = Reference(ws, min_col=col_week, min_row=data_min_row, max_row=data_max_row)
    chart.set_categories(cats)

    # Colors
    if chart.series:
        chart.series[0].graphicalProperties.solidFill = "1F4E79"  # Base: navy
        if len(chart.series) > 1:
            chart.series[1].graphicalProperties.solidFill = "00B050"  # Promo: green
        if len(chart.series) > 2:
            chart.series[2].graphicalProperties.solidFill = "FFC000"  # Acq: amber

    ws.add_chart(chart, chart_anchor)
    return chart


def add_line_chart(ws, data_min_row, data_max_row, col_week, col_total, col_upside=None, col_downside=None, chart_anchor="M20"):
    """Line chart for total orders over time with optional scenario bands."""
    chart = LineChart()
    chart.title = "Weekly Order Forecast"
    chart.y_axis.title = "Total Orders"
    chart.x_axis.title = "Week"
    chart.style = 10
    chart.width = 24
    chart.height = 14

    total_ref = Reference(ws, min_col=col_total, min_row=data_min_row - 1, max_row=data_max_row)
    chart.add_data(total_ref, titles_from_data=True)

    if col_upside:
        up_ref = Reference(ws, min_col=col_upside, min_row=data_min_row - 1, max_row=data_max_row)
        chart.add_data(up_ref, titles_from_data=True)

    if col_downside:
        down_ref = Reference(ws, min_col=col_downside, min_row=data_min_row - 1, max_row=data_max_row)
        chart.add_data(down_ref, titles_from_data=True)

    cats = Reference(ws, min_col=col_week, min_row=data_min_row, max_row=data_max_row)
    chart.set_categories(cats)

    if chart.series:
        chart.series[0].graphicalProperties.line.solidFill = "1F4E79"
        chart.series[0].graphicalProperties.line.width = 25000
        if len(chart.series) > 1:
            chart.series[1].graphicalProperties.line.solidFill = "00B050"
            chart.series[1].graphicalProperties.line.dashDot = "dash"
        if len(chart.series) > 2:
            chart.series[2].graphicalProperties.line.solidFill = "FF0000"
            chart.series[2].graphicalProperties.line.dashDot = "dash"

    ws.add_chart(chart, chart_anchor)
    return chart
