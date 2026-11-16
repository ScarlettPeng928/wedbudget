"""Vercel entry point for the backend.

Vercel runs every Python file in api/ as a serverless function. This one loads the
FastAPI app from backend/app, so the same code runs locally (uvicorn) and online.
vercel.json sends every /api/... request here; FastAPI then picks the endpoint.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'backend'))

from app.main import app  # noqa: E402  (must come after the path is set)

__all__ = ['app']
