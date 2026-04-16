"""
D4 — Frequency & Wallet Share Engine
Linear ramp from current to target frequency per segment over specified weeks.
"""
from typing import List
from pydantic import BaseModel, Field


class FrequencySegment(BaseModel):
    name: str
    users: float = Field(gt=0)
    current_freq_per_week: float = Field(gt=0)
    target_freq_per_week: float = Field(gt=0)
    weeks_to_achieve: int = Field(ge=1, le=52)


class FrequencyRequest(BaseModel):
    horizon_weeks: int = Field(default=12, ge=4, le=52)
    aov: float = Field(default=290, gt=0)
    take_rate: float = Field(default=0.22, gt=0, le=1)
    currency: str = "MXN"
    country: str = "MX"
    segments: List[FrequencySegment] = Field(
        default=[
            FrequencySegment(name="Baja Frecuencia", users=50000, current_freq_per_week=0.5, target_freq_per_week=1.0, weeks_to_achieve=8),
            FrequencySegment(name="Frecuencia Media", users=30000, current_freq_per_week=1.5, target_freq_per_week=2.0, weeks_to_achieve=6),
            FrequencySegment(name="Alta Frecuencia", users=15000, current_freq_per_week=3.0, target_freq_per_week=3.5, weeks_to_achieve=4),
        ]
    )


def run_frequency_forecast(req: FrequencyRequest) -> dict:
    horizon = req.horizon_weeks
    rev_per_order = req.aov * req.take_rate

    segment_weekly: dict[str, list] = {seg.name: [] for seg in req.segments}
    weekly_totals = []

    for w in range(horizon):
        total_orders = 0.0
        base_orders = 0.0
        incremental = 0.0
        by_seg = {}

        for seg in req.segments:
            # Linear ramp
            if w < seg.weeks_to_achieve:
                freq = seg.current_freq_per_week + (seg.target_freq_per_week - seg.current_freq_per_week) * (w / seg.weeks_to_achieve)
            else:
                freq = seg.target_freq_per_week

            orders = seg.users * freq
            base_ord = seg.users * seg.current_freq_per_week
            incr = orders - base_ord

            by_seg[seg.name] = {
                "orders": round(orders, 0),
                "freq": round(freq, 3),
                "incremental": round(incr, 0),
            }
            total_orders += orders
            base_orders += base_ord
            incremental += incr

        revenue = total_orders * rev_per_order
        weekly_totals.append({
            "week": w + 1,
            "total_orders": round(total_orders, 0),
            "base_orders": round(base_orders, 0),
            "incremental": round(incremental, 0),
            "revenue": round(revenue, 2),
            "by_segment": by_seg,
        })

    total_incremental = sum(w["incremental"] for w in weekly_totals)
    total_revenue = sum(w["revenue"] for w in weekly_totals)

    # Per-segment summary
    seg_summary = []
    for seg in req.segments:
        total_incremental_seg = sum(
            w["by_segment"][seg.name]["incremental"] for w in weekly_totals
        )
        seg_summary.append({
            "name": seg.name,
            "users": seg.users,
            "current_freq": seg.current_freq_per_week,
            "target_freq": seg.target_freq_per_week,
            "total_incremental_orders": round(total_incremental_seg, 0),
            "incremental_revenue": round(total_incremental_seg * rev_per_order, 2),
        })

    return {
        "weekly": weekly_totals,
        "by_segment": seg_summary,
        "summary": {
            "total_incremental_orders": round(total_incremental, 0),
            "total_revenue": round(total_revenue, 2),
            "incremental_revenue": round(total_incremental * rev_per_order, 2),
            "horizon_weeks": horizon,
        },
    }
