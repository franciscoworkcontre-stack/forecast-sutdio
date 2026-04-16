"""
D2 — Cohort Retention & LTV Engine
Calculates LTV per channel, payback week, and weekly revenue by cohort.
"""
from typing import List
from pydantic import BaseModel, Field


class ChannelInput(BaseModel):
    name: str
    cac: float = Field(gt=0)
    weekly_new_users: float = Field(gt=0)


class CohortRequest(BaseModel):
    horizon_weeks: int = Field(default=12, ge=4, le=52)
    aov: float = Field(default=290, gt=0)
    take_rate: float = Field(default=0.22, gt=0, le=1)
    currency: str = "MXN"
    country: str = "MX"
    channels: List[ChannelInput] = Field(
        default=[
            ChannelInput(name="Paid Search", cac=180, weekly_new_users=500),
            ChannelInput(name="Social Media", cac=120, weekly_new_users=800),
            ChannelInput(name="Referral", cac=60, weekly_new_users=300),
        ]
    )
    retention_curve: List[float] = Field(
        default=[1.0, 0.65, 0.55, 0.45, 0.38, 0.32, 0.27, 0.23],
        description="Weekly retention rates, index=weeks since acquisition"
    )
    orders_per_active_per_week: float = Field(default=1.2, gt=0)


def run_cohort_forecast(req: CohortRequest) -> dict:
    horizon = req.horizon_weeks
    curve = req.retention_curve
    curve_len = len(curve)
    rev_per_order = req.aov * req.take_rate

    # For each week, accumulate revenue from all cohort slices
    weekly_totals: List[dict] = []
    channel_weekly: dict[str, List[float]] = {ch.name: [0.0] * horizon for ch in req.channels}

    for week_idx in range(horizon):
        week_total = 0.0
        for ch in req.channels:
            week_rev = 0.0
            # Cohorts that started in weeks 0..week_idx
            for cohort_start in range(week_idx + 1):
                age = week_idx - cohort_start  # weeks since acquisition
                ret = curve[age] if age < curve_len else curve[-1]
                active = ch.weekly_new_users * ret
                revenue = active * req.orders_per_active_per_week * rev_per_order
                week_rev += revenue
            channel_weekly[ch.name][week_idx] = week_rev
            week_total += week_rev

        weekly_totals.append({
            "week": week_idx + 1,
            "total_revenue": round(week_total, 2),
            "by_channel": {ch.name: round(channel_weekly[ch.name][week_idx], 2) for ch in req.channels},
        })

    # Per-channel LTV and payback
    per_channel_summary = []
    for ch in req.channels:
        # LTV per user = cumulative revenue per user over horizon
        ltv = 0.0
        payback_week = None
        cumulative = 0.0
        for age in range(horizon):
            ret = curve[age] if age < curve_len else curve[-1]
            week_rev_per_user = ret * req.orders_per_active_per_week * rev_per_order
            ltv += week_rev_per_user
            cumulative += week_rev_per_user
            if payback_week is None and cumulative >= ch.cac:
                payback_week = age + 1

        per_channel_summary.append({
            "name": ch.name,
            "cac": ch.cac,
            "ltv_per_user": round(ltv, 2),
            "ltv_cac_ratio": round(ltv / ch.cac, 2) if ch.cac > 0 else 0,
            "payback_week": payback_week or horizon + 1,
            "weekly_new_users": ch.weekly_new_users,
        })

    total_revenue = sum(w["total_revenue"] for w in weekly_totals)
    best_ch = max(per_channel_summary, key=lambda x: x["ltv_cac_ratio"])

    return {
        "weekly": weekly_totals,
        "summary": {
            "per_channel": per_channel_summary,
            "total_revenue": round(total_revenue, 2),
            "avg_ltv_cac": round(sum(c["ltv_cac_ratio"] for c in per_channel_summary) / len(per_channel_summary), 2),
            "best_channel": best_ch["name"],
            "horizon_weeks": horizon,
        },
    }
