#!/usr/bin/env python3
"""
Database migration script to add new columns to existing projects table
"""

import sqlite3
import os

def migrate_database():
    """Add new columns to the projects and documents tables"""
    db_path = "bess_permitting.db"
    
    if not os.path.exists(db_path):
        print("❌ Database file not found. Please run the application first to create it.")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # List of new columns to add to projects table
        projects_new_columns = [
            ("substation_name", "TEXT"),
            ("latitude", "REAL"),
            ("longitude", "REAL"), 
            ("voltage_level", "TEXT"),
            ("capacity_mw", "REAL"),
            ("technology_type", "TEXT"),
            ("grid_connection_type", "TEXT"),
            ("project_developer", "TEXT"),
            ("setup_completed", "BOOLEAN DEFAULT 0")
        ]
        
        # List of new columns to add to documents table
        documents_new_columns = [
            ("origin", "TEXT DEFAULT 'ai_generated'")
        ]
        
        print("🔄 Starting database migration...")
        
        # Migrate projects table
        print("\n📝 Migrating projects table:")
        cursor.execute("PRAGMA table_info(projects)")
        existing_projects_columns = [row[1] for row in cursor.fetchall()]
        print(f"📋 Existing projects columns: {existing_projects_columns}")
        
        for column_name, column_type in projects_new_columns:
            if column_name not in existing_projects_columns:
                try:
                    sql = f"ALTER TABLE projects ADD COLUMN {column_name} {column_type}"
                    cursor.execute(sql)
                    print(f"✅ Added projects.{column_name}")
                except sqlite3.OperationalError as e:
                    if "duplicate column name" in str(e):
                        print(f"⚠️  Column projects.{column_name} already exists")
                    else:
                        print(f"❌ Error adding projects.{column_name}: {e}")
            else:
                print(f"ℹ️  Column projects.{column_name} already exists")
        
        # Migrate documents table
        print("\n📝 Migrating documents table:")
        try:
            cursor.execute("PRAGMA table_info(documents)")
            existing_documents_columns = [row[1] for row in cursor.fetchall()]
            print(f"📋 Existing documents columns: {existing_documents_columns}")
            
            for column_name, column_type in documents_new_columns:
                if column_name not in existing_documents_columns:
                    try:
                        sql = f"ALTER TABLE documents ADD COLUMN {column_name} {column_type}"
                        cursor.execute(sql)
                        print(f"✅ Added documents.{column_name}")
                    except sqlite3.OperationalError as e:
                        if "duplicate column name" in str(e):
                            print(f"⚠️  Column documents.{column_name} already exists")
                        else:
                            print(f"❌ Error adding documents.{column_name}: {e}")
                else:
                    print(f"ℹ️  Column documents.{column_name} already exists")
        except sqlite3.OperationalError as e:
            print(f"⚠️  Documents table not found or error: {e}")
        
        conn.commit()
        print("\n✅ Database migration completed successfully!")
        
        # Verify the schema
        print("\n🔍 Verifying updated schemas:")
        cursor.execute("PRAGMA table_info(projects)")
        updated_projects_columns = [row[1] for row in cursor.fetchall()]
        print(f"📋 Updated projects columns: {updated_projects_columns}")
        
        try:
            cursor.execute("PRAGMA table_info(documents)")
            updated_documents_columns = [row[1] for row in cursor.fetchall()]
            print(f"📋 Updated documents columns: {updated_documents_columns}")
        except:
            print(f"📋 Documents table schema not available")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False
    finally:
        conn.close()
    
    return True

if __name__ == "__main__":
    migrate_database()