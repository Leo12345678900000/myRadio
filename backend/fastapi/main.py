from __future__ import annotations

from typing import Any, Dict, Optional
from urllib.parse import urlparse

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

TIMEOUT_SECONDS = 15.0
ALLOWED_METHODS = {"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"}
BLOCKED_HEADERS = {"host", "content-length", "connection", "accept-encoding"}


class GatewayFetchRequest(BaseModel):
    url: str = Field(..., min_length=1)
    method: str = Field(default="GET")
    headers: Dict[str, str] = Field(default_factory=dict)
    body: Optional[Any] = None


class OllamaGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    model: str = Field(default="qwen2.5:7b")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=2048, ge=32, le=8192)
    ollama_base_url: str = Field(default="http://localhost:11434")


app = FastAPI(title="Radio Agent Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def validate_url(raw_url: str) -> str:
    parsed = urlparse(raw_url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise HTTPException(status_code=400, detail="Only absolute HTTP/HTTPS URLs are allowed")
    return raw_url


def normalize_method(raw_method: str) -> str:
    normalized = (raw_method or "GET").upper()
    if normalized not in ALLOWED_METHODS:
        raise HTTPException(status_code=400, detail=f"Unsupported method: {raw_method}")
    return normalized


def build_forward_headers(raw_headers: Dict[str, str]) -> Dict[str, str]:
    headers: Dict[str, str] = {
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "RadioAgentBackend/0.1",
    }
    for key, value in raw_headers.items():
        if key.lower() in BLOCKED_HEADERS:
            continue
        headers[key] = value
    return headers


@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/api/gateway/fetch")
async def gateway_fetch(payload: GatewayFetchRequest) -> Any:
    target_url = validate_url(payload.url)
    method = normalize_method(payload.method)
    headers = build_forward_headers(payload.headers)

    request_kwargs: Dict[str, Any] = {
        "method": method,
        "url": target_url,
        "headers": headers,
    }
    if payload.body is not None and method not in {"GET", "HEAD"}:
        request_kwargs["json"] = payload.body

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS, follow_redirects=True) as client:
            upstream = await client.request(**request_kwargs)
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail=f"Gateway timeout: {exc}") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Gateway request failed: {exc}") from exc

    content_type = upstream.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            return upstream.json()
        except ValueError:
            return {"rawResponse": upstream.text, "parseError": "Invalid JSON response body"}

    return {"rawResponse": upstream.text}


@app.get("/api/llm/models")
async def ollama_models(ollama_base_url: str = "http://localhost:11434") -> Any:
    base_url = ollama_base_url.rstrip("/")
    endpoint = f"{base_url}/api/tags"

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS, follow_redirects=True) as client:
            response = await client.get(endpoint)
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail=f"Ollama models timeout: {exc}") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Ollama models request failed: {exc}") from exc

    if not response.is_success:
        raise HTTPException(status_code=response.status_code, detail=response.text[:200])

    try:
        data = response.json()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=f"Invalid Ollama models response: {exc}") from exc

    return {"models": data.get("models", [])}


@app.post("/api/llm/generate")
async def ollama_generate(payload: OllamaGenerateRequest) -> Any:
    base_url = payload.ollama_base_url.rstrip("/")
    endpoint = f"{base_url}/api/generate"

    request_body = {
        "model": payload.model,
        "prompt": payload.prompt,
        "stream": False,
        "options": {
            "temperature": payload.temperature,
            "num_predict": payload.max_tokens,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS, follow_redirects=True) as client:
            response = await client.post(endpoint, json=request_body)
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail=f"Ollama generate timeout: {exc}") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Ollama generate request failed: {exc}") from exc

    if not response.is_success:
        raise HTTPException(status_code=response.status_code, detail=response.text[:200])

    try:
        data = response.json()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=f"Invalid Ollama response: {exc}") from exc

    return {
        "text": data.get("response", ""),
        "model": data.get("model", payload.model),
        "done": data.get("done", True),
    }
