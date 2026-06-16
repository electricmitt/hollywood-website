"""OpenTelemetry instrumentation for the agent builder.

Initializes automatically on import. Exports traces to the Riff platform OTEL
ingestion endpoint using a custom JSON-over-HTTP exporter (no gRPC dependency).
Export is a no-op if OTEL_EXPORTER_OTLP_ENDPOINT is not set.

Configure via env vars (injected by the OTEL Ingestion API integration):
    OTEL_EXPORTER_OTLP_ENDPOINT  — Riff platform base URL
    OTEL_EXPORTER_OTLP_HEADERS   — comma-separated key=value auth headers
"""

import json
import logging
import os
from typing import Sequence

import requests
from opentelemetry import trace
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import ReadableSpan, TracerProvider
from opentelemetry.sdk.trace.export import (
    BatchSpanProcessor,
    SpanExporter,
    SpanExportResult,
)

log = logging.getLogger(__name__)


class _OTLPJSONSpanExporter(SpanExporter):
    """Posts spans as OTLP JSON over plain HTTP — no gRPC required."""

    def __init__(self, endpoint: str, headers: dict[str, str], timeout: int = 10):
        self.endpoint = endpoint
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.session.headers.update(headers)

    def export(self, spans: Sequence[ReadableSpan]) -> SpanExportResult:
        if not spans:
            return SpanExportResult.SUCCESS
        try:
            resp = self.session.post(
                self.endpoint,
                data=json.dumps(self._to_otlp(spans)),
                timeout=self.timeout,
            )
            if resp.status_code in (200, 202):
                return SpanExportResult.SUCCESS
            log.error("OTLP export failed: HTTP %s — %s", resp.status_code, resp.text)
            return SpanExportResult.FAILURE
        except Exception as e:
            log.error("OTLP export exception: %s", e)
            return SpanExportResult.FAILURE

    def _to_otlp(self, spans: Sequence[ReadableSpan]) -> dict:
        otlp_spans = []
        for span in spans:
            ctx = span.get_span_context()
            s = {
                "traceId": format(ctx.trace_id, "032x"),
                "spanId": format(ctx.span_id, "016x"),
                "name": span.name,
                "kind": span.kind.value if span.kind else 0,
                "startTimeUnixNano": str(span.start_time),
                "endTimeUnixNano": str(span.end_time or span.start_time),
                "attributes": [
                    {"key": k, "value": self._enc(v)}
                    for k, v in (span.attributes or {}).items()
                ],
            }
            if span.parent:
                s["parentSpanId"] = format(span.parent.span_id, "016x")
            otlp_spans.append(s)

        resource_attrs = [
            {"key": k, "value": self._enc(v)}
            for k, v in (spans[0].resource.attributes if spans else {}).items()
        ]
        return {
            "resourceSpans": [
                {
                    "resource": {"attributes": resource_attrs},
                    "scopeSpans": [
                        {"scope": {"name": "agent-studio"}, "spans": otlp_spans}
                    ],
                }
            ]
        }

    def _enc(self, v):
        if isinstance(v, bool):
            return {"boolValue": v}
        if isinstance(v, int):
            return {"intValue": str(v)}
        if isinstance(v, float):
            return {"doubleValue": v}
        return {"stringValue": str(v)}

    def shutdown(self):
        self.session.close()

    def force_flush(self, timeout_millis: int = 30000) -> bool:
        return True


_service_name = (
    os.environ.get("OTEL_SERVICE_NAME")
    or os.environ.get("DATABUTTON_PROJECT_ID")
    or "agent-studio"
)
_provider = TracerProvider(resource=Resource({SERVICE_NAME: _service_name}))

_otlp_endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT")
if _otlp_endpoint:
    _headers: dict[str, str] = {}
    if headers_str := os.environ.get("OTEL_EXPORTER_OTLP_HEADERS"):
        for part in headers_str.split(","):
            if "=" in part:
                k, v = part.split("=", 1)
                _headers[k.strip()] = v.strip()
    _provider.add_span_processor(
        BatchSpanProcessor(_OTLPJSONSpanExporter(_otlp_endpoint, _headers))
    )

trace.set_tracer_provider(_provider)
_tracer = trace.get_tracer(_service_name)


def _tool_input_summary(tool_name: str, inputs: dict) -> str:
    for key in (
        "command",
        "file_path",
        "pattern",
        "query",
        "prompt",
        "skill",
        "args",
        "description",
        "message",
        "task",
    ):
        if key in inputs:
            return str(inputs[key])[:500]
    return ""


class TurnTrace:
    """Manages the parent span for one agent turn and child spans for tool calls."""

    def __init__(self, session_id: str, message: str):
        self._span = _tracer.start_span(
            "claude.run",
            attributes={
                "session.id": session_id,
                "turn.message": message[:500],
            },
        )
        self._tool_spans: dict[str, trace.Span] = {}
        self._finished = False

    def tool_started(self, tool_id: str, tool_name: str, tool_input: dict) -> None:
        ctx = trace.set_span_in_context(self._span)
        child = _tracer.start_span(
            "claude.tool",
            context=ctx,
            attributes={
                "tool.name": tool_name,
                "tool.input": _tool_input_summary(tool_name, tool_input),
            },
        )
        self._tool_spans[tool_id] = child

    def tool_finished(self, tool_id: str, result: str, is_error: bool) -> None:
        child = self._tool_spans.pop(tool_id, None)
        if child:
            child.set_attribute("tool.result", result[:500])
            child.set_attribute("tool.is_error", is_error)
            child.end()

    def finish(self, cost: float, turns: int, duration_ms: int) -> None:
        if self._finished:
            return
        self._finished = True
        for child in self._tool_spans.values():
            child.end()
        self._tool_spans.clear()
        self._span.set_attribute("cost_usd", cost)
        self._span.set_attribute("num_turns", turns)
        self._span.set_attribute("duration_ms", duration_ms)
        self._span.end()


def start_turn(session_id: str, message: str) -> TurnTrace:
    return TurnTrace(session_id, message)
