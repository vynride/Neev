from collections.abc import AsyncIterator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings


class Base(DeclarativeBase):
    pass


_url = get_settings().database_url

# Supabase's transaction pooler cannot keep prepared statements, so caching is off there only.
# On a direct connection the cache saves a parse round trip per query, which matters when the
# database is in another region. pool_recycle replaces pre-ping for the same reason: a ping is
# a full round trip on every checkout.
engine = create_async_engine(
    _url,
    pool_recycle=300,
    pool_size=5,
    connect_args={"statement_cache_size": 0} if "pooler." in _url else {},
)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def init_postgres() -> None:
    """Create the pgvector extension and any missing tables."""
    import app.models  # noqa: F401  registers tables on Base

    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)


async def get_db() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session
