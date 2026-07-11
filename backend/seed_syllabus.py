from app.database import SessionLocal
from app import models

syllabus_data = [
    {"code": "E-1", "name": "FIRST SOLO FLIGHT PHASE", "category": "DUAL", "required_hours": 1.0, "order_index": 1},
    {"code": "E-2", "name": "FIRST SOLO FLIGHT PHASE", "category": "DUAL", "required_hours": 1.0, "order_index": 2},
    {"code": "E-3", "name": "FIRST SOLO FLIGHT PHASE", "category": "DUAL", "required_hours": 1.0, "order_index": 3},
    {"code": "E-4", "name": "FIRST SOLO FLIGHT PHASE", "category": "DUAL", "required_hours": 1.0, "order_index": 4},
    {"code": "E-5", "name": "FIRST SOLO FLIGHT PHASE", "category": "DUAL", "required_hours": 1.0, "order_index": 5},
    {"code": "E-6", "name": "FIRST SOLO FLIGHT PHASE", "category": "DUAL", "required_hours": 1.0, "order_index": 6},
    {"code": "E-7A", "name": "FIRST SOLO FLIGHT PHASE", "category": "DUAL", "required_hours": 1.0, "order_index": 7},
    {"code": "E-7B", "name": "FIRST SOLO FLIGHT PHASE", "category": "DUAL", "required_hours": 1.0, "order_index": 8},
    {"code": "E-8", "name": "FIRST SOLO FLIGHT PHASE", "category": "DUAL", "required_hours": 1.0, "order_index": 9},
    {"code": "E-9", "name": "FIRST SOLO FLIGHT PHASE", "category": "DUAL", "required_hours": 1.0, "order_index": 10},
    {"code": "E-10", "name": "FIRST SOLO FLIGHT PHASE", "category": "DUAL", "required_hours": 1.0, "order_index": 11},
    {"code": "E-11", "name": "FIRST SOLO FLIGHT PHASE", "category": "DUAL", "required_hours": 1.0, "order_index": 12},
    {"code": "E-12", "name": "FIRST SOLO FLIGHT PHASE", "category": "DUAL", "required_hours": 1.0, "order_index": 13},
    {"code": "E-13", "name": "FIRST SOLO CHECK FLIGHT", "category": "DUAL", "required_hours": 1.0, "order_index": 14},
    {"code": "E-14", "name": "FIRST SOLO FLIGHT", "category": "SOLO", "required_hours": 0.33, "order_index": 15},
    {"code": "E-15A", "name": "AIR EXERCISE PHASE", "category": "DUAL", "required_hours": 1.0, "order_index": 16},
    {"code": "E-15B", "name": "AIR EXERCISE PHASE", "category": "SOLO", "required_hours": 0.66, "order_index": 17},
    {"code": "E-15C", "name": "AIR EXERCISE PHASE", "category": "DUAL", "required_hours": 1.0, "order_index": 18},
    {"code": "E-15D", "name": "AIR EXERCISE PHASE", "category": "SOLO", "required_hours": 1.0, "order_index": 19},
    {"code": "E-16A", "name": "AIR EXERCISE PHASE", "category": "DUAL", "required_hours": 1.0, "order_index": 20},
    {"code": "E-16B", "name": "AIR EXERCISE PHASE", "category": "SOLO", "required_hours": 1.0, "order_index": 21},
    {"code": "E-16C", "name": "AIR EXERCISE PHASE", "category": "DUAL", "required_hours": 1.0, "order_index": 22},
    {"code": "E-16D", "name": "AIR EXERCISE PHASE", "category": "SOLO", "required_hours": 1.0, "order_index": 23},
    {"code": "E-17A", "name": "AIR EXERCISE PHASE", "category": "DUAL", "required_hours": 1.0, "order_index": 24},
    {"code": "E-17B", "name": "AIR EXERCISE PHASE", "category": "SOLO", "required_hours": 1.0, "order_index": 25},
    {"code": "E-17C", "name": "AIR EXERCISE PHASE CHECK", "category": "DUAL", "required_hours": 1.0, "order_index": 26},
    {"code": "E-18A", "name": "BASIC INSTRUMENT PHASE", "category": "SIMULATOR", "required_hours": 1.0, "order_index": 27},
    {"code": "E-18B", "name": "BASIC INSTRUMENT PHASE", "category": "SIMULATOR", "required_hours": 2.0, "order_index": 28},
    {"code": "E-18C", "name": "BASIC INSTRUMENT PHASE", "category": "SIMULATOR", "required_hours": 2.0, "order_index": 29},
    {"code": "E-19A", "name": "NAVIGATION PHASE", "category": "DUAL", "required_hours": 1.5, "order_index": 30},
    {"code": "E-19B", "name": "NAVIGATION PHASE", "category": "DUAL", "required_hours": 1.5, "order_index": 31},
    {"code": "E-19C-1", "name": "NAVIGATION PHASE", "category": "DUAL", "required_hours": 1.5, "order_index": 32},
    {"code": "E-19C-2", "name": "NAVIGATION PHASE", "category": "DUAL", "required_hours": 1.5, "order_index": 33},
    {"code": "E-19D", "name": "NAVIGATION PHASE CHECK", "category": "DUAL", "required_hours": 1.5, "order_index": 34},
    {"code": "E-19E", "name": "NAVIGATION PHASE", "category": "SOLO", "required_hours": 0.75, "order_index": 35},
    {"code": "E-19F", "name": "NAVIGATION PHASE", "category": "SOLO", "required_hours": 1.5, "order_index": 36},
    {"code": "E-19G", "name": "NAVIGATION PHASE", "category": "SOLO", "required_hours": 1.75, "order_index": 37},
    {"code": "E-19H", "name": "NAVIGATION PHASE", "category": "SOLO", "required_hours": 1.5, "order_index": 38},
    {"code": "E-20", "name": "SKILL TEST PREPARATION FLIGHT", "category": "DUAL", "required_hours": 2.0, "order_index": 39},
    {"code": "SKILL TEST", "name": "PPL (A) SKILL TEST", "category": "DUAL", "required_hours": 1.5, "order_index": 40},
]

def seed_syllabus():
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(models.SyllabusSortie).count() == 0:
            for item in syllabus_data:
                db_sortie = models.SyllabusSortie(**item)
                db.add(db_sortie)
            db.commit()
            print("Syllabus seeded successfully!")
        else:
            print("Syllabus already seeded.")
    except Exception as e:
        print(f"Error seeding syllabus: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_syllabus()
