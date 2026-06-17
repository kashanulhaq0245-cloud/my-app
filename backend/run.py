import uvicorn
from app.seed import seed_db

if __name__ == "__main__":
    print("--- Starting Smart Gate ANPR System ---")
    try:
        # Run database seeding
        seed_db()
    except Exception as e:
        print(f"Error seeding database: {e}. Attempting to run anyway...")
        
    print("--- Launching FastAPI Server ---")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
