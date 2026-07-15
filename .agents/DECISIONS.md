# KFMS — User Decisions Log

> **This file is a permanent record of decisions made by the project owner.**
> Every entry below was explicitly requested or approved by the user.
> No AI model may reverse, modify, or "improve" any of these without the user
> explicitly saying so in the current conversation.
>
> Format: `[DATE] DECISION — Rationale`

---

## Branding & Identity

- **[2026-07] App name is KFMS** — "Kigali Flight Management System." User corrected AI twice for renaming it to KFMS.aero. This is final.
- **[2026-07] Logo must appear in three places** — Login page, sidebar, and browser favicon. User explicitly requested this.

## Dispatch Calendar

- **[2026-07] Compact layout, no "Aircraft" sub-label** — User said: "No need to write Aircraft under each aircraft name."
- **[2026-07] Booking colors: none/green/red/grey** — User said: "No color when it is scheduled. It becomes automatically green when the flight hour filed reaches. When it is saved on [tech log], make it look red."
- **[2026-07] Calendar hours: 6 AM to 8 PM** — Designed for a flight academy that operates during daylight hours.
- **[2026-07] Bookings must refresh immediately after creation** — User reported bug where new schedules didn't show. Fixed by increasing query limit from 100 to 1000.

## Post-Flight Tech Log

- **[2026-07] Sidebar item for post-flight logging** — User said: "Create an option on the sidebar showing a place where a student/instructor can enter the real details of the flight after the flight is done."
- **[2026-07] Fields: actual times, Hobbs, Tach, remarks** — These specific meters were requested.
- **[2026-07] Submitting tech log sets status to Completed (red)** — User's explicit coloring rule.

## UI/UX

- **[2026-07] Font: Outfit** — User approved this Google Font. Do not change.
- **[2026-07] Design: Liquid Glass / Glassmorphism** — Frosted panels, backdrop-blur, rounded corners. User approved.
- **[2026-07] Dark mode text must be visible in inputs** — User said: "I want the font to change according to the mode. Because now in dark mode, I can't see words in the text box." Fixed with global CSS overrides.
- **[2026-07] Text visibility fix applies to ALL pages** — User said: "Not only the login page but also everything else."

## Aircraft Fleet

- **[2026-07] 5× DA20, 3× DA42, 2× C208** — All with 9XR- Rwandan registrations. Seeded in `seed_aircraft.py`. Do not modify.

## Deployment

- **[2026-07] Auto-push after every change** — User wants code deployed immediately. Do not ask for permission. Just push.
- **[2026-07] Hosted on Render free tier** — SQLite is ephemeral. Migrations and seeds MUST run on startup.

## Syllabus

- **[2026-07] PPL sorties list** — User previously sent a detailed list but it was lost in a database wipe. User said "We'll do that later" when asked to resend. Do NOT prompt them about this unless they bring it up.

---

## How to Use This File

When an AI model is about to make a change that conflicts with any entry above, it must:

1. STOP
2. Re-read the relevant decision
3. Preserve the user's decision exactly as specified
4. If truly uncertain, ASK the user — do not guess
