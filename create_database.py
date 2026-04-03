"""
Database initialization script
Creates the voteon_dev database
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_database():
    """Create the voteon_dev database if it doesn't exist"""
    
    # Connect to PostgreSQL server (default postgres database)
    conn = psycopg2.connect(
        host="localhost",
        user="postgres",
        password="Kevin@123",
        port=5432
    )
    
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    # Check if database exists
    cursor.execute("SELECT 1 FROM pg_database WHERE datname='voteon_dev'")
    exists = cursor.fetchone()
    
    if not exists:
        cursor.execute("CREATE DATABASE voteon_dev")
        print("✅ Database 'voteon_dev' created successfully!")
    else:
        print("ℹ️  Database 'voteon_dev' already exists")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    try:
        create_database()
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        print("\nMake sure PostgreSQL is running and credentials are correct.")
