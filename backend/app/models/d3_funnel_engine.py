"""
D3 — Funnel Conversion Engine
Applies sequential conversion rates to weekly visitors, with sensitivity analysis.
"""
from typing import List
from pydantic import BaseModel, Field


class FunnelStep(BaseModel):
    name: str
    conversion_rate: float = Field(gt=0, le=1)


class FunnelRequest(BaseModel):
    horizon_weeks: int = Field(default=12, ge=4, le=52)
    weekly_visitors: float = Field(default=100000, gt=0)
    aov: float = Field(default=290, gt=0)
    take_rate: float = Field(default=0.22, gt=0, le=1)
    currency: str = "MXN"
    country: str = "MX"
    visitor_growth_pct_per_week: float = Field(default=0.01, ge=0)
    funnel_steps: List[FunnelStep] = Field(
        default=[
            FunnelStep(name="App Open", conversion_rate=0.55),
            FunnelStep(name="Browse Restaurant", conversion_rate=0.40),
            FunnelStep(name="View Menu", conversion_rate=0.60),
            FunnelStep(name="Add to Cart", conversion_rate=0.45),
            FunnelStep(name="Place Order", conversion_rate=0.80),
        ]
    )
    palette: str = 'navy'


def run_funnel_forecast(req: FunnelRequest) -> dict:
    steps = req.funnel_steps
    horizon = req.horizon_weeks

    # Compute final conversion through all steps
    final_cvr = 1.0
    for s in steps:
        final_cvr *= s.conversion_rate

    # Weekly progression
    weekly_totals = []
    for w in range(horizon):
        visitors = req.weekly_visitors * ((1 + req.visitor_growth_pct_per_week) ** w)
        orders = visitors * final_cvr
        revenue = orders * req.aov * req.take_rate

        weekly_totals.append({
            "week": w + 1,
            "visitors_at_top": round(visitors, 0),
            "orders": round(orders, 1),
            "revenue": round(revenue, 2),
        })

    # Funnel breakdown (using week 1 volumes for illustration)
    base_visitors = req.weekly_visitors
    funnel_breakdown = []
    current_volume = base_visitors
    for i, step in enumerate(steps):
        out = current_volume * step.conversion_rate
        drop_pct = (1 - step.conversion_rate) * 100
        funnel_breakdown.append({
            "step": step.name,
            "volume_in": round(current_volume, 0),
            "volume_out": round(out, 0),
            "drop_off_pct": round(drop_pct, 1),
            "conversion_rate": step.conversion_rate,
        })
        current_volume = out

    # Sensitivity: what if each step improves by +10%?
    base_orders_w1 = req.weekly_visitors * final_cvr
    sensitivity = []
    for i, step in enumerate(steps):
        improved_cvr = 1.0
        for j, s in enumerate(steps):
            cr = s.conversion_rate * 1.10 if j == i else s.conversion_rate
            cr = min(cr, 1.0)
            improved_cvr *= cr
        improved_orders = req.weekly_visitors * improved_cvr
        incremental = improved_orders - base_orders_w1
        sensitivity.append({
            "step": step.name,
            "incremental_orders_if_10pct_improvement": round(incremental, 1),
            "pct_improvement": round(incremental / base_orders_w1 * 100, 1) if base_orders_w1 > 0 else 0,
        })

    total_revenue = sum(w["revenue"] for w in weekly_totals)
    total_orders = sum(w["orders"] for w in weekly_totals)

    return {
        "weekly": weekly_totals,
        "funnel_breakdown": funnel_breakdown,
        "sensitivity": sensitivity,
        "summary": {
            "total_orders": round(total_orders, 0),
            "total_revenue": round(total_revenue, 2),
            "overall_conversion_rate": round(final_cvr * 100, 2),
            "biggest_drop_step": max(funnel_breakdown, key=lambda x: x["drop_off_pct"])["step"],
            "horizon_weeks": horizon,
        },
    }
