# AI-Based Automatic Number Plate Recognition (ANPR) Smart Gate System

A complete, production-ready Automatic Number Plate Recognition (ANPR) system for vehicle entry and exit management. The system is designed for high-throughput, low-latency video analytics, integrating deep learning models for detection and recognition with a modern React dashboard.

---

## 1. System Workflow & Architecture

```
                                      [ PHYSICAL GATE ENVIRONMENT ]
                                                    │
                                                    ▼
                                           1. Camera / CCTV Feed
                                                    │
                                                    ▼
                                         2. OpenCV Frame Capture
                                                    │
                                                    ▼
                                         3. Image Preprocessing
                                                    │
                                                    ▼
                                        4. YOLOv8 Plate Detection
                                                    │
                                                    ▼
                                       5. License Plate Cropping
                                                    │
                                                    ▼
                                       6. EasyOCR Text Extraction
                                                    │
                                                    ▼
                                         7. Alphanumeric Parsing
                                                    │
                                                    ▼
                                        8. Database Status Check
                                                   / \
                                                  /   \
                                       [Inside]? /     \ [Outside]?
                                                /       \
                                               ▼         ▼
                                         Update Exit     Create Entry
                                           Log Log           Log Log
                                               \         /
                                                \       /
                                                 ▼     ▼
                                        9. Commit Timestamp & Photo
                                                    │
                                                    ▼
                                            10. FastAPI Server
                                            /                \
                                   (WebSockets)            (REST API)
                                        /                        \
                                       ▼                          ▼
                               11. Real-Time Push          12. React Dashboard
```

1. **CCTV / Camera Feed**: Live video frames are grabbed via OpenCV's `cv2.VideoCapture` from a local webcam or an RTSP network stream.
2. **Image Preprocessing**: Frame resolution is normalized. When a candidate vehicle bounding box is found, the sub-image is converted to grayscale, bilateral filtered to reduce noise while maintaining sharp text edges, and adaptively thresholded.
3. **Plate Detection (YOLOv8)**: The frame passes through a YOLOv8 object detection model, which outputs precise bounding box coordinates for vehicles and their plates.
4. **Text Recognition (EasyOCR)**: The cropped license plate region is parsed by EasyOCR (built on PyTorch, utilizing a ResNet backbone and LSTM sequence translation) to extract characters.
5. **Database Verification**: The backend matches the cleaned alphanumeric string against the active database:
   * **If the vehicle is currently logged as `Inside`**: It marks the vehicle as `Exited`, stamps the exit time, and opens the gate.
   * **If the vehicle is not inside**: It registers a new `Entry` log with entry time, date, and stores the cropped plate photo.
6. **Real-Time Dispatch**: The backend logs data to the PostgreSQL database, and immediately pushes a JSON event payload over WebSockets to all connected dashboard web clients.

---

## 2. Technology Stack
* **Frontend**: React.js, Tailwind CSS (Dark/Light themes), Lucide Icons, Chart.js / React-Chartjs-2.
* **Backend**: FastAPI (Python 3.12), SQLAlchemy ORM, Uvicorn ASGI Server, WebSockets.
* **Database**: PostgreSQL (Production) / SQLite (Development auto-fallback).
* **AI & Machine Vision**: OpenCV, Ultralytics (YOLOv8), EasyOCR (PyTorch).
* **Reporting**: ReportLab (PDF compiler), OpenPyXL (Excel builder).

---

## 3. Database Schema

The database consists of two core tables, managed via SQLAlchemy ORM.

### 3.1 `users`
Stores administrator and operator authentication credentials.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `username` | String | Unique, Indexed, Not Null | Account login name |
| `password_hash` | String | Not Null | Hashed password (bcrypt) |
| `role` | String | Not Null (Default: `operator`) | Authorization role (`admin` or `operator`) |
| `created_at` | DateTime | Not Null | Timestamp of account creation |

### 3.2 `vehicles`
Stores entry, exit, status, and OCR audit photo links.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | Primary Key, Auto-increment | Unique log ID |
| `vehicle_number` | String | Indexed, Not Null | Alphanumeric plate string |
| `entry_time` | DateTime | Not Null | Timestamp of gate entry |
| `exit_time` | DateTime | Nullable | Timestamp of gate exit |
| `date` | Date | Indexed, Not Null | Log date |
| `status` | String | Not Null (Default: `Inside`) | Live state (`Inside` or `Exited`) |
| `photo_path` | String | Nullable | Absolute static server path to cropped plate photo |

---

## 4. API Endpoints

### 4.1 Authentication
* `POST /api/auth/login`: Exchange `username` and `password` for a signed JWT access token.

### 4.2 User Administration (Admin Role Required)
* `GET /api/users`: List all system accounts.
* `POST /api/users`: Create a new user account.
* `PUT /api/users/{user_id}`: Modify user credentials or role.
* `DELETE /api/users/{user_id}`: Remove a user (admins cannot self-delete).

### 4.3 Vehicle Database Logs
* `GET /api/vehicles`: Paginated search & filter for entry/exit history. (Filters: `search` plate text, `status`, `start_date`, `end_date`).
* `DELETE /api/vehicles/{vehicle_id}` (Admin Only): Delete specific log entry.

### 4.4 Real-time & Reports
* `GET /api/dashboard/stats`: Fetch high-level KPIs (Active inside, today's entry/exit count, recent logs) for dashboards.
* `GET /api/reports/export`: Export logs as `excel` (.xlsx) or `pdf` (.pdf). Includes date ranges.
* `GET /api/stream/live`: Secure MJPEG live boundary line stream displaying YOLO/OCR bounding box annotations. (Supports JWT query parameter `?token=...`).
* `WS /api/ws/traffic`: Real-time WebSocket connection to push plate detection events.

---

## 5. Development Installation & Setup

Ensure you have **Python 3.12** and **Node.js (LTS)** installed.

### 5.1 Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables (optional). Create a `.env` file inside `backend/`:
   ```env
   ANPR_MODE=simulated  # Options: "real" or "simulated"
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_SERVER=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=anpr_db
   CCTV_FEED_SOURCE=0   # Webcam index or RTSP streaming URL
   ```
   *Note: If PostgreSQL is not running or credentials do not connect, the backend automatically falls back to an SQLite database (`anpr.db`) in the root directory for instant out-of-the-box operation.*

5. Run the server (this seeds default admin credentials and mock history on first run):
   ```bash
   python run.py
   ```
   * Default Admin credentials: **`admin` / `admin123`**
   * Default Operator credentials: **`operator` / `operator123`**

---

### 5.2 Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install Node modules:
   ```bash
   npm install
   ```
3. Launch Vite local hot-reloader:
   ```bash
   npm run dev
   ```
4. Access the web panel at: **`http://localhost:5173`**

---

## 6. Production & Scaling Deployment Guidelines

For a Final Year Project presentation, the fallback SQLite and Simulated Mode are perfect. For production deployment, configure the following:

### 6.1 Database Scaling (PostgreSQL)
* **Index Fields**: Ensure the `vehicles.vehicle_number` and `vehicles.date` fields are indexed (handled in our models) to speed up searches on millions of rows.
* **Auto-Purging / Archiving**: Cropped license plate photos can take space over time. Set up a cron task to run a script migrating older photos to an Amazon S3 Cold Storage bucket and keeping only database records.

### 6.2 ML Inference Optimization
* **Hardware Acceleration**: Run the FastAPI backend on an NVIDIA Jetson or a server with a dedicated GPU (e.g. RTX 4060). Configure PyTorch to use CUDA:
  ```python
  yolo_model.to('cuda')
  ocr_reader = easyocr.Reader(['en'], gpu=True)
  ```
* **Model Export**: Convert the YOLOv8 PyTorch model (`.pt`) to **TensorRT** (`.engine`) format for up to a 5x increase in frame processing speeds:
  ```python
  from ultralytics import YOLO
  model = YOLO("yolov8n.pt")
  model.export(format="engine") # Exports to yolov8n.engine
  ```
* **Thread Splitting**: Run OpenCV camera frame captures in a dedicated thread or process separate from the FastAPI event loop, saving frames to a queue. This keeps the API responsive even during heavy inference workloads.

### 6.3 Deployment Stack
* **Containerization**: Use `docker-compose` to run the app, managing the FastAPI service, React static build, and PostgreSQL database inside isolated containers.
* **Production ASGI Hosting**: Run the FastAPI backend behind **Gunicorn** wrapping **Uvicorn** worker processes:
  ```bash
  gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
  ```
* **Nginx Reverse Proxy**: Place Nginx in front of Gunicorn to serve compiled React files directly and proxy `/api` requests to the python server while managing SSL certificates.
