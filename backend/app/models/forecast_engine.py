"""
Forecast Engine: orchestrates all sub-models into a unified forecast.

Active models controlled by models_active list:
  A1 - Promo Uplift
  A2 - Restaurant Acquisition (cohort-based)
  A3 - Cannibalization (requires A2)
  A4 - Seasonality
  A5 - Expansion / City Launch (capacity constraint)
  B1 - Unit Economics
  B2 - Scenarios & Sensitivity
  C1 - Market Share Evolution
"""
from typing import List, Optional, Dict, Any
import math

from ..models.schemas import (
    ForecastRequest, ForecastResult, WeekResult, ForecastSummary
)
from . import promo_model, acquisition_model, cannibalization, seasonality, unit_economics, market_share, expansion_model


def _compute_weeks(request: ForecastRequest) -> List[WeekResult]:
    horizon = request.horizon_weeks
    active = set(request.models_active)

    # Initialize per-week accumulators
    promo_orders = [0.0] * horizon
    promo_costs = [0.0] * horizon
    acquisition_orders_vec = [0.0] * horizon
    cannibalization_vec = [0.0] * horizon
    seasonal_factors = [1.0] * horizon
    market_share_factors = [1.0] * horizon
    expansion_orders_vec = [0.0] * horizon

    cohort_matrix: Optional[List[List[float]]] = None

    # A1: Promo
    if "A1" in active and request.promo_inputs:
        all_promo_results = []
        for promo in request.promo_inputs:
            result = promo_model.calculate_promo_uplift(promo, horizon)
            all_promo_results.append(result)
        agg = promo_model.aggregate_promos(all_promo_results, horizon)
        for w in range(horizon):
            promo_orders[w] = agg[w]["total"]
            promo_costs[w] = agg[w]["platform_cost"]

    # A2: Acquisition
    if "A2" in active and request.acquisition_input:
        acq_result = acquisition_model.calculate_acquisition_orders(
            request.acquisition_input, horizon
        )
        acquisition_orders_vec = acq_result["weekly_orders"]
        cohort_matrix = acq_result["cohort_matrix"]

    # A3: Cannibalization (depends on A2)
    if "A3" in active and request.acquisition_input:
        cannibalization_vec = cannibalization.calculate_cannibalization(
            acquisition_orders_vec,
            request.acquisition_input.restaurant_type,
        )

    # A4: Seasonality
    if "A4" in active and request.seasonality_input:
        seasonal_factors = seasonality.calculate_seasonality_factors(
            request.seasonality_input, horizon
        )
    elif "A4" in active:
        # Use default seasonality for country
        from ..models.schemas import SeasonalityInput
        default_inp = SeasonalityInput(country=request.country)
        seasonal_factors = seasonality.calculate_seasonality_factors(default_inp, horizon)

    # A5: Expansion
    if "A5" in active and request.expansion_input:
        exp_result = expansion_model.calculate_expansion_orders(
            request.expansion_input.cities, horizon
        )
        expansion_orders_vec = exp_result["weekly_orders"]

    # C1: Market Share
    if "C1" in active and request.market_share_input:
        market_share_factors = market_share.calculate_market_share_factors(
            request.market_share_input, horizon
        )

    # Build week results
    weeks: List[WeekResult] = []
    prev_total = None

    for w in range(horizon):
        base = request.base_orders_weekly
        promo = promo_orders[w]
        acq = acquisition_orders_vec[w]
        cann = cannibalization_vec[w]
        exp = expansion_orders_vec[w]
        s_factor = seasonal_factors[w]
        ms_factor = market_share_factors[w]

        raw_total = (base + promo + acq + exp - cann)
        total = raw_total * s_factor * ms_factor

        if prev_total is not None and prev_total > 0:
            wow_pct = (total - prev_total) / prev_total * 100
        else:
            wow_pct = None

        weeks.append(WeekResult(
            week=w,
            base_orders=base,
            promo_orders=promo,
            acquisition_orders=acq,
            cannibalization=cann,
            seasonal_factor=s_factor,
            market_share_factor=ms_factor,
            total_orders=max(0, total),
            wow_pct=wow_pct,
        ))
        prev_total = total

    return weeks, promo_costs, cohort_matrix


def run_forecast(request: ForecastRequest) -> ForecastResult:
    """Main entry point: orchestrate all models."""
    active = set(request.models_active)

    weeks, promo_costs, cohort_matrix = _compute_weeks(request)

    # B1: Unit Economics
    ue_results = None
    if "B1" in active and request.unit_economics:
        weekly_totals = [w.total_orders for w in weeks]
        ue_results = unit_economics.calculate_unit_economics(
            request.unit_economics,
            weekly_totals,
            promo_costs,
        )

    # B2: Scenarios
    scenarios_result = None
    sensitivity_tornado = None
    if "B2" in active and request.scenarios_config:
        from . import scenarios as scen_module
        sc = request.scenarios_config

        # Upside: multiply key inputs
        import copy
        up_req = copy.deepcopy(request)
        down_req = copy.deepcopy(request)

        if up_req.promo_inputs:
            for p in up_req.promo_inputs:
                p.uplift_pct = p.uplift_pct * sc.upside_multiplier
        up_req.base_orders_weekly = request.base_orders_weekly * sc.upside_multiplier

        if down_req.promo_inputs:
            for p in down_req.promo_inputs:
                p.uplift_pct = p.uplift_pct * sc.downside_multiplier
        down_req.base_orders_weekly = request.base_orders_weekly * sc.downside_multiplier

        up_weeks, _, _ = _compute_weeks(up_req)
        down_weeks, _, _ = _compute_weeks(down_req)

        # Tornado sensitivity
        sensitivity_tornado = scen_module.build_tornado(
            lambda req: _compute_weeks(req)[0],
            request,
            sc.sensitivity_vars,
            sc.sensitivity_range_pct,
        )

        scenarios_result = scen_module.run_scenarios(weeks, up_weeks, down_weeks, sensitivity_tornado)

    # Build summary
    total_orders = sum(w.total_orders for w in weeks)
    avg_orders = total_orders / len(weeks) if weeks else 0
    peak_week_idx = max(range(len(weeks)), key=lambda i: weeks[i].total_orders) if weeks else 0
    peak_orders = weeks[peak_week_idx].total_orders if weeks else 0

    total_promo = sum(w.promo_orders for w in weeks)
    total_acq = sum(w.acquisition_orders for w in weeks)
    total_promo_cost = sum(promo_costs)

    # ROI: (promo incremental orders × contribution margin) / promo cost
    promo_roi = None
    payback_weeks = None
    if total_promo_cost > 0 and request.unit_economics:
        ue = request.unit_economics
        aov = ue.avg_order_value
        cm_per_order = aov * ue.commission_pct + ue.delivery_fee + ue.ad_revenue_per_order - ue.courier_cost_per_order - aov * ue.support_cost_pct - ue.tech_cost_per_order
        promo_revenue = total_promo * cm_per_order
        promo_roi = (promo_revenue - total_promo_cost) / total_promo_cost if total_promo_cost > 0 else None
        if promo_roi and promo_roi > 0:
            # Find week where cumulative CM > cumulative cost
            cumulative_cm = 0
            cumulative_cost = 0
            for i, (w, cost) in enumerate(zip(weeks, promo_costs)):
                cumulative_cm += w.promo_orders * cm_per_order
                cumulative_cost += cost
                if cumulative_cm >= cumulative_cost:
                    payback_weeks = i + 1
                    break

    # CAGR
    if len(weeks) >= 2 and weeks[0].total_orders > 0:
        cagr = (weeks[-1].total_orders / weeks[0].total_orders) ** (1 / len(weeks)) - 1
    else:
        cagr = 0.0

    summary = ForecastSummary(
        total_orders=total_orders,
        avg_weekly_orders=avg_orders,
        peak_week=peak_week_idx,
        peak_orders=peak_orders,
        promo_total_orders=total_promo,
        promo_total_cost=total_promo_cost,
        promo_roi=promo_roi,
        acquisition_total_orders=total_acq,
        payback_weeks=payback_weeks,
        cagr_weekly=cagr,
    )

    # Promo detail
    promo_detail = None
    if "A1" in active and request.promo_inputs:
        promo_detail = []
        for i, promo in enumerate(request.promo_inputs):
            detail = promo_model.calculate_promo_uplift(promo, request.horizon_weeks)
            promo_detail.append({
                "promo_index": i,
                "promo_type": promo.promo_type,
                "duration_weeks": promo.duration_weeks,
                "target_segment": promo.target_segment,
                "weekly": detail,
            })

    return ForecastResult(
        name=request.name,
        weeks=weeks,
        summary=summary,
        unit_economics_by_week=ue_results,
        scenarios=scenarios_result,
        cohort_matrix=cohort_matrix,
        sensitivity_tornado=sensitivity_tornado,
        promo_detail=promo_detail,
    )
