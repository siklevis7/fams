from app.database import SessionLocal
from app.models import User, RoleEnum
import bcrypt

users_to_seed = [
    {"full_name": "Admin Boss", "email": "admin@kfms.rw", "role": RoleEnum.ADMINISTRATOR},
    {"full_name": "Ops Manager", "email": "ops@kfms.rw", "role": RoleEnum.OPERATIONS_OFFICER},
    {"full_name": "Flight Instructor", "email": "instructor@kfms.rw", "role": RoleEnum.INSTRUCTOR},
    {"full_name": "John Student", "email": "student@kfms.rw", "role": RoleEnum.STUDENT_PILOT},
    {"full_name": "Checkride Examiner", "email": "examiner@kfms.rw", "role": RoleEnum.EXAMINER},
    {"full_name": "Chief Mechanic", "email": "maintenance@kfms.rw", "role": RoleEnum.MAINTENANCE_ENGINEER},
    {"full_name": "Finance Desk", "email": "finance@kfms.rw", "role": RoleEnum.FINANCE_OFFICER},
]

def seed_users():
    db = SessionLocal()
    try:
        for u in users_to_seed:
            salt = bcrypt.gensalt()
            hashed_pw = bcrypt.hashpw("password123".encode('utf-8'), salt).decode('utf-8')
            
            # Find existing user by role or email to update
            db_user = db.query(User).filter(User.role == u["role"]).first()
            if not db_user:
                db_user = db.query(User).filter(User.email == u["email"]).first()
                
            if db_user:
                db_user.full_name = u["full_name"]
                db_user.email = u["email"]
                db_user.hashed_password = hashed_pw
            else:
                db_user = User(
                    full_name=u["full_name"],
                    email=u["email"],
                    role=u["role"],
                    hashed_password=hashed_pw
                )
                db.add(db_user)
        db.commit()
        print("Users seeded/updated successfully!")
    except Exception as e:
        print(f"Error seeding users: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
