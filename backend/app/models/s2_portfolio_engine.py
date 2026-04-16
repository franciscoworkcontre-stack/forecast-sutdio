"""
S2 — Portfolio & Selection Effect Engine
Computes baseline vs. with-changes orders/revenue across restaurant tiers.
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class RestaurantTier(BaseModel):
    name: str
    count: float = Field(gt=0)
    traffic_share: float = Field(gt=0, le=1)
    conversion_rate: float = Field(gt=0, le=1)
    avg_aov_multiplier: float = Field(default=1.0, gt=0)


class PortfolioChange(BaseModel):
    tier_name: str
    delta_count: float = Field(default=0)
    delta_conversion: float = Field(default=0)


class PortfolioRequest(BaseModel):
    horizon_weeks: int = Field(default=12, ge=4, le=52)
    aov_base: float = Field(default=290, gt=0)
    take_rate: float = Field(default=0.22, gt=0, le=1)
    currency: str = "MXN"
    country: str = "MX"
    traffic_per_week: float = Field(default=500000, gt=0)
    restaurant_tiers: List[RestaurantTier] = Field(
        default=[
            RestaurantTier(name="Premium", count=500, traffic_share=0.30, conversion_rate=0.18, avg_aov_multiplier=1.4),
            RestaurantTier(name="Standard", count=2000, traffic_share=0.50, conversion_rate=0.12, avg_aov_multiplier=1.0),
            RestaurantTier(name="Economy", count=3000, traffic_share=0.20, conversion_rate=0.08, avg_aov_multiplier=0.75),
        ]
    )
    proposed_changes: List[PortfolioChange] = Field(
        default=[
            PortfolioChange(tier_name="Premium", delta_count=50, delta_conversion=0.01),
        ]
    )


def _compute_orders(traffic: float, tiers: List[RestaurantTier]) -> float:
    total_count = sum(t.count for t in tiers)
    orders = 0.0
    for t in tiers:
        count_weight = t.count / total_count if total_count > 0 else 0
        tier_orders = traffic * t.traffic_share * t.conversion_rate * count_weight
        orders += tier_orders
    return orders


def _compute_revenue(traffic: float, tiers: List[RestaurantTier], aov: float, take_rate: float) -> float:
    total_count = sum(t.count for t in tiers)
    revenue = 0.0
    for t in tiers:
        count_weight = t.count / total_count if total_count > 0 else 0
        tier_orders = traffic * t.traffic_share * t.conversion_rate * count_weight
        tier_aov = aov * t.avg_aov_multiplier
        revenue += tier_orders * tier_aov * take_rate
    return revenue


def run_portfolio_forecast(req: PortfolioRequest) -> dict:
    horizon = req.horizon_weeks
    base_tiers = req.restaurant_tiers

    # Build changed tiers
    changed_tiers = []
    for t in base_tiers:
        change = next((c for c in req.proposed_changes if c.tier_name == t.name), None)
        if change:
            new_count = max(1, t.count + change.delta_count)
            new_conv = min(1.0, max(0.001, t.conversion_rate + change.delta_conversion))
            changed_tiers.append(RestaurantTier(
                name=t.name,
                count=new_count,
                traffic_share=t.traffic_share,
                conversion_rate=new_conv,
                avg_aov_multiplier=t.avg_aov_multiplier,
            ))
        else:
            changed_tiers.append(t)

    weekly = []
    for w in range(horizon):
        traffic = req.traffic_per_week
        base_orders = _compute_orders(traffic, base_tiers)
        changed_orders = _compute_orders(traffic, changed_tiers)
        base_rev = _compute_revenue(traffic, base_tiers, req.aov_base, req.take_rate)
        changed_rev = _compute_revenue(traffic, changed_tiers, req.aov_base, req.take_rate)

        weekly.append({
            "week": w + 1,
            "baseline_orders": round(base_orders, 0),
            "with_changes_orders": round(changed_orders, 0),
            "uplift_orders": round(changed_orders - base_orders, 0),
            "baseline_revenue": round(base_rev, 2),
            "with_changes_revenue": round(changed_rev, 2),
            "uplift_revenue": round(changed_rev - base_rev, 2),
        })

    # Tier breakdown
    total_count = sum(t.count for t in base_tiers)
    by_tier = []
    for t in base_tiers:
        count_weight = t.count / total_count if total_count > 0 else 0
        orders_w1 = req.traffic_per_week * t.traffic_share * t.conversion_rate * count_weight
        by_tier.append({
            "name": t.name,
            "count": t.count,
            "traffic_share_pct": round(t.traffic_share * 100, 1),
            "conversion_rate_pct": round(t.conversion_rate * 100, 1),
            "weekly_orders": round(orders_w1, 0),
            "aov_multiplier": t.avg_aov_multiplier,
        })

    total_uplift_rev = sum(w["uplift_revenue"] for w in weekly)
    total_base_rev = sum(w["baseline_revenue"] for w in weekly)

    return {
        "weekly": weekly,
        "by_tier": by_tier,
        "summary": {
            "total_baseline_revenue": round(total_base_rev, 2),
            "total_with_changes_revenue": round(total_base_rev + total_uplift_rev, 2),
            "total_uplift_revenue": round(total_uplift_rev, 2),
            "uplift_pct": round(total_uplift_rev / total_base_rev * 100, 1) if total_base_rev > 0 else 0,
            "horizon_weeks": horizon,
        },
    }
