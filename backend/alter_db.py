import sqlite3
import os

db_path = r'C:\Users\FH\Documents\fams\backend\fams_academy.db'
if not os.path.exists(db_path):
    print("DB not found at:", db_path)
else:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    columns = [
        ('actual_start_time', 'DATETIME'),
        ('actual_end_time', 'DATETIME'),
        ('actual_hobbs_start', 'FLOAT'),
        ('actual_hobbs_end', 'FLOAT'),
        ('actual_tach_start', 'FLOAT'),
        ('actual_tach_end', 'FLOAT'),
    ]
    for col, dtype in columns:
        try:
            cur.execute(f"ALTER TABLE bookings ADD COLUMN {col} {dtype}")
            print(f"Added {col}")
        except sqlite3.OperationalError as e:
            print(f"Column {col} might already exist: {e}")
    conn.commit()
    conn.close()
