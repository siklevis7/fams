---
inclusion: auto
---

# KFMS Project Guidelines

## Project Overview
**KFMS (Kigali Flight Management System)** is a full-stack aviation training management application with:
- **Backend**: Python/FastAPI with SQLite database
- **Frontend**: React + Vite + TailwindCSS
- **Mobile**: Flutter/Dart application

## Critical Rules for All Agents

### 1. Project Structure (Location Independent)
This project may be moved to different directories. **NEVER** hardcode absolute paths.

**Current structure:**
```
fams/
├── .kiro/              # Kiro configuration
│   └── steering/       # Project guidelines
├── backend/            # FastAPI backend
│   ├── app/           # Main application
│   │   ├── main.py    # API endpoints
│   │   ├── models.py  # SQLAlchemy models
│   │   ├── schemas.py # Pydantic schemas
│   │   ├── crud.py    # Database operations
│   │   └── database.py # Database configuration
│   ├── seed_*.py      # Database seed files (root of backend/)
│   ├── requirements.txt
│   ├── fams.db        # SQLite database
│   └── venv/          # Python virtual environment
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── config.js  # API configuration
│   │   └── main.jsx
│   ├── package.json
│   └── dist/          # Build output
└── mobile/            # Flutter mobile app
```

### 2. Backend Development Rules

#### Database
- **Database**: SQLite (fams.db or fams_academy.db)
- **ORM**: SQLAlchemy 2.0+
- **Location**: Always in `backend/` directory
- **Migrations**: Use alter_db.py or migrate.py for schema changes
- **Seed Files**: Located in `backend/` root, NOT in `backend/app/`

#### Import Rules
- Seed files (seed_*.py) are in `backend/` root directory
- When importing seed modules from `backend/app/main.py`, add parent dir to sys.path
- Use relative imports within the `app` package: `from . import models, schemas, crud`
- Use absolute imports for external packages

#### Code Standards
- **Never duplicate function definitions** - check for existing implementations
- **Always import required dependencies** - especially timezone, datetime, etc.
- **Use modern JWT exceptions**: `jwt.InvalidTokenError, jwt.DecodeError` (not PyJWTError)
- **Type hints**: Always use type hints for function parameters and returns
- **Error handling**: Wrap database operations in try-except blocks
- **Validation**: Use Pydantic schemas for all API input/output

#### Models Must Match Database
- All columns used in crud.py MUST be defined in models.py
- Check models.py before adding references in crud.py
- Add missing columns (like `fixed_at` in Squawk model)

### 3. Frontend Development Rules

#### Configuration
- **API URL**: Always use `API_BASE` from `src/config.js`
- **Never hardcode** localhost URLs in components
- Environment variable: `VITE_API_URL` (defaults to http://127.0.0.1:8000)

#### Component Standards
- Use React hooks (useState, useEffect)
- Implement proper error handling for API calls
- Use toast notifications (sonner) for user feedback
- Always check for null/undefined before accessing properties
- Use optional chaining: `user?.name` instead of `user.name`

#### Styling
- **TailwindCSS**: Primary styling system
- **Dark mode**: Fully supported with `dark:` prefixes
- **Responsive**: Mobile-first design (md:, lg: breakpoints)
- Keep existing glass morphism effects and gradients

### 4. Authentication & Authorization

#### JWT Implementation
- Token stored in localStorage: `fams_token`
- Include in headers: `Authorization: Bearer ${token}`
- Handle 401 errors by logging out user
- Token expires in 1440 minutes (24 hours)

#### Role-Based Access Control
Roles (from models.RoleEnum):
- `Administrator` - Full system access
- `Operations Officer` - Dispatch, scheduling, compliance
- `Instructor` - Teaching, flight operations, student progress
- `Student Pilot` - Limited access, own flights only
- `Examiner` - Testing, evaluation
- `Maintenance Engineer` - Aircraft maintenance, squawks
- `Finance Officer` - Reports, analytics

**Check user.role before rendering restricted components/routes**

### 5. Testing Before Committing

#### Backend
```bash
cd backend
python -m py_compile app/main.py app/models.py app/crud.py app/schemas.py
```

#### Frontend
```bash
cd frontend
npm run build  # Must succeed without errors
```

### 6. Common Pitfalls to Avoid

❌ **DON'T:**
- Duplicate function definitions (check entire file first)
- Use deprecated JWT exceptions (PyJWTError)
- Hardcode absolute file paths
- Forget to import timezone, datetime utilities
- Add database columns without updating models.py
- Use relative imports for seed files from app/main.py
- Create files with UTF-16 encoding (requirements.txt must be UTF-8)

✅ **DO:**
- Check for existing functions before creating new ones
- Add all required columns to models before using in crud.py
- Use dynamic path resolution for imports
- Import timezone from datetime module
- Test all code changes before declaring complete
- Use proper exception handling everywhere
- Validate all user input with Pydantic schemas

### 7. Database Schema Key Points

#### Core Models
- **User**: Authentication, roles, medical expiry, FTL tracking
- **Resource**: Aircraft, simulators, classrooms with mass & balance data
- **Booking**: Flight scheduling with FTL compliance checks
- **Squawk**: Maintenance issues (includes fixed_at column!)
- **Duty**: Duty roster for FTL compliance
- **SyllabusSortie**: Training progression tracking
- **Document**: E-signature capable documents
- **Finding**: Compliance audit findings
- **MassAndBalance**: Weight & balance calculations

#### Critical Business Logic
- **Double booking prevention**: Checked in crud.create_booking
- **FTL compliance**: 28-day and daily flight hour limits
- **Medical expiry**: Prevents booking if instructor medical expired
- **Syllabus progression**: Students must complete sorties in order
- **Duty conflicts**: Prevents booking if instructor on duty

### 8. File Encoding Standards

- **All Python files**: UTF-8 encoding
- **requirements.txt**: UTF-8, no BOM markers
- **JavaScript/JSX**: UTF-8
- **No UTF-16**: Will cause pip install failures

### 9. When Making Changes

1. **Read before editing**: Always read the file first
2. **Check dependencies**: Verify all imports exist
3. **Test locally**: Compile Python, build frontend
4. **Check cross-references**: Models ↔ CRUD ↔ Schemas ↔ API
5. **Verify no duplicates**: Search for existing functions
6. **Document changes**: Update this file if patterns change

### 10. Emergency Fixes

If the application breaks:
1. Check for duplicate function definitions
2. Verify all imports (especially timezone, datetime)
3. Confirm models.py has all columns used in crud.py
4. Check requirements.txt encoding (must be UTF-8)
5. Verify seed file import paths in main.py

## Questions to Ask Before Making Changes

1. Does this model column exist in models.py?
2. Is this function already defined elsewhere?
3. Are all imports present at the top of the file?
4. Will this work regardless of where the folder is located?
5. Is this following the existing code patterns?
6. Have I tested this change?

## Success Criteria

- ✅ No syntax errors in Python files
- ✅ No duplicate function definitions
- ✅ All imports resolve correctly
- ✅ Database models match CRUD operations
- ✅ Frontend builds without errors
- ✅ API endpoints match frontend expectations
- ✅ Proper error handling everywhere
- ✅ Type safety with Pydantic schemas

---

**Last Updated**: 2026-07-13  
**Maintained by**: KFMS Development Team
