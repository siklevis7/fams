from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import jwt
from datetime import datetime, timedelta
import urllib.request
import json
import ssl

import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.environ.get("KFMS_JWT_SECRET", "fams-super-secret-key-2026-secure")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

from . import models, schemas, crud
from .database import engine, get_db
from sqlalchemy import text
from .database import engine, get_db, SessionLocal

models.Base.metadata.create_all(bind=engine)

# Safely migrate existing users table
try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR;"))
        conn.execute(text("ALTER TABLE users ADD COLUMN dob DATETIME;"))
        conn.execute(text("ALTER TABLE users ADD COLUMN weight FLOAT DEFAULT 0.0;"))
except Exception as e:
    pass # Columns probably already exist

# Safely add Duty table
try:
    models.Base.metadata.tables['duties'].create(engine)
except Exception as e:
    pass # Table probably already exists

# Safely add Document table
try:
    models.Base.metadata.tables['documents'].create(engine)
except Exception as e:
    pass

# Safely add Finding and ComplianceSetting tables
try:
    models.Base.metadata.tables['findings'].create(engine)
    models.Base.metadata.tables['compliance_settings'].create(engine)
    
    # Seed default compliance settings
    with SessionLocal() as db:
        if not crud.get_setting(db, "medical_warning_days"):
            crud.set_setting(db, schemas.ComplianceSettingCreate(key="medical_warning_days", value="30", description="Days before medical expiry to show a warning"))
            crud.set_setting(db, schemas.ComplianceSettingCreate(key="max_flight_hours_28_days", value="100", description="Maximum flight hours allowed in 28 days"))
            crud.set_setting(db, schemas.ComplianceSettingCreate(key="max_duty_hours_per_day", value="14", description="Maximum duty hours allowed per day"))
        
        # Seed branding settings
        if not crud.get_setting(db, "app_name"):
            crud.set_setting(db, schemas.ComplianceSettingCreate(key="app_name", value="KFMS", description="Application Display Name"))
            crud.set_setting(db, schemas.ComplianceSettingCreate(key="app_logo_url", value="", description="URL for custom branding logo"))
except Exception as e:
    pass



app = FastAPI(title="FAMS.aero API", version="1.0.0")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

ALLOWED_ORIGINS = os.environ.get("KFMS_ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "FAMS API is running"}

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401, detail="Could not validate credentials", headers={"WWW-Authenticate": "Bearer"}
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = crud.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user

# --- Authentication ---
@app.post("/api/token")
@limiter.limit("5/minute")
def login_for_access_token(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# --- Users ---
@app.get("/api/users/", response_model=List[schemas.UserResponse])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_users(db, skip=skip, limit=limit)

@app.get("/api/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.put("/api/users/me", response_model=schemas.UserResponse)
def update_users_me(user_update: schemas.UserProfileUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    updated = crud.update_user(db, current_user.id, user_update)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated

@app.put("/api/users/me/password")
def update_users_password(payload: schemas.PasswordUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not crud.verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    success = crud.update_password(db, current_user.id, payload.new_password)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update password")
    return {"status": "success"}

@app.get("/api/users/me/compliance_warnings")
def get_user_compliance_warnings(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_compliance_warnings_for_user(db, current_user.id)

@app.get("/api/users/{user_id}/compliance_warnings")
def get_user_compliance_warnings_admin(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in [models.RoleEnum.ADMINISTRATOR, models.RoleEnum.OPERATIONS_OFFICER]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud.get_compliance_warnings_for_user(db, user_id)

@app.post("/api/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.RoleEnum.ADMINISTRATOR:
        raise HTTPException(status_code=403, detail="Not authorized")
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.put("/api/users/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, user: schemas.UserBase, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.RoleEnum.ADMINISTRATOR:
        raise HTTPException(status_code=403, detail="Not authorized")
    updated = crud.update_user(db, user_id, user)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.RoleEnum.ADMINISTRATOR:
        raise HTTPException(status_code=403, detail="Not authorized")
    success = crud.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success"}

# --- Resources ---
@app.get("/api/resources/", response_model=List[schemas.ResourceResponse])
def read_resources(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_resources(db, skip=skip, limit=limit)

@app.post("/api/resources/", response_model=schemas.ResourceResponse)
def create_resource(resource: schemas.ResourceCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.RoleEnum.ADMINISTRATOR:
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud.create_resource(db=db, resource=resource)

@app.put("/api/resources/{resource_id}", response_model=schemas.ResourceResponse)
def update_resource(resource_id: int, resource: schemas.ResourceBase, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.RoleEnum.ADMINISTRATOR:
        raise HTTPException(status_code=403, detail="Not authorized")
    updated = crud.update_resource(db, resource_id, resource)
    if not updated:
        raise HTTPException(status_code=404, detail="Resource not found")
    return updated

@app.delete("/api/resources/{resource_id}")
def delete_resource(resource_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.RoleEnum.ADMINISTRATOR:
        raise HTTPException(status_code=403, detail="Not authorized")
    success = crud.delete_resource(db, resource_id)
    if not success:
        raise HTTPException(status_code=404, detail="Resource not found")
    return {"status": "success"}

@app.patch("/api/squawks/{squawk_id}", response_model=schemas.SquawkResponse)
def update_squawk(squawk_id: int, status: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in [models.RoleEnum.MAINTENANCE_ENGINEER, models.RoleEnum.ADMINISTRATOR]:
        raise HTTPException(status_code=403, detail="Not authorized to clear squawks")
    return crud.update_squawk(db, squawk_id, status, current_user.id)

# --- Mass & Balance ---
@app.get("/api/massbalance/{resource_id}", response_model=schemas.MassAndBalanceResponse)
def get_mass_balance(resource_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    mb = crud.get_latest_mass_balance(db, resource_id)
    if not mb:
        raise HTTPException(status_code=404, detail="No Mass & Balance found for this aircraft.")
    return mb

@app.post("/api/massbalance/", response_model=schemas.MassAndBalanceResponse)
def create_mass_balance(mb: schemas.MassAndBalanceCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return crud.create_mass_balance(db, mb)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.patch("/api/massbalance/{mb_id}/signoff")
def sign_mass_balance(mb_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    import hashlib
    raw_sig = f"{current_user.id}-{mb_id}-{datetime.utcnow().isoformat()}"
    signature_hash = hashlib.sha256(raw_sig.encode()).hexdigest()[:16]
    mb = crud.sign_mass_balance(db, mb_id, signature_hash)
    if not mb:
        raise HTTPException(status_code=404, detail="Not found")
    return mb

# --- Bookings ---
@app.get("/api/bookings/", response_model=List[schemas.BookingResponse])
def read_bookings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_bookings(db, skip=skip, limit=limit)

# --- Squawks ---

@app.get("/api/squawks/", response_model=list[schemas.SquawkResponse])
def read_squawks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: schemas.UserResponse = Depends(get_current_user)):
    return crud.get_squawks(db=db, skip=skip, limit=limit)

@app.post("/api/squawks/", response_model=schemas.SquawkResponse)
def create_squawk(squawk: schemas.SquawkCreate, db: Session = Depends(get_db), current_user: schemas.UserResponse = Depends(get_current_user)):
    return crud.create_squawk(db=db, squawk=squawk, reporter_id=current_user.id)

@app.patch("/api/squawks/{squawk_id}/clear", response_model=schemas.SquawkResponse)
def clear_squawk(squawk_id: int, db: Session = Depends(get_db), current_user: schemas.UserResponse = Depends(get_current_user)):
    if current_user.role not in [models.RoleEnum.ADMINISTRATOR, models.RoleEnum.INSTRUCTOR, models.RoleEnum.MAINTENANCE_ENGINEER, models.RoleEnum.OPERATIONS_OFFICER]:
        raise HTTPException(status_code=403, detail="Only admins, instructors, operations or maintenance can clear squawks.")
    
    cleared = crud.clear_squawk(db=db, squawk_id=squawk_id, user_id=current_user.id)
    if not cleared:
        raise HTTPException(status_code=404, detail="Squawk not found")
    return cleared

class SignOffData(BaseModel):
    grade: str
    instructor_notes: str
    signature_hash: str

@app.patch("/api/bookings/{booking_id}/signoff")
def sign_off_booking(booking_id: int, data: SignOffData, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in [models.RoleEnum.INSTRUCTOR, models.RoleEnum.EXAMINER, models.RoleEnum.ADMINISTRATOR]:
        raise HTTPException(status_code=403, detail="Only instructors/examiners can sign off bookings")
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = models.BookingStatusEnum.COMPLETED
    booking.grade = data.grade
    booking.instructor_notes = data.instructor_notes
    booking.signature_hash = data.signature_hash
    db.commit()
    return {"status": "success"}

@app.post("/api/bookings/", response_model=schemas.BookingResponse)
def create_booking(booking: schemas.BookingCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in [models.RoleEnum.ADMINISTRATOR, models.RoleEnum.OPERATIONS_OFFICER, models.RoleEnum.INSTRUCTOR, models.RoleEnum.EXAMINER]:
        raise HTTPException(status_code=403, detail="Not authorized to schedule flights")
    try:
        return crud.create_booking(db=db, booking=booking)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/bookings/{booking_id}", response_model=schemas.BookingResponse)
def update_booking(booking_id: int, booking: schemas.BookingBase, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.RoleEnum.ADMINISTRATOR and current_user.role != models.RoleEnum.OPERATIONS_OFFICER:
        raise HTTPException(status_code=403, detail="Not authorized")
    updated = crud.update_booking(db, booking_id, booking)
    if not updated:
        raise HTTPException(status_code=404, detail="Booking not found")
    return updated

# --- Duties ---
@app.get("/api/duties/", response_model=List[schemas.DutyResponse])
def read_duties(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_duties(db, skip=skip, limit=limit)

@app.post("/api/duties/", response_model=schemas.DutyResponse)
def create_duty(duty: schemas.DutyCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in [models.RoleEnum.ADMINISTRATOR, models.RoleEnum.OPERATIONS_OFFICER]:
        raise HTTPException(status_code=403, detail="Not authorized")
    try:
        return crud.create_duty(db=db, duty=duty)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/duties/{duty_id}")
def delete_duty(duty_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in [models.RoleEnum.ADMINISTRATOR, models.RoleEnum.OPERATIONS_OFFICER]:
        raise HTTPException(status_code=403, detail="Not authorized")
    success = crud.delete_duty(db, duty_id)
    if not success:
        raise HTTPException(status_code=404, detail="Duty not found")
    return {"status": "success"}

# --- Weather ---
@app.get("/api/weather/{icao}")
def get_weather(icao: str, current_user: models.User = Depends(get_current_user)):
    try:
        icao = icao.upper()
        
        import urllib.parse, ssl
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        # Fetch METAR
        metar_url = f"https://aviationweather.gov/api/data/metar?ids={icao}&format=json"
        req_metar = urllib.request.Request(metar_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req_metar, context=ctx) as response:
            metar_data = json.loads(response.read().decode())
            
        # Fetch TAF
        taf_url = f"https://aviationweather.gov/api/data/taf?ids={icao}&format=json"
        req_taf = urllib.request.Request(taf_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req_taf, context=ctx) as response:
            taf_data = json.loads(response.read().decode())
            
        # Fetch Airport Info
        airport_url = f"https://aviationweather.gov/api/data/airport?ids={icao}&format=json"
        req_airport = urllib.request.Request(airport_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req_airport, context=ctx) as response:
            airport_data = json.loads(response.read().decode())

        # Fetch NOTAMs
        notams_data = []
        try:
            notam_payload = urllib.parse.urlencode({'searchType': 0, 'designatorsForLocation': icao}).encode()
            req_notam = urllib.request.Request('https://notams.aim.faa.gov/notamSearch/search', data=notam_payload, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req_notam, context=ctx) as response:
                notams_res = json.loads(response.read().decode())
                if 'notamList' in notams_res:
                    notams_data = notams_res['notamList']
        except Exception as e:
            print(f"NOTAM fetch error: {e}")
            
        return {
            "metar": metar_data[0] if metar_data else None,
            "taf": taf_data[0] if taf_data else None,
            "airport": airport_data[0] if airport_data else None,
            "notams": notams_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Documents ---
@app.get("/api/documents/", response_model=List[schemas.DocumentResponse])
def read_documents(skip: int = 0, limit: int = 100, user_id: int = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # If not admin/ops, can only see own documents
    if current_user.role not in [models.RoleEnum.ADMINISTRATOR, models.RoleEnum.OPERATIONS_OFFICER]:
        user_id = current_user.id
    return crud.get_documents(db, skip=skip, limit=limit, user_id=user_id)

@app.post("/api/documents/", response_model=schemas.DocumentResponse)
def create_document(doc: schemas.DocumentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in [models.RoleEnum.ADMINISTRATOR, models.RoleEnum.OPERATIONS_OFFICER]:
        # User can only create for themselves (or we can restrict completely to Admins)
        if doc.user_id != current_user.id:
             raise HTTPException(status_code=403, detail="Not authorized to add document for another user")
    return crud.create_document(db=db, doc=doc)

class DocumentSignData(BaseModel):
    signature_hash: str

@app.patch("/api/documents/{document_id}/sign", response_model=schemas.DocumentResponse)
def sign_document(document_id: int, data: DocumentSignData, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        doc = crud.sign_document(db, document_id, current_user.id, data.signature_hash)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        return doc
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

# --- Findings ---
@app.get("/api/findings/", response_model=List[schemas.FindingResponse])
def read_findings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_findings(db, skip=skip, limit=limit)

@app.post("/api/findings/", response_model=schemas.FindingResponse)
def create_finding(finding: schemas.FindingCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in [models.RoleEnum.ADMINISTRATOR, models.RoleEnum.OPERATIONS_OFFICER]:
        raise HTTPException(status_code=403, detail="Not authorized to create findings")
    return crud.create_finding(db=db, finding=finding)

@app.patch("/api/findings/{finding_id}", response_model=schemas.FindingResponse)
def update_finding(finding_id: int, finding: schemas.FindingUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in [models.RoleEnum.ADMINISTRATOR, models.RoleEnum.OPERATIONS_OFFICER]:
        raise HTTPException(status_code=403, detail="Not authorized to update findings")
    updated = crud.update_finding(db, finding_id, finding)
    if not updated:
        raise HTTPException(status_code=404, detail="Finding not found")
    return updated

# --- Compliance Settings ---
@app.get("/api/settings/public")
def read_public_settings(db: Session = Depends(get_db)):
    # Returns only safe branding info without auth
    app_name = crud.get_setting(db, "app_name")
    app_logo = crud.get_setting(db, "app_logo_url")
    return {
        "app_name": app_name.value if app_name else "KFMS",
        "app_logo_url": app_logo.value if app_logo else ""
    }

@app.get("/api/settings/", response_model=List[schemas.ComplianceSettingResponse])
def read_settings(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.RoleEnum.ADMINISTRATOR:
        raise HTTPException(status_code=403, detail="Not authorized to view settings")
    return crud.get_settings(db)


@app.post("/api/settings/", response_model=schemas.ComplianceSettingResponse)
def update_setting(setting: schemas.ComplianceSettingCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.RoleEnum.ADMINISTRATOR:
        raise HTTPException(status_code=403, detail="Not authorized to update settings")
    return crud.set_setting(db=db, setting=setting)

# --- Analytics ---
@app.get("/api/reports/analytics")
def get_analytics(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in [models.RoleEnum.ADMINISTRATOR, models.RoleEnum.FINANCE_OFFICER, models.RoleEnum.OPERATIONS_OFFICER]:
        raise HTTPException(status_code=403, detail="Not authorized to view analytics")
    return crud.get_analytics_summary(db)

# --- Syllabus ---
@app.get("/api/syllabus/", response_model=List[schemas.SyllabusSortieResponse])
def read_syllabus(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_syllabus_sorties(db)

@app.post("/api/syllabus/", response_model=schemas.SyllabusSortieResponse)
def create_syllabus_sortie(sortie: schemas.SyllabusSortieCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in [models.RoleEnum.ADMINISTRATOR, models.RoleEnum.OPERATIONS_OFFICER]:
        raise HTTPException(status_code=403, detail="Not authorized to modify syllabus")
    return crud.create_syllabus_sortie(db=db, sortie=sortie)

@app.put("/api/syllabus/{sortie_id}", response_model=schemas.SyllabusSortieResponse)
def update_syllabus_sortie(sortie_id: int, sortie: schemas.SyllabusSortieBase, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in [models.RoleEnum.ADMINISTRATOR, models.RoleEnum.OPERATIONS_OFFICER]:
        raise HTTPException(status_code=403, detail="Not authorized to modify syllabus")
    updated = crud.update_syllabus_sortie(db, sortie_id, sortie)
    if not updated:
        raise HTTPException(status_code=404, detail="Sortie not found")
    return updated

@app.delete("/api/syllabus/{sortie_id}")
def delete_syllabus_sortie(sortie_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in [models.RoleEnum.ADMINISTRATOR, models.RoleEnum.OPERATIONS_OFFICER]:
        raise HTTPException(status_code=403, detail="Not authorized to modify syllabus")
    success = crud.delete_syllabus_sortie(db, sortie_id)
    if not success:
        raise HTTPException(status_code=404, detail="Sortie not found")
    return {"status": "success"}

@app.get("/api/students/{user_id}/progression")
def get_student_progression(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Calculate highest completed sortie order_index
    highest_index = crud.get_student_progression(db, user_id)
    return {"highest_completed_index": highest_index}
