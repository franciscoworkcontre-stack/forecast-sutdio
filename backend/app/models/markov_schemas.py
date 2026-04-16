from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Dict, Literal


class UserProfile(BaseModel):
    id: str  # "A", "B", "C", etc.
    name: str  # "EFO", "2nd Order", "Churned", etc.
    initial_users: float = Field(ge=0)


class TransitionMatrix(BaseModel):
    profile_ids: List[str]
    matrix: List[List[float]]  # NxN, each row must sum to 1.0 (±0.001)

    @model_validator(mode='after')
    def validate_rows(self):
        for i, row in enumerate(self.matrix):
            s = sum(row)
            if abs(s - 1.0) > 0.001:
                raise ValueError(f"Row {i} sums to {s:.4f}, must be 1.0 ±0.001")
        return self


class FunnelParams(BaseModel):
    profile_id: str
    open_app_pct: float = Field(ge=0, le=1)
    avg_weekly_sessions: float = Field(ge=0)
    see_vertical_pct: float = Field(ge=0, le=1)
    entry_topic: float = Field(ge=0, le=1)
    entry_feed: float = Field(ge=0, le=1)
    entry_filter: float = Field(ge=0, le=1)
    p1_topic: float = Field(ge=0, le=1)
    p1_feed: float = Field(ge=0, le=1)
    p1_filter: float = Field(ge=0, le=1)
    p2_topic: float = Field(ge=0, le=1)
    p2_feed: float = Field(ge=0, le=1)
    p2_filter: float = Field(ge=0, le=1)


class Lever(BaseModel):
    id: str
    name: str
    lever_type: Literal["traffic", "conversion", "both"]
    active: bool = True
    base_uplift: float = Field(ge=0, le=5.0)  # e.g. 0.10 = 10%
    # Per-profile uplifts (optional override; if empty, base_uplift applies to all)
    profile_uplifts: Optional[Dict[str, float]] = None


class RampConfig(BaseModel):
    ramp_weeks: int = Field(ge=1, le=52, default=10)
    curve_type: Literal["linear", "logarithmic", "step"] = "linear"


class AcquisitionConfig(BaseModel):
    active: bool = False
    efo_share: float = Field(ge=0, le=1, default=0.20)
    alpha: float = Field(ge=0, le=1, default=0.40)
    new_user_orders_ratio: float = Field(ge=0.1, le=10, default=1.0)
    wow_cap: float = Field(ge=0, le=2, default=0.50)
    profile_split: Dict[str, float] = {"A": 0.7, "B": 0.3}


class ProfileCostConfig(BaseModel):
    profile_id: str
    pct_w_coupon: float = Field(ge=0, le=1, default=0.3)
    gasto_cupon: float = Field(ge=0, default=35.0)   # Gasto P2C: costo por cupón redimido
    coupon_redeem: float = Field(ge=0, le=1, default=0.6)
    pct_w_ddc: float = Field(ge=0, le=1, default=0.2)
    gasto_ddc: float = Field(ge=0, default=25.0)      # Gasto P2C: costo por orden con free delivery
    pct_w_bxsy: float = Field(ge=0, le=1, default=0.15)
    gasto_bxsy: float = Field(ge=0, default=40.0)     # Gasto B2C: subsidio por orden BxSy/bundle
    bxsy_redeem: float = Field(ge=0, le=1, default=0.8)


class MarkovForecastRequest(BaseModel):
    name: str
    country: str = "MX"
    horizon_weeks: int = Field(ge=4, le=52, default=12)
    aov: float = Field(ge=1, default=290.0)
    take_rate: float = Field(ge=0, le=1, default=0.22)
    currency: str = "MXN"
    overlap_factor: float = Field(ge=0, le=1, default=0.15)

    profiles: List[UserProfile]
    transition_matrix: TransitionMatrix
    funnel_params: List[FunnelParams]  # one per profile
    levers: List[Lever] = []
    ramp_config: RampConfig = RampConfig()
    acquisition: AcquisitionConfig = AcquisitionConfig()
    costs: List[ProfileCostConfig] = []  # one per profile, defaults if empty
    use_seasonality: bool = False
    seasonality_country: Optional[str] = None
    palette: str = 'navy'


# Output schemas
class WeeklyMarkovResult(BaseModel):
    week: int
    orders_total: float
    orders_base: float
    orders_incremental: float
    gmv: float
    net_revenue: float
    gasto_cupon: float    # Gasto P2C en cupones
    gasto_ddc: float      # Gasto P2C en free delivery
    gasto_bxsy: float     # Gasto B2C en promos/bundle
    total_gastos: float   # Total gastos comerciales
    contribution_dollar: float
    contribution_pct: float
    cost_per_order: float
    # Per-profile
    profile_users: Dict[str, float]
    profile_orders: Dict[str, float]
    profile_incremental: Dict[str, float]
    traffic_mult: float
    conv_mult: float


class MarkovForecastResult(BaseModel):
    weeks: List[WeeklyMarkovResult]
    summary: Dict  # total orders, revenue, spend, contribution
    funnel_debug: Optional[List[Dict]] = None  # detailed per-profile per-week
