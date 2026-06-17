import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DatabaseSetup")

# Construct PostgreSQL URL
postgres_url = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
sqlite_url = "sqlite:///./anpr.db"

engine = None
db_connected = False

# Try connecting to PostgreSQL first
try:
    logger.info(f"Attempting connection to PostgreSQL database: {settings.POSTGRES_DB}...")
    # Using a short timeout to fail fast if DB is down
    engine = create_engine(postgres_url, connect_args={"connect_timeout": 3})
    # Test connection
    with engine.connect() as conn:
        logger.info("Successfully connected to PostgreSQL database!")
        db_connected = True
except Exception as e:
    logger.warning(f"Could not connect to PostgreSQL database ({str(e)}). Falling back to SQLite database at `./anpr.db` for development...")
    # SQLite requires check_same_thread=False for multi-threaded FastAPI apps
    engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
    db_connected = False

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
