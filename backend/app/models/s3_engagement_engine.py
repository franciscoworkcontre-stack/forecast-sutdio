"""
S3 — Restaurant Engagement Engine
Measures ROI of engagement programs based on score elasticity.
"""
from typing import List
from pydantic import BaseModel, Field


class RestaurantTierEngagement(BaseModel):
    tier: str  # 'high', 'medium', 'low'
    count: float = Field(gt=0)
    avg_weekly_orders: float = Field(gt=0)
    engagement_score: float = Field(ge=0, le=100)


class EngagementProgram(BaseModel):
    cost_per_restaurant: float = Field(ge=0)
    expected_score_improvement: float = Field(default=10, gt=0)
    orders_per_point_improvement: float = Field(default=0.5, gt=0)


class EngagementRequest(BaseModel):
    horizon_weeks: int = Field(default=12, ge=4, le=52)
    aov: float = Field(default=290, gt=0)
    take_rate: float = Field(default=0.22, gt=0, le=1)
    currency: str = "MXN"
    country: str = "MX"
    target_tier: str = Field(default="low")
    restaurants: List[RestaurantTierEngagement] = Field(
        default=[
            RestaurantTierEngagement(tier="high", count=300, avg_weekly_orders=250, engagement_score=80),
            RestaurantTierEngagement(tier="medium", count=1200, avg_weekly_orders=120, engagement_score=55),
            RestaurantTierEngagement(tier="low", count=2500, avg_weekly_orders=40, engagement_score=30),
        ]
    )
    engagement_program: EngagementProgram = Field(
        default=EngagementProgram(
            cost_per_restaurant=800,
            expected_score_improvement=15,
            orders_per_point_improvement=0.3,
        )
    )
    palette: str = 'navy'


def run_engagement_forecast(req: EngagementRequest) -> dict:
    horizon = req.horizon_weeks
    rev_per_order = req.aov * req.take_rate
    prog = req.engagement_program

    # Find target tier
    target = next((r for r in req.restaurants if r.tier == req.target_tier), None)
    if target is None:
        target = req.restaurants[-1]

    # Baseline orders
    baseline_total = sum(r.count * r.avg_weekly_orders for r in req.restaurants)

    # Improved orders for target tier
    score_delta = prog.expected_score_improvement
    orders_uplift_per_rest = score_delta * prog.orders_per_point_improvement
    improved_orders_target = target.avg_weekly_orders + orders_uplift_per_rest

    # Improved total
    improved_total = baseline_total - target.count * target.avg_weekly_orders + target.count * improved_orders_target

    weekly = []
    program_cost_total = target.count * prog.cost_per_restaurant  # one-time cost

    for w in range(horizon):
        # Gradual ramp-up of engagement effect over 4 weeks
        ramp = min(1.0, (w + 1) / 4)
        orders_this_week = baseline_total + (improved_total - baseline_total) * ramp
        revenue = orders_this_week * rev_per_order
        # Program cost amortized over first week
        prog_cost_week = program_cost_total if w == 0 else 0.0

        weekly.append({
            "week": w + 1,
            "total_orders": round(orders_this_week, 0),
            "baseline_orders": round(baseline_total, 0),
            "incremental_orders": round(orders_this_week - baseline_total, 0),
            "revenue": round(revenue, 2),
            "program_cost": round(prog_cost_week, 2),
        })

    total_revenue = sum(w["revenue"] for w in weekly)
    baseline_revenue = baseline_total * rev_per_order * horizon
    incremental_revenue = total_revenue - baseline_revenue
    roi = (incremental_revenue - program_cost_total) / program_cost_total if program_cost_total > 0 else 0

    return {
        "weekly": weekly,
        "current_baseline": {
            "total_weekly_orders": round(baseline_total, 0),
            "weekly_revenue": round(baseline_total * rev_per_order, 2),
        },
        "improved_baseline": {
            "total_weekly_orders": round(improved_total, 0),
            "weekly_revenue": round(improved_total * rev_per_order, 2),
        },
        "summary": {
            "incremental_orders_total": round(sum(w["incremental_orders"] for w in weekly), 0),
            "incremental_revenue": round(incremental_revenue, 2),
            "program_cost": round(program_cost_total, 2),
            "roi": round(roi, 2),
            "target_tier": req.target_tier,
            "restaurants_in_program": round(target.count, 0),
            "horizon_weeks": horizon,
        },
    }
