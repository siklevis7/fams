from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from typing import Optional, List
from .models import RoleEnum, ResourceTypeEnum, BookingStatusEnum, DutyTypeEnum, DocumentTypeEnum, FindingLevelEnum, FindingStatusEnum

class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    role: RoleEnum = RoleEnum.STUDENT_PILOT
    medical_expiry: Optional[datetime] = None
    phone: Optional[str] = None
    dob: Optional[datetime] = None
    weight: float = 0.0

class UserProfileUpdate(BaseModel):
    full_name: str
    phone: Optional[str] = None
    weight: float = 0.0
    dob: Optional[datetime] = None
    medical_expiry: Optional[datetime] = None

class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)
    
    @field_validator('password')
    @classmethod
    def password_strength(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)
    
    @field_validator('new_password')
    @classmethod
    def password_strength(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

class UserResponse(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class ResourceBase(BaseModel):
    name: str
    type: ResourceTypeEnum
    status: str = "Active"
    basic_empty_weight: float = 0.0
    empty_moment: float = 0.0
    max_takeoff_weight: float = 0.0
    arm_front_seats: float = 0.0
    arm_rear_seats: float = 0.0
    arm_baggage_1: float = 0.0
    arm_fuel: float = 0.0

class ResourceCreate(ResourceBase):
    pass

class ResourceResponse(ResourceBase):
    id: int

    class Config:
        from_attributes = True

class SyllabusSortieBase(BaseModel):
    code: str
    name: str
    category: str
    required_hours: float
    order_index: int

class SyllabusSortieCreate(SyllabusSortieBase):
    pass

class SyllabusSortieResponse(SyllabusSortieBase):
    id: int
    
    class Config:
        from_attributes = True

class BookingBase(BaseModel):
    resource_id: int
    instructor_id: Optional[int] = None
    student_id: Optional[int] = None
    start_time: datetime
    end_time: datetime
    sortie_id: Optional[int] = None
    is_extra: bool = False

class BookingCreate(BookingBase):
    pass

class BookingResponse(BookingBase):
    id: int
    status: BookingStatusEnum
    instructor_notes: Optional[str] = None
    grade: Optional[str] = None
    student_performance: Optional[str] = None
    signature_hash: Optional[str] = None
    takeoffs: int = 0
    landings: int = 0
    pic_time: float = 0.0
    dual_time: float = 0.0
    instrument_time: float = 0.0
    night_time: float = 0.0
    cross_country: float = 0.0
    remarks: Optional[str] = None
    
    resource: ResourceResponse
    student: Optional[UserResponse] = None
    instructor: Optional[UserResponse] = None
    sortie: Optional[SyllabusSortieResponse] = None

    class Config:
        from_attributes = True

class SquawkCreate(BaseModel):
    resource_id: int
    description: str

class SquawkResponse(BaseModel):
    id: int
    resource_id: int
    reporter_id: int
    description: str
    reported_at: datetime
    status: str
    fixed_by_id: Optional[int]
    resource: Optional[ResourceResponse]
    reporter: Optional[UserResponse]
    fixed_by: Optional[UserResponse]

    class Config:
        from_attributes = True

class MassAndBalanceBase(BaseModel):
    front_seats_weight: float = 0.0
    rear_seats_weight: float = 0.0
    baggage_1_weight: float = 0.0
    fuel_gallons: float = 0.0

class MassAndBalanceCreate(MassAndBalanceBase):
    resource_id: int
    instructor_id: Optional[int] = None
    student_id: Optional[int] = None
    zero_fuel_weight: float
    takeoff_weight: float
    takeoff_cg: float
    is_valid: bool

class MassAndBalanceResponse(MassAndBalanceBase):
    id: int
    resource_id: int
    instructor_id: Optional[int] = None
    student_id: Optional[int] = None
    created_at: datetime
    zero_fuel_weight: float
    takeoff_weight: float
    takeoff_cg: float
    is_valid: bool
    signature_hash: Optional[str] = None
    
    resource: Optional[ResourceResponse] = None
    instructor: Optional[UserResponse] = None
    student: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class DutyBase(BaseModel):
    user_id: int
    duty_type: DutyTypeEnum
    start_time: datetime
    end_time: datetime
    notes: Optional[str] = None

class DutyCreate(DutyBase):
    pass

class DutyResponse(DutyBase):
    id: int
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class DocumentBase(BaseModel):
    user_id: int
    title: str
    document_type: DocumentTypeEnum
    issued_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    requires_signature: bool = False
    retention_until: Optional[datetime] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: int
    is_signed: bool
    signature_hash: Optional[str] = None
    signed_at: Optional[datetime] = None
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class ComplianceSettingBase(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

class ComplianceSettingCreate(ComplianceSettingBase):
    pass

class ComplianceSettingResponse(ComplianceSettingBase):
    class Config:
        from_attributes = True

class FindingBase(BaseModel):
    title: str
    description: str
    level: FindingLevelEnum = FindingLevelEnum.OBSERVATION
    status: FindingStatusEnum = FindingStatusEnum.OPEN
    date_issued: Optional[datetime] = None
    due_date: Optional[datetime] = None
    assigned_to: Optional[int] = None
    cap_notes: Optional[str] = None

class FindingCreate(FindingBase):
    pass

class FindingUpdate(BaseModel):
    status: Optional[FindingStatusEnum] = None
    cap_notes: Optional[str] = None
    assigned_to: Optional[int] = None

class FindingResponse(FindingBase):
    id: int
    date_issued: datetime
    assigned_user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

