"""
D5 — Reactivation & Winback Engine
For each campaign x segment, compute reactivated users, revenue, cost, and ROI.
"""
from typing import List
from pydantic import BaseModel, Field


class ChurnedSegment(BaseModel):
    name: str
    count: float = Field(gt=0)
    recency_weeks: int = Field(ge=1)
    organic_reactiv_rate: float = Field(default=0.02, ge=0, le=1)


class WinbackCampaign(BaseModel):
    name: str
    cost_per_contacted: float = Field(ge=0)
    contact_rate: float = Field(default=0.5, gt=0, le=1)
    incremental_reactiv_rate: float = Field(default=0.08, ge=0, le=1)
    orders_per_reactivated: float = Field(default=2.0, gt=0)


class WinbackRequest(BaseModel):
    horizon_weeks: int = Field(default=12, ge=4, le=52)
    aov: float = Field(default=290, gt=0)
    take_rate: float = Field(default=0.22, gt=0, le=1)
    currency: str = "MXN"
    country: str = "MX"
    churned_segments: List[ChurnedSegment] = Field(
        default=[
            ChurnedSegment(name="1-4 semanas inactivo", count=15000, recency_weeks=3, organic_reactiv_rate=0.05),
            ChurnedSegment(name="1-3 meses inactivo", count=40000, recency_weeks=8, organic_reactiv_rate=0.02),
            ChurnedSegment(name="+3 meses inactivo", count=80000, recency_weeks=20, organic_reactiv_rate=0.005),
        ]
    )
    campaigns: List[WinbackCampaign] = Field(
        default=[
            WinbackCampaign(name="Email Cupón 20%", cost_per_contacted=5, contact_rate=0.40, incremental_reactiv_rate=0.10, orders_per_reactivated=2),
            WinbackCampaign(name="Push Personalizado", cost_per_contacted=2, contact_rate=0.55, incremental_reactiv_rate=0.07, orders_per_reactivated=1.5),
        ]
    )


def run_winback_forecast(req: WinbackRequest) -> dict:
    rev_per_order = req.aov * req.take_rate
    by_campaign = []

    for camp in req.campaigns:
        total_reactivated = 0.0
        total_incremental_orders = 0.0
        total_revenue = 0.0
        total_cost = 0.0

        for seg in req.churned_segments:
            contacted = seg.count * camp.contact_rate
            reactivated = contacted * (seg.organic_reactiv_rate + camp.incremental_reactiv_rate)
            # Organic baseline (would have reactivated without campaign)
            organic = seg.count * seg.organic_reactiv_rate
            incremental_users = max(0, reactivated - organic)
            orders = incremental_users * camp.orders_per_reactivated
            revenue = orders * rev_per_order
            cost = contacted * camp.cost_per_contacted

            total_reactivated += incremental_users
            total_incremental_orders += orders
            total_revenue += revenue
            total_cost += cost

        roi = (total_revenue - total_cost) / total_cost if total_cost > 0 else 0

        by_campaign.append({
            "name": camp.name,
            "reactivated_users": round(total_reactivated, 0),
            "incremental_orders": round(total_incremental_orders, 0),
            "revenue": round(total_revenue, 2),
            "cost": round(total_cost, 2),
            "roi": round(roi, 2),
            "roas": round(total_revenue / total_cost, 2) if total_cost > 0 else 0,
        })

    # Weekly spread (assume uniform over horizon)
    horizon = req.horizon_weeks
    total_rev_all = sum(c["revenue"] for c in by_campaign)
    total_orders_all = sum(c["incremental_orders"] for c in by_campaign)
    total_cost_all = sum(c["cost"] for c in by_campaign)

    weekly = []
    for w in range(horizon):
        # Front-load slightly (more reactivations early in campaign)
        weight = max(0.5, 1.5 - w * (1.0 / horizon))
        weekly.append({
            "week": w + 1,
            "incremental_orders": round(total_orders_all / horizon * weight, 1),
            "revenue": round(total_rev_all / horizon * weight, 2),
            "cost": round(total_cost_all / horizon, 2),
        })

    best = max(by_campaign, key=lambda x: x["roi"]) if by_campaign else None

    return {
        "by_campaign": by_campaign,
        "weekly": weekly,
        "summary": {
            "total_reactivated_users": round(sum(c["reactivated_users"] for c in by_campaign), 0),
            "total_incremental_orders": round(total_orders_all, 0),
            "total_revenue": round(total_rev_all, 2),
            "total_cost": round(total_cost_all, 2),
            "blended_roi": round((total_rev_all - total_cost_all) / total_cost_all, 2) if total_cost_all > 0 else 0,
            "best_campaign": best["name"] if best else None,
            "horizon_weeks": horizon,
        },
    }
