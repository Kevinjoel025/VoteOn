# VoteOn Backend API

AI-Enhanced Community Voting Platform - FastAPI Backend

## 🚀 Quick Start

### Prerequisites
- Python 3.10 or higher
- PostgreSQL 14 or higher
- pip (Python package manager)

### Installation

1. **Create virtual environment**
```bash
python -m venv venv
```

2. **Activate virtual environment**
- Windows: `venv\Scripts\activate`
- Linux/Mac: `source venv/bin/activate`

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables**
```bash
copy .env.example .env
# Edit .env with your configuration
```

5. **Set up PostgreSQL database**
```bash
# Create database
createdb voteon_dev

# Or using psql
psql -U postgres
CREATE DATABASE voteon_dev;
```

6. **Run database migrations**
```bash
alembic upgrade head
```

7. **Start the development server**
```bash
uvicorn app.main:app --reload
```

The API will be available at: http://localhost:8000

API Documentation: http://localhost:8000/api/docs

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Environment configuration
│   ├── database.py          # Database setup
│   ├── models/              # SQLAlchemy models
│   ├── routers/             # API endpoints
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Business logic
│   ├── utils/               # Helper functions
│   └── middleware/          # Custom middleware
├── tests/                   # Test files
├── alembic/                 # Database migrations
├── requirements.txt         # Python dependencies
├── .env                     # Environment variables (not in git)
└── README.md
```

## 🔑 Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key (generate secure random string)
- `GOOGLE_CLIENT_ID`: Google OAuth credentials
- `GOOGLE_CLIENT_SECRET`: Google OAuth credentials

## 🧪 Testing

```bash
pytest
```

## 📚 API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## 🔒 Security

- All passwords are hashed using bcrypt
- JWT tokens with 15-minute expiry
- Rate limiting enabled
- CORS configured for frontend domain only
- Input validation with Pydantic

## 🚀 Deployment

See main project README for deployment instructions to Render.

## 📝 License

Private project - All rights reserved
