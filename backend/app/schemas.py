from pydantic import BaseModel, Field
from typing import Optional, List
import datetime

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    role: str = "operator"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    password: Optional[str] = None
    role: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Vehicle Schemas ---
class VehicleBase(BaseModel):
    vehicle_number: str
    status: str
    entry_time: datetime.datetime
    exit_time: Optional[datetime.datetime] = None
    date: datetime.date
    photo_path: Optional[str] = None

class VehicleCreate(BaseModel):
    vehicle_number: str
    photo_path: Optional[str] = None

class VehicleResponse(VehicleBase):
    id: int

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_vehicles: int
    active_vehicles: int
    today_entries: int
    today_exits: int
    recent_activity: List[VehicleResponse]
