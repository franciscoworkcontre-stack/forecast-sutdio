"""
Vercel Python ASGI entry point.
Adds the backend package to sys.path and re-exports the FastAPI app.
"""
import sys
import os

# Make `backend/` importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app  # noqa: F401 — Vercel detects the `app` ASGI variable
