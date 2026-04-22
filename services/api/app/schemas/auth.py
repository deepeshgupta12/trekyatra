from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class EmailSignupRequest(BaseModel):
    email: str
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)
    display_name: str | None = Field(default=None, max_length=255)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or normalized.startswith("@") or normalized.endswith("@"):
            raise ValueError("Please provide a valid email address.")
        return normalized


class EmailLoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or normalized.startswith("@") or normalized.endswith("@"):
            raise ValueError("Please provide a valid email address.")
        return normalized


class MobileOtpRequest(BaseModel):
    mobile_number: str = Field(min_length=8, max_length=32)


class MobileOtpVerifyRequest(BaseModel):
    mobile_number: str = Field(min_length=8, max_length=32)
    otp: str = Field(min_length=4, max_length=10)


class GoogleAuthRequest(BaseModel):
    access_token: str = Field(min_length=1)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str | None
    full_name: str | None
    display_name: str | None
    is_verified_email: bool
    is_verified_mobile: bool
    primary_auth_method: str | None
    created_at: datetime


class AuthResponse(BaseModel):
    user: UserResponse
    session_expires_at: datetime


class MessageResponse(BaseModel):
    message: str


class PlaceholderResponse(BaseModel):
    detail: str