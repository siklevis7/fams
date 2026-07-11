import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, SQLALCHEMY_DATABASE_URL
from app.models import User, RoleEnum, Resource, ResourceTypeEnum
from passlib.context import CryptContext

db_file = "fams_academy.db"
if os.path.exists(db_file):
    try:
        os.remove(db_file)
    except Exception as e:
        print(f"Could not remove DB: {e}")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Recreate tables to force schema update
Base.metadata.create_all(bind=engine)

db = SessionLocal()

users_to_seed = [
    {"full_name": "Admin Boss", "email": "admin@fams.aero", "role": RoleEnum.ADMINISTRATOR},
    {"full_name": "Ops Manager", "email": "ops@fams.aero", "role": RoleEnum.OPERATIONS_OFFICER},
    {"full_name": "Flight Instructor", "email": "instructor@fams.aero", "role": RoleEnum.INSTRUCTOR},
    {"full_name": "John Student", "email": "student@fams.aero", "role": RoleEnum.STUDENT_PILOT},
    {"full_name": "Checkride Examiner", "email": "examiner@fams.aero", "role": RoleEnum.EXAMINER},
    {"full_name": "Chief Mechanic", "email": "maintenance@fams.aero", "role": RoleEnum.MAINTENANCE_ENGINEER},
    {"full_name": "Finance Desk", "email": "finance@fams.aero", "role": RoleEnum.FINANCE_OFFICER},
]

for u in users_to_seed:
    db_user = User(
        full_name=u["full_name"],
        email=u["email"],
        role=u["role"],
        hashed_password=pwd_context.hash("password123")
    )
    db.add(db_user)

# Seed an aircraft
db.add(Resource(
    name="C172-N12345",
    type=ResourceTypeEnum.AIRCRAFT,
    status="Active",
    basic_empty_weight=1650.0,
    empty_moment=64500.0,
    max_takeoff_weight=2550.0,
    arm_front_seats=37.0,
    arm_rear_seats=73.0,
    arm_baggage_1=95.0,
    arm_fuel=48.0
))

try:
    db.commit()
    print("Seeded successfully!")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
