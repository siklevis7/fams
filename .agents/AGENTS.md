# KFMS Project Rules — MANDATORY FOR ALL AI MODELS

> **STOP. READ THIS ENTIRE FILE BEFORE TOUCHING ANY CODE.**
>
> These rules exist because previous AI sessions have repeatedly broken this project
> by reverting user decisions, renaming things the user explicitly named, and pushing
> broken code to production. Every rule below was written in response to a real failure.
>
> If you violate these rules, you will break production and waste the user's time.

---

## RULE 0: THE PRIME DIRECTIVE

**If the user told you to do something, it is LAW. Do not undo it. Do not "improve" it. Do not replace it with your own preference.**

The user has been burned multiple times by AI models that:
- Renamed KFMS to "FAMS.aero" (the user corrected this TWICE)
- Changed calendar colors the user explicitly specified
- Added back UI elements the user explicitly asked to remove
- Pushed code that crashed production because migrations were missing
- Overwrote working code with broken "improvements"

**You are not here to express preferences. You are here to execute the user's vision.**

---

## RULE 1: BRANDING IS LOCKED

| Element | Value | DO NOT CHANGE TO |
|---------|-------|-----------------|
| App name | **KFMS** | ~~FAMS~~, ~~FAMS.aero~~, ~~Flight Academy~~, or anything else |
| Full name | **Kigali Flight Management System** | ~~Flight & Aviation Management~~ |
| Browser tab | `KFMS \| Kigali Flight Management System` | anything else |
| Login heading | `KFMS` | anything else |
| Login subtitle | `Kigali Flight Management System` | anything else |
| Sidebar text | `KFMS` | anything else |
| Logo alt text | `KFMS Logo` | ~~FAMS Logo~~ |
| Favicon | `/logo.jpg` | do not remove |
| Backend API title | `FAMS.aero API` (internal, user never sees) | leave as-is |

---

## RULE 2: BEFORE YOU EDIT ANY FILE

You MUST do the following BEFORE making changes:

1. **READ the file first.** Use `view_file` to see the current state. Do not assume you know what's in it.
2. **Check this AGENTS.md** for locked values. If the value you're about to change appears in this file as locked, DO NOT CHANGE IT.
3. **Check DECISIONS.md** (at `.agents/DECISIONS.md`). If a decision is logged there, it is permanent unless the user explicitly says otherwise in the current conversation.
4. **Make only the changes the user asked for.** Do not "clean up" adjacent code. Do not refactor. Do not rename variables. Do not change formatting of lines you aren't editing.

### The Diff Test
Before submitting any file edit, mentally ask: "If the user looks at the git diff, will every changed line be something they asked for?" If the answer is no, remove those changes.

---

## RULE 3: DISPATCH CALENDAR COLORS — LOCKED

The user specified these exact rules. They have been changed incorrectly multiple times.

| Booking State | Background Color | CSS Classes | How It's Determined |
|--------------|-----------------|-------------|-------------------|
| Scheduled (future/past) | **NONE — transparent/glass** | `bg-slate-100/30 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 backdrop-blur-sm` | `status === 'Scheduled'` AND current time is NOT within the booking window |
| Active (flying right now) | **EMERALD GREEN with glow** | `bg-emerald-500 border-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] ring-2 ring-emerald-400` | `status === 'Scheduled'` AND current time IS within start_time–end_time |
| Completed (tech log filed) | **RED** | `bg-rose-500 border-rose-600 text-white` | `status === 'Completed'` (set by POST /api/bookings/{id}/log) |
| Cancelled | **GREY** | `bg-slate-400 border-slate-500 text-white` | `status === 'Cancelled'` |

**DO NOT** change these to blue, indigo, purple, or any other color. The function is `getStatusColor(booking)` in `DispatchCalendar.jsx`. It takes a full booking object (not just a status string).

---

## RULE 4: UI ELEMENTS THAT ARE LOCKED

These were explicitly requested or approved by the user:

- **Font**: Outfit (Google Fonts) — do not change to Inter, Roboto, or system fonts
- **Design language**: Liquid Glass (backdrop-blur, frosted panels, rounded-3xl)
- **Calendar layout**: Compact rows, NO "Aircraft" sub-label under resource names
- **Calendar constants**: `HOUR_WIDTH = 120`, `START_HOUR = 6`, `TOTAL_HOURS = 14`
- **Dark mode text**: Global CSS overrides in `index.css` force high-contrast text in inputs — do not remove
- **Post-Flight Tech Log**: Sidebar item under "Flight Ops" section — do not remove
- **Logo**: Displayed on login page, sidebar, and favicon — do not remove

---

## RULE 5: DATABASE MIGRATION IS MANDATORY

Render's free tier wipes the SQLite database on every deploy. This means:

### When you add a new column to any model in `models.py`:
You MUST ALSO add an idempotent migration in `main.py`'s startup block:

```python
# Example — this pattern is REQUIRED for every new column:
try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE tablename ADD COLUMN new_column TYPE;"))
except Exception as e:
    pass  # Column already exists
```

### If you forget this step:
- The production database won't have the column
- The API will return 500 errors
- The frontend will show empty data (no resources, no bookings)
- The user will think everything is broken

**This has happened before. Do not let it happen again.**

### Seed files run on startup:
- `seed_users.py` — creates default admin account
- `seed_aircraft.py` — creates DA20, DA42, C208 fleet
- `seed_syllabus.py` — creates PPL sorties
- Called by `run_seeds()` in `main.py`

---

## RULE 6: AUTO-DEPLOY WORKFLOW

After completing ANY verified unit of work:

```powershell
git add . ; git commit -m "Descriptive message about what changed" ; git push
```

- Use semicolons (`;`), NOT `&&` — this is PowerShell on Windows
- Do NOT ask the user "should I push?" — just push
- Do NOT ask the user "should I commit?" — just commit
- Write descriptive commit messages, not "fix" or "update"

---

## RULE 7: ARCHITECTURE — DO NOT RESTRUCTURE

### Backend (FastAPI)
- All routes live in `backend/app/main.py` — do NOT create a `routers/` directory
- All CRUD operations live in `backend/app/crud.py`
- All Pydantic schemas live in `backend/app/schemas.py`
- All SQLAlchemy models live in `backend/app/models.py`
- Database config lives in `backend/app/database.py`

### Frontend (React + Vite)
- All components live in `frontend/src/components/`
- `App.jsx` contains the sidebar, routing, and main layout
- `config.js` exports `API_BASE`
- `index.css` has global styles and theme

### Do NOT:
- Split `main.py` into separate router files
- Create a `services/` layer
- Add Redux, Zustand, or any state management library
- Change the folder structure
- Add TypeScript (the project uses JavaScript)

---

## RULE 8: CODING PATTERNS

### Python
- Pydantic v2: use `model_dump()`, not `.dict()`
- Schema Config: `from_attributes = True`
- All enums from `models.py`: `RoleEnum`, `BookingStatusEnum`, `ResourceTypeEnum`, etc.

### React
- Functional components with hooks (no class components)
- `API_BASE` from `config.js` for all API calls
- Auth header: `{ 'Authorization': \`Bearer ${token}\` }`
- Date handling: `date-fns` (`parseISO`, `format`, `addDays`, `differenceInMinutes`)
- Icons: `lucide-react`
- Toasts: `sonner`

### User Roles
```
Administrator, Operations Officer, Instructor, Student Pilot,
Examiner, Maintenance Engineer, Finance Officer
```

---

## RULE 9: AIRCRAFT FLEET — LOCKED

Seeded in `seed_aircraft.py`. Do NOT modify registrations, types, or weights:

| Registration | Type | BEW (kg) | MTOW (kg) |
|-------------|------|----------|-----------|
| 9XR-DAA through 9XR-DAE | DA20 | 528 | 800 |
| 9XR-DFA through 9XR-DFC | DA42 | 1410 | 1900 |
| 9XR-CAA, 9XR-CAB | C208 Caravan | 2145 | 3629 |

---

## RULE 10: SIDEBAR NAVIGATION ORDER — LOCKED

```
── Main ──
1. Dispatch Calendar        (/)
2. Crew Roster              (/roster)
3. Management               (/management)
4. Syllabus Management      (/syllabus)
5. Maintenance              (/maintenance)
6. Student Progress         (/progress)

── Flight Ops ──
7. Mass & Balance           (/massbalance)
8. Weather & NOTAMs         (/weather)
9. Post-Flight Tech Log     (/techlog)

── Compliance ──
10. Documents & E-Sign      (/documents)
11. Findings & Audits       (/compliance)
12. Reports & Analytics     (/reports)
```

---

## RULE 11: THINKING CHECKLIST

Before EVERY edit, run through this checklist mentally:

- [ ] Did I READ the file I'm about to edit?
- [ ] Am I ONLY changing what the user asked for?
- [ ] Am I preserving ALL existing values that the user previously approved?
- [ ] Is the app name still KFMS everywhere?
- [ ] Are the calendar colors still correct (none/green/red/grey)?
- [ ] Did I add ALTER TABLE migrations for any new database columns?
- [ ] Am I using `;` not `&&` for PowerShell commands?
- [ ] Will this change break anything on the production Render deployment?

If ANY answer is "no" or "I'm not sure," STOP and fix it before proceeding.

---

## RULE 12: WHAT NEVER TO DO — HARD STOPS

These actions are FORBIDDEN. If you find yourself about to do any of these, STOP IMMEDIATELY:

1. ❌ Rename KFMS to FAMS, FAMS.aero, or anything else
2. ❌ Change calendar booking colors from the locked values
3. ❌ Add "Aircraft" sub-labels back to calendar resource rows
4. ❌ Remove the compact calendar layout
5. ❌ Change the Outfit font
6. ❌ Remove the liquid glass / glassmorphism design
7. ❌ Remove or restructure the Post-Flight Tech Log feature
8. ❌ Use `&&` in shell commands (PowerShell uses `;`)
9. ❌ Add new DB columns without ALTER TABLE migrations in main.py
10. ❌ Ask "should I push?" instead of just pushing
11. ❌ Refactor or "clean up" code the user didn't ask you to touch
12. ❌ Replace working code with a "better" version nobody asked for
13. ❌ Change the file/folder structure
14. ❌ Add new dependencies without the user asking
15. ❌ Remove existing comments or docstrings

---

## RULE 13: WHEN IN DOUBT

If you are unsure whether the user wants something changed:

**ASK. Do not guess. Do not assume. Do not "improve."**

The cost of asking is 10 seconds. The cost of breaking production is hours of the user's time and trust.
