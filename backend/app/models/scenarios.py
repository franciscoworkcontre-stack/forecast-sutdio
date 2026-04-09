"""
Scenarios & Sensitivity Model (B2)

Runs the combined forecast under multiple parameter variations to generate:
- Base / Upside / Downside scenario bands
- Tornado chart: sensitivity of total orders to each input variable ±20%
"""
from typing import List, Dict, Any, Optional, Callable
from ..models.schemas import ScenariosInput, TornadoEntry, ScenariosResult, WeekResult

import copy


SENSITIVITY_VARIABLES = [
    "uplift_pct",
    "orders_base_weekly",
    "steady_state_orders",
    "churn_rate",
    "onboarding_promo_uplift",
    "commission_pct",
    "avg_order_value",
    "courier_cost_per_order",
    "trend_weekly_growth",
    "saturation_factor",
]


def run_scenarios(
    base_weeks: List[WeekResult],
    upside_weeks: List[WeekResult],
    downside_weeks: List[WeekResult],
    tornado_entries: Optional[List[TornadoEntry]],
) -> ScenariosResult:
    return ScenariosResult(
        base=base_weeks,
        upside=upside_weeks,
        downside=downside_weeks,
        tornado=tornado_entries,
    )


def build_tornado(
    run_forecast_fn: Callable[[Any], List[WeekResult]],
    request: Any,
    sensitivity_vars: Optional[List[str]] = None,
    range_pct: float = 0.20,
) -> List[TornadoEntry]:
    """
    For each sensitivity variable, modify the input by ±range_pct and compute
    the delta in total orders vs base.

    Returns sorted TornadoEntry list (largest impact first).
    """
    # Run base first
    base_weeks = run_forecast_fn(request)
    base_total = sum(w.total_orders for w in base_weeks)

    vars_to_test = sensitivity_vars or SENSITIVITY_VARIABLES
    entries: List[TornadoEntry] = []

    for var in vars_to_test:
        # Try to find and modify this variable in request
        upside_req, found_up = _modify_request(request, var, 1.0 + range_pct)
        downside_req, found_down = _modify_request(request, var, 1.0 - range_pct)

        if not found_up or not found_down:
            continue

        try:
            up_weeks = run_forecast_fn(upside_req)
            up_total = sum(w.total_orders for w in up_weeks)
        except Exception:
            up_total = base_total

        try:
            down_weeks = run_forecast_fn(downside_req)
            down_total = sum(w.total_orders for w in down_weeks)
        except Exception:
            down_total = base_total

        upside_delta = up_total - base_total
        downside_delta = down_total - base_total

        if abs(upside_delta) > 0.01 or abs(downside_delta) > 0.01:
            entries.append(TornadoEntry(
                variable=var,
                upside_delta=upside_delta,
                downside_delta=downside_delta,
                base_value=base_total,
            ))

    # Sort by absolute impact
    entries.sort(key=lambda e: abs(e.upside_delta) + abs(e.downside_delta), reverse=True)
    return entries[:10]  # top 10


def _modify_request(request: Any, var_name: str, multiplier: float):
    """Try to find and multiply a variable in the request. Returns (modified_request, found)."""
    import copy as copy_module
    req = copy_module.deepcopy(request)

    # Try promo inputs
    if req.promo_inputs and var_name in ("uplift_pct", "orders_base_weekly"):
        for p in req.promo_inputs:
            val = getattr(p, var_name, None)
            if val is not None:
                setattr(p, var_name, max(0, val * multiplier))
        return req, True

    # Try acquisition input
    if req.acquisition_input and var_name in ("steady_state_orders", "churn_rate", "onboarding_promo_uplift", "saturation_factor"):
        val = getattr(req.acquisition_input, var_name, None)
        if val is not None:
            setattr(req.acquisition_input, var_name, max(0, val * multiplier))
            return req, True

    # Try seasonality
    if req.seasonality_input and var_name == "trend_weekly_growth":
        val = req.seasonality_input.trend_weekly_growth or 0.002
        req.seasonality_input.trend_weekly_growth = val * multiplier
        return req, True

    # Try unit economics
    if req.unit_economics and var_name in ("commission_pct", "avg_order_value", "courier_cost_per_order"):
        val = getattr(req.unit_economics, var_name, None)
        if val is not None:
            setattr(req.unit_economics, var_name, max(0, val * multiplier))
            return req, True

    # Try base orders
    if var_name == "orders_base_weekly":
        req.base_orders_weekly = max(0, req.base_orders_weekly * multiplier)
        return req, True

    return req, False
