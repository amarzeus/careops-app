from redis.asyncio import Redis

from app.core.config import settings

redis_client: Redis | None = None

if settings.redis_url:
    redis_client = Redis.from_url(settings.redis_url, decode_responses=True)


async def get_redis_client() -> Redis:
    if redis_client is None:
        raise RuntimeError("Redis is not configured")
    return redis_client


async def check_redis_connection() -> dict[str, str]:
    if redis_client is None:
        return {"status": "not_configured", "detail": "REDIS_URL is not set"}

    try:
        pong = await redis_client.ping()
        if pong is True:
            return {"status": "ok", "detail": "redis reachable"}
        return {"status": "error", "detail": "redis ping failed"}
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}
