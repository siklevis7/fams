from app.database import SessionLocal
from app.models import User

db = SessionLocal()
users = db.query(User).all()
for u in users:
    print(f"User: {u.email}, Active: {getattr(u, 'is_active', None)}")
db.close()
