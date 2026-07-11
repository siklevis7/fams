import os
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker
from app.models import Base

# Setup old SQLite engine
SQLITE_URL = "sqlite:///./fams_academy.db"
sqlite_engine = create_engine(SQLITE_URL)
sqlite_Session = sessionmaker(bind=sqlite_engine)

# Setup new Postgres engine
POSTGRES_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres_password@localhost:5432/fams")
pg_engine = create_engine(POSTGRES_URL)
pg_Session = sessionmaker(bind=pg_engine)

def migrate():
    print("Creating tables in PostgreSQL...")
    Base.metadata.create_all(pg_engine)
    
    print("Reading data from SQLite...")
    sqlite_session = sqlite_Session()
    pg_session = pg_Session()
    
    # We must iterate over all tables in topological order (Base.metadata.sorted_tables)
    # to avoid foreign key constraint violations
    with sqlite_engine.connect() as sqlite_conn:
        with pg_engine.connect() as pg_conn:
            for table in Base.metadata.sorted_tables:
                print(f"Migrating table: {table.name}")
                rows = sqlite_conn.execute(table.select()).fetchall()
                if rows:
                    # Insert using standard table insert
                    # Fetchall returns rows, we convert to dict
                    # SQLAlchemy 2.0 requires using mappings() for dict conversion
                    dicts = [row._asdict() if hasattr(row, '_asdict') else dict(row._mapping) for row in rows]
                    pg_conn.execute(table.insert().values(dicts))
                    pg_conn.commit()
                    print(f"  -> Migrated {len(rows)} rows.")
                else:
                    print("  -> No rows to migrate.")
            
            # Need to update sequences for PostgreSQL since we inserted explicit IDs
            print("Updating sequences...")
            for table in Base.metadata.sorted_tables:
                # Check if table has a primary key named 'id'
                if 'id' in table.columns:
                    seq_name = f"{table.name}_id_seq"
                    try:
                        pg_conn.execute(f"SELECT setval('{seq_name}', COALESCE((SELECT MAX(id) FROM {table.name}), 1));")
                        pg_conn.commit()
                    except Exception as e:
                        print(f"  -> Could not update sequence for {table.name}: {e}")
                
    sqlite_session.close()
    pg_session.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
