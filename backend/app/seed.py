import datetime
import random
from sqlalchemy.orm import Session
from app import models, auth, database

def seed_db():
    db: Session = database.SessionLocal()
    
    # 1. Create tables
    models.Base.metadata.create_all(bind=database.engine)
    
    print("Seeding users...")
    # 2. Seed default users if they don't exist
    admin_user = db.query(models.User).filter(models.User.username == "admin").first()
    if not admin_user:
        hashed_pw = auth.get_password_hash("admin123")
        admin = models.User(
            username="admin",
            password_hash=hashed_pw,
            role="admin"
        )
        db.add(admin)
        print("Created default admin user (admin / admin123)")
        
    operator_user = db.query(models.User).filter(models.User.username == "operator").first()
    if not operator_user:
        hashed_pw = auth.get_password_hash("operator123")
        operator = models.User(
            username="operator",
            password_hash=hashed_pw,
            role="operator"
        )
        db.add(operator)
        print("Created default operator user (operator / operator123)")
        
    # 3. Seed historical vehicle logs if database is empty
    vehicle_count = db.query(models.Vehicle).count()
    if vehicle_count == 0:
        print("Seeding vehicle history...")
        states = ["CA", "NY", "TX", "FL", "IL", "PA", "OH", "GA", "NC", "MI"]
        
        # Generate logs for the last 7 days
        today = datetime.date.today()
        
        for day_offset in range(6, -1, -1):
            log_date = today - datetime.timedelta(days=day_offset)
            # Spawn random number of vehicles for this day
            num_vehicles = random.randint(8, 20)
            
            for _ in range(num_vehicles):
                # Generate plate
                letters = "".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ", k=3))
                digits = "".join(random.choices("0123456789", k=4))
                state = random.choice(states)
                plate = f"{state}-{letters}{digits}"
                
                # Random entry time
                hour = random.randint(8, 21)
                minute = random.randint(0, 59)
                entry_time = datetime.datetime.combine(log_date, datetime.time(hour, minute))
                
                # Decide status: today's latest logs can be "Inside", older ones are mostly "Exited"
                is_inside = False
                if day_offset == 0: # Today
                    is_inside = random.choice([True, False, False]) # 1 in 3 remains inside
                
                if is_inside:
                    db_vehicle = models.Vehicle(
                        vehicle_number=plate,
                        entry_time=entry_time,
                        exit_time=None,
                        date=log_date,
                        status="Inside"
                    )
                else:
                    # Stays inside for 1 to 5 hours
                    exit_hour = hour + random.randint(1, 4)
                    exit_minute = random.randint(0, 59)
                    if exit_hour > 23:
                        exit_hour = 23
                    exit_time = datetime.datetime.combine(log_date, datetime.time(exit_hour, exit_minute))
                    
                    db_vehicle = models.Vehicle(
                        vehicle_number=plate,
                        entry_time=entry_time,
                        exit_time=exit_time,
                        date=log_date,
                        status="Exited"
                    )
                
                db.add(db_vehicle)
                
        print("Historical vehicle logs successfully seeded!")
        
    db.commit()
    db.close()
    print("Database seeding completed.")

if __name__ == "__main__":
    seed_db()
