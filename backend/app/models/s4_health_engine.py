"""
S4 — Restaurant Health Score Engine
Computes health scores for restaurants and identifies at-risk revenue.
"""
from typing import List
from pydantic import BaseModel, Field


class RestaurantHealth(BaseModel):
    name: str
    weekly_orders: float = Field(gt=0)
    order_trend_pct: float = Field(default=0.0, description="Week-over-week order trend %")
    rating: float = Field(default=4.0, ge=1, le=5)
    days_since_menu_update: int = Field(default=30, ge=0)
    response_rate: float = Field(default=0.85, ge=0, le=1)


class S4HealthRequest(BaseModel):
    horizon_weeks: int = Field(default=12, ge=4, le=52)
    aov: float = Field(default=290, gt=0)
    take_rate: float = Field(default=0.22, gt=0, le=1)
    currency: str = "MXN"
    country: str = "MX"
    churn_threshold_score: float = Field(default=40.0, description="Health score below which restaurant is at-risk")
    restaurants: List[RestaurantHealth] = Field(
        default=[
            RestaurantHealth(name="El Rancho", weekly_orders=180, order_trend_pct=-15, rating=3.8, days_since_menu_update=90, response_rate=0.70),
            RestaurantHealth(name="Sushi Oishi", weekly_orders=250, order_trend_pct=5, rating=4.5, days_since_menu_update=14, response_rate=0.92),
            RestaurantHealth(name="Tacos Don Pedro", weekly_orders=120, order_trend_pct=-8, rating=3.5, days_since_menu_update=60, response_rate=0.60),
            RestaurantHealth(name="Burger Palace", weekly_orders=310, order_trend_pct=2, rating=4.2, days_since_menu_update=7, response_rate=0.95),
            RestaurantHealth(name="La Italiana", weekly_orders=90, order_trend_pct=-25, rating=3.2, days_since_menu_update=120, response_rate=0.50),
            RestaurantHealth(name="Noodle Box", weekly_orders=200, order_trend_pct=8, rating=4.6, days_since_menu_update=10, response_rate=0.98),
        ]
    )


def _compute_health_score(r: RestaurantHealth) -> float:
    """Weighted health score 0-100."""
    # Trend component (0-25 pts): -30% trend = 0pts, +10% trend = 25pts
    trend_score = max(0, min(25, (r.order_trend_pct + 30) * (25 / 40)))

    # Rating component (0-25 pts): 1 star = 0, 5 stars = 25
    rating_score = (r.rating - 1) / 4 * 25

    # Menu freshness (0-25 pts): 0 days = 25, 120+ days = 0
    menu_score = max(0, 25 - (r.days_since_menu_update / 120) * 25)

    # Response rate (0-25 pts): 100% = 25, 0% = 0
    response_score = r.response_rate * 25

    return trend_score + rating_score + menu_score + response_score


def run_health_forecast(req: S4HealthRequest) -> dict:
    horizon = req.horizon_weeks
    rev_per_order = req.aov * req.take_rate

    scored = []
    for r in req.restaurants:
        score = _compute_health_score(r)
        scored.append({
            "name": r.name,
            "weekly_orders": r.weekly_orders,
            "health_score": round(score, 1),
            "at_risk": score < req.churn_threshold_score,
            "order_trend_pct": r.order_trend_pct,
            "rating": r.rating,
            "days_since_menu_update": r.days_since_menu_update,
            "response_rate": round(r.response_rate * 100, 1),
        })

    scored.sort(key=lambda x: x["health_score"])

    at_risk = [s for s in scored if s["at_risk"]]
    at_risk_orders = sum(r["weekly_orders"] for r in at_risk)
    orders_at_risk = at_risk_orders * horizon
    revenue_at_risk = orders_at_risk * rev_per_order

    # Health distribution buckets
    buckets = [
        {"range": "0-25 (Critical)", "min": 0, "max": 25},
        {"range": "25-50 (At Risk)", "min": 25, "max": 50},
        {"range": "50-75 (Healthy)", "min": 50, "max": 75},
        {"range": "75-100 (Star)", "min": 75, "max": 100},
    ]
    total_weekly_orders = sum(r.weekly_orders for r in req.restaurants)
    health_distribution = []
    for b in buckets:
        in_bucket = [s for s in scored if b["min"] <= s["health_score"] < b["max"]]
        bucket_orders = sum(r["weekly_orders"] for r in in_bucket)
        health_distribution.append({
            "score_range": b["range"],
            "count": len(in_bucket),
            "orders_share_pct": round(bucket_orders / total_weekly_orders * 100, 1) if total_weekly_orders > 0 else 0,
            "weekly_orders": round(bucket_orders, 0),
        })

    # Weekly projection (assume at-risk restaurants decline ~5%/week)
    weekly = []
    for w in range(horizon):
        week_at_risk_orders = at_risk_orders * (0.95 ** w)
        week_healthy_orders = total_weekly_orders - at_risk_orders
        week_total = week_healthy_orders + week_at_risk_orders
        weekly.append({
            "week": w + 1,
            "total_orders": round(week_total, 0),
            "at_risk_orders": round(week_at_risk_orders, 0),
            "healthy_orders": round(week_healthy_orders, 0),
            "revenue": round(week_total * rev_per_order, 2),
        })

    return {
        "scored_restaurants": scored,
        "health_distribution": health_distribution,
        "weekly": weekly,
        "summary": {
            "at_risk_count": len(at_risk),
            "total_restaurants": len(req.restaurants),
            "orders_at_risk_total": round(orders_at_risk, 0),
            "revenue_at_risk": round(revenue_at_risk, 2),
            "avg_health_score": round(sum(s["health_score"] for s in scored) / len(scored), 1),
            "top_at_risk": [r["name"] for r in at_risk[:3]],
            "horizon_weeks": horizon,
        },
    }
