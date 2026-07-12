from app.database import SessionLocal
from app.models import Resource

db = SessionLocal()
resources = db.query(Resource).all()
for r in resources:
    print(r.id, r.name, r.type)
