from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.admin_user import AdminUser
from app.schemas.auth import LoginRequest, TokenResponse, UserInfo
from app.core.security import verify_password, create_access_token

router = APIRouter()

@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate single Admin user and issue JWT token.
    """
    stmt = select(AdminUser).where(AdminUser.username == credentials.username)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update last login timestamp
    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()

    access_token = create_access_token(subject=user.username)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserInfo(username=user.username, role=user.role)
    )
