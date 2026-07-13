# ✈️ FAMS - Flight Academy Management System

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.139+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A comprehensive, modern web application for aviation academies, flight schools, and small operators. FAMS provides a centralized digital ecosystem to manage aircraft fleets, student training progress, crew duty limits, flight scheduling, maintenance tracking, and regulatory compliance documentation.

**Built with modern 2026 design principles** - Clean, professional aviation UI with proper visual hierarchy and status-driven workflows.

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🎯 Key Highlights](#-key-highlights)
- [🏗️ Architecture](#️-architecture)
- [💻 Technology Stack](#-technology-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Configuration](#️-configuration)
- [👥 User Roles](#-user-roles)
- [📚 User Guide](#-user-guide)
- [🔌 API Documentation](#-api-documentation)
- [🗄️ Database Schema](#️-database-schema)
- [🧪 Testing](#-testing)
- [🐛 Troubleshooting](#-troubleshooting)
- [🚢 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

### 🗓️ Dispatch & Scheduling
- **Interactive Calendar**: Day-by-day view of all flight bookings
- **Resource Assignment**: Allocate aircraft, simulators, instructors, and classrooms
- **Conflict Prevention**: Automatic double-booking detection for resources and instructors
- **FTL Compliance**: Real-time flight time limitation checks (28-day and daily limits)
- **Duty Conflicts**: Prevents scheduling instructors when on other duties

### 👨‍✈️ Crew Roster & Duty Management
- **Visual Timeline**: Multi-day roster view for all staff
- **Duty Types**: Standby, Ground Training, Leave, Day Off
- **FTL Tracking**: Monitors maximum duty hours per regulation
- **Medical Expiry Alerts**: Automatic warnings for expiring medical certificates

### 🔧 Maintenance & Tech Log
- **Live Fleet Status**: Real-time aircraft airworthiness status (Active/Maintenance)
- **Squawk Reporting**: Pilots report defects directly from mobile or web
- **Maintenance Actions**: Track rectification, parts, and sign-offs
- **Auto-Grounding**: Aircraft automatically marked as grounded when squawk logged
- **Release to Service**: Maintenance engineers can clear squawks and release aircraft

### ⚖️ Mass & Balance Calculator
- **Real-time Computation**: Instant CG and weight calculations
- **Multi-Aircraft Types**: Supports different aircraft with unique arm/moment data
- **Load Validation**: Red/green status indicators for weight limits
- **Digital Sign-off**: Electronic instructor signatures
- **Print-Ready**: Optimized for A5 kneeboard printing

### 🎓 Student Progress Tracking
- **Syllabus Management**: Define sequential training sorties (E-1, E-2, etc.)
- **Progress Enforcement**: Students must complete sorties in order
- **Grading System**: Instructors log grades, notes, and performance
- **Flight Hours**: Automatic tracking of PIC, dual, night, cross-country time
- **Milestones**: Monitor solos, check rides, and stage completions

### 📄 Documents & Compliance
- **5-Year Retention**: RCAA/FAA compliant document retention
- **E-Signature Support**: Digital signing for documents and mass & balance
- **Expiry Tracking**: Color-coded alerts (green/amber/red)
- **Document Types**: Licenses, medicals, certificates, training records, policies
- **Audit Trail**: Track who uploaded and signed what

### 🌦️ Weather & NOTAMs
- **Live METAR/TAF**: Real-time aviation weather by ICAO code
- **Airport Information**: Automated fetch from aviationweather.gov
- **NOTAM Integration**: FAA NOTAM search (US airports)
- **Multi-Station**: Check multiple airports simultaneously

### 📊 Analytics & Reports
- **Fleet Utilization**: Flight hours per aircraft with visual charts
- **KPI Dashboard**: Total bookings, completed flights, cancellations
- **Compliance Metrics**: Active findings, expiring documents
- **Financial Reports**: Hours by student, aircraft rental utilization

### 🔍 Compliance Audits
- **Finding Management**: Log and track audit findings (Level 1, Level 2, Observations)
- **CAP Tracking**: Corrective Action Plan submission and status
- **Due Date Monitoring**: Automatic alerts for overdue findings
- **Regulatory Settings**: Configurable compliance thresholds

---

## 🎯 Key Highlights

✅ **Aviation-Specific**: Built by pilots for flight training operations  
✅ **Regulatory Compliant**: FTL tracking, document retention, audit trails  
✅ **Double-Booking Prevention**: Automatic conflict detection  
✅ **Mobile-Friendly**: Responsive design works on phones and tablets  
✅ **Dark Mode**: Professional dark theme for night operations  
✅ **Real-Time Updates**: Instant status changes across all users  
✅ **Role-Based Security**: Granular permissions by user role  
✅ **Offline-Ready**: Tech log and mass & balance work offline  

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FAMS System                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐ │
│  │   Frontend   │◄────►│   Backend    │◄────►│   Database   │ │
│  │  React/Vite  │      │   FastAPI    │      │    SQLite    │ │
│  │  Tailwind    │      │   Python     │      │              │ │
│  └──────────────┘      └──────────────┘      └──────────────┘ │
│         │                      │                                │
│         │                      ▼                                │
│         │              ┌──────────────┐                        │
│         └─────────────►│  External    │                        │
│                        │  APIs        │                        │
│                        │  - Weather   │                        │
│                        │  - NOTAMs    │                        │
│                        └──────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

### Communication Flow
1. **Client → API**: React app makes authenticated REST API calls
2. **API → Database**: FastAPI queries SQLite via SQLAlchemy ORM
3. **API → External**: Weather/NOTAM data fetched from aviation APIs
4. **Response**: JSON data returned through API to client

---

## 💻 Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18+ | UI framework |
| **Vite** | 5+ | Build tool & dev server |
| **TailwindCSS** | 3+ | Styling framework |
| **React Router** | 6+ | Client-side routing |
| **Lucide React** | Latest | Icon library |
| **Sonner** | Latest | Toast notifications |
| **date-fns** | Latest | Date manipulation |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.11+ | Programming language |
| **FastAPI** | 0.139+ | Web framework |
| **SQLAlchemy** | 2.0+ | ORM & database toolkit |
| **SQLite** | 3+ | Database |
| **Pydantic** | 2+ | Data validation |
| **PyJWT** | 2+ | JWT authentication |
| **Passlib** | 1.7+ | Password hashing |
| **python-dotenv** | Latest | Environment config |
| **SlowAPI** | Latest | Rate limiting |
| **Uvicorn** | Latest | ASGI server |

### Mobile (Optional)
| Technology | Version | Purpose |
|------------|---------|---------|
| **Flutter** | 3+ | Cross-platform mobile |
| **Dart** | 3+ | Programming language |

---

## 📁 Project Structure

```
fams/
├── .kiro/                          # Kiro AI assistant configuration
│   ├── steering/                   # Project guidelines for AI
│   │   ├── fams-project-guidelines.md
│   │   ├── fams-coding-standards.md
│   │   └── fams-troubleshooting.md
│   └── README.md
├── backend/                        # Python/FastAPI backend
│   ├── app/
│   │   ├── main.py                # FastAPI app & API endpoints
│   │   ├── models.py              # SQLAlchemy database models
│   │   ├── schemas.py             # Pydantic validation schemas
│   │   ├── crud.py                # Database operations
│   │   └── database.py            # Database configuration
│   ├── seed_users.py              # Initial user seeding
│   ├── seed_aircraft.py           # Aircraft data seeding
│   ├── seed_syllabus.py           # Training syllabus seeding
│   ├── requirements.txt           # Python dependencies
│   ├── fams.db                    # SQLite database file
│   └── venv/                      # Python virtual environment
├── frontend/                       # React frontend
│   ├── src/
│   │   ├── components/            # React components
│   │   │   ├── Login.jsx
│   │   │   ├── DispatchCalendar.jsx
│   │   │   ├── Management.jsx
│   │   │   ├── Maintenance.jsx
│   │   │   ├── StudentProgress.jsx
│   │   │   ├── MassBalance.jsx
│   │   │   └── ... (15+ components)
│   │   ├── App.jsx                # Main app component
│   │   ├── main.jsx               # Entry point
│   │   ├── index.css              # Global styles
│   │   └── config.js              # API configuration
│   ├── public/                    # Static assets
│   ├── package.json               # Node dependencies
│   └── vite.config.js             # Vite configuration
├── mobile/                         # Flutter mobile app
│   └── lib/                       # Dart source code
└── README.md                       # This file
```

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.11+** ([Download](https://www.python.org/downloads/))
- **Node.js 18+** ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))

### 1. Clone the Repository

```bash
git clone https://github.com/siklevis7/fams.git
cd fams
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations and seed data
python seed_users.py
python seed_aircraft.py
python seed_syllabus.py

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

Backend will be running at `http://localhost:8000`

### 3. Frontend Setup

Open a **new terminal** (keep backend running):

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Frontend will be running at `http://localhost:5173`

### 4. Access the Application

1. Open your browser to `http://localhost:5173`
2. Login with default credentials:
   - **Email**: `admin@fams.local`
   - **Password**: `Admin123`

### 5. Create Your First Flight

1. Go to **Management** → Add a student user
2. Go to **Management** → Add an aircraft resource
3. Go to **Dispatch Calendar** → Click "+ Schedule Flight"
4. Select aircraft, instructor, student, and time
5. Done! ✅

---

## ⚙️ Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
# JWT Secret Key (change this to a random secure string)
KFMS_JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# CORS Allowed Origins (comma-separated)
KFMS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

# Database URL (optional, defaults to sqlite:///./fams.db)
DATABASE_URL=sqlite:///./fams.db
```

### Frontend Environment Variables

Create `frontend/.env`:

```env
# Backend API URL
VITE_API_URL=http://127.0.0.1:8000
```

### Customization Options

#### Change App Branding
Login as Administrator → **Reports & Analytics** → **Settings**:
- `app_name`: Change from "KFMS" to your academy name
- `app_logo_url`: URL to your custom logo

#### FTL Compliance Thresholds
Modify in **Settings**:
- `max_flight_hours_28_days`: Default 100 hours
- `max_flight_hours_daily`: Default 8 hours  
- `max_duty_hours_per_day`: Default 14 hours
- `medical_warning_days`: Default 30 days before expiry

---

## 👥 User Roles

FAMS implements **Role-Based Access Control (RBAC)**:

| Role | Permissions |
|------|------------|
| **Administrator** | Full system access, user management, system settings |
| **Operations Officer** | Schedule flights, assign duties, view all reports |
| **Instructor** | Schedule flights, grade students, log squawks, compute mass & balance |
| **Examiner** | Same as Instructor plus sign-off on check rides |
| **Student Pilot** | View own schedule, weather, mass & balance, training progress |
| **Maintenance Engineer** | View/clear squawks, change aircraft status, maintenance logs |
| **Finance Officer** | View financial reports, fleet utilization, billing data |

---

## 📚 User Guide

### For Administrators

#### Adding Users
1. Navigate to **Management** → **Staff & Students**
2. Click **+ Add User**
3. Fill in details (name, email, role, medical expiry)
4. User receives their login credentials

#### Managing Aircraft
1. Navigate to **Management** → **Fleet & Resources**
2. Click **+ Add Resource**
3. Enter aircraft details including mass & balance data
4. Set initial status (Active/Maintenance)

### For Operations Officers

#### Scheduling a Flight
1. Navigate to **Dispatch Calendar**
2. Click **+ Schedule Flight**
3. Select:
   - Aircraft
   - Instructor (optional for solo)
   - Student
   - Start/End times
   - Syllabus sortie (if applicable)
4. System validates:
   - No resource conflicts
   - No instructor double-booking
   - Instructor medical valid
   - FTL limits not exceeded
   - Syllabus prerequisites met

#### Assigning Crew Duty
1. Navigate to **Crew Roster**
2. Click **Assign Duty**
3. Select user, duty type, and time period
4. System prevents conflicts with flights

### For Instructors

#### Pre-Flight Mass & Balance
1. Navigate to **Mass & Balance**
2. Select aircraft
3. Enter:
   - Front/rear seat weights
   - Baggage weight
   - Fuel quantity
4. Review calculated CG and weight
5. Click **Sign Loadsheet** if within limits
6. Optional: **Print A5** for kneeboard

#### Post-Flight Grading
1. Navigate to **Student Progress**
2. Select student
3. Find the flight booking
4. Click **Grade Flight**
5. Enter grade, notes, flight hours
6. Submit

#### Reporting Defects
1. Navigate to **Maintenance**
2. Select aircraft
3. Click **Report Squawk**
4. Describe the issue
5. Aircraft automatically marked as "Maintenance"

### For Students

#### Viewing Schedule
1. Navigate to **Dispatch Calendar**
2. View all your scheduled flights
3. Check instructor assignments

#### Checking Progress
1. Navigate to **Student Progress**
2. View completed sorties
3. See grades and instructor notes
4. Track total flight hours

### For Maintenance Engineers

#### Clearing Squawks
1. Navigate to **Maintenance**
2. View open squawks
3. Click on a squawk
4. Select **Clear Squawk**
5. Describe rectification action
6. If no other squawks, aircraft returns to "Active"

---

## 🔌 API Documentation

### Authentication

#### Login
```http
POST /api/token
Content-Type: application/x-www-form-urlencoded

username=admin@fams.local&password=Admin123
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Key Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/users/me` | Get current user profile | ✅ |
| `GET` | `/api/bookings/` | List all bookings | ✅ |
| `POST` | `/api/bookings/` | Create new booking | ✅ |
| `GET` | `/api/resources/` | List all aircraft/resources | ✅ |
| `POST` | `/api/squawks/` | Report a defect | ✅ |
| `GET` | `/api/weather/{icao}` | Get weather for airport | ✅ |
| `GET` | `/api/syllabus/` | Get training syllabus | ✅ |
| `GET` | `/api/users/{id}/compliance_warnings` | Get compliance alerts | ✅ |

### Full API Documentation

Start the backend and visit: `http://localhost:8000/docs`

FastAPI provides interactive Swagger UI documentation.

---

## 🗄️ Database Schema

### Core Tables

#### Users
- `id`, `full_name`, `email`, `hashed_password`
- `role` (Administrator, Instructor, Student, etc.)
- `medical_expiry`, `phone`, `dob`, `weight`

#### Resources (Aircraft/Simulators)
- `id`, `name`, `type`, `status`
- Mass & balance data: `basic_empty_weight`, `empty_moment`, `max_takeoff_weight`
- Arms: `arm_front_seats`, `arm_rear_seats`, `arm_baggage_1`, `arm_fuel`

#### Bookings (Flights)
- `id`, `resource_id`, `instructor_id`, `student_id`
- `start_time`, `end_time`, `status`, `sortie_id`, `is_extra`
- Grading: `grade`, `instructor_notes`, `signature_hash`
- Tech log: `actual_start_time`, `actual_hobbs_start`, `actual_tach_end`
- Logbook: `pic_time`, `dual_time`, `night_time`, `cross_country`

#### Squawks (Maintenance)
- `id`, `resource_id`, `reporter_id`, `description`
- `status` (Open/Fixed), `reported_at`, `fixed_by_id`, `fixed_at`

#### Duties (Crew Roster)
- `id`, `user_id`, `duty_type`, `start_time`, `end_time`, `notes`

#### Documents
- `id`, `user_id`, `title`, `document_type`
- `issued_at`, `expires_at`, `requires_signature`
- `is_signed`, `signature_hash`, `retention_until`

#### SyllabusSortie (Training)
- `id`, `code` (E-1, E-2...), `name`, `category`
- `required_hours`, `order_index`

#### Findings (Compliance)
- `id`, `title`, `description`, `level`, `status`
- `date_issued`, `due_date`, `assigned_to`, `cap_notes`

### Schema Diagram

```
Users ──┬─► Bookings (as instructor)
        ├─► Bookings (as student)
        ├─► Duties
        ├─► Documents
        └─► Findings (assigned)

Resources ──► Bookings
            └─► Squawks

SyllabusSortie ──► Bookings

Bookings ──► MassAndBalance
```

---

## 🧪 Testing

### Manual Testing

#### Test Flight Booking
```bash
cd backend
python test_booking.py
```

#### Test API Endpoints
```bash
cd backend
python test_endpoints.py
```

### Automated Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm run test
```

### Common Test Scenarios

1. **Double Booking Prevention**: Try to book same aircraft at overlapping times
2. **FTL Limits**: Schedule instructor for >100 hours in 28 days
3. **Medical Expiry**: Try to schedule instructor with expired medical
4. **Syllabus Enforcement**: Book student for E-3 without completing E-2
5. **Mass & Balance**: Enter weights exceeding MTOW

---

## 🐛 Troubleshooting

### Backend Issues

#### "ModuleNotFoundError: No module named 'fastapi'"
```bash
# Ensure virtual environment is activated
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

#### "sqlite3.OperationalError: database is locked"
```bash
# Close all connections to the database
# Restart the backend server
# Consider using PostgreSQL for production
```

#### "ImportError: No module named 'seed_users'"
```bash
# Seed files are in backend root, not backend/app
# Ensure you're running from backend/ directory
cd backend
python seed_users.py
```

### Frontend Issues

#### "Failed to fetch" / CORS errors
```bash
# Check backend is running on port 8000
# Verify VITE_API_URL in frontend/.env
# Check KFMS_ALLOWED_ORIGINS in backend/.env includes http://localhost:5173
```

#### "npm ERR! code ELIFECYCLE"
```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Authentication Issues

#### Cannot login
- Check default credentials: `admin@fams.local` / `Admin123`
- Verify JWT_SECRET is set in backend/.env
- Check browser console for errors
- Verify backend is running and accessible

### More Help

See `.kiro/steering/fams-troubleshooting.md` for comprehensive troubleshooting guide.

---

## 🚢 Deployment

### Option 1: Railway (Recommended)

#### Backend Deployment
1. Sign up at [Railway.app](https://railway.app)
2. Create new project → Deploy from GitHub repo
3. Select `backend` folder as root
4. Add environment variables:
   ```
   KFMS_JWT_SECRET=<random-secure-string>
   KFMS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ```
5. Railway auto-detects Python and runs `uvicorn app.main:app`

#### Frontend Deployment (Vercel)
1. Sign up at [Vercel.com](https://vercel.com)
2. Import GitHub repository
3. Root directory: `frontend`
4. Framework: Vite
5. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```
6. Deploy

### Option 2: Render

#### Backend
1. Go to [Render.com](https://render.com)
2. New Web Service → Connect GitHub
3. Root directory: `backend`
4. Build: `pip install -r requirements.txt`
5. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

#### Frontend
Use Vercel as above, or:
1. Render → New Static Site
2. Build: `npm run build`
3. Publish: `dist`

### Production Considerations

- ⚠️ **Change JWT_SECRET** to a strong random value
- ⚠️ **Use PostgreSQL** instead of SQLite for production
- ⚠️ **Enable HTTPS** (automatic on Railway/Vercel/Render)
- ⚠️ **Set up backups** for database
- ⚠️ **Monitor logs** for errors
- ⚠️ **Rate limiting** is enabled (5 login attempts/min)

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
   - Follow the coding standards in `.kiro/steering/fams-coding-standards.md`
   - Write tests for new features
   - Update documentation
4. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
   Follow [Conventional Commits](https://www.conventionalcommits.org/)
5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Coding Standards

- **Python**: PEP 8, type hints required
- **JavaScript**: ESLint, functional components with hooks
- **Commits**: Conventional Commits format
- **Documentation**: Update README for new features

See `.kiro/steering/` for detailed guidelines.

### Reporting Bugs

Open an issue with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details (OS, Python/Node versions)

---

## 📄 License

This project is licensed under the **MIT License**.

```
Copyright (c) 2026 FAMS Development Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- **FastAPI** - Modern, fast web framework for Python
- **React** - UI library for building interactive interfaces
- **Tailwind CSS** - Utility-first CSS framework
- **Aviation Weather API** - Real-time METAR/TAF data
- **Lucide** - Beautiful icon set

---

## 📞 Support

- **Documentation**: See `.kiro/steering/` folder
- **Issues**: [GitHub Issues](https://github.com/siklevis7/fams/issues)
- **Email**: support@fams.aero

---

<div align="center">

**Built with ❤️ for the aviation community**

*Fly safe, manage smarter*

[⬆ Back to Top](#-fams---flight-academy-management-system)

</div>
