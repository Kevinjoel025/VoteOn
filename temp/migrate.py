"""
Database Migration Script
Handles database schema changes and data migrations
"""

import logging
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text
from app.config import settings
from app.database import Base
from app.models import *  # Import all models

logger = logging.getLogger(__name__)

def run_migrations():
    """Run database migrations to latest version"""
    try:
        # Configure Alembic
        alembic_cfg = Config("alembic.ini")
        alembic_cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
        
        # Run migrations
        command.upgrade(alembic_cfg, "head")
        logger.info("✅ Database migrations completed successfully")
        
    except Exception as e:
        logger.error(f"❌ Database migration failed: {str(e)}")
        raise


def create_migration(message: str):
    """Create a new migration file"""
    try:
        alembic_cfg = Config("alembic.ini")
        alembic_cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
        
        command.revision(alembic_cfg, message=message, autogenerate=True)
        logger.info(f"✅ Migration created: {message}")
        
    except Exception as e:
        logger.error(f"❌ Migration creation failed: {str(e)}")
        raise


def check_database_connection():
    """Check if database is accessible"""
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("✅ Database connection successful")
        return True
        
    except Exception as e:
        logger.error(f"❌ Database connection failed: {str(e)}")
        return False


def reset_database():
    """Reset database (drop all tables and recreate)"""
    try:
        engine = create_engine(settings.DATABASE_URL)
        
        # Drop all tables
        Base.metadata.drop_all(bind=engine)
        logger.info("🗑️ All tables dropped")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("✅ All tables created")
        
    except Exception as e:
        logger.error(f"❌ Database reset failed: {str(e)}")
        raise


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python migrate.py [command]")
        print("Commands:")
        print("  upgrade     - Run migrations to latest version")
        print("  create      - Create new migration (requires message)")
        print("  check       - Check database connection")
        print("  reset       - Reset database (WARNING: destroys all data)")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "upgrade":
        run_migrations()
    elif command == "create":
        if len(sys.argv) < 3:
            print("Error: Migration message required")
            print("Usage: python migrate.py create 'Your migration message'")
            sys.exit(1)
        message = sys.argv[2]
        create_migration(message)
    elif command == "check":
        check_database_connection()
    elif command == "reset":
        confirm = input("WARNING: This will destroy all data. Type 'yes' to continue: ")
        if confirm.lower() == "yes":
            reset_database()
        else:
            print("Reset cancelled")
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)