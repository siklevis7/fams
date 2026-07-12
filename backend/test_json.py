from app.database import SessionLocal
from app.models import Resource
from app.schemas import ResourceResponse
from pydantic.json import pydantic_encoder
import json

db = SessionLocal()
resources = db.query(Resource).all()
res = [ResourceResponse.model_validate(r) for r in resources]
print(json.dumps([r.model_dump() for r in res], default=pydantic_encoder)[:500])
