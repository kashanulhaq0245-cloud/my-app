import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI ANPR Smart Gate System"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super_secret_jwt_key_for_smart_gate_anpr_12345!")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Database Settings
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "anpr_db")
    
    # Connection URL will be dynamically fallback-constructed in database.py
    DATABASE_URL: Optional[str] = None

    # ANPR Settings
    # Modes: "real" (loads YOLOv8 + EasyOCR) or "simulated" (uses simulated detections for smooth UI demos)
    ANPR_MODE: str = os.getenv("ANPR_MODE", "simulated")
    
    # CCTV feed index or RTSP URL: "0" for local webcam, or a video path, or RTSP url
    CCTV_FEED_SOURCE: str = os.getenv("CCTV_FEED_SOURCE", "0")
    
    # Directory to store captured number plate photos
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")

    class Config:
        case_sensitive = True

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
