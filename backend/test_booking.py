from app.database import SessionLocal
from app.models import Booking
from app.schemas import BookingCreate
from app.crud import create_booking
import datetime
db = SessionLocal()
b = BookingCreate(
    resource_id=1,
    instructor_id=3,
    student_id=4,
    start_time=datetime.datetime.utcnow(),
    end_time=datetime.datetime.utcnow() + datetime.timedelta(hours=2),
    is_extra=False
)
try:
    create_booking(db, b)
    print("Booking created successfully")
except Exception as e:
    print("Warning/Error:", e)
