"""
FastAPI application entry point.

Start locally:
    uvicorn main:app --reload

Deployed (Railway/Render):
    uvicorn main:app --host 0.0.0.0 --port $PORT
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.core.config import get_settings
from app.database.connection import engine, get_db
from app.models import models  # noqa: F401 – register all ORM models with SQLAlchemy
from app.schemas.schemas import HealthResponse

# Route modules
from app.api import auth, departments, courses, subjects, students, faculty, parents, semesters, enrollments, faculty_assignments, audit_logs, timetable

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: nothing to do — Alembic handles migrations at deploy time
    yield
    # Shutdown: nothing to tear down


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router)
app.include_router(departments.router)
app.include_router(courses.router)
app.include_router(subjects.router)
app.include_router(students.router)
app.include_router(faculty.router)
app.include_router(parents.router)
app.include_router(semesters.router)
app.include_router(enrollments.router)
app.include_router(faculty_assignments.router)
app.include_router(audit_logs.router)
app.include_router(timetable.router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", response_model=HealthResponse, tags=["health"])
def health():
    db_ok = False
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_ok = True
    except OperationalError:
        pass

    return HealthResponse(
        status="ok" if db_ok else "degraded",
        db_connected=db_ok,
        version=settings.app_version,
    )


@app.get("/", include_in_schema=False)
def root():
    return {"message": f"{settings.app_name} v{settings.app_version} — see /docs"}
