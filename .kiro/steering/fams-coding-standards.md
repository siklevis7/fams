---
inclusion: auto
---

# FAMS Coding Standards & Best Practices

## Python Backend Standards

### Code Style
- **PEP 8 compliant** (with line length up to 120 chars)
- **Type hints required** for all function parameters and returns
- **Docstrings**: Use for complex functions and classes
- **Naming**: snake_case for functions/variables, PascalCase for classes

### Import Organization
```python
# Standard library
from datetime import datetime, timedelta, timezone
import os
import sys

# Third-party packages
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

# Local imports
from . import models, schemas, crud
from .database import engine, get_db
```

### Error Handling Pattern
```python
def create_booking(db: Session, booking: schemas.BookingCreate):
    try:
        # Check for conflicts
        overlapping = db.query(models.Booking).filter(
            models.Booking.resource_id == booking.resource_id,
            models.Booking.start_time < booking.end_time,
            models.Booking.end_time > booking.start_time
        ).first()
        
        if overlapping:
            raise ValueError("Double booking detected!")
        
        # Create booking
        db_booking = models.Booking(**booking.model_dump())
        db.add(db_booking)
        db.commit()
        db.refresh(db_booking)
        return db_booking
        
    except ValueError as e:
        db.rollback()
        raise  # Re-raise to be handled by FastAPI
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
```

### Database Operations
- **Always use sessions**: Context managers or dependency injection
- **Commit carefully**: Only after all validations pass
- **Rollback on error**: Prevent partial transactions
- **Refresh after commit**: Get updated values including defaults
- **Use indexes**: On frequently queried columns

### API Endpoint Pattern
```python
@app.post("/api/resource/", response_model=schemas.ResourceResponse)
def create_resource(
    resource: schemas.ResourceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Authorization check
    if current_user.role != models.RoleEnum.ADMINISTRATOR:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # 2. Business logic validation
    try:
        return crud.create_resource(db=db, resource=resource)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

## JavaScript/React Standards

### Component Structure
```javascript
import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import { toast } from 'sonner';

function ComponentName({ token, user }) {
  // 1. State declarations
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 2. Effects
  useEffect(() => {
    fetchData();
  }, []);
  
  // 3. Handler functions
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/endpoint`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch');
      
      const result = await response.json();
      setData(result);
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // 4. Render
  return (
    <div className="container">
      {/* Component JSX */}
    </div>
  );
}

export default ComponentName;
```

### API Call Pattern
```javascript
// Always use API_BASE from config
import { API_BASE } from '../config';

// Standard fetch pattern
const response = await fetch(`${API_BASE}/api/endpoint`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.detail || 'Request failed');
}

const result = await response.json();
```

### Null Safety
```javascript
// Use optional chaining
const name = user?.full_name || 'Unknown';

// Check before mapping
const items = data?.items?.map(item => ...) || [];

// Safe property access
if (booking?.student?.email) {
  // Do something
}
```

## Security Standards

### Authentication
- **Store tokens securely**: localStorage for web, secure storage for mobile
- **Include in every request**: Authorization header
- **Handle expiry**: Logout on 401, redirect to login
- **Never log tokens**: Exclude from error messages

### Input Validation
```python
# Backend - Pydantic validation
class UserCreate(BaseModel):
    email: EmailStr  # Validates email format
    password: str = Field(min_length=8, max_length=128)
    
    @field_validator('password')
    @classmethod
    def password_strength(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Must contain uppercase')
        if not any(c.isdigit() for c in v):
            raise ValueError('Must contain digit')
        return v
```

### Authorization Checks
```python
# Always check user role before sensitive operations
if current_user.role not in [
    models.RoleEnum.ADMINISTRATOR,
    models.RoleEnum.OPERATIONS_OFFICER
]:
    raise HTTPException(status_code=403, detail="Not authorized")
```

## Performance Standards

### Database Queries
```python
# ✅ Good - Single query with join
bookings = db.query(models.Booking)\
    .join(models.User)\
    .filter(models.Booking.status == 'Scheduled')\
    .all()

# ❌ Bad - N+1 queries
bookings = db.query(models.Booking).all()
for booking in bookings:
    user = db.query(models.User).filter(User.id == booking.user_id).first()
```

### Frontend Optimization
```javascript
// Use useMemo for expensive calculations
const totalHours = useMemo(() => {
  return bookings.reduce((sum, b) => sum + b.hours, 0);
}, [bookings]);

// Debounce search inputs
const debouncedSearch = useMemo(
  () => debounce((value) => performSearch(value), 300),
  []
);
```

## Testing Standards

### Backend Tests
```python
def test_create_booking_double_booking():
    """Test that double booking is prevented"""
    db = TestingSessionLocal()
    
    # Create first booking
    booking1 = crud.create_booking(db, booking_data)
    
    # Attempt duplicate booking
    with pytest.raises(ValueError, match="Double booking"):
        crud.create_booking(db, booking_data)
```

### Frontend Tests
- Test user interactions
- Mock API responses
- Test error handling
- Test loading states

## Documentation Standards

### Function Documentation
```python
def get_student_progression(db: Session, student_id: int) -> int:
    """
    Returns the highest completed syllabus order_index for a student.
    
    Args:
        db: Database session
        student_id: ID of the student
        
    Returns:
        Highest completed order_index, or 0 if no completions
        
    Example:
        >>> progression = get_student_progression(db, 123)
        >>> print(f"Student has completed up to sortie {progression}")
    """
    # Implementation
```

### API Documentation
- Use FastAPI's automatic OpenAPI generation
- Add descriptions to Pydantic models
- Document expected error responses
- Include example request/response bodies

## Git Commit Standards

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting)
- **refactor**: Code refactoring
- **test**: Adding tests
- **chore**: Maintenance tasks

### Examples
```
fix(backend): Remove duplicate get_compliance_warnings_for_user function

- Deleted duplicate function definition at line 492
- Kept complete implementation with all checks
- Resolves syntax error causing import failures

Closes #123
```

```
feat(frontend): Add dark mode support to all components

- Implemented theme switcher in sidebar
- Added dark: variants to all TailwindCSS classes
- Persists theme preference in localStorage
```

## Aviation-Specific Standards

### Date/Time Handling
```python
# Always use UTC for aviation times
from datetime import datetime, timezone

# Creating timestamps
now = datetime.now(timezone.utc)

# Database storage
Column(DateTime, default=lambda: datetime.now(timezone.utc))

# Comparing times
if booking.start_time < datetime.now(timezone.utc):
    # Flight is in the past
```

### Flight Time Calculations
```python
# Always use total_seconds() for accurate duration
duration = (end_time - start_time).total_seconds()
hours = duration / 3600.0

# Round to nearest 0.1 hour (6 minutes)
flight_hours = round(hours, 1)
```

### Regulatory Compliance
- **FTL limits**: Always check before booking
- **Medical expiry**: Block expired medicals from flying
- **Duty times**: Track ground and flight duty separately
- **Documentation**: 5-year retention for aviation records

## Code Review Checklist

Before submitting code:
- [ ] No duplicate function definitions
- [ ] All imports are present and correct
- [ ] Type hints on all functions
- [ ] Error handling implemented
- [ ] Database models match CRUD operations
- [ ] Authorization checks in place
- [ ] No hardcoded paths or URLs
- [ ] Frontend uses API_BASE from config
- [ ] Null safety checks in JavaScript
- [ ] Code follows existing patterns
- [ ] Tests pass (if applicable)
- [ ] Documentation updated

---

**Follow these standards for consistent, maintainable FAMS code.**
