from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Float
from sqlalchemy.orm import relationship
import enum
from .database import Base
from datetime import datetime

class RoleEnum(str, enum.Enum):
    ADMINISTRATOR = "Administrator"
    OPERATIONS_OFFICER = "Operations Officer"
    INSTRUCTOR = "Instructor"
    STUDENT_PILOT = "Student Pilot"
    EXAMINER = "Examiner"
    MAINTENANCE_ENGINEER = "Maintenance Engineer"
    FINANCE_OFFICER = "Finance Officer"

class ResourceTypeEnum(str, enum.Enum):
    AIRCRAFT = "Aircraft"
    SIMULATOR = "Simulator"
    CLASSROOM = "Classroom"

class BookingStatusEnum(str, enum.Enum):
    SCHEDULED = "Scheduled"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

class DutyTypeEnum(str, enum.Enum):
    STANDBY = "Standby"
    GROUND_TRAINING = "Ground Training"
    LEAVE = "Leave"
    OFF = "Day Off"

class DocumentTypeEnum(str, enum.Enum):
    LICENSE = "License"
    MEDICAL = "Medical"
    CERTIFICATE = "Certificate"
    COMPANY_POLICY = "Company Policy"
    TRAINING_RECORD = "Training Record"

class FindingLevelEnum(str, enum.Enum):
    LEVEL_1 = "Level 1"
    LEVEL_2 = "Level 2"
    OBSERVATION = "Observation"

class FindingStatusEnum(str, enum.Enum):
    OPEN = "Open"
    CAP_SUBMITTED = "CAP Submitted"
    CLOSED = "Closed"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(RoleEnum), default=RoleEnum.STUDENT_PILOT)
    is_active = Column(Boolean, default=True)
    medical_expiry = Column(DateTime, nullable=True)
    phone = Column(String, nullable=True)
    dob = Column(DateTime, nullable=True)
    weight = Column(Float, default=0.0)
    
    # Relationships
    instructor_bookings = relationship("Booking", foreign_keys="Booking.instructor_id", back_populates="instructor")
    student_bookings = relationship("Booking", foreign_keys="Booking.student_id", back_populates="student")
    duties = relationship("Duty", back_populates="user")
    documents = relationship("Document", back_populates="user")
    findings = relationship("Finding", back_populates="assigned_user")

class Resource(Base):
    __tablename__ = "resources"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # e.g., C172-N12345
    type = Column(Enum(ResourceTypeEnum))
    status = Column(String, default="Active") # Active, Maintenance
    
    # Mass & Balance Specs
    basic_empty_weight = Column(Float, default=0.0)
    empty_moment = Column(Float, default=0.0)
    max_takeoff_weight = Column(Float, default=0.0)
    arm_front_seats = Column(Float, default=0.0)
    arm_rear_seats = Column(Float, default=0.0)
    arm_baggage_1 = Column(Float, default=0.0)
    arm_fuel = Column(Float, default=0.0)
    
    bookings = relationship("Booking", back_populates="resource")

class SyllabusSortie(Base):
    __tablename__ = "syllabus_sorties"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True) # e.g. E-1
    name = Column(String) # e.g. FIRST SOLO FLIGHT PHASE
    category = Column(String) # e.g. DUAL, SOLO, SIMULATOR
    required_hours = Column(Float, default=1.0)
    order_index = Column(Integer, index=True) # Enforces progression order

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, ForeignKey("resources.id"))
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Syllabus Tracking
    sortie_id = Column(Integer, ForeignKey("syllabus_sorties.id"), nullable=True)
    is_extra = Column(Boolean, default=False)
    
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(Enum(BookingStatusEnum), default=BookingStatusEnum.SCHEDULED)
    
    # Grading / Dispatch / Logbook
    instructor_notes = Column(String, nullable=True)
    grade = Column(String, nullable=True) # e.g. Pass, Fail, Exceptional
    student_performance = Column(String, nullable=True) # Flight evaluation JSON/Text
    signature_hash = Column(String, nullable=True) # For electronic sign-off
    
    # Tech Log / Actuals
    actual_start_time = Column(DateTime, nullable=True)
    actual_end_time = Column(DateTime, nullable=True)
    actual_hobbs_start = Column(Float, nullable=True)
    actual_hobbs_end = Column(Float, nullable=True)
    actual_tach_start = Column(Float, nullable=True)
    actual_tach_end = Column(Float, nullable=True)
    
    # FAA/EASA Logbook Fields
    takeoffs = Column(Integer, default=0)
    landings = Column(Integer, default=0)
    pic_time = Column(Float, default=0.0)
    dual_time = Column(Float, default=0.0)
    instrument_time = Column(Float, default=0.0)
    night_time = Column(Float, default=0.0)
    cross_country = Column(Float, default=0.0)
    remarks = Column(String, nullable=True)
    
    resource = relationship("Resource", back_populates="bookings")
    instructor = relationship("User", foreign_keys=[instructor_id], back_populates="instructor_bookings")
    student = relationship("User", foreign_keys=[student_id], back_populates="student_bookings")
    sortie = relationship("SyllabusSortie")

class Squawk(Base):
    __tablename__ = "squawks"
    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, ForeignKey('resources.id'), nullable=False)
    reporter_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    description = Column(String, nullable=False)
    reported_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Open") # Open, Fixed
    fixed_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)

    resource = relationship('Resource')
    reporter = relationship('User', foreign_keys=[reporter_id])
    fixed_by = relationship('User', foreign_keys=[fixed_by_id])

class MassAndBalance(Base):
    __tablename__ = "mass_and_balance"
    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, ForeignKey("resources.id"), nullable=False)
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Inputs from Student
    front_seats_weight = Column(Float, default=0.0)
    rear_seats_weight = Column(Float, default=0.0)
    baggage_1_weight = Column(Float, default=0.0)
    fuel_gallons = Column(Float, default=0.0)
    
    # Computed values
    zero_fuel_weight = Column(Float, default=0.0)
    takeoff_weight = Column(Float, default=0.0)
    takeoff_cg = Column(Float, default=0.0)
    is_valid = Column(Boolean, default=False)
    signature_hash = Column(String, nullable=True)

    resource = relationship("Resource")
    instructor = relationship("User", foreign_keys=[instructor_id])
    student = relationship("User", foreign_keys=[student_id])

class Duty(Base):
    __tablename__ = "duties"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    duty_type = Column(Enum(DutyTypeEnum), default=DutyTypeEnum.STANDBY)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    notes = Column(String, nullable=True)
    
    user = relationship("User", back_populates="duties")

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    document_type = Column(Enum(DocumentTypeEnum), default=DocumentTypeEnum.CERTIFICATE)
    issued_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    
    requires_signature = Column(Boolean, default=False)
    is_signed = Column(Boolean, default=False)
    signature_hash = Column(String, nullable=True)
    signed_at = Column(DateTime, nullable=True)
    retention_until = Column(DateTime, nullable=True)
    
    user = relationship("User", back_populates="documents")

class Finding(Base):
    __tablename__ = "findings"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    level = Column(Enum(FindingLevelEnum), default=FindingLevelEnum.OBSERVATION)
    status = Column(Enum(FindingStatusEnum), default=FindingStatusEnum.OPEN)
    date_issued = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    cap_notes = Column(String, nullable=True)
    
    assigned_user = relationship("User", back_populates="findings")

class ComplianceSetting(Base):
    __tablename__ = "compliance_settings"
    key = Column(String, primary_key=True, index=True)
    value = Column(String, nullable=False)
    description = Column(String, nullable=True)
