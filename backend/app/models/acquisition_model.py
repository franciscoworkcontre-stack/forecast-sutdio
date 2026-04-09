"""
Restaurant Acquisition Model (A2)

Formula (cohort-based):
  For each cohort c (restaurants joined at week c):
    active_restaurants[c][w] = restaurants_added[c] × (1 - churn_rate if w >= churn_week else 1.0)
    maturation[c][w] = maturation_curve[w - c]  # weeks since cohort joined
    onboarding_uplift[c][w] = onboarding_promo_uplift if (w - c) < onboarding_promo_weeks else 1.0
    orders[c][w] = active_restaurants[c][w] × steady_state_orders × maturation[c][w] × onboarding_uplift_factor
  total_acquisition_orders[w] = sum over all cohorts c of orders[c][w]

Cohort matrix: cohort_matrix[c][w] = orders contribution from cohort c at week w
"""
from typing import List, Dict, Optional, Any
from ..models.schemas import AcquisitionInput

MATURATION_CURVES: Dict[str, List[float]] = {
    "dark_kitchen_large": [0.15, 0.25, 0.40, 0.55, 0.65, 0.75, 0.82, 0.88, 0.92, 0.95, 0.98, 1.0],
    "dark_kitchen_small": [0.15, 0.25, 0.40, 0.55, 0.65, 0.75, 0.82, 0.88, 0.92, 0.95, 0.98, 1.0],
    "traditional_top": [0.08, 0.15, 0.22, 0.30, 0.38, 0.48, 0.58, 0.67, 0.75, 0.83, 0.90, 1.0],
    "traditional_avg": [0.08, 0.15, 0.22, 0.30, 0.38, 0.48, 0.58, 0.67, 0.75, 0.83, 0.90, 1.0],
    "grocery": [0.20, 0.35, 0.50, 0.65, 0.75, 0.85, 0.90, 0.95, 0.98, 1.0, 1.0, 1.0],
    "custom": [0.10, 0.20, 0.35, 0.50, 0.65, 0.78, 0.88, 0.94, 0.97, 1.0, 1.0, 1.0],
}

STEADY_STATE_DEFAULTS: Dict[str, float] = {
    "dark_kitchen_large": 215.0,
    "dark_kitchen_small": 100.0,
    "traditional_top": 140.0,
    "traditional_avg": 60.0,
    "grocery": 80.0,
    "custom": 100.0,
}


def get_maturation_factor(weeks_since_join: int, curve: List[float]) -> float:
    """Get maturation fraction for a restaurant that joined 'weeks_since_join' weeks ago."""
    if weeks_since_join < 0:
        return 0.0
    if weeks_since_join >= len(curve):
        return curve[-1]
    return curve[weeks_since_join]


def calculate_acquisition_orders(acq: AcquisitionInput, horizon: int) -> Dict[str, Any]:
    """
    Returns:
      - weekly_orders: List[float] of total acquisition orders per week
      - cohort_matrix: List[List[float]] cohort_matrix[cohort_idx][week]
    """
    # Select maturation curve
    if acq.maturation_curve:
        mat_curve = acq.maturation_curve
    else:
        mat_curve = MATURATION_CURVES.get(acq.restaurant_type, MATURATION_CURVES["traditional_avg"])

    steady = acq.steady_state_orders
    onboarding_uplift = acq.onboarding_promo_uplift or 0.0
    onboarding_weeks = acq.onboarding_promo_weeks or 0
    churn_rate = acq.churn_rate or 0.0
    churn_week = acq.churn_week or 999
    saturation = acq.saturation_factor or 1.0

    # Pad restaurant_plan to horizon
    plan = list(acq.restaurant_plan)
    while len(plan) < horizon:
        plan.append(0)

    num_cohorts = horizon
    cohort_matrix: List[List[float]] = []

    for cohort_idx in range(num_cohorts):
        restaurants_added = plan[cohort_idx] if cohort_idx < len(plan) else 0
        cohort_row: List[float] = []

        for w in range(horizon):
            weeks_since_join = w - cohort_idx
            if weeks_since_join < 0 or restaurants_added == 0:
                cohort_row.append(0.0)
                continue

            # Churn: after churn_week weeks since joining, apply churn rate
            if weeks_since_join >= churn_week:
                survival = 1.0 - churn_rate
            else:
                survival = 1.0

            active_restaurants = restaurants_added * survival

            mat_factor = get_maturation_factor(weeks_since_join, mat_curve)

            # Onboarding promo uplift
            if onboarding_weeks > 0 and weeks_since_join < onboarding_weeks:
                effective_steady = steady * (1.0 + onboarding_uplift)
            else:
                effective_steady = steady

            orders = active_restaurants * effective_steady * mat_factor * saturation
            cohort_row.append(orders)

        cohort_matrix.append(cohort_row)

    # Sum across cohorts per week
    weekly_orders: List[float] = []
    for w in range(horizon):
        total = sum(cohort_matrix[c][w] for c in range(num_cohorts))
        weekly_orders.append(total)

    return {
        "weekly_orders": weekly_orders,
        "cohort_matrix": cohort_matrix,
    }
