"""
P5 — Marketplace Equilibrium Engine
Weekly P&L including CAC spend, variable costs, fixed costs, and LTV/CAC ratio.
"""
from pydantic import BaseModel, Field


class EquilibriumRequest(BaseModel):
    horizon_weeks: int = Field(default=12, ge=4, le=52)
    aov: float = Field(default=290, gt=0)
    take_rate: float = Field(default=0.22, gt=0, le=1)
    currency: str = "MXN"
    country: str = "MX"
    weekly_orders: float = Field(default=100000, gt=0)
    cac: float = Field(default=180, ge=0)
    weekly_new_users: float = Field(default=2000, gt=0)
    avg_ltv: float = Field(default=650, gt=0)
    fixed_costs_per_week: float = Field(default=500000, ge=0)
    variable_cost_per_order: float = Field(default=55, ge=0, description="Delivery + subsidy + COGS per order")
    churn_rate_pct: float = Field(default=5.0, ge=0, le=100)
    order_growth_rate_pct_per_week: float = Field(default=2.0, ge=0)
    new_user_growth_pct_per_week: float = Field(default=1.5, ge=0)
    palette: str = 'navy'


def run_equilibrium_forecast(req: EquilibriumRequest) -> dict:
    horizon = req.horizon_weeks

    weekly = []
    current_orders = req.weekly_orders
    current_new_users = req.weekly_new_users
    cumulative_net = 0.0

    for w in range(horizon):
        gross_revenue = current_orders * req.aov * req.take_rate
        variable_costs = current_orders * req.variable_cost_per_order
        cac_spend = current_new_users * req.cac
        contribution = gross_revenue - variable_costs - cac_spend
        net_contribution = contribution - req.fixed_costs_per_week
        cumulative_net += net_contribution

        weekly.append({
            "week": w + 1,
            "orders": round(current_orders, 0),
            "new_users": round(current_new_users, 0),
            "gross_revenue": round(gross_revenue, 2),
            "variable_costs": round(variable_costs, 2),
            "cac_spend": round(cac_spend, 2),
            "fixed_costs": round(req.fixed_costs_per_week, 2),
            "contribution": round(contribution, 2),
            "net_contribution": round(net_contribution, 2),
            "cumulative_burn": round(cumulative_net, 2),
        })

        current_orders = current_orders * (1 + req.order_growth_rate_pct_per_week / 100)
        current_new_users = current_new_users * (1 + req.new_user_growth_pct_per_week / 100)

    # LTV/CAC ratio
    ltv_cac_ratio = req.avg_ltv / req.cac if req.cac > 0 else float("inf")

    # Breakeven: gross_rev - variable_cost - cac_spend - fixed = 0
    # At initial volumes: orders * (aov * take_rate - variable_cost) = fixed + new_users * cac
    margin_per_order = req.aov * req.take_rate - req.variable_cost_per_order
    if margin_per_order > 0:
        breakeven_orders = (req.fixed_costs_per_week + req.weekly_new_users * req.cac) / margin_per_order
    else:
        breakeven_orders = float("inf")

    # Is the business sustainable? LTV/CAC > 3 and positive net contribution in final week
    is_sustainable = ltv_cac_ratio >= 3.0 and weekly[-1]["net_contribution"] > 0

    total_revenue = sum(w["gross_revenue"] for w in weekly)
    total_net = sum(w["net_contribution"] for w in weekly)

    return {
        "weekly": weekly,
        "summary": {
            "ltv_cac_ratio": round(ltv_cac_ratio, 2),
            "breakeven_weekly_orders": round(breakeven_orders, 0) if breakeven_orders != float("inf") else None,
            "is_sustainable": is_sustainable,
            "total_gross_revenue": round(total_revenue, 2),
            "total_net_contribution": round(total_net, 2),
            "final_week_net": weekly[-1]["net_contribution"] if weekly else 0,
            "cumulative_burn": round(cumulative_net, 2),
            "margin_per_order": round(margin_per_order, 2),
            "horizon_weeks": horizon,
        },
    }
