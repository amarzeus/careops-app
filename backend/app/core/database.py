from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

engine: AsyncEngine | None = None
session_factory: async_sessionmaker[AsyncSession] | None = None

if settings.database_url:
    engine = create_async_engine(
        settings.database_url,
        pool_size=5,
        max_overflow=10,
        pool_recycle=1800,
        pool_pre_ping=True,
    )
    session_factory = async_sessionmaker(engine, expire_on_commit=False)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    if session_factory is None:
        raise RuntimeError("Database is not configured")

    async with session_factory() as session:
        yield session


async def check_database_connection() -> dict[str, str]:
    if engine is None:
        return {"status": "not_configured", "detail": "DATABASE_URL is not set"}

    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        return {"status": "ok", "detail": "database reachable"}
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}
