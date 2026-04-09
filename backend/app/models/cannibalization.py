"""
Cannibalization Model (A3)

When new restaurants/promos are added, some orders may shift from existing restaurants
rather than being truly incremental. This model estimates cannibalization.

Formula:
  cannibalization[w] = acquisition_orders[w] × cannibalization_rate
  where cannibalization_rate = f(market_density, category_overlap)

Default: 10-25% of new restaurant orders cannibalize existing GMV
"""
from typing import List, Optional


CANNIBALIZATION_RATES = {
    "dark_kitchen_large": 0.08,
    "dark_kitchen_small": 0.10,
    "traditional_top": 0.15,
    "traditional_avg": 0.12,
    "grocery": 0.05,
    "custom": 0.10,
}


def calculate_cannibalization(
    acquisition_orders: List[float],
    restaurant_type: str,
    custom_rate: Optional[float] = None,
    market_density_factor: float = 1.0,
) -> List[float]:
    """
    Returns per-week cannibalization orders (to be subtracted from base GMV).

    Formula:
      cannibalization[w] = acquisition_orders[w] × base_rate × market_density_factor
      base_rate = CANNIBALIZATION_RATES[restaurant_type]
    """
    base_rate = custom_rate if custom_rate is not None else CANNIBALIZATION_RATES.get(restaurant_type, 0.10)
    effective_rate = base_rate * market_density_factor

    return [orders * effective_rate for orders in acquisition_orders]
