import json
import time
from dataclasses import dataclass
from typing import Any

import httpx
import jwt
from fastapi import HTTPException, status


@dataclass(slots=True)
class JwksCache:
    value: dict[str, Any]
    loaded_at: float


class ClerkJWTVerifier:
    def __init__(
        self,
        jwks_url: str,
        issuer: str,
        audience: str | None = None,
        cache_ttl_seconds: int = 300,
    ) -> None:
        self.jwks_url = jwks_url
        self.issuer = issuer
        self.audience = audience
        self.cache_ttl_seconds = cache_ttl_seconds
        self._jwks_cache: JwksCache | None = None

    async def _get_jwks(self) -> dict[str, Any]:
        now = time.time()
        if self._jwks_cache and now - self._jwks_cache.loaded_at <= self.cache_ttl_seconds:
            return self._jwks_cache.value

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(self.jwks_url)
                response.raise_for_status()
                jwks = response.json()
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service unavailable",
            ) from exc

        self._jwks_cache = JwksCache(value=jwks, loaded_at=now)
        return jwks

    async def verify_token(self, token: str) -> dict[str, Any]:
        try:
            header = jwt.get_unverified_header(token)
            kid = header.get("kid")
        except jwt.InvalidTokenError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token header",
            ) from exc

        jwks = await self._get_jwks()
        jwk = next((key for key in jwks.get("keys", []) if key.get("kid") == kid), None)
        if jwk is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Signing key not found",
            )

        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(jwk))

        decode_kwargs: dict[str, Any] = {
            "key": public_key,
            "algorithms": ["RS256"],
            "issuer": self.issuer,
            "options": {"verify_aud": self.audience is not None},
        }
        if self.audience:
            decode_kwargs["audience"] = self.audience

        try:
            return jwt.decode(token, **decode_kwargs)
        except jwt.PyJWTError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token validation failed",
            ) from exc
