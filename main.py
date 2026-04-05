# Alternative Solution: Move main.py to Root

# Since Render settings aren't working, let's create a main.py in root
# that imports from the backend folder

import sys
import os

# Add backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Import the FastAPI app from backend
from app.main import app

# This allows uvicorn main:app to work from root directory
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))