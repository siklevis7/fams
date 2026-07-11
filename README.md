# FAMS - Flight Academy Management System

FAMS is a comprehensive, modern, and high-performance web application tailored for aviation academies, flight schools, and small operators. It provides a centralized digital ecosystem to manage aircraft fleets, student progress, crew duty limits, scheduling, maintenance, and compliance documentation.

The system is built using a modern 2026 "Liquid Glass & Bento Grid" design architecture, providing maximum content space with a beautiful, professional, sky-blue aesthetic.

---

## 🌟 Table of Contents
1. [Core Features](#-core-features)
2. [Technology Stack](#-technology-stack)
3. [User Roles & Permissions](#-user-roles--permissions)
4. [Comprehensive System Walkthrough (How to Use)](#-comprehensive-system-walkthrough)
5. [Local Development Setup](#-local-development-setup)
6. [Environment Variables](#-environment-variables)
7. [Deployment Guide (Vercel & Render)](#-deployment-guide)

---

## 🚀 Core Features

### 1. Dispatch & Scheduling Calendar
- **Interactive Calendar:** View bookings day-by-day.
- **Resource Management:** Assign aircraft, simulators, classrooms, and instructors to flights or ground lessons.
- **Conflict Prevention:** The backend ensures that double-booking of instructors or aircraft is blocked.

### 2. Crew Roster & FTL Tracking
- **Duty Logging:** Track standbys, flights, ground training, and days off.
- **Flight Time Limitations (FTL):** Monitors maximum duty hours and legally mandated rest periods, ensuring legal compliance.
- **Visual Roster:** A multi-day visual timeline for all staff.

### 3. Maintenance & Defect Management
- **Live Fleet Status:** View which aircraft are Airworthy or Grounded (AOG).
- **Tech Log:** Pilots and instructors can report defects/snags directly from the ramp.
- **Maintenance Actions:** Maintenance controllers can update defect statuses, log rectification actions, and release aircraft back to service.

### 4. Ad-Hoc Mass & Balance
- **Dynamic Load Sheets:** Real-time computation of CG (Center of Gravity) limits.
- **Multiple Aircraft Types:** Automatically pulls arm/moment configurations for different fleet types (e.g., C172, PA28).
- **Digital Sign-off:** Instructors can electronically sign off on the load sheet.
- **A5 Print Support:** Designed to be printed directly on A5 paper for the pilot's kneeboard.

### 5. Student Progress & Training
- **Syllabus Tracking:** Instructors can log flight grades, remarks, and maneuvers.
- **Milestones:** Track theoretical exams, solos, cross-country flights, and stage checks.

### 6. Documents & Compliance (E-Sign)
- **RCAA 5-Year Retention Ready:** Upload, track, and manage crew licenses, medical certificates, and technical documents.
- **Expiry Alerts:** Automatic color-coding (Red/Yellow/Green) based on document expiration dates (e.g., Medical Class 1 expiring soon).

### 7. Weather & NOTAMs
- **Live Aviation Weather:** Instant ICAO search fetching real-time METARs and TAFs.
- **Interactive Global Map:** Integration with Windy.com to visualize global wind patterns, precipitation, and cloud cover.

### 8. Analytics & Reporting
- **Fleet Utilization:** Visual progress bars displaying flight hours per aircraft.
- **KPI Dashboard:** Monitor total flight hours, active maintenance findings, and expiring compliance documents at a glance.

---

## 💻 Technology Stack

### Frontend (Client-Side)
- **Framework:** React.js (via Vite for blazing-fast HMR and optimized builds)
- **Styling:** Tailwind CSS (Modern Glassmorphism UI)
- **Routing:** React Router v6
- **Icons:** Lucide-React
- **Date Handling:** Date-fns

### Backend (Server-Side)
- **Framework:** Node.js with Express.js
- **Database:** PostgreSQL (Hosted on Supabase)
- **Authentication:** Custom JWT (JSON Web Tokens) with bcrypt password hashing
- **Middleware:** CORS, Express-JSON

---

## 👥 User Roles & Permissions

FAMS implements strict Role-Based Access Control (RBAC). What you see depends entirely on your assigned role:

1. **Administrator:** Unrestricted access. Can manage users, edit fleet resources, and override system locks.
2. **Operations Officer:** Can schedule flights, assign crew duty, and view all reports.
3. **Instructor:** Can schedule flights, grade students, compute Mass & Balance, and log defects.
4. **Examiner:** Similar to Instructor, but can sign off on official check-rides.
5. **Student:** Read-only access to their own schedule, their training progress, and weather data.
6. **Dispatcher:** Can manage the daily flight schedule and view aircraft maintenance status.
7. **Maintenance:** Can view the defect log, change aircraft airworthiness status, and clear technical snags.

---

## 📖 Comprehensive System Walkthrough

If you are a new user, here is exactly how you operate the system:

### Logging In
1. Open the web app URL.
2. Enter your Email and Password. 
3. If this is a fresh database, use the default master admin credentials configured by your administrator.

### Step 1: Set Up Resources (Admin/Ops Only)
Before scheduling flights, you need aircraft and personnel.
1. Navigate to **Management Dashboard** (Sidebar).
2. Go to **Staff & Students**. Click **Add User** to create accounts for your instructors and students. Assign them appropriate roles.
3. Go to **Fleet & Resources**. Click **Add Resource** to add your aircraft (e.g., Cessna 172, Piper Archer) and classrooms.

### Step 2: Schedule a Flight
1. Navigate to **Flight Ops > Dispatch & Scheduling**.
2. Click the **+ Schedule Flight** button.
3. Select the Aircraft/Resource, the Instructor (optional for solo flights), and the Student.
4. Choose the Start and End times. The system will prevent you from double-booking.

### Step 3: Compute Mass & Balance
1. Before the flight, the Instructor/Student navigates to **Flight Ops > Mass & Balance**.
2. Select the aircraft from the dropdown.
3. Input the weight of the Front Seat passengers, Rear Seat passengers, Baggage, and Fuel (in Gallons or Liters depending on the config).
4. The system instantly calculates the Takeoff Mass, Zero Fuel Mass, and CG limits. 
5. If within limits, the Instructor clicks **Sign Loadsheet** and can optionally click **Print A5**.

### Step 4: Post-Flight Duty & Grading
1. **Grade the Student:** Navigate to **Student Progress**, select the student, and input their flight grade and remarks.
2. **Log Defect (if any):** If the aircraft had an issue, go to **Maintenance**, select the aircraft, and log a defect (e.g., "Left strobe light INOP"). The aircraft will be flagged.
3. **Log Duty Time:** Navigate to **Crew Roster**, click **Assign Duty**, and log your flight time to ensure you don't exceed your weekly/monthly FTL (Flight Time Limitations).

### Step 5: Monitor Compliance
1. Operations Officers should periodically check **Compliance > Documents**.
2. Upload scans of Medicals and Licenses. Set their expiry dates.
3. The dashboard will flag any personnel whose medicals are expiring within 30 days in orange, and expired documents in red.

---

## 🛠 Local Development Setup

To run this application on your local machine for development or testing:

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Git](https://git-scm.com/)
- A free [Supabase](https://supabase.com/) account for the database.

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/fams.git
cd fams
```

### 2. Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` folder (see Environment Variables section below).
4. Start the backend server:
   ```bash
   npm run dev
   ```
   *(The server will run on `http://localhost:3000`)*

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` folder (see Environment Variables section below).
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *(The app will be accessible at `http://localhost:5173`)*

---

## 🔑 Environment Variables

You must create `.env` files in both the frontend and backend directories for the application to function.

### Backend (`backend/.env`)
```env
# The port the Express server will run on
PORT=3000

# Your Supabase connection details
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-service-role-key

# A random secure string for signing JWT tokens
JWT_SECRET=your_super_secret_jwt_string_12345
```

### Frontend (`frontend/.env`)
```env
# The URL where your backend API is hosted
# Use http://localhost:3000 for local development
VITE_API_URL=https://your-production-backend-url.onrender.com
```

---

## 🌍 Deployment Guide

The application is designed to be hosted entirely in the cloud for free using Vercel (Frontend) and Render (Backend).

### 1. Deploying the Backend (Render)
1. Go to [Render.com](https://render.com/) and create a new **Web Service**.
2. Connect your GitHub repository and select the `fams` repo.
3. **Root Directory:** `backend`
4. **Build Command:** `npm install`
5. **Start Command:** `node server.js`
6. Expand **Advanced** and add your Environment Variables (`SUPABASE_URL`, `SUPABASE_KEY`, `JWT_SECRET`).
7. Click **Create Web Service**. Render will give you a URL (e.g., `https://fams-backend.onrender.com`).

### 2. Deploying the Frontend (Vercel)
1. Go to [Vercel.com](https://vercel.com/) and click **Add New Project**.
2. Import the `fams` repository from GitHub.
3. **Framework Preset:** Vite
4. **Root Directory:** `frontend`
5. Open **Environment Variables** and add:
   - `VITE_API_URL` = The URL you just got from Render (e.g., `https://fams-backend.onrender.com`).
6. Click **Deploy**.

Once deployed, Vercel will provide your live URL. Any time you push changes to the `main` branch on GitHub, Vercel and Render will automatically rebuild and redeploy your application.

---
*FAMS - Built for the future of aviation training.*
