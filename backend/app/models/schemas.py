from pydantic import BaseModel, Field, model_validator
from typing import Optional, List, Dict, Literal, Any
import math


class PromoInput(BaseModel):
    orders_base_weekly: float = Field(ge=0, le=1_000_000, description="Base weekly orders before promo")
    promo_type: Literal["discount_pct", "discount_fixed", "bogo", "free_delivery", "cashback", "bundle"]
    duration_weeks: int = Field(ge=1, le=52)
    uplift_pct: float = Field(ge=0, le=500, description="Uplift as percentage (e.g., 27.5 = 27.5%)")
    target_segment: Literal["all", "new_users", "dormant", "high_value"] = "all"
    who_funds: Literal["platform", "merchant", "cofunded"] = "platform"
    cofund_split: Optional[float] = Field(default=0.5, ge=0, le=1)
    fatigue_curve: Optional[List[float]] = None
    residual_curve: Optional[List[float]] = None


class AcquisitionInput(BaseModel):
    restaurant_plan: List[int] = Field(description="Restaurants added per week")
    restaurant_type: Literal["dark_kitchen_large", "dark_kitchen_small", "traditional_top", "traditional_avg", "grocery", "custom"]
    maturation_curve: Optional[List[float]] = None
    steady_state_orders: float = Field(ge=0, description="Orders/week at maturity per restaurant")
    onboarding_promo_uplift: Optional[float] = Field(default=0.40, ge=0, le=5)
    onboarding_promo_weeks: Optional[int] = Field(default=6, ge=0, le=52)
    churn_rate: Optional[float] = Field(default=0.20, ge=0, le=1)
    churn_week: Optional[int] = Field(default=5, ge=0, le=10000)
    saturation_factor: Optional[float] = Field(default=1.0, ge=0, le=2)


class SeasonalityInput(BaseModel):
    country: str = "MX"
    weekly_pattern: Optional[Dict[str, float]] = None
    use_holidays: bool = True
    use_rain_season: bool = True
    use_pay_cycles: bool = True
    use_temperature: bool = True
    holiday_overrides: Optional[Dict[str, float]] = None
    trend_weekly_growth: Optional[float] = Field(default=0.002, ge=-0.1, le=0.1)


class UnitEconomicsInput(BaseModel):
    commission_pct: float = Field(default=0.27, ge=0, le=1)
    avg_order_value: float = Field(default=15.0, ge=0)
    delivery_fee: float = Field(default=2.5, ge=0)
    ad_revenue_per_order: float = Field(default=0.10, ge=0)
    courier_cost_per_order: float = Field(default=4.0, ge=0)
    support_cost_pct: float = Field(default=0.02, ge=0, le=1)
    tech_cost_per_order: float = Field(default=0.03, ge=0)
    subsidy_per_order: Optional[float] = None
    marketing_fixed_cost: Optional[float] = Field(default=0, ge=0)


class ScenariosInput(BaseModel):
    base_scenario: Optional[Dict[str, Any]] = None
    upside_multiplier: float = Field(default=1.2, ge=0.5, le=3.0)
    downside_multiplier: float = Field(default=0.8, ge=0.1, le=1.5)
    sensitivity_vars: Optional[List[str]] = None
    sensitivity_range_pct: float = Field(default=0.20, ge=0.01, le=1.0)


class MarketShareInput(BaseModel):
    current_share: float = Field(default=0.30, ge=0, le=1)
    target_share: float = Field(default=0.35, ge=0, le=1)
    total_market_orders_weekly: float = Field(default=100000, ge=0)
    share_gain_per_week: Optional[float] = None


class ExpansionInput(BaseModel):
    cities: List[Dict[str, Any]] = Field(description="List of city configs with launch week, population, penetration")
    category_expansion: Optional[List[Dict[str, Any]]] = None


class ForecastRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    horizon_weeks: int = Field(ge=4, le=52)
    country: str = "MX"
    base_orders_weekly: float = Field(default=0, ge=0, le=10_000_000)
    segments: List[str] = ["all"]
    models_active: List[str] = Field(description="e.g. ['A1','A2','A4','B1']")
    promo_inputs: Optional[List[PromoInput]] = None
    acquisition_input: Optional[AcquisitionInput] = None
    seasonality_input: Optional[SeasonalityInput] = None
    unit_economics: Optional[UnitEconomicsInput] = None
    scenarios_config: Optional[ScenariosInput] = None
    market_share_input: Optional[MarketShareInput] = None
    expansion_input: Optional[ExpansionInput] = None


# ---- Output models ----

class WeekResult(BaseModel):
    week: int
    base_orders: float
    promo_orders: float
    acquisition_orders: float
    cannibalization: float
    seasonal_factor: float
    market_share_factor: float
    total_orders: float
    wow_pct: Optional[float] = None


class UEWeekResult(BaseModel):
    week: int
    total_orders: float
    gross_revenue: float
    commission_revenue: float
    delivery_fee_revenue: float
    ad_revenue: float
    courier_cost: float
    support_cost: float
    tech_cost: float
    subsidy_cost: float
    marketing_cost: float
    contribution_margin: float
    contribution_margin_pct: float
    ebitda: float


class TornadoEntry(BaseModel):
    variable: str
    upside_delta: float
    downside_delta: float
    base_value: float


class ScenariosResult(BaseModel):
    base: List[WeekResult]
    upside: List[WeekResult]
    downside: List[WeekResult]
    tornado: Optional[List[TornadoEntry]] = None


class ForecastSummary(BaseModel):
    total_orders: float
    avg_weekly_orders: float
    peak_week: int
    peak_orders: float
    promo_total_orders: float
    promo_total_cost: float
    promo_roi: Optional[float]
    acquisition_total_orders: float
    payback_weeks: Optional[int]
    cagr_weekly: float


class ForecastResult(BaseModel):
    request_id: Optional[str] = None
    name: str
    weeks: List[WeekResult]
    summary: ForecastSummary
    unit_economics_by_week: Optional[List[UEWeekResult]] = None
    scenarios: Optional[ScenariosResult] = None
    cohort_matrix: Optional[List[List[float]]] = None
    sensitivity_tornado: Optional[List[TornadoEntry]] = None
    promo_detail: Optional[List[Dict[str, Any]]] = None
    inputs: Optional[Dict[str, Any]] = None


class SaveForecastResponse(BaseModel):
    id: str
    name: str
    created_at: str


class ForecastListItem(BaseModel):
    id: str
    name: str
    created_at: str
    horizon_weeks: int
    country: str
    models_active: List[str]
    total_orders: float
