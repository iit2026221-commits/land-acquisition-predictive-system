from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.security import CurrentUser, create_access_token, get_current_user, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)) -> TokenResponse:
    identifier = payload.username or payload.email
    user = db.query(User).filter((User.username == identifier) | (User.email == identifier)).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"code": "INVALID_CREDENTIALS", "message": "Username or password is incorrect."})
    from app.services.audit_service import record_event
    record_event(db, event="auth.login", request_id=getattr(request.state, "request_id", "unknown"), user_id=user.id)
    return TokenResponse(access_token=create_access_token(CurrentUser(id=user.id, email=user.email, role=user.role)), user=UserResponse.model_validate(user))


@router.get("/me")
def me(user: CurrentUser = Depends(get_current_user)) -> dict[str, object]:
    return {"id": user.id, "username": user.email.split("@", 1)[0], "email": user.email, "role": user.role}
