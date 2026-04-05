"""
Initialize database tables
Creates all tables defined in models
"""

from app.database import Base, engine
from app.models import User, Candidate, Vote, Nomination, ActivityLog

def init_tables():
    """Create all database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created successfully!")
    print("\nTables created:")
    print("  - users")
    print("  - candidates")
    print("  - votes")
    print("  - nominations")
    print("  - activity_logs")

if __name__ == "__main__":
    try:
        init_tables()
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
