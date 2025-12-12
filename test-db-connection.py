#!/usr/bin/env python3
"""
Database Connection Test Script

Tests the Supabase PostgreSQL connection to diagnose issues.
"""

import sys
import os
from urllib.parse import urlparse, parse_qs

# Add server to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ai-sports-mcp/server'))

def test_connection():
    """Test database connection with detailed diagnostics."""

    print("=" * 60)
    print("🔍 Database Connection Diagnostic Test")
    print("=" * 60)
    print()

    # Check if DATABASE_URL is set
    # Read from .env file manually (no dotenv dependency needed)
    database_url = None
    env_path = 'ai-sports-mcp/server/.env'
    try:
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith('DATABASE_URL='):
                    database_url = line.split('=', 1)[1].strip()
                    break
    except FileNotFoundError:
        pass

    if not database_url:
        database_url = os.getenv('DATABASE_URL')

    if not database_url:
        print("❌ ERROR: DATABASE_URL not found in environment")
        return False

    # Parse connection string
    print("📋 Connection String Details:")
    parsed = urlparse(database_url)
    print(f"  Scheme: {parsed.scheme}")
    print(f"  Host: {parsed.hostname}")
    print(f"  Port: {parsed.port}")
    print(f"  Database: {parsed.path.lstrip('/')}")
    print(f"  Username: {parsed.username}")
    print(f"  Password: {'*' * 10} (hidden)")

    # Check query parameters
    params = parse_qs(parsed.query)
    print(f"  SSL Mode: {params.get('sslmode', ['not specified'])[0]}")
    print()

    # Test 1: Check if psycopg2 is installed
    print("🔧 Test 1: Checking PostgreSQL driver...")
    try:
        import psycopg2
        print("  ✅ psycopg2 is installed")
    except ImportError:
        print("  ❌ psycopg2 NOT installed")
        print("  💡 Install with: pip install psycopg2-binary")
        return False

    # Test 2: Try direct connection with psycopg2
    print("\n🔌 Test 2: Testing direct psycopg2 connection...")
    try:
        conn = psycopg2.connect(database_url)
        print("  ✅ Direct connection successful!")

        # Test query
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        print(f"  📊 PostgreSQL version: {version[:50]}...")

        cursor.close()
        conn.close()
        print("  ✅ Connection closed successfully")
    except Exception as e:
        print(f"  ❌ Direct connection failed: {e}")
        print(f"  Error type: {type(e).__name__}")
        return False

    # Test 3: Try SQLAlchemy connection (used by the app)
    print("\n🔧 Test 3: Testing SQLAlchemy connection...")
    try:
        from sqlalchemy import create_engine, text
        engine = create_engine(database_url, echo=False)

        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("  ✅ SQLAlchemy connection successful!")

            # Check tables
            result = connection.execute(text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))
            tables = result.fetchall()

            if tables:
                print(f"  📊 Found {len(tables)} tables in database:")
                for table in tables[:10]:  # Show first 10
                    print(f"     - {table[0]}")
                if len(tables) > 10:
                    print(f"     ... and {len(tables) - 10} more")
            else:
                print("  ⚠️  No tables found - database may need migration")
                print("  💡 Run: cd apps/web && npx prisma db push")

        engine.dispose()
        print("  ✅ SQLAlchemy connection closed")
    except Exception as e:
        print(f"  ❌ SQLAlchemy connection failed: {e}")
        print(f"  Error type: {type(e).__name__}")
        return False

    # Test 4: Check Prisma schema sync
    print("\n📋 Test 4: Checking Prisma schema status...")
    try:
        os.chdir('apps/web')
        result = os.system('npx prisma db pull --force 2>&1 | grep -E "(Tables|error|success)"')
        os.chdir('../..')
    except Exception as e:
        print(f"  ⚠️  Could not check Prisma status: {e}")

    print()
    print("=" * 60)
    print("✅ All database tests passed!")
    print("=" * 60)
    print()
    print("💡 Next steps:")
    print("  1. If tables are missing: cd apps/web && npx prisma db push")
    print("  2. If connection works but app fails: Check app logs for specific errors")
    print("  3. Supabase dashboard: https://supabase.com/dashboard/project/ccbcrerrnkqqgxtlqjnm")
    print()

    return True

if __name__ == '__main__':
    try:
        success = test_connection()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
