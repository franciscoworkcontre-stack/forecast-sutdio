"""
Unit Economics Model (B1)

Formula per order:
  gross_revenue = avg_order_value × commission_pct + delivery_fee + ad_revenue_per_order
  variable_cost = courier_cost_per_order + support_cost_pct × avg_order_value + tech_cost_per_order + subsidy_per_order
  contribution_margin_per_order = gross_revenue - variable_cost
  contribution_margin_pct = contribution_margin_per_order / (avg_order_value + delivery_fee)

  Per week:
    total_gross_revenue = total_orders × gross_revenue_per_order
    total_cm = total_orders × cm_per_order - marketing_fixed_cost
"""
from typing import List, Optional, Dict, Any
from ..models.schemas import UnitEconomicsInput, UEWeekResult


def calculate_unit_economics(
    ue: UnitEconomicsInput,
    weekly_orders: List[float],
    promo_costs: Optional[List[float]] = None,
) -> List[UEWeekResult]:
    """
    Returns per-week unit economics.

    Revenue:
      commission_rev = orders × AOV × commission_pct
      delivery_rev = orders × delivery_fee
      ad_rev = orders × ad_revenue_per_order

    Costs:
      courier = orders × courier_cost_per_order
      support = orders × AOV × support_cost_pct
      tech = orders × tech_cost_per_order
      subsidy = orders × subsidy_per_order (or promo_cost if auto)
      marketing = marketing_fixed_cost (flat per week)
    """
    aov = ue.avg_order_value
    results = []

    for w, orders in enumerate(weekly_orders):
        # Revenue
        commission_rev = orders * aov * ue.commission_pct
        delivery_rev = orders * ue.delivery_fee
        ad_rev = orders * ue.ad_revenue_per_order
        gross_rev = commission_rev + delivery_rev + ad_rev

        # Costs
        courier_cost = orders * ue.courier_cost_per_order
        support_cost = orders * aov * ue.support_cost_pct
        tech_cost = orders * ue.tech_cost_per_order

        # Subsidy / promo cost
        if ue.subsidy_per_order is not None:
            subsidy = orders * ue.subsidy_per_order
        elif promo_costs and w < len(promo_costs):
            subsidy = promo_costs[w]
        else:
            subsidy = 0.0

        marketing_cost = ue.marketing_fixed_cost or 0.0
        total_cost = courier_cost + support_cost + tech_cost + subsidy + marketing_cost

        cm = gross_rev - total_cost
        gmv = orders * aov
        cm_pct = cm / gmv if gmv > 0 else 0.0
        ebitda = cm  # simplified: EBITDA = contribution margin (excluding D&A)

        results.append(UEWeekResult(
            week=w,
            total_orders=orders,
            gross_revenue=gross_rev,
            commission_revenue=commission_rev,
            delivery_fee_revenue=delivery_rev,
            ad_revenue=ad_rev,
            courier_cost=courier_cost,
            support_cost=support_cost,
            tech_cost=tech_cost,
            subsidy_cost=subsidy,
            marketing_cost=marketing_cost,
            contribution_margin=cm,
            contribution_margin_pct=cm_pct,
            ebitda=ebitda,
        ))

    return results
