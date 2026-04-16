"""
S1 — Restaurant Onboarding & Maturation Engine
Each cohort of restaurants follows a maturation curve from activation.
"""
from typing import List
from pydantic import BaseModel, Field


class OnboardingRequest(BaseModel):
    horizon_weeks: int = Field(default=12, ge=4, le=52)
    aov: float = Field(default=290, gt=0)
    take_rate: float = Field(default=0.22, gt=0, le=1)
    currency: str = "MXN"
    country: str = "MX"
    new_restaurants_per_week: float = Field(default=50, gt=0)
    peak_gmv_per_restaurant_per_week: float = Field(
        default=18000,
        description="Peak weekly GMV per restaurant at full maturity"
    )
    maturation_curve: List[float] = Field(
        default=[0.15, 0.25, 0.40, 0.55, 0.65, 0.72, 0.78, 0.83, 0.87, 0.90, 0.93, 0.95],
        description="Fraction of peak GMV at each week of age"
    )


def run_onboarding_forecast(req: OnboardingRequest) -> dict:
    horizon = req.horizon_weeks
    curve = req.maturation_curve
    curve_len = len(curve)
    peak = req.peak_gmv_per_restaurant_per_week

    weekly = []
    for w in range(horizon):
        total_gmv = 0.0
        new_cohort_gmv = 0.0
        mature_cohort_gmv = 0.0
        restaurant_count = 0

        for cohort_start in range(w + 1):
            age = w - cohort_start
            maturity = curve[age] if age < curve_len else curve[-1]
            cohort_gmv = req.new_restaurants_per_week * peak * maturity
            total_gmv += cohort_gmv
            restaurant_count += req.new_restaurants_per_week

            if age < 4:
                new_cohort_gmv += cohort_gmv
            else:
                mature_cohort_gmv += cohort_gmv

        revenue = total_gmv * req.take_rate
        weekly.append({
            "week": w + 1,
            "total_gmv": round(total_gmv, 2),
            "total_revenue": round(revenue, 2),
            "new_cohort_contribution": round(new_cohort_gmv, 2),
            "mature_cohort_contribution": round(mature_cohort_gmv, 2),
            "restaurant_count_active": round(restaurant_count, 0),
        })

    total_gmv = sum(w["total_gmv"] for w in weekly)
    total_revenue = sum(w["total_revenue"] for w in weekly)
    final_week = weekly[-1]

    return {
        "weekly": weekly,
        "summary": {
            "total_gmv": round(total_gmv, 2),
            "total_revenue": round(total_revenue, 2),
            "total_restaurants_added": round(req.new_restaurants_per_week * horizon, 0),
            "final_week_gmv": final_week["total_gmv"],
            "final_week_revenue": final_week["total_revenue"],
            "maturation_curve_weeks": curve_len,
            "horizon_weeks": horizon,
        },
    }
