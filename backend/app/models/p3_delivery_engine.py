"""
P3 — Delivery Economics & Capacity Engine
Models courier fleet capacity, utilization, and unit economics.
"""
from typing import Optional
from pydantic import BaseModel, Field


class DeliveryRequest(BaseModel):
    horizon_weeks: int = Field(default=12, ge=4, le=52)
    aov: float = Field(default=290, gt=0)
    take_rate: float = Field(default=0.22, gt=0, le=1)
    currency: str = "MXN"
    country: str = "MX"
    couriers: float = Field(default=2000, gt=0)
    orders_per_courier_per_hour: float = Field(default=1.5, gt=0)
    active_hours_per_day: float = Field(default=8.0, gt=0, le=24)
    current_weekly_orders: float = Field(default=80000, gt=0)
    order_growth_rate_pct_per_week: float = Field(default=2.0, ge=0)
    delivery_cost_per_order: float = Field(default=45, ge=0)
    platform_subsidy_per_order: float = Field(default=15, ge=0)
    capacity_utilization_threshold: float = Field(default=0.85, gt=0, le=1)
    new_couriers_per_week: float = Field(default=20, ge=0)
    palette: str = 'navy'


def run_delivery_forecast(req: DeliveryRequest) -> dict:
    horizon = req.horizon_weeks

    weekly = []
    current_orders = req.current_weekly_orders
    current_couriers = req.couriers
    bottleneck_week = None

    for w in range(horizon):
        capacity = current_couriers * req.orders_per_courier_per_hour * req.active_hours_per_day * 7
        utilization = current_orders / capacity if capacity > 0 else 999

        is_constrained = utilization > req.capacity_utilization_threshold
        if is_constrained and bottleneck_week is None:
            bottleneck_week = w + 1

        # If constrained, cap orders at threshold capacity
        effective_orders = min(current_orders, capacity * req.capacity_utilization_threshold) if is_constrained else current_orders

        revenue = effective_orders * req.aov * req.take_rate
        delivery_cost = effective_orders * req.delivery_cost_per_order
        subsidy_cost = effective_orders * req.platform_subsidy_per_order
        contribution = revenue - delivery_cost - subsidy_cost

        weekly.append({
            "week": w + 1,
            "orders": round(effective_orders, 0),
            "demand": round(current_orders, 0),
            "capacity": round(capacity, 0),
            "utilization": round(utilization, 3),
            "couriers": round(current_couriers, 0),
            "revenue": round(revenue, 2),
            "delivery_cost": round(delivery_cost, 2),
            "subsidy_cost": round(subsidy_cost, 2),
            "contribution": round(contribution, 2),
            "is_constrained": is_constrained,
        })

        # Grow orders and add couriers
        current_orders = current_orders * (1 + req.order_growth_rate_pct_per_week / 100)
        current_couriers = current_couriers + req.new_couriers_per_week

    total_revenue = sum(w["revenue"] for w in weekly)
    total_contribution = sum(w["contribution"] for w in weekly)
    total_delivery_cost = sum(w["delivery_cost"] for w in weekly)

    return {
        "weekly": weekly,
        "summary": {
            "bottleneck_week": bottleneck_week,
            "total_revenue": round(total_revenue, 2),
            "total_contribution": round(total_contribution, 2),
            "total_delivery_cost": round(total_delivery_cost, 2),
            "is_profitable": total_contribution > 0,
            "contribution_margin_pct": round(total_contribution / total_revenue * 100, 1) if total_revenue > 0 else 0,
            "final_couriers": round(current_couriers, 0),
            "horizon_weeks": horizon,
        },
    }
