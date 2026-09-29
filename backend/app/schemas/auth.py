from pydantic import BaseModel, Field
from typing import Optional

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, example="admin")
    password: str = Field(..., min_length=1, example="admin123")

class UserInfo(BaseModel):
    username: str
    role: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserInfo
