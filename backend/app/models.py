import datetime
from sqlalchemy import Column, Integer, String, DateTime, Date
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="operator")  # "admin" or "operator"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_number = Column(String, index=True, nullable=False)
    entry_time = Column(DateTime, default=datetime.datetime.utcnow)
    exit_time = Column(DateTime, nullable=True)
    date = Column(Date, default=lambda: datetime.date.today(), index=True)
    status = Column(String, default="Inside")  # "Inside" or "Exited"
    photo_path = Column(String, nullable=True)  # Path to saved cropped plate image
