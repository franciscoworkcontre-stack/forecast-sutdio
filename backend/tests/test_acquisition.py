"""Tests for the Restaurant Acquisition model (A2)."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.models.schemas import AcquisitionInput
from app.models.acquisition_model import (
    calculate_acquisition_orders,
    MATURATION_CURVES,
    STEADY_STATE_DEFAULTS,
)


def test_dark_kitchen_maturation():
    """Week 1 should be 15% of steady state for dark_kitchen_large."""
    acq = AcquisitionInput(
        restaurant_plan=[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],  # 1 restaurant at week 0
        restaurant_type="dark_kitchen_large",
        steady_state_orders=100.0,  # simplify to 100
        onboarding_promo_uplift=0.0,
        churn_rate=0.0,
        churn_week=999,
    )
    result = calculate_acquisition_orders(acq, horizon=12)
    weekly = result["weekly_orders"]

    # Week 0: 1 restaurant, maturation[0] = 0.15, steady = 100
    # orders = 1 * 100 * 0.15 = 15
    assert abs(weekly[0] - 15.0) < 0.01, f"Week 1 orders should be 15, got {weekly[0]}"

    # Week 11: fully matured, maturation[-1] = 1.0
    assert abs(weekly[11] - 100.0) < 0.01, f"Week 12 orders should be 100, got {weekly[11]}"


def test_cohort_accumulation():
    """Multiple cohorts should sum correctly."""
    # 1 restaurant per week for 3 weeks
    acq = AcquisitionInput(
        restaurant_plan=[1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        restaurant_type="dark_kitchen_large",
        steady_state_orders=100.0,
        onboarding_promo_uplift=0.0,
        churn_rate=0.0,
        churn_week=999,
    )
    result = calculate_acquisition_orders(acq, horizon=12)
    weekly = result["weekly_orders"]
    cohort_matrix = result["cohort_matrix"]

    # At week 2 (index 2): 3 cohorts active
    # Cohort 0 (2 weeks old): maturation[2] = 0.40 → 40 orders
    # Cohort 1 (1 week old): maturation[1] = 0.25 → 25 orders
    # Cohort 2 (0 weeks old): maturation[0] = 0.15 → 15 orders
    # Total = 80
    expected_w2 = 100 * (MATURATION_CURVES["dark_kitchen_large"][2] +
                         MATURATION_CURVES["dark_kitchen_large"][1] +
                         MATURATION_CURVES["dark_kitchen_large"][0])
    assert abs(weekly[2] - expected_w2) < 0.1, \
        f"Week 3 with 3 cohorts: expected {expected_w2:.1f}, got {weekly[2]:.1f}"


def test_churn_effect():
    """20% churn by week 5 should reduce active restaurants."""
    acq = AcquisitionInput(
        restaurant_plan=[10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],  # 10 restaurants at week 0
        restaurant_type="dark_kitchen_large",
        steady_state_orders=100.0,
        onboarding_promo_uplift=0.0,
        churn_rate=0.20,
        churn_week=5,
    )
    result = calculate_acquisition_orders(acq, horizon=12)
    weekly = result["weekly_orders"]

    # Before churn (week 4): 10 restaurants
    w4 = weekly[4]
    # After churn (week 5+): 10 * 0.80 = 8 restaurants
    w5 = weekly[5]

    # Compute expected
    mat_w4 = MATURATION_CURVES["dark_kitchen_large"][4]
    mat_w5 = MATURATION_CURVES["dark_kitchen_large"][5]
    expected_w4 = 10 * 100 * mat_w4
    expected_w5 = 10 * 0.80 * 100 * mat_w5  # 20% churn applied

    assert abs(w4 - expected_w4) < 0.1, f"Pre-churn week 5: expected {expected_w4}, got {w4}"
    assert abs(w5 - expected_w5) < 0.1, f"Post-churn week 6: expected {expected_w5}, got {w5}"


def test_onboarding_promo_uplift():
    """Onboarding promo should boost orders during first N weeks."""
    acq_with_promo = AcquisitionInput(
        restaurant_plan=[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        restaurant_type="traditional_avg",
        steady_state_orders=60.0,
        onboarding_promo_uplift=0.40,
        onboarding_promo_weeks=3,
        churn_rate=0.0,
        churn_week=999,
    )
    acq_no_promo = AcquisitionInput(
        restaurant_plan=[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        restaurant_type="traditional_avg",
        steady_state_orders=60.0,
        onboarding_promo_uplift=0.0,
        onboarding_promo_weeks=3,
        churn_rate=0.0,
        churn_week=999,
    )

    r_promo = calculate_acquisition_orders(acq_with_promo, horizon=12)
    r_no_promo = calculate_acquisition_orders(acq_no_promo, horizon=12)

    # During promo weeks (0-2), promo version should be 1.40x
    for w in range(3):
        ratio = r_promo["weekly_orders"][w] / r_no_promo["weekly_orders"][w] if r_no_promo["weekly_orders"][w] > 0 else 1
        assert abs(ratio - 1.40) < 0.001, f"Week {w}: expected 1.40x, got {ratio:.3f}"

    # After promo (week 3+), should be equal
    for w in range(3, 12):
        ratio = r_promo["weekly_orders"][w] / r_no_promo["weekly_orders"][w] if r_no_promo["weekly_orders"][w] > 0 else 1
        assert abs(ratio - 1.0) < 0.001, f"Post-promo week {w}: expected 1.0x, got {ratio:.3f}"


def test_cohort_matrix_shape():
    """Cohort matrix should be (horizon x horizon)."""
    horizon = 8
    acq = AcquisitionInput(
        restaurant_plan=[2, 3, 1, 0, 2, 0, 0, 0],
        restaurant_type="grocery",
        steady_state_orders=80.0,
        onboarding_promo_uplift=0.0,
        churn_rate=0.0,
        churn_week=999,
    )
    result = calculate_acquisition_orders(acq, horizon=horizon)
    matrix = result["cohort_matrix"]

    assert len(matrix) == horizon, f"Expected {horizon} cohorts, got {len(matrix)}"
    assert all(len(row) == horizon for row in matrix), "Each cohort row should have horizon entries"


def test_no_restaurants_no_orders():
    """Zero restaurant plan → zero orders."""
    acq = AcquisitionInput(
        restaurant_plan=[0, 0, 0, 0],
        restaurant_type="traditional_avg",
        steady_state_orders=60.0,
        onboarding_promo_uplift=0.0,
        churn_rate=0.0,
        churn_week=999,
    )
    result = calculate_acquisition_orders(acq, horizon=4)
    assert all(o == 0 for o in result["weekly_orders"]), "Zero restaurants should give zero orders"


if __name__ == "__main__":
    test_dark_kitchen_maturation()
    test_cohort_accumulation()
    test_churn_effect()
    test_onboarding_promo_uplift()
    test_cohort_matrix_shape()
    test_no_restaurants_no_orders()
    print("All acquisition tests passed!")
