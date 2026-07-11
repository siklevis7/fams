from app.database import engine
from sqlalchemy import text

try:
    with engine.begin() as conn:
        conn.execute(text('ALTER TABLE bookings ADD COLUMN sortie_id INTEGER;'))
        conn.execute(text('ALTER TABLE bookings ADD COLUMN is_extra BOOLEAN DEFAULT FALSE;'))
        print("Migration applied")
except Exception as e:
    print("Migration error (might already exist):", e)
