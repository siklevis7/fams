---
inclusion: auto
---

# FAMS Troubleshooting Guide

## Quick Diagnostic Commands

### Backend Health Check
```bash
cd backend
python -c "from app import models, crud, schemas; print('✓ All imports OK')"
```

### Frontend Build Check
```bash
cd frontend
npm run build
```

### Database Check
```bash
cd backend
python check_db.py
```

## Common Issues & Solutions

### Issue 1: Import Errors in Backend

#### Symptom
```
ModuleNotFoundError: No module named 'seed_users'
ImportError: cannot import name 'timezone' from 'datetime'
```

#### Root Causes
1. Seed files not in correct location (should be in `backend/` root)
2. Missing imports in file headers
3. Incorrect sys.path configuration

#### Solution
```python
# In backend/app/main.py
def run_seeds():
    import sys
    import os
    # Add parent directory to path
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)
    
    import seed_users  # Now this works
```

Ensure imports include timezone:
```python
from datetime import datetime, timedelta, timezone
```

### Issue 2: Database Column Not Found

#### Symptom
```
AttributeError: 'Squawk' object has no attribute 'fixed_at'
sqlalchemy.exc.OperationalError: no such column: squawks.fixed_at
```

#### Root Cause
Column used in `crud.py` but not defined in `models.py`

#### Solution
1. Add column to model:
```python
# In models.py
class Squawk(Base):
    # ... existing columns ...
    fixed_at = Column(DateTime, nullable=True)
```

2. Run migration or alter table:
```python
# Quick fix
with engine.begin() as conn:
    conn.execute(text("ALTER TABLE squawks ADD COLUMN fixed_at DATETIME;"))
```

### Issue 3: Duplicate Function Definition

#### Symptom
```
SyntaxError: duplicate function definition
Function defined at line X but never used
```

#### Root Cause
Copy-paste error or merge conflict created duplicate functions

#### Solution
1. Search entire file for function name
2. Compare both implementations
3. Keep the complete one, delete duplicate
4. Verify no other duplicates exist

### Issue 4: JWT Token Errors

#### Symptom
```
AttributeError: module 'jwt' has no attribute 'PyJWTError'
```

#### Root Cause
Using deprecated JWT exception name

#### Solution
Replace:
```python
# ❌ Old (deprecated)
except jwt.PyJWTError:
    raise credentials_exception

# ✅ New (correct)
except (jwt.InvalidTokenError, jwt.DecodeError):
    raise credentials_exception
```

### Issue 5: UTF-16 Encoding in requirements.txt

#### Symptom
```
pip install fails with encoding errors
BOM markers visible: ��a n n o t a t e d
```

#### Root Cause
File saved with UTF-16 encoding instead of UTF-8

#### Solution
1. Delete requirements.txt
2. Create new file with UTF-8 encoding
3. Ensure no BOM (Byte Order Mark)
4. Reinstall: `pip install -r requirements.txt`

### Issue 6: CORS Errors in Frontend

#### Symptom
```
Access to fetch at 'http://localhost:8000' blocked by CORS policy
```

#### Root Cause
Backend CORS configuration doesn't include frontend URL

#### Solution
```python
# In backend/app/main.py
ALLOWED_ORIGINS = os.environ.get(
    "KFMS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:5174"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue 7: Frontend API Connection Refused

#### Symptom
```
Failed to fetch
net::ERR_CONNECTION_REFUSED
```

#### Root Cause
1. Backend not running
2. Wrong API URL in config

#### Solution
1. Start backend: `cd backend && uvicorn app.main:app --reload`
2. Check frontend config:
```javascript
// frontend/src/config.js
export const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
```

### Issue 8: Database Locked

#### Symptom
```
sqlite3.OperationalError: database is locked
```

#### Root Cause
Multiple processes accessing SQLite simultaneously

#### Solution
1. Close all connections to database
2. Restart backend server
3. Consider connection pooling:
```python
engine = create_engine(
    'sqlite:///fams.db',
    connect_args={"check_same_thread": False, "timeout": 30}
)
```

### Issue 9: 401 Unauthorized After Login

#### Symptom
User logs in successfully but immediately logged out

#### Root Cause
1. Token not being saved to localStorage
2. Token format incorrect
3. Backend JWT secret mismatch

#### Solution
```javascript
// Verify token storage
const handleLogin = (newToken) => {
  console.log('Saving token:', newToken.substring(0, 20) + '...');
  localStorage.setItem('fams_token', newToken);
  setToken(newToken);
};

// Verify token sending
fetch(`${API_BASE}/api/users/me`, {
  headers: {
    'Authorization': `Bearer ${token}`  // Space after Bearer is critical
  }
})
```

### Issue 10: Double Booking Not Prevented

#### Symptom
Same aircraft can be booked twice for overlapping times

#### Root Cause
Missing or incorrect overlap detection logic

#### Solution
```python
# In crud.py
overlapping = db.query(models.Booking).filter(
    models.Booking.resource_id == booking.resource_id,
    models.Booking.start_time < booking.end_time,  # Starts before new booking ends
    models.Booking.end_time > booking.start_time,  # Ends after new booking starts
    models.Booking.status != models.BookingStatusEnum.CANCELLED
).first()

if overlapping:
    raise ValueError("Double booking detected!")
```

### Issue 11: FTL Compliance Not Working

#### Symptom
Instructors can be scheduled beyond 100 hours in 28 days

#### Root Cause
Flight time calculation incorrect or check bypassed

#### Solution
```python
twenty_eight_days_ago = booking.start_time - timedelta(days=28)
recent_bookings = db.query(models.Booking).filter(
    models.Booking.instructor_id == booking.instructor_id,
    models.Booking.start_time >= twenty_eight_days_ago,
    models.Booking.status != models.BookingStatusEnum.CANCELLED
).all()

total_seconds = sum((b.end_time - b.start_time).total_seconds() for b in recent_bookings)
this_flight = (booking.end_time - booking.start_time).total_seconds()

if (total_seconds + this_flight) / 3600.0 > 100:
    raise ValueError("FTL Limit Exceeded")
```

### Issue 12: Frontend Build Fails

#### Symptom
```
npm run build fails with syntax errors
Module not found errors
```

#### Root Cause
1. Missing dependencies
2. Incorrect import paths
3. Syntax errors in components

#### Solution
```bash
# Clean install
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

Check imports:
```javascript
// ✅ Correct
import { API_BASE } from '../config';
import Login from './components/Login';

// ❌ Wrong
import { API_BASE } from 'config';  // Missing relative path
```

## Debugging Workflows

### Backend API Issue
1. Check server logs for errors
2. Test endpoint with curl or Postman
3. Verify database state with check_db.py
4. Check CRUD function in isolation
5. Verify model/schema match

### Frontend Component Issue
1. Check browser console for errors
2. Verify API_BASE configuration
3. Check network tab for failed requests
4. Add console.log for state values
5. Test with React DevTools

### Database Issue
1. Check schema with `sqlite3 fams.db ".schema"`
2. Query directly: `sqlite3 fams.db "SELECT * FROM table;"`
3. Check for locked database
4. Verify migrations ran successfully
5. Check seed data loaded

## Performance Issues

### Slow API Response
1. Check for N+1 queries
2. Add indexes to frequently queried columns
3. Use SQL EXPLAIN to analyze queries
4. Consider pagination for large datasets

### Frontend Lag
1. Reduce unnecessary re-renders
2. Use React.memo for expensive components
3. Implement virtual scrolling for long lists
4. Optimize image sizes

## Emergency Recovery

### Database Corrupted
```bash
cd backend
# Backup current database
cp fams.db fams.db.backup

# Recreate from scratch
rm fams.db
python -c "from app.database import engine; from app import models; models.Base.metadata.create_all(engine)"

# Re-seed
python seed_users.py
python seed_aircraft.py
python seed_syllabus.py
```

### Lost Admin Access
```bash
cd backend
python -c "
from app.database import SessionLocal
from app import crud, schemas
from app.models import RoleEnum

db = SessionLocal()
user = crud.create_user(db, schemas.UserCreate(
    full_name='Emergency Admin',
    email='admin@fams.local',
    password='Admin123',
    role=RoleEnum.ADMINISTRATOR
))
print(f'Created admin user: {user.email}')
"
```

## Logs to Check

### Backend Logs
- uvicorn server output
- Python exception tracebacks
- SQL queries (enable echo=True in engine)

### Frontend Logs
- Browser console (F12)
- Network tab for API calls
- React error boundaries

### Database Logs
- SQLite errors in server output
- Query timing information

## Getting Help

When reporting issues, include:
1. **Error message** (full traceback)
2. **Steps to reproduce**
3. **Expected vs actual behavior**
4. **Environment** (OS, Python version, Node version)
5. **Recent changes** made to code
6. **Database state** (relevant table contents)

---

**Keep this guide updated as new issues are discovered and resolved.**
