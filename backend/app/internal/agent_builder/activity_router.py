"""Activity / audit-log endpoints — proxies the OTEL query API.

Reads config from the same env vars used for exporting traces:
    OTEL_EXPORTER_OTLP_ENDPOINT  — ingest URL; /ingest/traces is replaced with /query/traces
    OTEL_EXPORTER_OTLP_HEADERS   — comma-separated key=value pairs; API key is extracted
    DATABUTTON_PROJECT_ID         — used as agent_name (not exposed to callers)

Endpoints:
    GET /activity/traces                        — list traces, optional ?session_id=
    GET /activity/traces/{trace_id}             — detail for a single trace
"""

import os

import httpx
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/activity", tags=["activity"])


def _otel_query_base() -> str | None:
    endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", "")
    if not endpoint:
        return None
    return endpoint.replace("/ingest/traces", "/query/traces")


def _otel_headers() -> dict[str, str]:
    headers: dict[str, str] = {}
    raw = os.environ.get("OTEL_EXPORTER_OTLP_HEADERS", "")
    for part in raw.split(","):
        if "=" in part:
            k, v = part.split("=", 1)
            headers[k.strip()] = v.strip()
    return headers


def _agent_name() -> str:
    return os.environ.get("DATABUTTON_PROJECT_ID", "")


def _require_otel() -> tuple[str, dict[str, str]]:
    base = _otel_query_base()
    if not base:
        raise HTTPException(
            status_code=503,
            detail="OTEL_EXPORTER_OTLP_ENDPOINT is not configured",
        )
    headers = _otel_headers()
    if not headers:
        raise HTTPException(
            status_code=503,
            detail="OTEL_EXPORTER_OTLP_HEADERS is not configured",
        )
    return base, headers


@router.get("/traces")
async def list_traces(session_id: str | None = None) -> list[dict]:
    """List agent turns (traces), optionally filtered by session_id."""
    base, headers = _require_otel()
    params: dict[str, str] = {"agent_name": _agent_name()}
    if session_id:
        params["session_id"] = session_id
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(base, headers=headers, params=params, timeout=10)
            r.raise_for_status()
            return r.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code, detail=e.response.text
            )
        except Exception as e:
            raise HTTPException(status_code=502, detail=str(e))


@router.get("/traces/{trace_id}")
async def get_trace(trace_id: str) -> dict:
    """Get detail for a single trace including all spans (tool calls)."""
    base, headers = _require_otel()
    params = {"agent_name": _agent_name()}
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(
                f"{base}/{trace_id}", headers=headers, params=params, timeout=10
            )
            if r.status_code == 404:
                raise HTTPException(status_code=404, detail="Trace not found")
            r.raise_for_status()
            return r.json()
        except HTTPException:
            raise
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code, detail=e.response.text
            )
        except Exception as e:
            raise HTTPException(status_code=502, detail=str(e))
