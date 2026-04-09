"""
Seasonality Model (A4)

Formula:
  factor_total[w] = weekly_pattern_factor[weekday(w)]
                  × holiday_factor[w]
                  × rain_factor[w]
                  × pay_cycle_factor[w]
                  × temperature_factor[w]
                  × (1 + trend_weekly_growth)^w

All factors are multiplicative. Base = 1.0 means no effect.
"""
import json
import os
import math
from typing import List, Dict, Optional, Any
from datetime import date, timedelta
from ..models.schemas import SeasonalityInput

HOLIDAYS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "holidays.json")

_holidays_cache: Optional[Dict] = None


def load_holidays() -> Dict:
    global _holidays_cache
    if _holidays_cache is None:
        try:
            with open(HOLIDAYS_PATH, "r") as f:
                _holidays_cache = json.load(f)
        except FileNotFoundError:
            _holidays_cache = {}
    return _holidays_cache


def get_week_start_date(week_index: int, start_date: Optional[date] = None) -> date:
    """Get the Monday of a given week index (0-based)."""
    if start_date is None:
        # Use a Monday as reference point
        today = date.today()
        # Find next Monday
        days_ahead = 0 - today.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        start_date = today + timedelta(days=days_ahead)
    return start_date + timedelta(weeks=week_index)


def get_weekly_pattern_factor(week_start: date, pattern: Dict[str, float]) -> float:
    """Average daily factor for the 7 days in the week."""
    day_keys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    total = 0.0
    for i, key in enumerate(day_keys):
        total += pattern.get(key, 1.0)
    return total / 7.0


def get_holiday_factor(week_start: date, country_data: Dict, overrides: Optional[Dict] = None) -> float:
    """
    Apply holiday multipliers for any holiday falling in the week.
    Returns multiplicative factor (e.g., 1.375 for +37.5%, 0.675 for -32.5%)
    """
    factor = 1.0
    holidays = country_data.get("holidays", [])

    for holiday in holidays:
        # Find the holiday date
        month = holiday.get("month", 0)
        day = holiday.get("day", 0)
        day_type = holiday.get("day_type", None)

        if month == 0:
            continue

        # Compute holiday date for the current year
        try:
            if day_type:
                hdate = compute_dynamic_date(week_start.year, month, day_type)
            elif day > 0:
                hdate = date(week_start.year, month, day)
            else:
                continue
        except Exception:
            continue

        # Check if holiday falls within the week
        week_end = week_start + timedelta(days=6)
        if week_start <= hdate <= week_end:
            holiday_name = holiday.get("name", "")
            if overrides and holiday_name in overrides:
                effect = overrides[holiday_name]
            else:
                effect = holiday.get("effect", 0.0)
            duration_days = holiday.get("duration_days", 1)
            # Prorate effect by duration / 7
            week_effect = effect * min(duration_days, 7) / 7.0
            factor = factor * (1.0 + week_effect)

    return factor


def compute_dynamic_date(year: int, month: int, day_type: str) -> date:
    """Compute dates like 'second_sunday', 'last_monday', etc."""
    parts = day_type.split("_")
    if len(parts) < 2:
        raise ValueError(f"Unknown day_type: {day_type}")

    ordinal = parts[0]  # first, second, third, fourth, last
    weekday_name = parts[1]  # monday, tuesday, ..., sunday

    weekday_map = {"monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6}
    target_weekday = weekday_map.get(weekday_name, 6)

    if ordinal == "last":
        # Find last occurrence in month
        # Start from end of month
        if month == 12:
            last_day = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            last_day = date(year, month + 1, 1) - timedelta(days=1)
        d = last_day
        while d.weekday() != target_weekday:
            d -= timedelta(days=1)
        return d
    else:
        ordinal_map = {"first": 1, "second": 2, "third": 3, "fourth": 4}
        n = ordinal_map.get(ordinal, 1)
        d = date(year, month, 1)
        count = 0
        while True:
            if d.weekday() == target_weekday:
                count += 1
                if count == n:
                    return d
            d += timedelta(days=1)
            if d.month != month:
                raise ValueError(f"Could not find {day_type} in {year}-{month:02d}")


def get_rain_factor(week_start: date, country_data: Dict) -> float:
    """Rain season effect."""
    rain = country_data.get("rain_season", {})
    if not rain:
        return 1.0
    months = rain.get("months", [])
    if week_start.month in months:
        return 1.0 + rain.get("net_normal", 0.0)
    return 1.0


def get_pay_cycle_factor(week_start: date, country_data: Dict) -> float:
    """Pay cycle uplift (quincena in MX/CO, weekly in others)."""
    pay = country_data.get("pay_cycles", {})
    if not pay:
        return 1.0
    pay_type = pay.get("type", "")
    uplift = pay.get("uplift", 0.0)

    if pay_type == "quincena":
        pay_days = pay.get("days", [1, 15])
        # Check if week contains day 1 or 15 of month
        for d_offset in range(7):
            d = week_start + timedelta(days=d_offset)
            if d.day in pay_days:
                return 1.0 + uplift
    elif pay_type == "weekly":
        return 1.0 + uplift * 0.25  # spread across weeks
    elif pay_type == "biweekly":
        # Approximate: every 2 weeks
        week_of_month = (week_start.day - 1) // 7
        if week_of_month in [0, 2]:
            return 1.0 + uplift

    return 1.0


def get_temperature_factor(week_start: date, country_data: Dict) -> float:
    """Temperature effect on orders."""
    temp = country_data.get("temperature", {})
    if not temp:
        return 1.0
    hot_months = temp.get("hot_months", [])
    cold_months = temp.get("cold_months", [])
    if week_start.month in hot_months:
        return 1.0 + temp.get("hot_effect", 0.0)
    if week_start.month in cold_months:
        return 1.0 + temp.get("cold_effect", 0.0)
    return 1.0


def calculate_seasonality_factors(inp: SeasonalityInput, horizon: int) -> List[float]:
    """
    Returns list of multiplicative seasonal factors for each week (0-indexed).

    Factor formula:
      factor[w] = pattern_factor × holiday_factor × rain_factor × pay_cycle_factor × temperature_factor × (1+trend)^w
    """
    holidays_data = load_holidays()
    country_data = holidays_data.get(inp.country, {})

    # Weekly pattern
    pattern = inp.weekly_pattern or country_data.get("weekly_pattern", {})

    trend = inp.trend_weekly_growth or 0.0

    start_date = get_week_start_date(0)
    factors = []

    for w in range(horizon):
        week_start = start_date + timedelta(weeks=w)

        # Weekly pattern factor (average over 7 days)
        if pattern:
            pat_factor = get_weekly_pattern_factor(week_start, pattern)
        else:
            pat_factor = 1.0

        # Holiday factor
        if inp.use_holidays and country_data:
            hol_factor = get_holiday_factor(week_start, country_data, inp.holiday_overrides)
        else:
            hol_factor = 1.0

        # Rain season
        if inp.use_rain_season and country_data:
            rain_factor = get_rain_factor(week_start, country_data)
        else:
            rain_factor = 1.0

        # Pay cycle
        if inp.use_pay_cycles and country_data:
            pay_factor = get_pay_cycle_factor(week_start, country_data)
        else:
            pay_factor = 1.0

        # Temperature
        if inp.use_temperature and country_data:
            temp_factor = get_temperature_factor(week_start, country_data)
        else:
            temp_factor = 1.0

        # Trend
        trend_factor = (1.0 + trend) ** w

        total_factor = pat_factor * hol_factor * rain_factor * pay_factor * temp_factor * trend_factor
        factors.append(total_factor)

    return factors
