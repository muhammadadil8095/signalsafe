from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    APP_NAME: str = "SignalSafe Campus"
    VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "sqlite:///./signalsafe.db"

    # JWT Authentication
    SECRET_KEY: str = "change-this-in-production-use-openssl-rand-hex-32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # VirusTotal Integration
    VT_API_KEY: Optional[str] = None
    VT_ENABLED: bool = False
    VT_TIMEOUT: int = 30
    VT_RATE_LIMIT: int = 4

    # File Upload
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10 MB
    ALLOWED_EXTENSIONS: list = [".pdf", ".html", ".htm"]

    # CORS
    CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000"]

    # ML Model Paths
    ML_MODEL_PATH: str = "ml/models/url_phishing_model.joblib"
    ML_PIPELINE_PATH: str = "ml/models/feature_pipeline.joblib"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
