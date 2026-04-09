import math
import numpy as np
from typing import List, Dict
from .markov_schemas import MarkovForecastRequest, MarkovForecastResult, WeeklyMarkovResult


def run_markov_forecast(req: MarkovForecastRequest) -> MarkovForecastResult:
    """
    Execute 5 layers sequentially for each week:
    1. User base evolution (Markov transition matrix)
    2. Traffic funnel -> orders per profile
    3. Levers (traffic/conv multipliers with ramp-up and overlap)
    4. Acquisition loop (incremental orders -> new users -> feed back)
    5. Cost & P&L calculation
    """

    profiles = req.profiles
    n_profiles = len(profiles)
    profile_ids = [p.id for p in profiles]
    H = req.horizon_weeks

    # Index profiles
    funnel_map = {f.profile_id: f for f in req.funnel_params}
    cost_map = {c.profile_id: c for c in req.costs}

    # -- LAYER 3: Pre-compute lever multipliers per week ------------------------

    active_levers = [l for l in req.levers if l.active]
    traffic_levers = [l for l in active_levers if l.lever_type in ("traffic", "both")]
    conv_levers = [l for l in active_levers if l.lever_type in ("conversion", "both")]

    ramp_weeks = req.ramp_config.ramp_weeks

    def ramp_factor(w: int) -> float:
        if req.ramp_config.curve_type == "linear":
            return min(w / max(ramp_weeks, 1), 1.0)
        elif req.ramp_config.curve_type == "logarithmic":
            return min(math.log1p(w) / math.log1p(ramp_weeks), 1.0)
        else:  # step
            return 1.0 if w >= ramp_weeks else 0.0

    def compute_multiplier(levers_list: List, w: int, profile_id: str) -> float:
        """Compute effective multiplier with overlap."""
        n = len(levers_list)
        if n == 0:
            return 1.0

        uplifts = []
        for lv in levers_list:
            u = lv.base_uplift
            if lv.profile_uplifts and profile_id in lv.profile_uplifts:
                u = lv.profile_uplifts[profile_id]
            uplifts.append(u)

        raw_total = sum(uplifts)
        overlap_factor = req.overlap_factor
        if n > 1:
            overlap_reduction = overlap_factor * (n - 1) / n
            effective_total = raw_total * (1 - overlap_reduction)
        else:
            effective_total = raw_total

        return 1.0 + effective_total * ramp_factor(w)

    # -- State arrays ----------------------------------------------------------

    # users_end[profile_idx][week] -- users at end of each week
    users_end = np.zeros((n_profiles, H + 1))

    # Initialize week 0
    for i, p in enumerate(profiles):
        users_end[i][0] = p.initial_users

    # Transition matrix as numpy array
    T = np.array(req.transition_matrix.matrix)  # shape (n, n)

    results = []
    new_users_to_add = np.zeros((n_profiles, H + 1))  # users added from acquisition loop

    for w in range(1, H + 1):
        # -- LAYER 1: User Base Evolution --------------------------------------

        # users before matrix: previous end + new additions from acquisition loop
        users_pre = users_end[:, w - 1] + new_users_to_add[:, w]

        # Apply transition matrix: users_post[j] = sum_i users_pre[i] * T[i,j]
        users_post = T.T @ users_pre  # shape (n,)
        users_end[:, w] = users_post

        # -- LAYER 2 & 3: Funnel + Levers -------------------------------------

        profile_orders_eff = {}
        profile_orders_base = {}
        profile_incremental = {}
        profile_users_dict = {}

        for i, p in enumerate(profiles):
            pid = p.id
            fp = funnel_map.get(pid)
            if fp is None:
                profile_orders_eff[pid] = 0.0
                profile_orders_base[pid] = 0.0
                profile_incremental[pid] = 0.0
                profile_users_dict[pid] = float(users_end[i, w])
                continue

            u = float(users_end[i, w])
            profile_users_dict[pid] = u

            # Traffic multiplier
            traffic_mult = compute_multiplier(traffic_levers, w, pid)
            # Conversion multiplier
            conv_mult = compute_multiplier(conv_levers, w, pid)

            # Base funnel (no multipliers)
            open_u = u * fp.open_app_pct
            sessions = open_u * fp.avg_weekly_sessions
            sv_base = sessions * fp.see_vertical_pct

            # Effective funnel (with multipliers)
            sv_eff = sv_base * traffic_mult

            def calc_orders(sv, c_mult=1.0):
                o = 0.0
                for channel, entry_share, p1, p2 in [
                    ("topic", fp.entry_topic, fp.p1_topic, fp.p2_topic),
                    ("feed", fp.entry_feed, fp.p1_feed, fp.p2_feed),
                    ("filter", fp.entry_filter, fp.p1_filter, fp.p2_filter),
                ]:
                    sv_ch = sv * entry_share
                    visits = sv_ch * p1 * c_mult
                    orders = visits * p2 * c_mult
                    o += orders
                return o

            orders_eff = calc_orders(sv_eff, conv_mult)
            orders_base = calc_orders(sv_base, 1.0)

            profile_orders_eff[pid] = orders_eff
            profile_orders_base[pid] = orders_base
            profile_incremental[pid] = max(0.0, orders_eff - orders_base)

        total_orders_eff = sum(profile_orders_eff.values())
        total_orders_base = sum(profile_orders_base.values())
        total_incremental = sum(profile_incremental.values())

        # -- LAYER 4: Acquisition Loop -----------------------------------------

        if req.acquisition.active and w < H:
            acq = req.acquisition
            acq_orders = total_incremental * acq.alpha
            new_users_raw = acq_orders / max(acq.new_user_orders_ratio, 0.01)

            # WoW cap
            total_prev_new = sum(new_users_to_add[:, w])
            if total_prev_new > 0:
                new_users_capped = min(new_users_raw, total_prev_new * (1 + acq.wow_cap))
            else:
                new_users_capped = new_users_raw

            # Distribute to profiles
            for pid, frac in acq.profile_split.items():
                if pid in profile_ids:
                    idx = profile_ids.index(pid)
                    new_users_to_add[idx, w + 1] += new_users_capped * frac

        # -- LAYER 5: Cost & P&L ----------------------------------------------

        gmv = total_orders_eff * req.aov
        net_revenue = gmv * req.take_rate

        coupon_spend = 0.0
        ddc_spend = 0.0
        bxsy_spend = 0.0

        for pid in profile_ids:
            o = profile_orders_eff.get(pid, 0.0)
            c = cost_map.get(pid)
            if c is None:
                # Default cost config
                coupon_spend += o * 0.3 * 35.0 * 0.6
                ddc_spend += o * 0.2 * 25.0
                bxsy_spend += o * 0.15 * 40.0 * 0.8
            else:
                coupon_spend += o * c.pct_w_coupon * c.coupon_p2c * c.coupon_redeem
                ddc_spend += o * c.pct_w_ddc * c.ddc_p2c
                bxsy_spend += o * c.pct_w_bxsy * c.bxsy_b2c * c.bxsy_redeem

        total_spend = coupon_spend + ddc_spend + bxsy_spend
        contribution_dollar = net_revenue - total_spend
        contribution_pct = contribution_dollar / net_revenue if net_revenue > 0 else 0.0
        cost_per_order = total_spend / total_orders_eff if total_orders_eff > 0 else 0.0

        # Compute effective multipliers for reporting
        traffic_mults = [compute_multiplier(traffic_levers, w, p.id) for p in profiles]
        conv_mults = [compute_multiplier(conv_levers, w, p.id) for p in profiles]
        avg_traffic_mult = float(np.mean(traffic_mults)) if traffic_mults else 1.0
        avg_conv_mult = float(np.mean(conv_mults)) if conv_mults else 1.0

        results.append(WeeklyMarkovResult(
            week=w,
            orders_total=round(total_orders_eff, 1),
            orders_base=round(total_orders_base, 1),
            orders_incremental=round(total_incremental, 1),
            gmv=round(gmv, 2),
            net_revenue=round(net_revenue, 2),
            coupon_spend=round(coupon_spend, 2),
            ddc_spend=round(ddc_spend, 2),
            bxsy_spend=round(bxsy_spend, 2),
            total_spend=round(total_spend, 2),
            contribution_dollar=round(contribution_dollar, 2),
            contribution_pct=round(contribution_pct, 4),
            cost_per_order=round(cost_per_order, 2),
            profile_users={pid: round(float(users_end[profile_ids.index(pid), w]), 1) for pid in profile_ids},
            profile_orders={pid: round(profile_orders_eff.get(pid, 0.0), 1) for pid in profile_ids},
            profile_incremental={pid: round(profile_incremental.get(pid, 0.0), 1) for pid in profile_ids},
            traffic_mult=round(avg_traffic_mult, 4),
            conv_mult=round(avg_conv_mult, 4),
        ))

    # Summary
    total_orders = sum(r.orders_total for r in results)
    total_incremental_sum = sum(r.orders_incremental for r in results)
    total_revenue = sum(r.net_revenue for r in results)
    total_spend_sum = sum(r.total_spend for r in results)
    total_contribution = sum(r.contribution_dollar for r in results)
    avg_contribution_pct = total_contribution / total_revenue if total_revenue > 0 else 0
    avg_cost_per_order = total_spend_sum / total_orders if total_orders > 0 else 0

    summary = {
        "total_orders": round(total_orders, 0),
        "total_incremental": round(total_incremental_sum, 0),
        "total_revenue": round(total_revenue, 2),
        "total_spend": round(total_spend_sum, 2),
        "total_contribution": round(total_contribution, 2),
        "avg_contribution_pct": round(avg_contribution_pct, 4),
        "avg_cost_per_order": round(avg_cost_per_order, 2),
        "horizon_weeks": H,
        "n_profiles": n_profiles,
        "n_active_levers": len(active_levers),
    }

    return MarkovForecastResult(weeks=results, summary=summary)
