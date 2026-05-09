"""Test PostgreSQL database connection"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
print(f"📊 Database URL: {DATABASE_URL}")

try:
    # Create engine
    engine = create_engine(DATABASE_URL)
    
    # Test connection
    with engine.connect() as conn:
        # Get database info
        result = conn.execute(text("SELECT current_database(), current_user, version()"))
        row = result.fetchone()
        
        print("\n✅ Database connection successful!")
        print(f"   Database: {row[0]}")
        print(f"   User: {row[1]}")
        print(f"   Version: {row[2][:50]}...")
        
        # List all tables
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """))
        tables = [row[0] for row in result.fetchall()]
        
        if tables:
            print(f"\n📋 Tables in database ({len(tables)}):")
            for table in tables:
                print(f"   - {table}")
        else:
            print("\n📋 No tables found yet (run the app to create them)")
            
    print("\n✅ All tests passed!")
    
except Exception as e:
    print(f"\n❌ Connection failed: {e}")
    import sys
    sys.exit(1)
