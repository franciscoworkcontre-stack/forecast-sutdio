"""
Food Delivery Forecast Studio — FastAPI Backend
"""
import json
import os
import sqlite3
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware

from .models.schemas import (
    ForecastRequest,
    ForecastResult,
    SaveForecastResponse,
    ForecastListItem,
)
from .models.forecast_engine import run_forecast
from .excel.generator import generate_excel

# ── App setup ──────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Food Delivery Forecast Studio",
    version="1.0.0",
    description="Backend API for forecasting food delivery operations.",
)

_ON_VERCEL = bool(os.environ.get("VERCEL"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _ON_VERCEL else ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    allow_credentials=not _ON_VERCEL,  # credentials + wildcard origin is not allowed
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── SQLite setup ───────────────────────────────────────────────────────────────

# On Vercel the filesystem is read-only except /tmp; persistence is ephemeral per-instance.
DB_PATH = "/tmp/forecasts.db" if _ON_VERCEL else os.path.join(os.path.dirname(__file__), "..", "forecasts.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS forecasts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            config_json TEXT NOT NULL,
            results_json TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


@app.on_event("startup")
async def startup_event():
    init_db()


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


@app.post("/api/forecast/calculate", response_model=ForecastResult)
async def calculate_forecast(request: ForecastRequest):
    """
    Run the combined forecast model.
    Returns immediately without saving — use /save to persist.
    """
    try:
        result = run_forecast(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/api/forecast/save", response_model=SaveForecastResponse)
async def save_forecast(request: ForecastRequest):
    """Run forecast and save to SQLite."""
    try:
        result = run_forecast(request)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    forecast_id = str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat() + "Z"

    conn = get_db()
    conn.execute(
        "INSERT INTO forecasts (id, name, created_at, config_json, results_json) VALUES (?, ?, ?, ?, ?)",
        (
            forecast_id,
            request.name,
            created_at,
            request.model_dump_json(),
            result.model_dump_json(),
        ),
    )
    conn.commit()
    conn.close()

    return SaveForecastResponse(id=forecast_id, name=request.name, created_at=created_at)


@app.get("/api/forecast/list", response_model=List[ForecastListItem])
async def list_forecasts():
    """List all saved forecasts (metadata only)."""
    conn = get_db()
    rows = conn.execute(
        "SELECT id, name, created_at, config_json, results_json FROM forecasts ORDER BY created_at DESC"
    ).fetchall()
    conn.close()

    items = []
    for row in rows:
        try:
            config = json.loads(row["config_json"])
            results = json.loads(row["results_json"])
            summary = results.get("summary", {})
            items.append(
                ForecastListItem(
                    id=row["id"],
                    name=row["name"],
                    created_at=row["created_at"],
                    horizon_weeks=config.get("horizon_weeks", 0),
                    country=config.get("country", ""),
                    models_active=config.get("models_active", []),
                    total_orders=summary.get("total_orders", 0),
                )
            )
        except Exception:
            continue

    return items


@app.get("/api/forecast/{forecast_id}", response_model=ForecastResult)
async def get_forecast(forecast_id: str):
    """Retrieve a saved forecast by ID."""
    conn = get_db()
    row = conn.execute(
        "SELECT results_json FROM forecasts WHERE id = ?", (forecast_id,)
    ).fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Forecast not found")

    data = json.loads(row["results_json"])
    return ForecastResult(**data)


@app.delete("/api/forecast/{forecast_id}")
async def delete_forecast(forecast_id: str):
    """Delete a saved forecast."""
    conn = get_db()
    result = conn.execute("DELETE FROM forecasts WHERE id = ?", (forecast_id,))
    conn.commit()
    conn.close()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Forecast not found")
    return {"deleted": forecast_id}


@app.post("/api/forecast/export-excel")
async def export_excel(request: ForecastRequest):
    """Run forecast and return an Excel file for download."""
    try:
        result = run_forecast(request)
        excel_bytes = generate_excel(result, request)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    filename = f"forecast_{request.name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.xlsx"
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.get("/api/benchmarks")
async def get_benchmarks():
    """Return benchmark data for UI display."""
    benchmarks_path = os.path.join(os.path.dirname(__file__), "data", "benchmarks.json")
    try:
        with open(benchmarks_path, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Benchmarks file not found")


@app.get("/api/holidays/{country}")
async def get_holidays(country: str):
    """Return holiday data for a specific country."""
    holidays_path = os.path.join(os.path.dirname(__file__), "data", "holidays.json")
    try:
        with open(holidays_path, "r") as f:
            all_holidays = json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Holidays file not found")

    country_data = all_holidays.get(country.upper())
    if not country_data:
        raise HTTPException(status_code=404, detail=f"No holiday data for country: {country}")

    return country_data


@app.post("/api/forecast/scenarios")
async def run_scenarios(request: ForecastRequest):
    """
    Run B2 scenario analysis: base / upside / downside + tornado sensitivity.
    """
    # Ensure B2 is in models_active
    if "B2" not in request.models_active:
        request.models_active = list(request.models_active) + ["B2"]

    try:
        result = run_forecast(request)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    return {
        "scenarios": result.scenarios.model_dump() if result.scenarios else None,
        "sensitivity_tornado": [t.model_dump() for t in result.sensitivity_tornado] if result.sensitivity_tornado else [],
    }


# ── Markov v3 Routes ───────────────────────────────────────────────────────────

from .models.markov_schemas import MarkovForecastRequest, MarkovForecastResult
from .models.markov_engine import run_markov_forecast


@app.post("/api/markov/calculate", response_model=MarkovForecastResult)
async def markov_calculate(request: MarkovForecastRequest):
    """Run the Markov + Funnel v3 forecast model."""
    try:
        result = run_markov_forecast(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/api/markov/save", response_model=SaveForecastResponse)
async def markov_save(request: MarkovForecastRequest):
    """Run Markov forecast and save to SQLite."""
    try:
        result = run_markov_forecast(request)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    forecast_id = str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat() + "Z"
    conn = get_db()
    conn.execute(
        "INSERT INTO forecasts (id, name, created_at, config_json, results_json) VALUES (?, ?, ?, ?, ?)",
        (forecast_id, request.name, created_at, request.model_dump_json(), result.model_dump_json()),
    )
    conn.commit()
    conn.close()
    return SaveForecastResponse(id=forecast_id, name=request.name, created_at=created_at)


@app.get("/api/markov/assumptions-packs")
async def get_assumptions_packs():
    """List available assumptions packs."""
    import glob
    packs_dir = os.path.join(os.path.dirname(__file__), "data", "assumptions_packs")
    packs = []
    for path in glob.glob(os.path.join(packs_dir, "*.json")):
        with open(path) as f:
            p = json.load(f)
            packs.append({
                "id": os.path.basename(path).replace(".json", ""),
                "name": p.get("pack_name", ""),
                "description": p.get("pack_description", ""),
            })
    return packs


@app.get("/api/markov/assumptions-packs/{pack_id}")
async def get_assumptions_pack(pack_id: str):
    """Get a specific assumptions pack."""
    path = os.path.join(os.path.dirname(__file__), "data", "assumptions_packs", f"{pack_id}.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"Pack '{pack_id}' not found")
    with open(path) as f:
        return json.load(f)


@app.post("/api/markov/validate-matrix")
async def validate_transition_matrix(data: dict):
    """Validate that each row of a transition matrix sums to 1.0."""
    matrix = data.get("matrix", [])
    results = []
    for i, row in enumerate(matrix):
        s = sum(row)
        results.append({"row": i, "sum": round(s, 4), "valid": abs(s - 1.0) <= 0.001})
    return {"rows": results, "all_valid": all(r["valid"] for r in results)}


from .excel.markov_generator import generate_markov_excel


@app.post("/api/markov/export-excel")
async def markov_export_excel(request: MarkovForecastRequest):
    """Run Markov forecast and return McKinsey-style Excel."""
    try:
        result = run_markov_forecast(request)
        excel_bytes = generate_markov_excel(result, request)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    filename = f"markov_{request.name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.xlsx"
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ── Wizard Model Routes (D2-P5) ────────────────────────────────────────────────

from .models.d2_cohort_engine import CohortRequest, run_cohort_forecast
from .models.d3_funnel_engine import FunnelRequest, run_funnel_forecast
from .models.d4_frequency_engine import FrequencyRequest, run_frequency_forecast
from .models.d5_winback_engine import WinbackRequest, run_winback_forecast
from .models.s1_onboarding_engine import OnboardingRequest, run_onboarding_forecast
from .models.s2_portfolio_engine import PortfolioRequest, run_portfolio_forecast
from .models.s3_engagement_engine import EngagementRequest, run_engagement_forecast
from .models.s4_health_engine import S4HealthRequest, run_health_forecast
from .models.p1_network_engine import NetworkRequest, run_network_forecast
from .models.p2_incrementality_engine import IncrementalityRequest, run_incrementality_forecast
from .models.p3_delivery_engine import DeliveryRequest, run_delivery_forecast
from .models.p4_competitive_engine import CompetitiveRequest, run_competitive_forecast
from .models.p5_equilibrium_engine import EquilibriumRequest, run_equilibrium_forecast


@app.post("/api/models/d2/calculate")
async def d2_calculate(request: CohortRequest):
    try:
        return run_cohort_forecast(request)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/api/models/d3/calculate")
async def d3_calculate(request: FunnelRequest):
    try:
        return run_funnel_forecast(request)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/api/models/d4/calculate")
async def d4_calculate(request: FrequencyRequest):
    try:
        return run_frequency_forecast(request)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/api/models/d5/calculate")
async def d5_calculate(request: WinbackRequest):
    try:
        return run_winback_forecast(request)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/api/models/s1/calculate")
async def s1_calculate(request: OnboardingRequest):
    try:
        return run_onboarding_forecast(request)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/api/models/s2/calculate")
async def s2_calculate(request: PortfolioRequest):
    try:
        return run_portfolio_forecast(request)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/api/models/s3/calculate")
async def s3_calculate(request: EngagementRequest):
    try:
        return run_engagement_forecast(request)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/api/models/s4/calculate")
async def s4_calculate(request: S4HealthRequest):
    try:
        return run_health_forecast(request)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/api/models/p1/calculate")
async def p1_calculate(request: NetworkRequest):
    try:
        return run_network_forecast(request)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/api/models/p2/calculate")
async def p2_calculate(request: IncrementalityRequest):
    try:
        return run_incrementality_forecast(request)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/api/models/p3/calculate")
async def p3_calculate(request: DeliveryRequest):
    try:
        return run_delivery_forecast(request)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/api/models/p4/calculate")
async def p4_calculate(request: CompetitiveRequest):
    try:
        return run_competitive_forecast(request)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/api/models/p5/calculate")
async def p5_calculate(request: EquilibriumRequest):
    try:
        return run_equilibrium_forecast(request)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
