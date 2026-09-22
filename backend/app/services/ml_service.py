"""HTTP client boundary for the ML microservice."""

import json
from urllib.error import HTTPError, URLError
from urllib.request import ProxyHandler, Request, build_opener

from fastapi import HTTPException, status

from app.config.settings import get_settings


def request_prediction(path: str, payload: dict) -> dict:
    request = Request(
        f"{get_settings().ml_service_url.rstrip('/')}{path}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with build_opener(ProxyHandler({})).open(request, timeout=8) as response:
            return json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"status": "PREDICTION_UNAVAILABLE", "message": "The ML service is unavailable."},
        ) from exc


def get_ml_status() -> dict:
    request = Request(f"{get_settings().ml_service_url.rstrip('/')}/health", method="GET")
    try:
        with build_opener(ProxyHandler({})).open(request, timeout=3) as response:
            return json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError):
        return {"status": "unavailable", "service": "ml-service"}
