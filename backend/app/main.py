from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import get_settings
from app.db.mongo import get_mongo, init_mongo
from app.db.postgres import engine, init_postgres


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_postgres()
    await init_mongo()
    yield
    await engine.dispose()


app = FastAPI(title="Barabari AI Mentor", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> dict:
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    await get_mongo().command("ping")
    return {"status": "ok"}
