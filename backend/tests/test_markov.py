"""Tests for the Markov v3 forecast engine."""
import pytest
from app.models.markov_schemas import (
    MarkovForecastRequest, UserProfile, TransitionMatrix,
    FunnelParams, Lever, AcquisitionConfig, RampConfig
)
from app.models.markov_engine import run_markov_forecast


def make_simple_request(n_weeks=4):
    """Minimal valid request with 2 profiles for testing."""
    return MarkovForecastRequest(
        name="test",
        horizon_weeks=n_weeks,
        aov=290.0,
        take_rate=0.22,
        overlap_factor=0.15,
        profiles=[
            UserProfile(id="A", name="EFO", initial_users=10000),
            UserProfile(id="E", name="High Freq", initial_users=5000),
        ],
        transition_matrix=TransitionMatrix(
            profile_ids=["A", "E"],
            matrix=[[0.3, 0.7], [0.1, 0.9]]
        ),
        funnel_params=[
            FunnelParams(profile_id="A", open_app_pct=0.55, avg_weekly_sessions=1.0,
                         see_vertical_pct=0.25, entry_topic=0.45, entry_feed=0.40, entry_filter=0.15,
                         p1_topic=0.35, p1_feed=0.30, p1_filter=0.25,
                         p2_topic=0.18, p2_feed=0.15, p2_filter=0.12),
            FunnelParams(profile_id="E", open_app_pct=0.70, avg_weekly_sessions=2.5,
                         see_vertical_pct=0.40, entry_topic=0.35, entry_feed=0.40, entry_filter=0.25,
                         p1_topic=0.40, p1_feed=0.35, p1_filter=0.30,
                         p2_topic=0.22, p2_feed=0.19, p2_filter=0.16),
        ],
        levers=[],
        ramp_config=RampConfig(ramp_weeks=4),
        acquisition=AcquisitionConfig(active=False),
    )


def test_basic_run():
    req = make_simple_request(4)
    result = run_markov_forecast(req)
    assert len(result.weeks) == 4
    assert result.summary["total_orders"] > 0


def test_no_levers_means_no_incremental():
    """With no active levers, incremental orders should be ~0."""
    req = make_simple_request(4)
    result = run_markov_forecast(req)
    for w in result.weeks:
        assert abs(w.orders_incremental) < 1.0, f"Week {w.week} had unexpected incremental: {w.orders_incremental}"


def test_lever_increases_orders():
    req = make_simple_request(4)
    req.levers = [Lever(id="test_lever", name="Test Conv", lever_type="conversion", active=True, base_uplift=0.20)]
    result = run_markov_forecast(req)
    assert result.summary["total_incremental"] > 0


def test_transition_matrix_validation():
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        TransitionMatrix(profile_ids=["A", "B"], matrix=[[0.5, 0.4], [0.5, 0.5]])  # row 0 sums to 0.9


def test_p_and_l():
    req = make_simple_request(4)
    req.levers = [Lever(id="ddc", name="DDC", lever_type="conversion", active=True, base_uplift=0.10)]
    result = run_markov_forecast(req)
    for w in result.weeks:
        assert w.total_gastos >= 0
        assert w.gmv >= 0
        assert w.net_revenue == pytest.approx(w.gmv * 0.22, rel=0.01)


def test_acquisition_loop():
    req = make_simple_request(8)
    req.levers = [Lever(id="conv", name="Conv", lever_type="conversion", active=True, base_uplift=0.15)]
    req.acquisition = AcquisitionConfig(active=True, efo_share=0.20, alpha=0.40, wow_cap=0.50)
    result = run_markov_forecast(req)
    # With acquisition active, total users should grow over time
    w1_users = sum(result.weeks[0].profile_users.values())
    w8_users = sum(result.weeks[7].profile_users.values())
    assert w8_users > w1_users, "Users should grow with acquisition active"


def test_summary_totals():
    req = make_simple_request(4)
    result = run_markov_forecast(req)
    assert result.summary["total_orders"] == pytest.approx(sum(w.orders_total for w in result.weeks), rel=0.01)
    assert result.summary["total_revenue"] == pytest.approx(sum(w.net_revenue for w in result.weeks), rel=0.01)
