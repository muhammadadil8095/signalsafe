"""Main API router combining all sub-routers."""

from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.scans import router as scans_router
from app.api.reports import router as reports_router
from app.api.admin import router as admin_router
from app.api.messages import router as messages_router
from app.api.attachments import router as attachments_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(scans_router)
api_router.include_router(reports_router)
api_router.include_router(admin_router)
api_router.include_router(messages_router)
api_router.include_router(attachments_router)

