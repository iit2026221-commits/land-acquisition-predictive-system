from pydantic import BaseModel, ConfigDict, EmailStr, model_validator


class LoginRequest(BaseModel):
    username: str | None = None
    email: EmailStr | None = None
    password: str

    @model_validator(mode="after")
    def validate_identifier(self):
        if not self.username and not self.email:
            raise ValueError("Username or email is required.")
        return self


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: EmailStr
    role: str
