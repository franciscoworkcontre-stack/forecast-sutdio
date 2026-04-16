"""
P2 — Incrementality & Cannibalization Engine
Computes true incremental orders vs. cannibalized organic demand.
"""
from typing import List
from pydantic import BaseModel, Field


class CampaignIncrementality(BaseModel):
    name: str
    promoted_orders_per_week: float = Field(gt=0)
    organic_baseline: float = Field(default=0, ge=0, description="Orders that would happen anyway")
    uplift_observed_pct: float = Field(default=0.30, gt=0, description="Observed lift vs. control")
    discount_per_order: float = Field(default=30, ge=0)
    cost_per_order: float = Field(default=15, ge=0, description="Additional cost e.g. free delivery")


class IncrementalityRequest(BaseModel):
    horizon_weeks: int = Field(default=12, ge=4, le=52)
    aov: float = Field(default=290, gt=0)
    take_rate: float = Field(default=0.22, gt=0, le=1)
    currency: str = "MXN"
    country: str = "MX"
    campaigns: List[CampaignIncrementality] = Field(
        default=[
            CampaignIncrementality(name="Cupón -20%", promoted_orders_per_week=5000, organic_baseline=1200, uplift_observed_pct=0.35, discount_per_order=58, cost_per_order=0),
            CampaignIncrementality(name="Free Delivery", promoted_orders_per_week=8000, organic_baseline=2000, uplift_observed_pct=0.25, discount_per_order=0, cost_per_order=30),
            CampaignIncrementality(name="2x1 Flash", promoted_orders_per_week=3000, organic_baseline=500, uplift_observed_pct=0.50, discount_per_order=80, cost_per_order=0),
        ]
    )


def run_incrementality_forecast(req: IncrementalityRequest) -> dict:
    horizon = req.horizon_weeks
    rev_per_order = req.aov * req.take_rate

    by_campaign = []
    for camp in req.campaigns:
        # True incrementality: what fraction of promoted orders is actually incremental?
        # uplift_observed means: treated group ordered uplift_pct more than control
        # true_incremental = promoted * (uplift / (1 + uplift))
        uplift = camp.uplift_observed_pct
        true_incremental_frac = uplift / (1 + uplift)
        true_incremental = camp.promoted_orders_per_week * true_incremental_frac
        cannibalized = camp.promoted_orders_per_week - true_incremental
        cannibalization_rate = cannibalized / camp.promoted_orders_per_week if camp.promoted_orders_per_week > 0 else 0

        cost_per_week = camp.promoted_orders_per_week * (camp.discount_per_order + camp.cost_per_order)
        # Revenue from incremental orders only (cannibalized orders would have happened anyway)
        incremental_revenue = true_incremental * rev_per_order
        # Net: incremental revenue minus cost of ALL promoted orders
        net_contribution = (incremental_revenue - cost_per_week) * horizon
        roi = (incremental_revenue - cost_per_week) / cost_per_week if cost_per_week > 0 else 0

        by_campaign.append({
            "name": camp.name,
            "promoted_orders_per_week": camp.promoted_orders_per_week,
            "true_incremental_per_week": round(true_incremental, 1),
            "cannibalized_per_week": round(cannibalized, 1),
            "cannibalization_rate_pct": round(cannibalization_rate * 100, 1),
            "cost_per_week": round(cost_per_week, 2),
            "incremental_revenue_per_week": round(incremental_revenue, 2),
            "true_roi": round(roi, 2),
            "net_contribution_horizon": round(net_contribution, 2),
        })

    weekly = []
    total_incremental = sum(c["true_incremental_per_week"] for c in by_campaign)
    total_cost = sum(c["cost_per_week"] for c in by_campaign)
    total_revenue = sum(c["incremental_revenue_per_week"] for c in by_campaign)

    for w in range(horizon):
        weekly.append({
            "week": w + 1,
            "total_promoted_orders": round(sum(c["promoted_orders_per_week"] for c in req.campaigns), 0),
            "true_incremental_orders": round(total_incremental, 1),
            "cannibalized_orders": round(sum(c["cannibalized_per_week"] for c in by_campaign), 1),
            "incremental_revenue": round(total_revenue, 2),
            "campaign_cost": round(total_cost, 2),
            "net_contribution": round(total_revenue - total_cost, 2),
        })

    blended_cannib = sum(c["cannibalized_per_week"] for c in by_campaign) / sum(c["promoted_orders_per_week"] for c in req.campaigns) if req.campaigns else 0

    return {
        "by_campaign": by_campaign,
        "weekly": weekly,
        "summary": {
            "total_promoted_per_week": round(sum(c["promoted_orders_per_week"] for c in req.campaigns), 0),
            "total_true_incremental_per_week": round(total_incremental, 1),
            "blended_cannibalization_rate_pct": round(blended_cannib * 100, 1),
            "total_weekly_cost": round(total_cost, 2),
            "total_weekly_incremental_revenue": round(total_revenue, 2),
            "blended_roi": round((total_revenue - total_cost) / total_cost, 2) if total_cost > 0 else 0,
            "horizon_weeks": horizon,
        },
    }
