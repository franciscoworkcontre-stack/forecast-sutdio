"""
Market Share Model (C1)

Models market share evolution over time and its effect on order volume.

Formula:
  share[w] = current_share + (target_share - current_share) × (w / horizon)  # linear ramp
  market_orders[w] = total_market_orders_weekly × share[w]
  adjustment_factor[w] = share[w] / current_share  # relative to base
"""
from typing import List, Optional
from ..models.schemas import MarketShareInput


def calculate_market_share_factors(inp: MarketShareInput, horizon: int) -> List[float]:
    """
    Returns list of market share multipliers (vs current share = 1.0).

    If share grows from 30% to 35% over horizon:
      factor[w] = share[w] / current_share
    """
    current = inp.current_share
    target = inp.target_share

    if current <= 0:
        return [1.0] * horizon

    factors = []
    for w in range(horizon):
        if inp.share_gain_per_week is not None:
            share_w = min(current + inp.share_gain_per_week * w, target)
        else:
            # Linear ramp to target
            t = w / max(horizon - 1, 1)
            share_w = current + (target - current) * t

        factor = share_w / current
        factors.append(factor)

    return factors
