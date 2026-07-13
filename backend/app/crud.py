from sqlalchemy.orm import Session
from . import models, schemas
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 1000):
    return db.query(models.User).offset(skip).limit(limit).all()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    if not getattr(user, 'is_active', True):
        return False
    return user

# --- Documents ---
def get_documents(db: Session, skip: int = 0, limit: int = 1000, user_id: int = None):
    query = db.query(models.Document)
    if user_id:
        query = query.filter(models.Document.user_id == user_id)
    return query.offset(skip).limit(limit).all()

def create_document(db: Session, doc: schemas.DocumentCreate):
    db_doc = models.Document(**doc.model_dump())
    
    # Enforce 5-year data retention for aviation compliance
    if not db_doc.retention_until:
        issued = db_doc.issued_at or datetime.utcnow()
        db_doc.retention_until = issued.replace(year=issued.year + 5)
        
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc

def sign_document(db: Session, document_id: int, user_id: int, signature_hash: str):
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not doc:
        return None
    if doc.user_id != user_id:
        raise ValueError("Not authorized to sign this document")
    
    doc.is_signed = True
    doc.signature_hash = signature_hash
    doc.signed_at = datetime.utcnow()
    db.commit()
    db.refresh(doc)
    return doc

# --- Findings ---
def get_findings(db: Session, skip: int = 0, limit: int = 1000):
    return db.query(models.Finding).offset(skip).limit(limit).all()

def create_finding(db: Session, finding: schemas.FindingCreate):
    db_finding = models.Finding(**finding.model_dump())
    db.add(db_finding)
    db.commit()
    db.refresh(db_finding)
    return db_finding

def update_finding(db: Session, finding_id: int, finding: schemas.FindingUpdate):
    db_finding = db.query(models.Finding).filter(models.Finding.id == finding_id).first()
    if db_finding:
        update_data = finding.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_finding, key, value)
        db.commit()
        db.refresh(db_finding)
    return db_finding

# --- Compliance Settings ---
def get_settings(db: Session):
    return db.query(models.ComplianceSetting).all()

def get_setting(db: Session, key: str):
    return db.query(models.ComplianceSetting).filter(models.ComplianceSetting.key == key).first()

def set_setting(db: Session, setting: schemas.ComplianceSettingCreate):
    db_setting = get_setting(db, setting.key)
    if db_setting:
        db_setting.value = setting.value
        if setting.description:
            db_setting.description = setting.description
    else:
        db_setting = models.ComplianceSetting(**setting.model_dump())
        db.add(db_setting)
    db.commit()
    db.refresh(db_setting)
    return db_setting

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = models.User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=hashed_password,
        role=user.role,
        medical_expiry=user.medical_expiry
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_update: schemas.UserBase):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        for key, value in user_update.model_dump().items():
            setattr(db_user, key, value)
        db.commit()
        db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False

def update_password(db: Session, user_id: int, new_password: str):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        hashed_password = pwd_context.hash(new_password)
        db_user.hashed_password = hashed_password
        db.commit()
        db.refresh(db_user)
        return True
    return False

def get_resources(db: Session, skip: int = 0, limit: int = 1000):
    return db.query(models.Resource).offset(skip).limit(limit).all()

def create_resource(db: Session, resource: schemas.ResourceCreate):
    db_resource = models.Resource(**resource.model_dump())
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    return db_resource

def update_resource(db: Session, resource_id: int, res_update: schemas.ResourceBase):
    db_res = db.query(models.Resource).filter(models.Resource.id == resource_id).first()
    if db_res:
        for key, value in res_update.model_dump().items():
            setattr(db_res, key, value)
        db.commit()
        db.refresh(db_res)
    return db_res

def delete_resource(db: Session, resource_id: int):
    db_res = db.query(models.Resource).filter(models.Resource.id == resource_id).first()
    if db_res:
        db.delete(db_res)
        db.commit()
        return True
    return False

def create_booking(db: Session, booking: schemas.BookingCreate):
    # Check for overlapping bookings for the resource
    overlapping = db.query(models.Booking).filter(
        models.Booking.resource_id == booking.resource_id,
        models.Booking.start_time < booking.end_time,
        models.Booking.end_time > booking.start_time
    ).first()
    
    if overlapping:
        raise ValueError("Double booking detected! This resource is already booked during this time.")

    # Legality Checks for Instructor
    if booking.instructor_id:
        instructor = db.query(models.User).filter(models.User.id == booking.instructor_id).first()
        if instructor:
            # Medical Expiry
            if instructor.medical_expiry and instructor.medical_expiry < booking.start_time:
                raise ValueError(f"Instructor {instructor.full_name} has an expired medical certificate.")
            
            # Double Booking (Flights)
            instructor_overlap = db.query(models.Booking).filter(
                models.Booking.instructor_id == booking.instructor_id,
                models.Booking.start_time < booking.end_time,
                models.Booking.end_time > booking.start_time
            ).first()
            if instructor_overlap:
                raise ValueError(f"Instructor {instructor.full_name} is already scheduled for another flight during this time.")

            # Double Booking (Duties)
            duty_overlap = db.query(models.Duty).filter(
                models.Duty.user_id == booking.instructor_id,
                models.Duty.start_time < booking.end_time,
                models.Duty.end_time > booking.start_time
            ).first()
            if duty_overlap:
                raise ValueError(f"Instructor {instructor.full_name} is on duty ({duty_overlap.duty_type}) during this time.")

            # FTL 28-day Check (Approximation using scheduled time)
            twenty_eight_days_ago = booking.start_time - timedelta(days=28)
            recent_bookings = db.query(models.Booking).filter(
                models.Booking.instructor_id == booking.instructor_id,
                models.Booking.start_time >= twenty_eight_days_ago,
                models.Booking.status != "Cancelled"
            ).all()
            
            total_seconds = sum((b.end_time - b.start_time).total_seconds() for b in recent_bookings)
            this_flight_seconds = (booking.end_time - booking.start_time).total_seconds()
            if (total_seconds + this_flight_seconds) / 3600.0 > 100:
                raise ValueError(f"FTL Limit Exceeded: Instructor {instructor.full_name} will exceed 100 hours in 28 days.")

    # Syllabus Sequencing Check
    if booking.student_id and booking.sortie_id and getattr(booking, 'is_extra', False) == False:
        highest_completed_index = get_student_progression(db, booking.student_id)
        sortie = db.query(models.SyllabusSortie).filter(models.SyllabusSortie.id == booking.sortie_id).first()
        if sortie and sortie.order_index > highest_completed_index + 1:
            raise ValueError(f"Student has not completed prerequisite sorties for {sortie.code}.")

    db_booking = models.Booking(**booking.model_dump())
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking

def update_booking(db: Session, booking_id: int, booking_update: schemas.BookingBase):
    # Check for overlapping bookings for the resource (excluding this booking)
    overlapping = db.query(models.Booking).filter(
        models.Booking.resource_id == booking_update.resource_id,
        models.Booking.start_time < booking_update.end_time,
        models.Booking.end_time > booking_update.start_time,
        models.Booking.id != booking_id
    ).first()
    
    if overlapping:
        raise ValueError("Double booking detected! This resource is already booked during this time.")

    # Legality Checks for Instructor
    if booking_update.instructor_id:
        instructor = db.query(models.User).filter(models.User.id == booking_update.instructor_id).first()
        if instructor:
            # Medical Expiry
            if instructor.medical_expiry and instructor.medical_expiry < booking_update.start_time:
                raise ValueError(f"Instructor {instructor.full_name} has an expired medical certificate.")
            
            # Double Booking (Flights)
            instructor_overlap = db.query(models.Booking).filter(
                models.Booking.instructor_id == booking_update.instructor_id,
                models.Booking.start_time < booking_update.end_time,
                models.Booking.end_time > booking_update.start_time,
                models.Booking.id != booking_id
            ).first()
            if instructor_overlap:
                raise ValueError(f"Instructor {instructor.full_name} is already scheduled for another flight during this time.")

            # Double Booking (Duties)
            duty_overlap = db.query(models.Duty).filter(
                models.Duty.user_id == booking_update.instructor_id,
                models.Duty.start_time < booking_update.end_time,
                models.Duty.end_time > booking_update.start_time
            ).first()
            if duty_overlap:
                raise ValueError(f"Instructor {instructor.full_name} is on duty ({duty_overlap.duty_type}) during this time.")

    # Syllabus Sequencing Check
    if getattr(booking_update, 'student_id', None) and getattr(booking_update, 'sortie_id', None) and getattr(booking_update, 'is_extra', False) == False:
        highest_completed_index = get_student_progression(db, booking_update.student_id)
        sortie = db.query(models.SyllabusSortie).filter(models.SyllabusSortie.id == booking_update.sortie_id).first()
        if sortie and sortie.order_index > highest_completed_index + 1:
            raise ValueError(f"Student has not completed prerequisite sorties for {sortie.code}.")

    db_booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if db_booking:
        for key, value in booking_update.model_dump().items():
            setattr(db_booking, key, value)
        db.commit()
        db.refresh(db_booking)
    return db_booking

def submit_tech_log(db: Session, booking_id: int, log_data: schemas.TechLogSubmit):
    db_booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not db_booking:
        return None
    
    # Update actual times
    db_booking.actual_start_time = log_data.actual_start_time
    db_booking.actual_end_time = log_data.actual_end_time
    db_booking.actual_hobbs_start = log_data.actual_hobbs_start
    db_booking.actual_hobbs_end = log_data.actual_hobbs_end
    db_booking.actual_tach_start = log_data.actual_tach_start
    db_booking.actual_tach_end = log_data.actual_tach_end
    db_booking.remarks = log_data.remarks
    db_booking.status = models.BookingStatusEnum.COMPLETED

    db.commit()
    db.refresh(db_booking)
    return db_booking

def create_mass_balance(db: Session, mb: schemas.MassAndBalanceCreate):
    resource = db.query(models.Resource).filter(models.Resource.id == mb.resource_id).first()
    if resource and resource.max_takeoff_weight > 0:
        if mb.takeoff_weight > resource.max_takeoff_weight:
            mb.is_valid = False
    db_mb = models.MassAndBalance(**mb.model_dump())
    db.add(db_mb)
    db.commit()
    db.refresh(db_mb)
    return db_mb

def get_latest_mass_balance(db: Session, resource_id: int):
    return db.query(models.MassAndBalance).filter(models.MassAndBalance.resource_id == resource_id).order_by(models.MassAndBalance.created_at.desc()).first()

def sign_mass_balance(db: Session, mb_id: int, signature_hash: str):
    db_mb = db.query(models.MassAndBalance).filter(models.MassAndBalance.id == mb_id).first()
    if db_mb:
        db_mb.signature_hash = signature_hash
        db.commit()
        db.refresh(db_mb)
    return db_mb

# --- Squawks ---

def get_squawks(db: Session, skip: int = 0, limit: int = 1000):
    return db.query(models.Squawk).offset(skip).limit(limit).all()

def create_squawk(db: Session, squawk: schemas.SquawkCreate, reporter_id: int):
    db_squawk = models.Squawk(**squawk.model_dump(), reporter_id=reporter_id)
    db.add(db_squawk)
    
    # Automatically mark resource as Grounded/Maintenance if it's an Aircraft
    resource = db.query(models.Resource).filter(models.Resource.id == squawk.resource_id).first()
    if resource and resource.type == "Aircraft":
        resource.status = "Maintenance"
        
    db.commit()
    db.refresh(db_squawk)
    return db_squawk

def clear_squawk(db: Session, squawk_id: int, user_id: int):
    db_squawk = db.query(models.Squawk).filter(models.Squawk.id == squawk_id).first()
    if not db_squawk:
        return None
    
    db_squawk.status = "Fixed"
    db_squawk.fixed_by_id = user_id
    
    # Check if resource has any other open squawks. If not, mark Active.
    open_squawks = db.query(models.Squawk).filter(models.Squawk.resource_id == db_squawk.resource_id, models.Squawk.status == "Open").count()
    if open_squawks == 0:
        resource = db.query(models.Resource).filter(models.Resource.id == db_squawk.resource_id).first()
        if resource:
            resource.status = "Active"
            
    db.commit()
    db.refresh(db_squawk)
    return db_squawk

def update_squawk(db: Session, squawk_id: int, status: str, user_id: int):
    squawk = db.query(models.Squawk).filter(models.Squawk.id == squawk_id).first()
    if not squawk:
        return None
    squawk.status = status
    if status == "Fixed":
        squawk.fixed_by_id = user_id
        squawk.fixed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(squawk)
    return squawk


def get_bookings(db: Session, skip: int = 0, limit: int = 1000):
    return db.query(models.Booking).offset(skip).limit(limit).all()

# --- Duties ---

def get_duties(db: Session, skip: int = 0, limit: int = 1000):
    return db.query(models.Duty).offset(skip).limit(limit).all()

def create_duty(db: Session, duty: schemas.DutyCreate):
    # Conflict check for duty
    overlap = db.query(models.Duty).filter(
        models.Duty.user_id == duty.user_id,
        models.Duty.start_time < duty.end_time,
        models.Duty.end_time > duty.start_time
    ).first()
    if overlap:
        raise ValueError("User is already assigned a duty during this time.")
        
    flight_overlap = db.query(models.Booking).filter(
        models.Booking.instructor_id == duty.user_id,
        models.Booking.start_time < duty.end_time,
        models.Booking.end_time > duty.start_time
    ).first()
    if flight_overlap:
        raise ValueError("User is already scheduled for a flight during this time.")

    db_duty = models.Duty(**duty.model_dump())
    db.add(db_duty)
    db.commit()
    db.refresh(db_duty)
    return db_duty

def delete_duty(db: Session, duty_id: int):
    db_duty = db.query(models.Duty).filter(models.Duty.id == duty_id).first()
    if db_duty:
        db.delete(db_duty)
        db.commit()
        return True
    return False

from sqlalchemy import func

def get_analytics_summary(db: Session):
    total_bookings = db.query(models.Booking).count()
    completed = db.query(models.Booking).filter(models.Booking.status == models.BookingStatusEnum.COMPLETED).count()
    cancelled = db.query(models.Booking).filter(models.Booking.status == models.BookingStatusEnum.CANCELLED).count()
    scheduled = db.query(models.Booking).filter(models.Booking.status == models.BookingStatusEnum.SCHEDULED).count()
    
    total_flight_hours = db.query(func.sum(models.Booking.pic_time + models.Booking.dual_time)).filter(models.Booking.status == models.BookingStatusEnum.COMPLETED).scalar() or 0.0
    
    # Fleet utilization
    resources = db.query(models.Resource).all()
    fleet_utilization = []
    for r in resources:
        hours = db.query(func.sum(models.Booking.pic_time + models.Booking.dual_time)).filter(models.Booking.resource_id == r.id, models.Booking.status == models.BookingStatusEnum.COMPLETED).scalar() or 0.0
        fleet_utilization.append({"name": r.name, "hours": float(hours)})
        
    active_findings = db.query(models.Finding).filter(models.Finding.status != models.FindingStatusEnum.CLOSED).count()
    expiring_docs = db.query(models.Document).filter(models.Document.expires_at <= datetime.utcnow() + timedelta(days=30)).count()

    return {
        "total_bookings": total_bookings,
        "completed_bookings": completed,
        "cancelled_bookings": cancelled,
        "scheduled_bookings": scheduled,
        "total_flight_hours": float(total_flight_hours),
        "fleet_utilization": fleet_utilization,
        "active_findings": active_findings,
        "expiring_documents": expiring_docs
    }



def get_compliance_warnings_for_user(db: Session, user_id: int):
    warnings = []
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return warnings

    now = datetime.utcnow()
    
    # Pre-fetch all settings
    settings_query = db.query(models.ComplianceSetting).all()
    settings = {s.key: s.value for s in settings_query}

    # Medical Expiry
    if user.medical_expiry:
        warning_days = int(settings.get("medical_warning_days", 30))
        delta = (user.medical_expiry - now).days
        if delta < 0:
            warnings.append("Your medical certificate has expired!")
        elif delta <= warning_days:
            warnings.append(f"Your medical certificate expires in {delta} days.")
    else:
        warnings.append("No medical certificate on file.")

    # Duty Hours Daily
    if "max_duty_hours_daily" in settings or "max_duty_hours_per_day" in settings:
        max_duty_h = float(settings.get("max_duty_hours_daily", settings.get("max_duty_hours_per_day", 14)))
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_duties = db.query(models.Duty).filter(
            models.Duty.user_id == user_id,
            models.Duty.start_time >= today_start,
            models.Duty.end_time <= now + timedelta(days=1)
        ).all()
        total_duty_s = 0
        for d in today_duties:
            if d.duty_type not in [models.DutyTypeEnum.OFF, models.DutyTypeEnum.LEAVE]:
                end_t = min(now, d.end_time) if d.end_time else now
                start_t = max(today_start, d.start_time)
                if end_t > start_t:
                    total_duty_s += (end_t - start_t).total_seconds()
        
        if total_duty_s / 3600.0 > max_duty_h:
            warnings.append(f"Exceeded max daily duty hours ({max_duty_h}h). Current: {round(total_duty_s / 3600.0, 1)}h.")

    # Flight Hours (28 days)
    if "max_flight_hours_28_days" in settings:
        max_28d_h = float(settings.get("max_flight_hours_28_days", 100))
        twenty_eight_days_ago = now - timedelta(days=28)
        recent_bookings = db.query(models.Booking).filter(
            (models.Booking.instructor_id == user_id) | (models.Booking.student_id == user_id),
            models.Booking.start_time >= twenty_eight_days_ago,
            models.Booking.status == models.BookingStatusEnum.COMPLETED
        ).all()
        total_s = sum((b.end_time - b.start_time).total_seconds() for b in recent_bookings)
        if total_s / 3600.0 > max_28d_h:
            warnings.append(f"Exceeded 28-day flight hour limit ({max_28d_h}h). Current: {round(total_s / 3600.0, 1)}h.")

    # Flight Hours (Daily)
    if "max_flight_hours_daily" in settings:
        max_daily_h = float(settings.get("max_flight_hours_daily", 8))
        one_day_ago = now - timedelta(days=1)
        daily_bookings = db.query(models.Booking).filter(
            (models.Booking.instructor_id == user_id) | (models.Booking.student_id == user_id),
            models.Booking.start_time >= one_day_ago,
            models.Booking.status == models.BookingStatusEnum.COMPLETED
        ).all()
        total_daily_s = sum((b.end_time - b.start_time).total_seconds() for b in daily_bookings)
        if total_daily_s / 3600.0 > max_daily_h:
            warnings.append(f"Exceeded 24-hour flight limit ({max_daily_h}h). Current: {round(total_daily_s / 3600.0, 1)}h.")

    return warnings


# --- Syllabus ---
def get_syllabus_sorties(db: Session):
    return db.query(models.SyllabusSortie).order_by(models.SyllabusSortie.order_index.asc()).all()

def create_syllabus_sortie(db: Session, sortie: schemas.SyllabusSortieCreate):
    db_sortie = models.SyllabusSortie(**sortie.model_dump())
    db.add(db_sortie)
    db.commit()
    db.refresh(db_sortie)
    return db_sortie

def update_syllabus_sortie(db: Session, sortie_id: int, sortie_update: schemas.SyllabusSortieBase):
    db_sortie = db.query(models.SyllabusSortie).filter(models.SyllabusSortie.id == sortie_id).first()
    if db_sortie:
        for key, value in sortie_update.model_dump().items():
            setattr(db_sortie, key, value)
        db.commit()
        db.refresh(db_sortie)
    return db_sortie

def delete_syllabus_sortie(db: Session, sortie_id: int):
    db_sortie = db.query(models.SyllabusSortie).filter(models.SyllabusSortie.id == sortie_id).first()
    if db_sortie:
        db.delete(db_sortie)
        db.commit()
        return True
    return False

def get_student_progression(db: Session, student_id: int):
    """
    Returns the highest completed syllabus order_index for a student.
    Returns 0 if no syllabus flights have been completed.
    """
    completed_bookings = db.query(models.Booking).join(models.SyllabusSortie).filter(
        models.Booking.student_id == student_id,
        models.Booking.status == models.BookingStatusEnum.COMPLETED,
        models.Booking.is_extra == False,
        models.Booking.sortie_id != None
    ).all()
    
    if not completed_bookings:
        return 0
        
    highest_index = max((b.sortie.order_index for b in completed_bookings if b.sortie), default=0)
    return highest_index
