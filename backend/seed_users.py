from app.database import SessionLocal
from app.models import User, RoleEnum
import bcrypt

users_to_seed = [
    {"full_name": "Admin Boss", "email": "admin@fams.aero", "role": RoleEnum.ADMINISTRATOR},
    {"full_name": "Ops Manager", "email": "ops@fams.aero", "role": RoleEnum.OPERATIONS_OFFICER},
    {"full_name": "Flight Instructor", "email": "instructor@fams.aero", "role": RoleEnum.INSTRUCTOR},
    {"full_name": "John Student", "email": "student@fams.aero", "role": RoleEnum.STUDENT_PILOT},
    {"full_name": "Checkride Examiner", "email": "examiner@fams.aero", "role": RoleEnum.EXAMINER},
    {"full_name": "Chief Mechanic", "email": "maintenance@fams.aero", "role": RoleEnum.MAINTENANCE_ENGINEER},
    {"full_name": "Finance Desk", "email": "finance@fams.aero", "role": RoleEnum.FINANCE_OFFICER},
]

def seed_users():
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            for u in users_to_seed:
                salt = bcrypt.gensalt()
                hashed_pw = bcrypt.hashpw("password123".encode('utf-8'), salt).decode('utf-8')
                db_user = User(
                    full_name=u["full_name"],
                    email=u["email"],
                    role=u["role"],
                    hashed_password=hashed_pw
                )
                db.add(db_user)
            db.commit()
            print("Users seeded successfully!")
        else:
            print("Users already seeded.")
    except Exception as e:
        print(f"Error seeding users: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
