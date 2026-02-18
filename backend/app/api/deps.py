from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.core.config import settings
from app.core.security import ClerkJWTVerifier

http_bearer = HTTPBearer(auto_error=False)


class AuthenticatedUser(BaseModel):
    user_id: str
    email: str | None = None
    org_id: str | None = None
    claims: dict[str, Any]


def _get_verifier() -> ClerkJWTVerifier:
    if not settings.clerk_jwks_url or not settings.clerk_issuer:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Clerk auth is not configured",
        )

    return ClerkJWTVerifier(
        jwks_url=settings.clerk_jwks_url,
        issuer=settings.clerk_issuer,
        audience=settings.clerk_audience,
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(http_bearer),
) -> AuthenticatedUser:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    claims = await _get_verifier().verify_token(credentials.credentials)
    user_id = claims.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing subject claim",
        )

    return AuthenticatedUser(
        user_id=user_id,
        email=claims.get("email"),
        org_id=claims.get("org_id"),
        claims=claims,
    )
