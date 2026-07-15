import requests
import jwt
from datetime import datetime, timedelta

# generate token manually exactly like main.py
SECRET_KEY = "super-secret-key-change-in-production"
ALGORITHM = "HS256"

expire = datetime.utcnow() + timedelta(minutes=100)
to_encode = {"sub": "admin@kfms.rw", "exp": expire}
token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

url = "http://localhost:8000"
headers = {"Authorization": f"Bearer {token}"}

res = requests.get(f"{url}/api/syllabus/", headers=headers)
print("Syllabus:", res.status_code, res.text[:200])

res = requests.get(f"{url}/api/bookings/", headers=headers)
print("Bookings:", res.status_code, res.text[:200])

res = requests.get(f"{url}/api/users/", headers=headers)
print("Users:", res.status_code, res.text[:200])
