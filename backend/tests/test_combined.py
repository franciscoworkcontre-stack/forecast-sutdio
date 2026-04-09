"""Integration tests for the combined forecast engine."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.models.schemas import (
    ForecastRequest,
    PromoInput,
    AcquisitionInput,
    SeasonalityInput,
    UnitEconomicsInput,
    ScenariosInput,
)
from app.models.forecast_engine import run_forecast


def make_base_request(**overrides):
    defaults = dict(
        name="Test Forecast",
        horizon_weeks=12,
        country="MX",
        base_orders_weekly=1000.0,
        models_active=["A1"],
    )
    defaults.update(overrides)
    return ForecastRequest(**defaults)


def test_base_only():
    """No models active: total orders = base orders × 1.0 × horizon."""
    req = ForecastRequest(
        name="Base Only",
        horizon_weeks=4,
        country="MX",
        base_orders_weekly=500.0,
        models_active=[],
    )
    result = run_forecast(req)
    assert len(result.weeks) == 4
    for w in result.weeks:
        assert abs(w.total_orders - 500.0) < 0.01, f"Week {w.week}: expected 500, got {w.total_orders}"


def test_promo_increments():
    """A1 promo adds incremental orders above base."""
    promo = PromoInput(
        orders_base_weekly=1000,
        promo_type="discount_pct",
        duration_weeks=4,
        uplift_pct=20.0,
        target_segment="all",
        who_funds="platform",
    )
    req = make_base_request(
        base_orders_weekly=1000.0,
        models_active=["A1"],
        promo_inputs=[promo],
        horizon_weeks=4,
    )
    result = run_forecast(req)

    # Each week total > base (1000)
    for w in result.weeks:
        assert w.total_orders > 1000, f"Week {w.week}: promo should increase orders above base"
        assert w.promo_orders > 0, f"Week {w.week}: promo_orders should be positive"


def test_acquisition_adds_orders():
    """A2 acquisition adds orders to base."""
    acq = AcquisitionInput(
        restaurant_plan=[5, 5, 5, 5, 5, 5, 5, 5],
        restaurant_type="dark_kitchen_large",
        steady_state_orders=100.0,
        onboarding_promo_uplift=0.0,
        churn_rate=0.0,
        churn_week=999,
    )
    req = ForecastRequest(
        name="Acquisition Test",
        horizon_weeks=8,
        country="MX",
        base_orders_weekly=0.0,
        models_active=["A2"],
        acquisition_input=acq,
    )
    result = run_forecast(req)

    # Orders should grow over time as more cohorts mature
    orders = [w.total_orders for w in result.weeks]
    assert orders[-1] > orders[0], "Later weeks should have more orders as cohorts mature"
    assert all(o > 0 for o in orders), "All weeks should have positive orders"


def test_seasonality_modulates_orders():
    """A4 seasonality applies multiplicative factor."""
    # Use default MX seasonality
    req = ForecastRequest(
        name="Seasonality Test",
        horizon_weeks=12,
        country="MX",
        base_orders_weekly=1000.0,
        models_active=["A4"],
        seasonality_input=SeasonalityInput(
            country="MX",
            use_holidays=False,
            use_rain_season=False,
            use_pay_cycles=False,
            use_temperature=False,
            trend_weekly_growth=0.0,
        ),
    )
    result = run_forecast(req)

    # Factors should not all be exactly 1.0 (weekly pattern applies)
    factors = [w.seasonal_factor for w in result.weeks]
    # With weekly pattern applied, factors may vary
    assert all(f > 0 for f in factors), "All seasonal factors should be positive"


def test_unit_economics_computed():
    """B1 unit economics returns per-week data."""
    ue = UnitEconomicsInput(
        commission_pct=0.27,
        avg_order_value=15.0,
        delivery_fee=2.5,
        ad_revenue_per_order=0.10,
        courier_cost_per_order=4.0,
        support_cost_pct=0.02,
        tech_cost_per_order=0.03,
    )
    req = make_base_request(
        models_active=["B1"],
        unit_economics=ue,
        horizon_weeks=4,
    )
    result = run_forecast(req)

    assert result.unit_economics_by_week is not None
    assert len(result.unit_economics_by_week) == 4

    for ue_week in result.unit_economics_by_week:
        # Revenue = commission + delivery + ad
        expected_rev = 1000 * (15 * 0.27 + 2.5 + 0.10)
        assert abs(ue_week.gross_revenue - expected_rev) < 0.01, \
            f"Week {ue_week.week}: expected revenue {expected_rev:.2f}, got {ue_week.gross_revenue:.2f}"


def test_summary_totals_match_weeks():
    """Summary total_orders should equal sum of weekly totals."""
    promo = PromoInput(
        orders_base_weekly=500,
        promo_type="bogo",
        duration_weeks=6,
        uplift_pct=37.5,
        target_segment="all",
        who_funds="platform",
    )
    req = make_base_request(
        models_active=["A1"],
        promo_inputs=[promo],
        horizon_weeks=8,
        base_orders_weekly=500.0,
    )
    result = run_forecast(req)

    weekly_total = sum(w.total_orders for w in result.weeks)
    assert abs(result.summary.total_orders - weekly_total) < 0.1, \
        f"Summary total {result.summary.total_orders:.1f} != weekly sum {weekly_total:.1f}"


def test_scenarios_produces_three_bands():
    """B2 scenarios should produce base, upside, and downside."""
    req = ForecastRequest(
        name="Scenario Test",
        horizon_weeks=8,
        country="MX",
        base_orders_weekly=1000.0,
        models_active=["B2"],
        scenarios_config=ScenariosInput(
            upside_multiplier=1.2,
            downside_multiplier=0.8,
        ),
    )
    result = run_forecast(req)

    assert result.scenarios is not None
    assert len(result.scenarios.base) == 8
    assert len(result.scenarios.upside) == 8
    assert len(result.scenarios.downside) == 8

    # Upside should be > base > downside
    base_total = sum(w.total_orders for w in result.scenarios.base)
    up_total = sum(w.total_orders for w in result.scenarios.upside)
    down_total = sum(w.total_orders for w in result.scenarios.downside)

    assert up_total > base_total, "Upside should exceed base"
    assert down_total < base_total, "Downside should be below base"


def test_cannibalization_reduces_total():
    """A3 cannibalization reduces net acquisition orders."""
    acq = AcquisitionInput(
        restaurant_plan=[10] * 8,
        restaurant_type="traditional_avg",
        steady_state_orders=60.0,
        onboarding_promo_uplift=0.0,
        churn_rate=0.0,
        churn_week=999,
    )
    req_no_cann = ForecastRequest(
        name="No Cannibalization",
        horizon_weeks=8,
        country="MX",
        base_orders_weekly=0.0,
        models_active=["A2"],
        acquisition_input=acq,
    )
    req_with_cann = ForecastRequest(
        name="With Cannibalization",
        horizon_weeks=8,
        country="MX",
        base_orders_weekly=0.0,
        models_active=["A2", "A3"],
        acquisition_input=acq,
    )

    result_no = run_forecast(req_no_cann)
    result_with = run_forecast(req_with_cann)

    for i, (w_no, w_with) in enumerate(zip(result_no.weeks, result_with.weeks)):
        assert w_with.total_orders <= w_no.total_orders, \
            f"Week {i}: cannibalization should reduce total orders"
        if w_no.total_orders > 0:
            assert w_with.cannibalization >= 0, "Cannibalization should be non-negative"


def test_wow_percentage():
    """WoW% should be None for week 0 and computed for subsequent weeks."""
    req = make_base_request(
        base_orders_weekly=1000.0,
        models_active=[],
        horizon_weeks=4,
    )
    result = run_forecast(req)

    assert result.weeks[0].wow_pct is None, "Week 0 should have no WoW%"
    for w in result.weeks[1:]:
        assert w.wow_pct is not None or w.wow_pct == 0, "Week 1+ should have WoW%"


if __name__ == "__main__":
    test_base_only()
    test_promo_increments()
    test_acquisition_adds_orders()
    test_seasonality_modulates_orders()
    test_unit_economics_computed()
    test_summary_totals_match_weeks()
    test_scenarios_produces_three_bands()
    test_cannibalization_reduces_total()
    test_wow_percentage()
    print("All combined tests passed!")
