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
    """Run Markov forecast and return MBB-grade Excel."""
    try:
        result = run_markov_forecast(request)
        excel_bytes = generate_markov_excel(result, request, palette_key=request.palette)
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


# ── Excel Export Routes (D2–P5) ────────────────────────────────────────────────

from .excel.generic_generator import generate_generic_excel


@app.post("/api/models/d2/export-excel")
async def d2_export_excel(request: CohortRequest):
    try:
        result = run_cohort_forecast(request)
        excel_bytes = generate_generic_excel(result if isinstance(result, dict) else result.model_dump(), "D2 — Cohort Retention & LTV", "D2", request.model_dump(), request.palette)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
    filename = f"d2_cohort_{datetime.now().strftime('%Y%m%d')}.xlsx"
    return Response(content=excel_bytes, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@app.post("/api/models/d3/export-excel")
async def d3_export_excel(request: FunnelRequest):
    try:
        result = run_funnel_forecast(request)
        excel_bytes = generate_generic_excel(result if isinstance(result, dict) else result.model_dump(), "D3 — Funnel Conversion", "D3", request.model_dump(), request.palette)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
    filename = f"d3_funnel_{datetime.now().strftime('%Y%m%d')}.xlsx"
    return Response(content=excel_bytes, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@app.post("/api/models/d4/export-excel")
async def d4_export_excel(request: FrequencyRequest):
    try:
        result = run_frequency_forecast(request)
        excel_bytes = generate_generic_excel(result if isinstance(result, dict) else result.model_dump(), "D4 — Frequency & Wallet Share", "D4", request.model_dump(), request.palette)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
    filename = f"d4_frequency_{datetime.now().strftime('%Y%m%d')}.xlsx"
    return Response(content=excel_bytes, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@app.post("/api/models/d5/export-excel")
async def d5_export_excel(request: WinbackRequest):
    try:
        result = run_winback_forecast(request)
        excel_bytes = generate_generic_excel(result if isinstance(result, dict) else result.model_dump(), "D5 — Reactivation & Winback", "D5", request.model_dump(), request.palette)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
    filename = f"d5_winback_{datetime.now().strftime('%Y%m%d')}.xlsx"
    return Response(content=excel_bytes, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@app.post("/api/models/s1/export-excel")
async def s1_export_excel(request: OnboardingRequest):
    try:
        result = run_onboarding_forecast(request)
        excel_bytes = generate_generic_excel(result if isinstance(result, dict) else result.model_dump(), "S1 — Restaurant Onboarding & Maturation", "S1", request.model_dump(), request.palette)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
    filename = f"s1_onboarding_{datetime.now().strftime('%Y%m%d')}.xlsx"
    return Response(content=excel_bytes, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@app.post("/api/models/s2/export-excel")
async def s2_export_excel(request: PortfolioRequest):
    try:
        result = run_portfolio_forecast(request)
        excel_bytes = generate_generic_excel(result if isinstance(result, dict) else result.model_dump(), "S2 — Portfolio & Selection Effect", "S2", request.model_dump(), request.palette)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
    filename = f"s2_portfolio_{datetime.now().strftime('%Y%m%d')}.xlsx"
    return Response(content=excel_bytes, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@app.post("/api/models/s3/export-excel")
async def s3_export_excel(request: EngagementRequest):
    try:
        result = run_engagement_forecast(request)
        excel_bytes = generate_generic_excel(result if isinstance(result, dict) else result.model_dump(), "S3 — Restaurant Engagement & Performance", "S3", request.model_dump(), request.palette)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
    filename = f"s3_engagement_{datetime.now().strftime('%Y%m%d')}.xlsx"
    return Response(content=excel_bytes, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@app.post("/api/models/s4/export-excel")
async def s4_export_excel(request: S4HealthRequest):
    try:
        result = run_health_forecast(request)
        excel_bytes = generate_generic_excel(result if isinstance(result, dict) else result.model_dump(), "S4 — Restaurant Health Score", "S4", request.model_dump(), request.palette)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
    filename = f"s4_health_{datetime.now().strftime('%Y%m%d')}.xlsx"
    return Response(content=excel_bytes, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@app.post("/api/models/p1/export-excel")
async def p1_export_excel(request: NetworkRequest):
    try:
        result = run_network_forecast(request)
        excel_bytes = generate_generic_excel(result if isinstance(result, dict) else result.model_dump(), "P1 — Network Effects & Liquidity", "P1", request.model_dump(), request.palette)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
    filename = f"p1_network_{datetime.now().strftime('%Y%m%d')}.xlsx"
    return Response(content=excel_bytes, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@app.post("/api/models/p2/export-excel")
async def p2_export_excel(request: IncrementalityRequest):
    try:
        result = run_incrementality_forecast(request)
        excel_bytes = generate_generic_excel(result if isinstance(result, dict) else result.model_dump(), "P2 — Incrementality & Cannibalization", "P2", request.model_dump(), request.palette)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
    filename = f"p2_incrementality_{datetime.now().strftime('%Y%m%d')}.xlsx"
    return Response(content=excel_bytes, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@app.post("/api/models/p3/export-excel")
async def p3_export_excel(request: DeliveryRequest):
    try:
        result = run_delivery_forecast(request)
        excel_bytes = generate_generic_excel(result if isinstance(result, dict) else result.model_dump(), "P3 — Delivery Economics & Capacity", "P3", request.model_dump(), request.palette)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
    filename = f"p3_delivery_{datetime.now().strftime('%Y%m%d')}.xlsx"
    return Response(content=excel_bytes, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@app.post("/api/models/p4/export-excel")
async def p4_export_excel(request: CompetitiveRequest):
    try:
        result = run_competitive_forecast(request)
        excel_bytes = generate_generic_excel(result if isinstance(result, dict) else result.model_dump(), "P4 — Competitive Dynamics", "P4", request.model_dump(), request.palette)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
    filename = f"p4_competitive_{datetime.now().strftime('%Y%m%d')}.xlsx"
    return Response(content=excel_bytes, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@app.post("/api/models/p5/export-excel")
async def p5_export_excel(request: EquilibriumRequest):
    try:
        result = run_equilibrium_forecast(request)
        excel_bytes = generate_generic_excel(result if isinstance(result, dict) else result.model_dump(), "P5 — Marketplace Equilibrium", "P5", request.model_dump(), request.palette)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
    filename = f"p5_equilibrium_{datetime.now().strftime('%Y%m%d')}.xlsx"
    return Response(content=excel_bytes, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


# ── Feedback Endpoint ──────────────────────────────────────────────────────────

from pydantic import BaseModel as _BM
from typing import Optional as _Opt

class FeedbackPayload(_BM):
    nps: int
    message: str = ""
    email: _Opt[str] = None
    company: _Opt[str] = None

@app.post("/api/feedback")
async def submit_feedback(payload: FeedbackPayload):
    try:
        import resend
        resend.api_key = os.environ.get("RESEND_API_KEY", "")
        if not resend.api_key:
            raise HTTPException(status_code=503, detail="Servicio de email no configurado")

        nps_label = "Promotor 😊" if payload.nps >= 9 else "Neutro 😐" if payload.nps >= 7 else "Detractor 😞"
        body_lines = [
            f"<h2>Nuevo Feedback — Forecast Studio</h2>",
            f"<p><strong>NPS:</strong> {payload.nps}/10 — {nps_label}</p>",
        ]
        if payload.message:
            body_lines.append(f"<p><strong>Mensaje:</strong><br>{payload.message.replace(chr(10), '<br>')}</p>")
        if payload.email:
            body_lines.append(f"<p><strong>Email:</strong> {payload.email}</p>")
        if payload.company:
            body_lines.append(f"<p><strong>Empresa:</strong> {payload.company}</p>")
        body_lines.append(f"<p style='color:#888;font-size:12px'>Enviado: {datetime.now().strftime('%d/%m/%Y %H:%M')}</p>")

        params = {
            "from": "Forecast Studio <onboarding@resend.dev>",
            "to": ["tusalario.io@gmail.com"],
            "subject": f"[Forecast Studio] NPS {payload.nps}/10 — {'Nuevo feedback'}",
            "html": "\n".join(body_lines),
        }
        resend.Emails.send(params)
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Sensitivity / Tornado Analysis ────────────────────────────────────────────

from fastapi import Request as _FRequest

_SENSITIVITY_MAP = {
    'd2': (CohortRequest,      run_cohort_forecast,      'total_revenue'),
    'd3': (FunnelRequest,       run_funnel_forecast,      'total_orders'),
    'd4': (FrequencyRequest,    run_frequency_forecast,   'total_orders'),
    'd5': (WinbackRequest,      run_winback_forecast,     'total_orders'),
    's1': (OnboardingRequest,   run_onboarding_forecast,  'total_orders'),
    's2': (PortfolioRequest,    run_portfolio_forecast,   'total_revenue'),
    's3': (EngagementRequest,   run_engagement_forecast,  'total_orders'),
    's4': (S4HealthRequest,     run_health_forecast,      'revenue_at_risk'),
    'p1': (NetworkRequest,      run_network_forecast,     'total_orders'),
    'p2': (IncrementalityRequest, run_incrementality_forecast, 'blended_roi'),
    'p3': (DeliveryRequest,     run_delivery_forecast,    'total_orders'),
    'p4': (CompetitiveRequest,  run_competitive_forecast, 'total_orders'),
    'p5': (EquilibriumRequest,  run_equilibrium_forecast, 'total_revenue'),
}

_SENSITIVITY_LABELS = {
    'horizon_weeks':        'Horizonte (semanas)',
    'aov':                  'AOV (valor por orden)',
    'take_rate':            'Take Rate',
    'weekly_new_users':     'Nuevos usuarios/semana',
    'uplift_observed_pct':  'Uplift observado',
    'organic_baseline':     'Baseline orgánico',
    'promoted_orders_per_week': 'Órdenes promovidas/sem',
    'orders_per_active_per_week': 'Órdenes/usuario activo',
    'churn_rate':           'Tasa de churn',
    'reactivation_rate':    'Tasa de reactivación',
    'dormant_base':         'Base dormida',
    'weekly_new_restaurants': 'Nuevos restaurantes/sem',
    'avg_orders_per_restaurant': 'Órdenes/restaurante',
    'fleet_size':           'Tamaño de flota',
    'orders_per_courier_per_week': 'Órdenes/courier/sem',
    'market_size_weekly_orders': 'Tamaño de mercado',
    'your_share_pct':       'Market share actual',
    'competitor_share_pct': 'Share de competidores',
}

@app.post("/api/models/{model_id}/sensitivity")
async def model_sensitivity(model_id: str, raw: _FRequest):
    mid = model_id.lower()
    if mid not in _SENSITIVITY_MAP:
        raise HTTPException(status_code=404, detail=f"Modelo {model_id} no encontrado")

    RequestClass, engine_fn, kpi_key = _SENSITIVITY_MAP[mid]
    try:
        body = await raw.json()
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid JSON body")

    # Base run
    try:
        base_req = RequestClass(**body)
        base_result = engine_fn(base_req)
        if not isinstance(base_result, dict):
            base_result = base_result.model_dump()
        base_kpi = float(base_result.get('summary', {}).get(kpi_key, 0) or 0)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Error en modelo base: {e}")

    SKIP_KEYS = {'palette', 'currency', 'country'}
    results = []

    for field, value in body.items():
        if field in SKIP_KEYS:
            continue
        if not isinstance(value, (int, float)) or isinstance(value, bool):
            continue
        if value == 0:
            continue

        row = {'param': field, 'label': _SENSITIVITY_LABELS.get(field, field.replace('_', ' ').title()), 'base_value': value}
        for label, delta in [('low', 0.8), ('high', 1.2)]:
            modified = dict(body)
            modified[field] = value * delta
            try:
                mod_req = RequestClass(**modified)
                mod_result = engine_fn(mod_req)
                if not isinstance(mod_result, dict):
                    mod_result = mod_result.model_dump()
                mod_kpi = float(mod_result.get('summary', {}).get(kpi_key, 0) or 0)
                pct = (mod_kpi - base_kpi) / abs(base_kpi) * 100 if base_kpi != 0 else 0
                row[f'kpi_{label}'] = round(mod_kpi, 2)
                row[f'pct_{label}'] = round(pct, 1)
            except Exception:
                row[f'kpi_{label}'] = base_kpi
                row[f'pct_{label}'] = 0.0
        results.append(row)

    # Sort by max absolute impact, take top 5
    results.sort(key=lambda r: max(abs(r.get('pct_low', 0)), abs(r.get('pct_high', 0))), reverse=True)
    results = results[:5]

    return {
        'model_id': mid,
        'kpi_key': kpi_key,
        'base_kpi': round(base_kpi, 2),
        'tornado': results,
    }
