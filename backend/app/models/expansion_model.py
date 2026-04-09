"""
Expansion / Capacity Model (A5)

Models city expansion launches with ramp-up curves.

Formula:
  For each city c launched at week launch_week[c]:
    orders[c][w] = 0 if w < launch_week[c]
    orders[c][w] = population[c] × penetration_rate[c] × ramp_factor[w - launch_week[c]] × orders_per_user
  capacity_constraint[w] = sum of all city capacities at week w
"""
from typing import List, Dict, Optional, Any


DEFAULT_CITY_RAMP = [0.05, 0.10, 0.18, 0.28, 0.40, 0.52, 0.63, 0.72, 0.80, 0.87, 0.93, 1.0]


def calculate_expansion_orders(cities: List[Dict[str, Any]], horizon: int) -> Dict[str, Any]:
    """
    Each city dict:
      {
        name: str,
        launch_week: int,  # 0-indexed
        population: float,  # e.g. 1_000_000
        penetration_rate: float,  # fraction of population ordering monthly (e.g. 0.05)
        orders_per_user_weekly: float,  # orders per active user per week (e.g. 1.5)
        ramp_curve: Optional[List[float]]  # custom ramp
      }
    """
    weekly_orders: List[float] = [0.0] * horizon
    city_details: List[Dict] = []

    for city in cities:
        launch_week = city.get("launch_week", 0)
        population = city.get("population", 0)
        penetration = city.get("penetration_rate", 0.03)
        orders_per_user = city.get("orders_per_user_weekly", 1.5)
        ramp_curve = city.get("ramp_curve") or DEFAULT_CITY_RAMP
        max_orders = population * penetration * orders_per_user

        city_row: List[float] = []
        for w in range(horizon):
            weeks_since_launch = w - launch_week
            if weeks_since_launch < 0:
                orders = 0.0
            else:
                if weeks_since_launch >= len(ramp_curve):
                    ramp = ramp_curve[-1]
                else:
                    ramp = ramp_curve[weeks_since_launch]
                orders = max_orders * ramp
            weekly_orders[w] += orders
            city_row.append(orders)

        city_details.append({
            "name": city.get("name", "Unknown"),
            "launch_week": launch_week,
            "max_orders": max_orders,
            "weekly_orders": city_row,
        })

    return {
        "weekly_orders": weekly_orders,
        "city_details": city_details,
    }
