import logging
import time
from uuid import uuid4

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid4())
        request.state.request_id = request_id
        started = time.perf_counter()
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        logging.getLogger("landiq.request").info(
            "request_completed",
            extra={"request_id": request_id, "route": request.url.path, "duration_ms": round((time.perf_counter() - started) * 1000, 2), "status_code": response.status_code},
        )
        return response
