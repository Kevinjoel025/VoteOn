"""
Seed Database with Sample Data
Creates sample candidates for testing
"""

from app.database import SessionLocal
from app.models import Candidate
from app.models.user import User, UserRole
from app.utils.security import hash_password

def seed_database():
    """Add sample candidates and admin user"""
    db = SessionLocal()
    
    try:
        # Create admin user
        admin = db.query(User).filter(User.email == "Kevin@admin.com").first()
        if not admin:
            admin = User(
                username="admin",
                email="Kevin@admin.com",
                password_hash=hash_password("admin123"),
                role=UserRole.ADMIN,
                is_active=True,
                has_voted=False
            )
            db.add(admin)
            print("✅ Admin user created (email: Kevin@admin.com, password: admin123)")
        else:
            print("ℹ️  Admin user already exists")
        
        # Check if candidates exist
        existing_candidates = db.query(Candidate).count()
        if existing_candidates > 0:
            print(f"ℹ️  {existing_candidates} candidates already exist")
            db.close()
            return
        
        # Create sample candidates
        candidates = [
            {
                "name": "Sarah Johnson",
                "position": "Community President",
                "bio": "Experienced leader with 10 years in community development",
                "manifesto": "I pledge to improve infrastructure, enhance education, and create job opportunities for all community members.",
                "photo_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
                "approved": True
            },
            {
                "name": "Marcus Chen",
                "position": "Community President",
                "bio": "Tech entrepreneur focused on digital transformation",
                "manifesto": "Bringing innovation and technology to modernize our community services and governance.",
                "photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
                "approved": True
            },
            {
                "name": "Amara Osei",
                "position": "Community President",
                "bio": "Social worker dedicated to community welfare",
                "manifesto": "Prioritizing healthcare, social programs, and support for vulnerable populations.",
                "photo_url": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400",
                "approved": True
            },
            {
                "name": "Elena Vasquez",
                "position": "Community President",
                "bio": "Environmental advocate and sustainability expert",
                "manifesto": "Building a sustainable, green community for future generations.",
                "photo_url": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400",
                "approved": True
            }
        ]
        
        for candidate_data in candidates:
            candidate = Candidate(**candidate_data)
            db.add(candidate)
        
        db.commit()
        print(f"\n✅ Successfully created {len(candidates)} sample candidates!")
        print("\nCandidates:")
        for i, c in enumerate(candidates, 1):
            print(f"  {i}. {c['name']} - {c['position']}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Seeding database with sample data...\n")
    seed_database()
    print("\n🎯 Database ready for testing!")
