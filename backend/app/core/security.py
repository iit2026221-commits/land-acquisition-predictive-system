import base64
import hashlib
import hmac
import json
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config.settings import get_settings
from app.config.database import get_db
from app.models.user import User


@dataclass(frozen=True)
class CurrentUser:
    id: int
    email: str
    role: str


bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 210_000)
    return f"pbkdf2_sha256$210000${base64.urlsafe_b64encode(salt).decode()}${base64.urlsafe_b64encode(digest).decode()}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, rounds, salt, expected = encoded.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), base64.urlsafe_b64decode(salt), int(rounds))
        return hmac.compare_digest(base64.urlsafe_b64encode(digest).decode(), expected)
    except (ValueError, TypeError):
        return False


def create_access_token(user: CurrentUser) -> str:
    settings = get_settings()
    payload = {
        "sub": str(user.id), "email": user.email, "role": user.role,
        "exp": int((datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)).timestamp()),
    }
    encode = lambda value: base64.urlsafe_b64encode(json.dumps(value, separators=(",", ":")).encode()).decode().rstrip("=")
    header = encode({"alg": "HS256", "typ": "JWT"})
    body = encode(payload)
    signing_input = f"{header}.{body}"
    signature = base64.urlsafe_b64encode(hmac.new(settings.secret_key.encode(), signing_input.encode(), hashlib.sha256).digest()).decode().rstrip("=")
    return f"{signing_input}.{signature}"


def decode_access_token(token: str) -> CurrentUser:
    try:
        header, encoded, signature = token.split(".")
        signing_input = f"{header}.{encoded}"
        expected = base64.urlsafe_b64encode(hmac.new(get_settings().secret_key.encode(), signing_input.encode(), hashlib.sha256).digest()).decode().rstrip("=")
        if not hmac.compare_digest(signature, expected):
            raise ValueError
        parsed_header = json.loads(base64.urlsafe_b64decode(header + "=" * (-len(header) % 4)))
        if parsed_header.get("alg") != "HS256":
            raise ValueError
        payload = json.loads(base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4)))
        if int(payload["exp"]) < int(datetime.now(timezone.utc).timestamp()):
            raise ValueError
        return CurrentUser(id=int(payload["sub"]), email=str(payload["email"]), role=str(payload["role"]))
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"code": "INVALID_TOKEN", "message": "Authentication is required."})


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> CurrentUser:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"code": "AUTHENTICATION_REQUIRED", "message": "Authentication is required."})
    token_user = decode_access_token(credentials.credentials)
    user = db.query(User).filter(User.id == token_user.id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"code": "USER_NOT_FOUND", "message": "Authentication is required."})
    return CurrentUser(id=user.id, email=user.email, role=user.role)
