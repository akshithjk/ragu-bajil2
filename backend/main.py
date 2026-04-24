# FastAPI Application Entry Point
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.database import engine, Base
from core.middleware import JWTMiddleware, SiteScopeMiddleware, AuditMiddleware

from api import auth, guidelines, rules, patients, evaluations, reports, pipeline, admin

@asynccontextmanager
async def lifespan(app: FastAPI):
    # This generates the schema if it doesn't exist, though Alembic is preferred.
    # async with engine.begin() as conn:
    #     await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()

app = FastAPI(title="ReguVigil API", lifespan=lifespan)

# Add middlewares (order matters: executed bottom to top)
app.add_middleware(AuditMiddleware)
app.add_middleware(SiteScopeMiddleware)
app.add_middleware(JWTMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(guidelines.router)
app.include_router(rules.router)
app.include_router(patients.router)
app.include_router(evaluations.router)
app.include_router(reports.router)
app.include_router(pipeline.router)
app.include_router(admin.router)

@app.get("/")
async def root():
    return {"status": "ok", "message": "ReguVigil API running"}
