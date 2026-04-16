"""
P1 — Network Effects & Liquidity Engine
Supply growth drives demand via network effect elasticity.
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class Zone(BaseModel):
    name: str
    supply_count: float = Field(gt=0)
    demand_weekly: float = Field(gt=0)
    fulfillment_rate: float = Field(default=0.85, gt=0, le=1)


class SupplyAddition(BaseModel):
    week: int = Field(ge=1)
    new_supply: float = Field(gt=0)


class NetworkRequest(BaseModel):
    horizon_weeks: int = Field(default=12, ge=4, le=52)
    aov: float = Field(default=290, gt=0)
    take_rate: float = Field(default=0.22, gt=0, le=1)
    currency: str = "MXN"
    country: str = "MX"
    network_effect_elasticity: float = Field(
        default=0.3,
        description="For every +10% supply increase, demand increases by elasticity * 10%"
    )
    zones: List[Zone] = Field(
        default=[
            Zone(name="Centro", supply_count=500, demand_weekly=50000, fulfillment_rate=0.88),
            Zone(name="Norte", supply_count=200, demand_weekly=25000, fulfillment_rate=0.75),
            Zone(name="Sur", supply_count=100, demand_weekly=15000, fulfillment_rate=0.65),
        ]
    )
    supply_growth_plan: List[SupplyAddition] = Field(
        default=[
            SupplyAddition(week=2, new_supply=50),
            SupplyAddition(week=4, new_supply=80),
            SupplyAddition(week=6, new_supply=60),
        ]
    )
    palette: str = 'navy'


def run_network_forecast(req: NetworkRequest) -> dict:
    horizon = req.horizon_weeks
    rev_per_order = req.aov * req.take_rate

    # Aggregate starting supply & demand
    total_supply = sum(z.supply_count for z in req.zones)
    total_demand = sum(z.demand_weekly for z in req.zones)
    avg_fulfillment = sum(z.fulfillment_rate * z.supply_count for z in req.zones) / total_supply if total_supply > 0 else 0.75

    supply_additions_by_week = {sa.week: sa.new_supply for sa in req.supply_growth_plan}

    weekly = []
    current_supply = total_supply
    current_demand = total_demand
    current_fulfillment = avg_fulfillment

    for w in range(horizon):
        week_num = w + 1
        # Apply supply additions
        new_supply = supply_additions_by_week.get(week_num, 0)
        if new_supply > 0:
            supply_pct_increase = new_supply / current_supply
            demand_uplift = req.network_effect_elasticity * supply_pct_increase
            current_demand = current_demand * (1 + demand_uplift)
            current_supply = current_supply + new_supply
            # Fulfillment improves with more supply (diminishing returns)
            current_fulfillment = min(0.98, current_fulfillment + supply_pct_increase * 0.15)

        orders = current_demand * current_fulfillment
        revenue = orders * rev_per_order

        # Liquidity phase
        if current_fulfillment < 0.70:
            phase = "supply_constrained"
        elif current_fulfillment < 0.85:
            phase = "growing"
        else:
            phase = "mature"

        weekly.append({
            "week": week_num,
            "supply": round(current_supply, 0),
            "demand": round(current_demand, 0),
            "fulfillment_rate": round(current_fulfillment, 3),
            "orders": round(orders, 0),
            "revenue": round(revenue, 2),
            "phase": phase,
        })

    total_revenue = sum(w["revenue"] for w in weekly)
    total_orders = sum(w["orders"] for w in weekly)

    return {
        "weekly": weekly,
        "summary": {
            "starting_supply": round(total_supply, 0),
            "final_supply": round(current_supply, 0),
            "supply_added": round(current_supply - total_supply, 0),
            "total_orders": round(total_orders, 0),
            "total_revenue": round(total_revenue, 2),
            "final_fulfillment_rate": round(current_fulfillment, 3),
            "final_phase": weekly[-1]["phase"] if weekly else "unknown",
            "horizon_weeks": horizon,
        },
    }
