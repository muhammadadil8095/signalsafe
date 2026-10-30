"""SignalSafe Campus — FastAPI application entry point."""

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.api.router import api_router
from app.core.config import settings
from app.database.session import Base, engine

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

def get_client_ip(request: Request) -> str:
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"

# Rate limiter
limiter = Limiter(key_func=get_client_ip)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="AI-powered campus cybersecurity platform — Your digital safety, one signal ahead.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
def on_startup():
    """Create database tables on startup."""
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info(f"{settings.APP_NAME} v{settings.VERSION} started successfully")


@app.get("/", tags=["Health"])
def root():
    """Root health check endpoint."""
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "database": "connected",
        "ml_model": _check_ml_status(),
        "virustotal": settings.VT_ENABLED,
    }


def _check_ml_status() -> str:
    try:
        from app.ml.predictor import MLPredictor
        predictor = MLPredictor()
        return "loaded" if predictor.is_available else "not_available"
    except Exception:
        return "not_available"


@app.get("/api/v1/ml/health", tags=["ML"])
def ml_health():
    """ML model health status."""
    try:
        from app.ml.predictor import MLPredictor
        predictor = MLPredictor()
        return predictor.health_check()
    except Exception as e:
        return {"available": False, "error": str(e)}

