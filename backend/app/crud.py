import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from app import models, schemas

# --- User CRUD ---
def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    from app.auth import get_password_hash
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        password_hash=hashed_password,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None
    if user_update.password:
        from app.auth import get_password_hash
        db_user.password_hash = get_password_hash(user_update.password)
    if user_update.role:
        db_user.role = user_update.role
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = get_user_by_id(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False

# --- Vehicle CRUD ---
def get_vehicle_by_id(db: Session, vehicle_id: int):
    return db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()

def get_active_vehicle_by_number(db: Session, vehicle_number: str):
    # Returns the latest active vehicle record that is currently "Inside"
    return db.query(models.Vehicle).filter(
        and_(
            models.Vehicle.vehicle_number == vehicle_number,
            models.Vehicle.status == "Inside"
        )
    ).order_by(models.Vehicle.entry_time.desc()).first()

def create_vehicle_entry(db: Session, vehicle_number: str, photo_path: str = None):
    # Log vehicle entry
    now = datetime.datetime.now()
    db_vehicle = models.Vehicle(
        vehicle_number=vehicle_number,
        entry_time=now,
        date=now.date(),
        status="Inside",
        photo_path=photo_path
    )
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

def update_vehicle_exit(db: Session, vehicle_id: int):
    # Update exit log
    db_vehicle = get_vehicle_by_id(db, vehicle_id)
    if db_vehicle:
        db_vehicle.exit_time = datetime.datetime.now()
        db_vehicle.status = "Exited"
        db.commit()
        db.refresh(db_vehicle)
        return db_vehicle
    return None

def process_vehicle_detection(db: Session, vehicle_number: str, photo_path: str = None):
    # ANPR workflow: check if vehicle is already inside
    active_vehicle = get_active_vehicle_by_number(db, vehicle_number)
    if active_vehicle:
        # If it is inside, record its exit
        # Wait a small throttle time (e.g. 10 seconds) to prevent double capture errors on the same plate
        time_elapsed = (datetime.datetime.now() - active_vehicle.entry_time).total_seconds()
        if time_elapsed > 10:
            return update_vehicle_exit(db, active_vehicle.id), "exit"
        return active_vehicle, "duplicate"
    else:
        # If not inside, record its entry
        return create_vehicle_entry(db, vehicle_number, photo_path), "entry"

def get_vehicles(
    db: Session, 
    search: str = None, 
    status: str = None, 
    start_date: datetime.date = None, 
    end_date: datetime.date = None, 
    skip: int = 0, 
    limit: int = 100
):
    query = db.query(models.Vehicle)
    
    if search:
        query = query.filter(models.Vehicle.vehicle_number.ilike(f"%{search}%"))
    if status:
        query = query.filter(models.Vehicle.status == status)
    if start_date:
        query = query.filter(models.Vehicle.date >= start_date)
    if end_date:
        query = query.filter(models.Vehicle.date <= end_date)
        
    return query.order_by(models.Vehicle.entry_time.desc()).offset(skip).limit(limit).all()

def delete_vehicle_log(db: Session, vehicle_id: int):
    db_vehicle = get_vehicle_by_id(db, vehicle_id)
    if db_vehicle:
        db.delete(db_vehicle)
        db.commit()
        return True
    return False

def get_dashboard_stats(db: Session):
    today = datetime.date.today()
    
    total = db.query(models.Vehicle).count()
    active = db.query(models.Vehicle).filter(models.Vehicle.status == "Inside").count()
    
    today_entries = db.query(models.Vehicle).filter(
        and_(
            models.Vehicle.date == today,
            models.Vehicle.entry_time.isnot(None)
        )
    ).count()
    
    today_exits = db.query(models.Vehicle).filter(
        and_(
            models.Vehicle.date == today,
            models.Vehicle.status == "Exited"
        )
    ).count()
    
    recent_activity = db.query(models.Vehicle).order_by(
        models.Vehicle.entry_time.desc()
    ).limit(10).all()
    
    return {
        "total_vehicles": total,
        "active_vehicles": active,
        "today_entries": today_entries,
        "today_exits": today_exits,
        "recent_activity": recent_activity
    }
