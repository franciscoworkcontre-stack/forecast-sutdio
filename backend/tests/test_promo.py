"""Tests for the Promo Uplift model (A1)."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.models.schemas import PromoInput
from app.models.promo_model import (
    calculate_promo_uplift,
    get_fatigue_factor,
    get_residual_factor,
    SEGMENT_PENETRATION,
    DEFAULT_FATIGUE,
    DEFAULT_RESIDUAL,
)


def test_promo_uplift_basic():
    """100 base orders, 20% uplift, 4 weeks, all users → ~20 incremental/week (weeks 1-2, before fatigue)"""
    promo = PromoInput(
        orders_base_weekly=100,
        promo_type="discount_pct",
        duration_weeks=4,
        uplift_pct=20.0,
        target_segment="all",
        who_funds="platform",
    )
    results = calculate_promo_uplift(promo, horizon=4)

    # Weeks 1-2: fatigue = 1.0, penetration = 1.0
    # incremental = 100 * 0.20 * 1.0 * 1.0 = 20
    assert len(results) == 4
    assert abs(results[0]["incremental"] - 20.0) < 0.01
    assert abs(results[1]["incremental"] - 20.0) < 0.01


def test_fatigue_curve():
    """After week 2, uplift should decay by fatigue factor."""
    promo = PromoInput(
        orders_base_weekly=1000,
        promo_type="free_delivery",
        duration_weeks=12,
        uplift_pct=27.5,
        target_segment="all",
        who_funds="platform",
    )
    results = calculate_promo_uplift(promo, horizon=12)

    # Week 1-2: fatigue = 1.0
    inc_w1 = results[0]["incremental"]
    inc_w2 = results[1]["incremental"]
    assert abs(inc_w1 - inc_w2) < 0.01, "Weeks 1 and 2 should have same fatigue"

    # Week 3-4: fatigue = 0.90
    inc_w3 = results[2]["incremental"]
    assert abs(inc_w3 / inc_w1 - 0.90) < 0.01, f"Expected 0.90 fatigue at week 3, got {inc_w3 / inc_w1:.3f}"

    # Week 5-8: fatigue = 0.75
    inc_w5 = results[4]["incremental"]
    assert abs(inc_w5 / inc_w1 - 0.75) < 0.01, f"Expected 0.75 fatigue at week 5, got {inc_w5 / inc_w1:.3f}"

    # Week 9+: fatigue = 0.60
    inc_w9 = results[8]["incremental"]
    assert abs(inc_w9 / inc_w1 - 0.60) < 0.01, f"Expected 0.60 fatigue at week 9, got {inc_w9 / inc_w1:.3f}"


def test_residual_post_promo():
    """30% residual in week 1 post-promo."""
    promo = PromoInput(
        orders_base_weekly=1000,
        promo_type="cashback",
        duration_weeks=2,
        uplift_pct=14.0,
        target_segment="all",
        who_funds="platform",
    )
    results = calculate_promo_uplift(promo, horizon=6)

    # Weeks 0, 1: active promo
    # Week 2: 1 week post-promo → residual = 0.30
    # Expected residual = 1000 * 0.14 * 0.30 * 1.0 = 42
    expected_residual_w3 = 1000 * 0.14 * DEFAULT_RESIDUAL[1]
    assert abs(results[2]["residual"] - expected_residual_w3) < 0.01, \
        f"Week 3 residual: expected {expected_residual_w3:.2f}, got {results[2]['residual']:.2f}"

    # During-promo weeks should have residual = 0
    assert results[0]["residual"] == 0.0
    assert results[1]["residual"] == 0.0


def test_segment_penetration():
    """dormant segment should use 0.20 penetration → 1/5th of 'all' uplift."""
    promo_all = PromoInput(
        orders_base_weekly=1000,
        promo_type="discount_pct",
        duration_weeks=4,
        uplift_pct=20.0,
        target_segment="all",
        who_funds="platform",
    )
    promo_dormant = PromoInput(
        orders_base_weekly=1000,
        promo_type="discount_pct",
        duration_weeks=4,
        uplift_pct=20.0,
        target_segment="dormant",
        who_funds="platform",
    )

    r_all = calculate_promo_uplift(promo_all, horizon=4)
    r_dormant = calculate_promo_uplift(promo_dormant, horizon=4)

    expected_penetration = SEGMENT_PENETRATION["dormant"]  # 0.20
    ratio = r_dormant[0]["incremental"] / r_all[0]["incremental"]
    assert abs(ratio - expected_penetration) < 0.001, \
        f"Dormant penetration should be {expected_penetration}, ratio is {ratio:.3f}"


def test_custom_fatigue_curve():
    """Custom fatigue curve should override defaults."""
    custom_fatigue = [1.0, 0.8, 0.5, 0.2]
    promo = PromoInput(
        orders_base_weekly=100,
        promo_type="bogo",
        duration_weeks=4,
        uplift_pct=37.5,
        target_segment="all",
        who_funds="platform",
        fatigue_curve=custom_fatigue,
    )
    results = calculate_promo_uplift(promo, horizon=4)

    base_inc = 100 * 0.375 * 1.0  # week 0: fatigue=1.0
    expected = [base_inc * f for f in custom_fatigue]

    for w, (result, exp) in enumerate(zip(results, expected)):
        assert abs(result["incremental"] - exp) < 0.01, \
            f"Week {w}: expected {exp:.2f}, got {result['incremental']:.2f}"


def test_cofunding_split():
    """co-funded promo: 50% split should halve platform cost vs 100% platform."""
    promo_platform = PromoInput(
        orders_base_weekly=1000,
        promo_type="discount_pct",
        duration_weeks=4,
        uplift_pct=20.0,
        target_segment="all",
        who_funds="platform",
    )
    promo_cofunded = PromoInput(
        orders_base_weekly=1000,
        promo_type="discount_pct",
        duration_weeks=4,
        uplift_pct=20.0,
        target_segment="all",
        who_funds="cofunded",
        cofund_split=0.5,
    )

    r_p = calculate_promo_uplift(promo_platform, horizon=4)
    r_c = calculate_promo_uplift(promo_cofunded, horizon=4)

    # Platform cost should be 50% when cofunded
    ratio = r_c[0]["platform_cost"] / r_p[0]["platform_cost"]
    assert abs(ratio - 0.5) < 0.001, f"Co-funded should have 0.5x platform cost, got {ratio:.3f}"


def test_no_residual_after_decay():
    """Residual should be 0 after DEFAULT_RESIDUAL runs out."""
    promo = PromoInput(
        orders_base_weekly=1000,
        promo_type="bundle",
        duration_weeks=1,
        uplift_pct=18.5,
        target_segment="all",
        who_funds="platform",
    )
    results = calculate_promo_uplift(promo, horizon=10)

    # Week 0: active
    # Weeks 1-5: residual (DEFAULT_RESIDUAL goes to 0 at week 5)
    # Week 6+: no residual
    assert results[6]["residual"] == 0.0, f"Expected 0 residual at week 7, got {results[6]['residual']}"
    assert results[7]["residual"] == 0.0


if __name__ == "__main__":
    test_promo_uplift_basic()
    test_fatigue_curve()
    test_residual_post_promo()
    test_segment_penetration()
    test_custom_fatigue_curve()
    test_cofunding_split()
    test_no_residual_after_decay()
    print("All promo tests passed!")
