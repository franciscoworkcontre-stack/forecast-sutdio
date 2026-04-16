"""
P4 — Competitive Dynamics Engine
Models market share shifts from competitor events and our response.
"""
from typing import List
from pydantic import BaseModel, Field


class CompetitorScenario(BaseModel):
    name: str
    type: str = Field(description="price_cut | new_entry | exit")
    magnitude_pct: float = Field(description="Price cut %, market share %, etc.")
    week_of_event: int = Field(ge=1)


class OurResponse(BaseModel):
    type: str = Field(default="match", description="match | ignore | differentiate")
    cost_per_week: float = Field(default=0, ge=0)


class CompetitiveRequest(BaseModel):
    horizon_weeks: int = Field(default=12, ge=4, le=52)
    aov: float = Field(default=290, gt=0)
    take_rate: float = Field(default=0.22, gt=0, le=1)
    currency: str = "MXN"
    country: str = "MX"
    market_weekly_orders: float = Field(default=500000, gt=0)
    our_market_share_pct: float = Field(default=35.0, gt=0, le=100)
    price_elasticity: float = Field(default=0.8, gt=0, description="Share change per % price gap")
    competitor_scenarios: List[CompetitorScenario] = Field(
        default=[
            CompetitorScenario(name="Competidor A reduce precios", type="price_cut", magnitude_pct=15, week_of_event=3),
            CompetitorScenario(name="Nuevo entrante", type="new_entry", magnitude_pct=5, week_of_event=6),
        ]
    )
    our_response: OurResponse = Field(
        default=OurResponse(type="match", cost_per_week=50000)
    )
    palette: str = 'navy'


def run_competitive_forecast(req: CompetitiveRequest) -> dict:
    horizon = req.horizon_weeks

    our_share = req.our_market_share_pct / 100
    market_orders = req.market_weekly_orders
    our_response = req.our_response

    weekly = []
    for w in range(horizon):
        week_num = w + 1
        share_impact = 0.0
        response_cost = 0.0

        for sc in req.competitor_scenarios:
            if week_num < sc.week_of_event:
                continue

            if sc.type == "price_cut":
                if our_response.type == "match":
                    # We match = no share change but we pay the cost
                    share_impact += 0.0
                    response_cost += our_response.cost_per_week
                elif our_response.type == "ignore":
                    # We lose share proportional to price gap and elasticity
                    share_impact -= (sc.magnitude_pct / 100) * req.price_elasticity * 0.5
                else:  # differentiate
                    # Partial share loss, some cost
                    share_impact -= (sc.magnitude_pct / 100) * req.price_elasticity * 0.2
                    response_cost += our_response.cost_per_week * 0.5

            elif sc.type == "new_entry":
                # Market share redistribution — new entrant takes from everyone
                share_impact -= sc.magnitude_pct / 100 * our_share
                if our_response.type == "match":
                    share_impact += sc.magnitude_pct / 100 * our_share * 0.5
                    response_cost += our_response.cost_per_week

            elif sc.type == "exit":
                # Competitor exits, we pick up some share
                share_impact += sc.magnitude_pct / 100 * 0.6

        effective_share = max(0.01, min(1.0, our_share + share_impact))
        our_orders = market_orders * effective_share
        revenue = our_orders * req.aov * req.take_rate
        net = revenue - response_cost

        weekly.append({
            "week": week_num,
            "our_orders": round(our_orders, 0),
            "market_orders": round(market_orders, 0),
            "our_share_pct": round(effective_share * 100, 2),
            "share_delta_pct": round(share_impact * 100, 2),
            "revenue": round(revenue, 2),
            "response_cost": round(response_cost, 2),
            "net_revenue": round(net, 2),
        })

    total_revenue = sum(w["revenue"] for w in weekly)
    avg_share = sum(w["our_share_pct"] for w in weekly) / horizon
    baseline_revenue = market_orders * (req.our_market_share_pct / 100) * req.aov * req.take_rate * horizon
    total_response_cost = sum(w["response_cost"] for w in weekly)

    return {
        "weekly": weekly,
        "summary": {
            "initial_share_pct": req.our_market_share_pct,
            "avg_share_pct": round(avg_share, 2),
            "final_share_pct": weekly[-1]["our_share_pct"] if weekly else req.our_market_share_pct,
            "total_revenue": round(total_revenue, 2),
            "baseline_revenue": round(baseline_revenue, 2),
            "revenue_vs_baseline": round(total_revenue - baseline_revenue, 2),
            "total_response_cost": round(total_response_cost, 2),
            "scenario_count": len(req.competitor_scenarios),
            "horizon_weeks": horizon,
        },
    }
