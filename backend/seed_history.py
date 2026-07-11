import os
import random
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

from app.database import Base, SQLALCHEMY_DATABASE_URL
from app.models import (
    User, RoleEnum, Resource, ResourceTypeEnum, Booking, BookingStatusEnum,
    Squawk, Duty, DutyTypeEnum, Document, DocumentTypeEnum, MassAndBalance
)

# Constants
DAYS_OF_HISTORY = 1095  # 3 years
START_DATE = datetime.utcnow() - timedelta(days=DAYS_OF_HISTORY)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
DEFAULT_PASSWORD = pwd_context.hash("password123")

def generate_names(count):
    first_names = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley", "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle", "Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa", "Edward", "Deborah", "Ronald", "Stephanie", "Timothy", "Rebecca", "Jason", "Sharon", "Jeffrey", "Laura", "Ryan", "Cynthia"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"]
    names = set()
    while len(names) < count:
        names.add(f"{random.choice(first_names)} {random.choice(last_names)}")
    return list(names)

def run_seed():
    db_file = "fams_academy.db"
    # Ensure backend closes existing DB connections before running this
    
    engine = create_engine("sqlite:///./fams_academy.db", connect_args={"check_same_thread": False})
    
    print("Dropping old tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating new tables...")
    Base.metadata.create_all(bind=engine)
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    print("Seeding Users...")
    all_names = generate_names(60)
    
    instructors = []
    students = []
    mechanics = []
    ops = []
    examiners = []
    
    # 10 Instructors
    for _ in range(10):
        name = all_names.pop()
        email = f"{name.lower().replace(' ', '.')}@fams.aero"
        u = User(full_name=name, email=email, role=RoleEnum.INSTRUCTOR, hashed_password=DEFAULT_PASSWORD)
        instructors.append(u)
        db.add(u)
        
    # 30 Students
    for _ in range(30):
        name = all_names.pop()
        email = f"{name.lower().replace(' ', '.')}@fams.aero"
        u = User(full_name=name, email=email, role=RoleEnum.STUDENT_PILOT, hashed_password=DEFAULT_PASSWORD)
        students.append(u)
        db.add(u)
        
    # 4 Mechanics
    for _ in range(4):
        name = all_names.pop()
        email = f"{name.lower().replace(' ', '.')}@fams.aero"
        u = User(full_name=name, email=email, role=RoleEnum.MAINTENANCE_ENGINEER, hashed_password=DEFAULT_PASSWORD)
        mechanics.append(u)
        db.add(u)
        
    # 3 Examiners
    for _ in range(3):
        name = all_names.pop()
        email = f"{name.lower().replace(' ', '.')}@fams.aero"
        u = User(full_name=name, email=email, role=RoleEnum.EXAMINER, hashed_password=DEFAULT_PASSWORD)
        examiners.append(u)
        db.add(u)
        
    # 5 Ops / Admin
    for _ in range(5):
        name = all_names.pop()
        email = f"{name.lower().replace(' ', '.')}@fams.aero"
        role = RoleEnum.ADMINISTRATOR if _ == 0 else RoleEnum.OPERATIONS_OFFICER
        u = User(full_name=name, email=email, role=role, hashed_password=DEFAULT_PASSWORD)
        ops.append(u)
        db.add(u)
        
    # Explicit admin for easy login testing
    u_admin = User(full_name="Admin Boss", email="admin@fams.aero", role=RoleEnum.ADMINISTRATOR, hashed_password=DEFAULT_PASSWORD)
    u_student = User(full_name="John Student", email="student@fams.aero", role=RoleEnum.STUDENT_PILOT, hashed_password=DEFAULT_PASSWORD)
    u_instructor = User(full_name="Flight Instructor", email="instructor@fams.aero", role=RoleEnum.INSTRUCTOR, hashed_password=DEFAULT_PASSWORD)
    db.add_all([u_admin, u_student, u_instructor])
    students.append(u_student)
    instructors.append(u_instructor)
    
    db.commit()
    
    print("Seeding Resources...")
    resources = []
    fleet = [
        ("C172-N111AA", ResourceTypeEnum.AIRCRAFT), ("C172-N222BB", ResourceTypeEnum.AIRCRAFT),
        ("C172-N333CC", ResourceTypeEnum.AIRCRAFT), ("C172-N444DD", ResourceTypeEnum.AIRCRAFT),
        ("C172-N555EE", ResourceTypeEnum.AIRCRAFT),
        ("PA28-N666FF", ResourceTypeEnum.AIRCRAFT), ("PA28-N777GG", ResourceTypeEnum.AIRCRAFT),
        ("DA42-N888HH", ResourceTypeEnum.AIRCRAFT),
        ("SIM-REDBIRD-1", ResourceTypeEnum.SIMULATOR), ("SIM-ALSIM-2", ResourceTypeEnum.SIMULATOR)
    ]
    for name, r_type in fleet:
        r = Resource(name=name, type=r_type, status="Active", basic_empty_weight=1650.0, max_takeoff_weight=2550.0)
        resources.append(r)
        db.add(r)
    db.commit()
    
    print("Seeding Documents...")
    for user in instructors + students + examiners + mechanics:
        # Medical
        issue_date = START_DATE + timedelta(days=random.randint(0, DAYS_OF_HISTORY))
        expires_date = issue_date + timedelta(days=365)
        db.add(Document(user_id=user.id, title="Class 1 Medical", document_type=DocumentTypeEnum.MEDICAL, issued_at=issue_date, expires_at=expires_date))
        
        # License
        db.add(Document(user_id=user.id, title="Commercial Pilot License", document_type=DocumentTypeEnum.LICENSE, issued_at=issue_date - timedelta(days=700)))
    db.commit()
    
    print(f"Seeding {DAYS_OF_HISTORY} days of Bookings/Flights (this may take a moment)...")
    remarks_pool = ["Good pattern work", "Struggled with crosswind", "Excellent steep turns", "Needs more right rudder", "Nav log was well prepared", "Solid ILS approach", "Minor radio mistakes", "Perfect touchdown", "Great airmanship"]
    
    for day in range(DAYS_OF_HISTORY):
        current_date = START_DATE + timedelta(days=day)
        num_flights = random.randint(3, 12)
        
        for _ in range(num_flights):
            instructor = random.choice(instructors)
            student = random.choice(students)
            resource = random.choice(resources)
            
            start_hour = random.randint(6, 17)
            duration_hours = random.choice([1.0, 1.5, 2.0, 2.5])
            
            start_time = current_date.replace(hour=start_hour, minute=0, second=0)
            end_time = start_time + timedelta(hours=duration_hours)
            
            # 5% chance flight was cancelled
            if random.random() < 0.05:
                status = BookingStatusEnum.CANCELLED
            else:
                status = BookingStatusEnum.COMPLETED if end_time < datetime.utcnow() else BookingStatusEnum.SCHEDULED
            
            b = Booking(
                resource_id=resource.id,
                instructor_id=instructor.id,
                student_id=student.id,
                start_time=start_time,
                end_time=end_time,
                status=status
            )
            
            if status == BookingStatusEnum.COMPLETED:
                b.takeoffs = random.randint(1, 6)
                b.landings = b.takeoffs
                b.grade = random.choice(["Pass", "Pass", "Pass", "Pass", "Exceptional", "Fail"])
                b.instructor_notes = random.choice(remarks_pool)
                b.dual_time = duration_hours
                if random.random() < 0.2:
                    b.pic_time = duration_hours # Solo flight
                    b.dual_time = 0.0
                    b.instructor_id = None
            
            db.add(b)
            
        # Commit every 30 days to avoid huge transactions
        if day % 30 == 0:
            db.commit()
            
    db.commit()
    
    print("Seeding Maintenance Squawks...")
    for _ in range(150):
        resource = random.choice(resources)
        reporter = random.choice(instructors + students)
        mechanic = random.choice(mechanics)
        
        reported_at = START_DATE + timedelta(days=random.randint(0, DAYS_OF_HISTORY))
        
        # 95% chance it's fixed
        is_fixed = random.random() < 0.95
        
        sq = Squawk(
            resource_id=resource.id,
            reporter_id=reporter.id,
            description=random.choice(["Left main tire worn", "Nav light burnt out", "Radio static on Com 2", "Right brake soft", "Stall warning horn inop", "Oil leak visible on cowling"]),
            reported_at=reported_at,
            status="Fixed" if is_fixed else "Open",
            fixed_by_id=mechanic.id if is_fixed else None
        )
        db.add(sq)
        
    db.commit()
    db.close()
    print("Done! The flight school database is fully populated with 3 years of history.")

if __name__ == "__main__":
    run_seed()
