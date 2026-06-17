import os
import cv2
import re
import time
import random
import logging
from datetime import datetime
from typing import Tuple, Optional, List, Dict
from app.config import settings

logger = logging.getLogger("ANPR_Engine")

# Load models in "real" mode
yolo_model = None
ocr_reader = None

if settings.ANPR_MODE == "real":
    try:
        logger.info("Initializing YOLOv8 and EasyOCR models (Real Mode)...")
        from ultralytics import YOLO
        import easyocr
        
        # Load or download the YOLOv8 model (defaulting to yolov8n.pt or a plate-specific model if available)
        # Using yolov8n.pt as a base; standard practice for generic object checks
        yolo_model = YOLO("yolov8n.pt")
        # Initialize EasyOCR Reader for English
        ocr_reader = easyocr.Reader(['en'], gpu=False)
        logger.info("Models loaded successfully!")
    except Exception as e:
        logger.error(f"Failed to load ML models: {e}. Switching to simulated mode.")
        settings.ANPR_MODE = "simulated"

# --- Image Preprocessing for OCR ---
def preprocess_plate_image(plate_img):
    """
    Apply standard computer vision preprocessing to improve OCR accuracy
    """
    if plate_img is None or plate_img.size == 0:
        return None
    # 1. Convert to grayscale
    gray = cv2.cvtColor(plate_img, cv2.COLOR_BGR2GRAY)
    # 2. Resize to double size to help OCR read small text
    gray = cv2.resize(gray, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
    # 3. Apply bilateral filter to remove noise while preserving edges
    filtered = cv2.bilateralFilter(gray, 11, 17, 17)
    # 4. Adaptive Thresholding to binary image
    thresh = cv2.threshold(filtered, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    return thresh

def clean_plate_text(text: str) -> str:
    """
    Clean the OCR output to match typical license plate formats (alphanumeric uppercase)
    """
    # Remove non-alphanumeric characters, spaces, and lowercase
    cleaned = re.sub(r'[^A-Za-z0-9]', '', text).upper()
    # Filter out short or long garbage strings (plates are usually 3-10 characters)
    if 3 <= len(cleaned) <= 10:
        return cleaned
    return ""

import numpy as np

# --- Simulated Vehicle & Plate Generator ---
class SimulatedTraffic:
    """
    Generates synthetic frames representing vehicles passing through a gate
    """
    def __init__(self):
        self.state = "idle" # idle, approaching, detected, exiting
        self.state_timer = time.time()
        self.vehicle_types = ["Car", "SUV", "Truck", "Motorbike"]
        self.colors = [(255, 99, 71), (60, 179, 113), (30, 144, 255), (255, 215, 0)]
        self.current_vehicle = None
        self.current_plate = None
        self.current_y = 480
        self.box_coords = [0, 0, 0, 0]
        
    def generate_plate_number(self) -> str:
        states = ["CA", "NY", "TX", "FL", "IL", "PA", "OH", "GA", "NC", "MI"]
        letters = "".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ", k=3))
        digits = "".join(random.choices("0123456789", k=4))
        state = random.choice(states)
        return f"{state}-{letters}{digits}"

    def update(self) -> Tuple[cv2.Mat, Optional[str], Optional[Tuple[int, int, int, int]]]:
        # Create a background frame (black/gray gradient simulating road at gate)
        frame = np.zeros((480, 640, 3), dtype='uint8')
        # Draw road layout
        cv2.rectangle(frame, (180, 0), (460, 480), (40, 40, 40), -1) # Road
        cv2.line(frame, (320, 0), (320, 480), (255, 255, 255), 2) # Lane Divider
        
        # Draw gate barrier (Red line when down, Green when up)
        gate_color = (0, 0, 255) if self.state != "exiting" else (0, 255, 0)
        cv2.rectangle(frame, (100, 240), (540, 250), gate_color, -1)
        cv2.putText(frame, "SMART GATE BARRIER", (220, 230), cv2.FONT_HERSHEY_SIMPLEX, 0.6, gate_color, 2)
        
        # State machine for traffic simulation
        now = time.time()
        elapsed = now - self.state_timer
        
        if self.state == "idle":
            if elapsed > random.randint(4, 8):
                # Spawn new vehicle
                self.state = "approaching"
                self.state_timer = now
                self.current_vehicle = random.choice(self.vehicle_types)
                self.current_plate = self.generate_plate_number()
                self.current_y = 480
        
        elif self.state == "approaching":
            # Vehicle drives up to the gate
            self.current_y -= 40
            if self.current_y <= 280:
                self.state = "detected"
                self.state_timer = now
            # Draw vehicle body (simple colored rectangle)
            cv2.rectangle(frame, (240, int(self.current_y)), (400, int(self.current_y + 120)), (100, 100, 100), -1)
            # Plate box
            cv2.rectangle(frame, (290, int(self.current_y + 80)), (350, int(self.current_y + 105)), (255, 255, 255), -1)
            cv2.rectangle(frame, (290, int(self.current_y + 80)), (350, int(self.current_y + 105)), (0, 0, 0), 1)
            
        elif self.state == "detected":
            # Vehicle stopped at gate for ANPR reading
            cv2.rectangle(frame, (240, 280), (400, 400), (120, 120, 120), -1)
            # Draw License Plate
            cv2.rectangle(frame, (290, 360), (350, 385), (255, 255, 255), -1)
            cv2.rectangle(frame, (290, 360), (350, 385), (0, 0, 255), 2) # Red highlight
            cv2.putText(frame, self.current_plate.split("-")[1], (292, 378), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 0), 1)
            
            # Save bounding box coordinates
            self.box_coords = [290, 360, 350, 385]
            
            # Hold detection state for 3 seconds before opening gate
            if elapsed > 3.0:
                self.state = "exiting"
                self.state_timer = now
                
        elif self.state == "exiting":
            # Gate opens, vehicle drives through
            self.current_y -= 45
            if self.current_y < -150:
                self.state = "idle"
                self.state_timer = now
                self.current_vehicle = None
                self.current_plate = None
            else:
                cv2.rectangle(frame, (240, int(self.current_y)), (400, int(self.current_y + 120)), (100, 100, 100), -1)
                cv2.rectangle(frame, (290, int(self.current_y + 80)), (350, int(self.current_y + 105)), (255, 255, 255), -1)
                
        # Draw overlay details
        cv2.putText(frame, f"Mode: {settings.ANPR_MODE.upper()}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        if self.state == "detected" and self.current_plate:
            # Add scanning HUD text
            cv2.putText(frame, "SCANNING PLATE...", (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
            # Return frame, plate number, and coordinates ONLY when fully detected
            return frame, self.current_plate, self.box_coords
            
        return frame, None, None

simulated_traffic = SimulatedTraffic()

# --- Frame Processing Function ---
def process_frame(frame: cv2.Mat) -> Tuple[cv2.Mat, List[Dict]]:
    """
    Process a camera frame: detect vehicles/plates using YOLOv8, read plates with EasyOCR,
    and return the annotated frame along with a list of detections containing coordinates and text.
    """
    detections = []
    
    if settings.ANPR_MODE == "simulated":
        # Handled by generator directly when streaming, but in case we pass an image:
        return frame, []
        
    if yolo_model is None or ocr_reader is None:
        return frame, []
        
    # --- Real Mode Detection Pipeline ---
    h, w, _ = frame.shape
    
    # Run YOLOv8 on frame
    results = yolo_model(frame, verbose=False)
    
    for r in results:
        boxes = r.boxes
        for box in boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            
            # YOLO COCO classes for vehicles: 2 (car), 3 (motorbike), 5 (bus), 7 (truck)
            # If standard coco model is loaded, we can detect cars and crop their front/back areas.
            # To draw bounding boxes and run OCR on likely regions, we look at the bounding boxes.
            # Let's crop potential license plates. If using standard YOLO model, we'll scan the bottom half
            # of detected vehicle bounding boxes, or if a custom license plate YOLO is running, it outputs plates directly.
            
            # For robustness, we will assume standard YOLO model detects vehicles. We will segment the vehicle
            # bottom region, apply edge detection, find plate contours, crop, and run EasyOCR.
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            
            # Check vehicle classes
            if cls in [2, 3, 5, 7] and conf > 0.4:
                # Estimate license plate area (typically center bottom of vehicle bounding box)
                # Let's crop the bottom 40% of the vehicle box
                vh = y2 - y1
                plate_y1 = int(y1 + vh * 0.6)
                plate_y2 = y2
                plate_x1 = int(x1 + (x2 - x1) * 0.15)
                plate_x2 = int(x2 - (x2 - x1) * 0.15)
                
                vehicle_crop = frame[plate_y1:plate_y2, plate_x1:plate_x2]
                
                # Perform OCR on crop
                if vehicle_crop.size > 0:
                    preprocessed = preprocess_plate_image(vehicle_crop)
                    if preprocessed is not None:
                        ocr_result = ocr_reader.readtext(preprocessed)
                        for (bbox, text, ocr_conf) in ocr_result:
                            cleaned_text = clean_plate_text(text)
                            if cleaned_text and ocr_conf > 0.35:
                                # Save cropped plate image to uploads
                                filename = f"plate_{int(time.time())}_{cleaned_text}.jpg"
                                filepath = os.path.join(settings.UPLOAD_DIR, filename)
                                cv2.imwrite(filepath, vehicle_crop)
                                
                                detections.append({
                                    "plate_text": cleaned_text,
                                    "confidence": ocr_conf,
                                    "box": [plate_x1, plate_y1, plate_x2, plate_y2],
                                    "photo_path": f"/uploads/{filename}"
                                })
                                
                                # Draw green bounding box around vehicle
                                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                                # Draw red bounding box around license plate
                                cv2.rectangle(frame, (plate_x1, plate_y1), (plate_x2, plate_y2), (0, 0, 255), 2)
                                # Draw text label
                                cv2.putText(frame, f"{cleaned_text} ({ocr_conf:.2f})", (plate_x1, plate_y1 - 10),
                                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                                break  # Stop after first valid text in this vehicle box
                                
    return frame, detections
