import os
import cv2
import numpy as np
import asyncio
import time
import logging
from typing import List, Optional
from datetime import date, datetime
from fastapi import FastAPI, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app import models, schemas, crud, auth, reports, database
from app.config import settings
from app.anpr import process_frame, simulated_traffic

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ANPR_Backend")

# Initialize FastAPI app
app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount upload directory to serve cropped plate photos
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Dynamic DB creation at startup
@app.on_event("startup")
def startup_event():
    logger.info("Initializing database schemas...")
    models.Base.metadata.create_all(bind=database.engine)
    logger.info("Database initialized successfully.")

# --- WebSocket Connection Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"Client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                # Handle dead connections silently
                pass

manager = ConnectionManager()

# --- Authentication Endpoints ---
@app.post(f"{settings.API_V1_STR}/auth/login", response_model=schemas.Token)
def login(db: Session = Depends(database.get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.role,
        "username": user.username
    }

# --- User Management Endpoints (Admin Only) ---
@app.post(f"{settings.API_V1_STR}/users", response_model=schemas.UserResponse)
def create_user(
    user: schemas.UserCreate, 
    db: Session = Depends(database.get_db), 
    current_admin: models.User = Depends(auth.get_current_active_admin)
):
    existing = crud.get_user_by_username(db, username=user.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    return crud.create_user(db=db, user=user)

@app.get(f"{settings.API_V1_STR}/users", response_model=List[schemas.UserResponse])
def get_users(
    db: Session = Depends(database.get_db), 
    current_admin: models.User = Depends(auth.get_current_active_admin)
):
    return crud.get_users(db)

@app.put(f"{settings.API_V1_STR}/users/{{user_id}}", response_model=schemas.UserResponse)
def update_user(
    user_id: int, 
    user_update: schemas.UserUpdate, 
    db: Session = Depends(database.get_db), 
    current_admin: models.User = Depends(auth.get_current_active_admin)
):
    updated = crud.update_user(db, user_id, user_update)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated

@app.delete(f"{settings.API_V1_STR}/users/{{user_id}}")
def delete_user(
    user_id: int, 
    db: Session = Depends(database.get_db), 
    current_admin: models.User = Depends(auth.get_current_active_admin)
):
    # Prevent self-deletion
    if current_admin.id == user_id:
        raise HTTPException(status_code=400, detail="Admin cannot delete their own account")
    deleted = crud.delete_user(db, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success", "message": "User deleted successfully"}

# --- Vehicle Logs Endpoints ---
@app.get(f"{settings.API_V1_STR}/vehicles", response_model=List[schemas.VehicleResponse])
def get_vehicles(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return crud.get_vehicles(db, search, status, start_date, end_date, skip, limit)

@app.delete(f"{settings.API_V1_STR}/vehicles/{{vehicle_id}}")
def delete_vehicle(
    vehicle_id: int, 
    db: Session = Depends(database.get_db), 
    current_admin: models.User = Depends(auth.get_current_active_admin)
):
    deleted = crud.delete_vehicle_log(db, vehicle_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return {"status": "success", "message": "Vehicle log deleted successfully"}

# --- Dashboard Summary Stats ---
@app.get(f"{settings.API_V1_STR}/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    return crud.get_dashboard_stats(db)

# --- Reports & Export Endpoints ---
@app.get(f"{settings.API_V1_STR}/reports/export")
def export_report(
    format: str = Query("excel", regex="^(excel|pdf)$"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Fetch logs based on date range
    vehicles = crud.get_vehicles(db, start_date=start_date, end_date=end_date, limit=1000)
    
    if format == "excel":
        file_path = reports.generate_excel_report(vehicles)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = "ANPR_Vehicle_Log.xlsx"
    else:
        file_path = reports.generate_pdf_report(vehicles)
        media_type = "application/pdf"
        filename = "ANPR_Vehicle_Log.pdf"
        
    return FileResponse(path=file_path, media_type=media_type, filename=filename)

# --- WebSocket Event Broker ---
@app.websocket("/api/ws/traffic")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Maintain connection, handle occasional ping
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# --- Live CCTV Video MJPEG Streaming Generator ---
def video_frame_generator():
    """
    Video streaming generator. Captures frames from camera/simulation,
    processes them via YOLOv8/EasyOCR, logs detections to database,
    and yields the MJPEG boundary streams.
    """
    # Open DB session specifically for the background thread generator
    db: Session = database.SessionLocal()
    
    cap = None
    if settings.ANPR_MODE == "real":
        try:
            # Attempt to connect to local camera or stream
            source = settings.CCTV_FEED_SOURCE
            # Convert string to int if it represents an index
            if source.isdigit():
                source = int(source)
            cap = cv2.VideoCapture(source)
            # Reduce resolution for streaming performance
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        except Exception as e:
            logger.error(f"Failed to open video source {settings.CCTV_FEED_SOURCE}: {e}. Falling back to simulation.")
            settings.ANPR_MODE = "simulated"

    last_processed_plate = None
    last_processed_time = 0

    try:
        while True:
            frame = None
            plate_number = None
            box = None
            photo_path = None
            
            if settings.ANPR_MODE == "simulated":
                frame, plate_number, box = simulated_traffic.update()
                # Yield at ~20 frames per second
                time.sleep(0.05)
            else:
                if cap and cap.isOpened():
                    ret, raw_frame = cap.read()
                    if not ret:
                        # Re-read or restart video file if at end
                        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                        continue
                    
                    # Run YOLOv8 + OCR detection on frame
                    frame, detections = process_frame(raw_frame)
                    
                    if detections:
                        # Grab the first detection in the frame
                        det = detections[0]
                        plate_number = det["plate_text"]
                        box = det["box"]
                        photo_path = det["photo_path"]
                else:
                    # Fallback to black screen if stream fails
                    frame = np.zeros((480, 640, 3), dtype='uint8')
                    cv2.putText(frame, "CCTV DISCONNECTED", (180, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
                    time.sleep(0.1)

            # --- Database Logging & WS Broadcast Workflow ---
            if plate_number:
                now_sec = time.time()
                # Simple throttle: prevent double logging of the same plate within 8 seconds
                if plate_number != last_processed_plate or (now_sec - last_processed_time > 8):
                    last_processed_plate = plate_number
                    last_processed_time = now_sec
                    
                    try:
                        # Handle simulation crop save for visuals
                        if settings.ANPR_MODE == "simulated" and box:
                            # Crop simulated plate area
                            crop = frame[box[1]:box[3], box[0]:box[2]]
                            if crop.size > 0:
                                filename = f"sim_plate_{int(now_sec)}_{plate_number.replace('-', '_')}.jpg"
                                photo_path = f"/uploads/{filename}"
                                cv2.imwrite(os.path.join(settings.UPLOAD_DIR, filename), crop)

                        # Verify vehicle inside/exit in DB
                        db_vehicle, action = crud.process_vehicle_detection(
                            db, vehicle_number=plate_number, photo_path=photo_path
                        )
                        
                        if action in ["entry", "exit"]:
                            # Fetch updated dashboard stats
                            stats = crud.get_dashboard_stats(db)
                            # Serialize current vehicle info
                            vehicle_res = {
                                "id": db_vehicle.id,
                                "vehicle_number": db_vehicle.vehicle_number,
                                "entry_time": db_vehicle.entry_time.isoformat() if db_vehicle.entry_time else None,
                                "exit_time": db_vehicle.exit_time.isoformat() if db_vehicle.exit_time else None,
                                "date": db_vehicle.date.isoformat(),
                                "status": db_vehicle.status,
                                "photo_path": db_vehicle.photo_path
                            }
                            # Broadcast to React frontend sockets
                            asyncio.run(manager.broadcast({
                                "event": "detection",
                                "action": action,
                                "vehicle": vehicle_res,
                                "stats": {
                                    "total_vehicles": stats["total_vehicles"],
                                    "active_vehicles": stats["active_vehicles"],
                                    "today_entries": stats["today_entries"],
                                    "today_exits": stats["today_exits"]
                                }
                            }))
                            logger.info(f"ANPR EVENT: logged {action.upper()} for plate: {plate_number}")
                    except Exception as db_err:
                        logger.error(f"Error logging ANPR detection to database: {db_err}")
                        db.rollback()

            # Encode frame to JPEG
            if frame is not None:
                # Draw crosshair/HUD markers to make it look premium
                cv2.line(frame, (320, 20), (320, 60), (0, 255, 255), 1)
                cv2.line(frame, (320, 420), (320, 460), (0, 255, 255), 1)
                cv2.line(frame, (20, 240), (60, 240), (0, 255, 255), 1)
                cv2.line(frame, (580, 240), (620, 240), (0, 255, 255), 1)
                
                # Encode
                ret, jpeg = cv2.imencode('.jpg', frame)
                if ret:
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n\r\n')
    finally:
        db.close()
        if cap:
            cap.release()

@app.get(f"{settings.API_V1_STR}/stream/live")
def get_live_stream(current_user: models.User = Depends(auth.get_current_user)):
    return StreamingResponse(
        video_frame_generator(), 
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
