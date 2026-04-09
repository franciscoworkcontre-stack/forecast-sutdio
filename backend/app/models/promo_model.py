"""
Promo Uplift Model (A1)

Formula:
  orders_inc[w] = orders_base × (uplift/100) × fatigue[w] × penetration[segment]
  post_promo_residual[w] = orders_base × (uplift/100) × residual[w-duration] × penetration[segment]
  cost[w] = orders_inc[w] × cost_per_incremental_order × funding_split
"""
from typing import List, Dict, Optional, Any
from ..models.schemas import PromoInput

# Default fatigue multipliers by week (1-indexed)
DEFAULT_FATIGUE: Dict[int, float] = {
    1: 1.00, 2: 1.00,
    3: 0.90, 4: 0.90,
    5: 0.75, 6: 0.75, 7: 0.75, 8: 0.75,
    9: 0.60, 10: 0.60, 11: 0.60, 12: 0.60,
}

# Default residual effect post-promo (weeks after promo ends)
DEFAULT_RESIDUAL: Dict[int, float] = {
    1: 0.30,
    2: 0.20,
    3: 0.10,
    4: 0.10,
    5: 0.00,
}

# Segment penetration: fraction of user base targeted
SEGMENT_PENETRATION: Dict[str, float] = {
    "all": 1.0,
    "new_users": 0.15,
    "dormant": 0.20,
    "high_value": 0.20,
}

# Benchmark uplift % for each promo type (mid)
BENCHMARK_UPLIFT: Dict[str, float] = {
    "discount_pct": 0.275,
    "discount_fixed": 0.20,
    "bogo": 0.375,
    "free_delivery": 0.275,
    "cashback": 0.14,
    "bundle": 0.185,
}

# Cost per incremental order estimate by promo type (as fraction of AOV)
COST_PER_INC_ORDER_FRACTION: Dict[str, float] = {
    "discount_pct": 0.15,
    "discount_fixed": 0.10,
    "bogo": 0.35,
    "free_delivery": 0.08,
    "cashback": 0.12,
    "bundle": 0.12,
}


def get_fatigue_factor(week_1indexed: int, custom_curve: Optional[List[float]]) -> float:
    """Return fatigue multiplier for a given week (1-indexed within promo)."""
    if custom_curve:
        idx = week_1indexed - 1
        if idx < len(custom_curve):
            return custom_curve[idx]
        return custom_curve[-1]
    # Default curve: find largest key <= week
    applicable = [v for k, v in sorted(DEFAULT_FATIGUE.items()) if k <= week_1indexed]
    if applicable:
        return applicable[-1]
    return DEFAULT_FATIGUE[max(DEFAULT_FATIGUE.keys())]


def get_residual_factor(weeks_post_promo: int, custom_curve: Optional[List[float]]) -> float:
    """Return residual uplift fraction for weeks after promo ends (1-indexed)."""
    if custom_curve:
        idx = weeks_post_promo - 1
        if idx < len(custom_curve):
            return custom_curve[idx]
        return 0.0
    return DEFAULT_RESIDUAL.get(weeks_post_promo, 0.0)


def calculate_promo_uplift(promo: PromoInput, horizon: int) -> List[Dict[str, Any]]:
    """
    Returns per-week dict: {week, base_orders, incremental, residual, total, platform_cost, merchant_cost}

    Formula:
      uplift_frac = promo.uplift_pct / 100
      penetration = SEGMENT_PENETRATION[segment]
      During promo (week w in [1, duration]):
        incremental[w] = base × uplift_frac × fatigue[w] × penetration
      Post-promo residual (week d after promo ends):
        residual[d] = base × uplift_frac × residual_factor[d] × penetration
    """
    results = []
    uplift_frac = promo.uplift_pct / 100.0
    penetration = SEGMENT_PENETRATION.get(promo.target_segment, 1.0)
    base = promo.orders_base_weekly

    # Platform funding fraction
    if promo.who_funds == "platform":
        platform_split = 1.0
    elif promo.who_funds == "merchant":
        platform_split = 0.0
    else:  # cofunded
        platform_split = promo.cofund_split if promo.cofund_split is not None else 0.5

    cost_fraction = COST_PER_INC_ORDER_FRACTION.get(promo.promo_type, 0.15)

    for w in range(horizon):
        week_1 = w + 1
        promo_week = week_1  # which week within the promo

        if w < promo.duration_weeks:
            # Active promo week
            fatigue = get_fatigue_factor(promo_week, promo.fatigue_curve)
            incremental = base * uplift_frac * fatigue * penetration
            residual = 0.0
        else:
            # Post-promo residual
            weeks_after = w - promo.duration_weeks + 1
            incremental = 0.0
            residual_frac = get_residual_factor(weeks_after, promo.residual_curve)
            residual = base * uplift_frac * residual_frac * penetration

        total_uplift = incremental + residual
        total_cost = total_uplift * cost_fraction * base if total_uplift > 0 else 0.0
        # Actually cost should be based on incremental orders * cost per order
        # cost per incremental order = cost_fraction * AOV; here simplified as fraction * base
        # More accurately: cost = incremental * cost_fraction * (some AOV factor)
        # We'll keep it simple: platform spends cost_fraction of AOV per incremental order
        total_cost = (incremental + residual) * cost_fraction * platform_split

        results.append({
            "week": w,
            "base_orders": base,
            "incremental": incremental,
            "residual": residual,
            "total": total_uplift,
            "platform_cost": total_cost,
            "merchant_cost": (incremental + residual) * cost_fraction * (1 - platform_split),
        })

    return results


def aggregate_promos(promo_results_list: List[List[Dict[str, Any]]], horizon: int) -> Dict[int, Dict[str, float]]:
    """Sum up all promos per week."""
    agg: Dict[int, Dict[str, float]] = {w: {"incremental": 0.0, "residual": 0.0, "total": 0.0, "platform_cost": 0.0} for w in range(horizon)}
    for promo_results in promo_results_list:
        for row in promo_results:
            w = row["week"]
            if w in agg:
                agg[w]["incremental"] += row["incremental"]
                agg[w]["residual"] += row["residual"]
                agg[w]["total"] += row["total"]
                agg[w]["platform_cost"] += row["platform_cost"]
    return agg
