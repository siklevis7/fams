# Changelog

All notable changes to KFMS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned Features
- Two-factor authentication (2FA)
- Mobile app (Flutter)
- Email notifications for expiring documents
- Advanced analytics dashboard
- Multi-language support
- PostgreSQL support for production

## [1.0.0] - 2026-07-13

### Added
- **Complete UI/UX Redesign**: Modern, professional aviation interface
  - Clean card-based layouts
  - Inter font for better readability
  - Grouped navigation by function (Operations, Maintenance, Training, Compliance)
  - Aviation status colors (Emerald, Blue, Amber, Rose, Orange)
  - Improved responsive design for mobile/tablet
  - Refined dark mode

- **Dispatch Calendar**: Interactive flight scheduling with conflict prevention
  - Resource booking (aircraft, simulators, classrooms)
  - Instructor assignment
  - Double-booking prevention
  - FTL compliance checks

- **Crew Roster & Duty Management**: Visual timeline for crew assignments
  - Duty types (Standby, Ground Training, Leave, Day Off)
  - FTL tracking (28-day and daily limits)
  - Medical expiry alerts

- **Maintenance & Tech Log**: Aircraft status and defect tracking
  - Squawk reporting
  - Auto-grounding on defect log
  - Maintenance rectification tracking
  - Release to service workflow

- **Mass & Balance Calculator**: Real-time weight and CG calculations
  - Multi-aircraft type support
  - Load validation
  - Digital sign-off
  - A5 print format

- **Student Progress Tracking**: Training syllabus management
  - Sequential sortie enforcement
  - Grading system
  - Flight hour tracking (PIC, dual, night, cross-country)
  - Milestone monitoring

- **Documents & Compliance**: 5-year retention with e-signature
  - License and medical tracking
  - Expiry alerts (color-coded)
  - Audit trail

- **Weather & NOTAMs**: Live aviation weather integration
  - METAR/TAF by ICAO
  - NOTAM search
  - Multi-station support

- **Analytics & Reports**: Fleet utilization and KPI dashboard
  - Flight hours per aircraft
  - Compliance metrics
  - Financial reports

- **Compliance Audits**: Finding management system
  - Level 1/2/Observation tracking
  - CAP (Corrective Action Plan) submission
  - Due date monitoring

- **Kiro AI Steering Files**: Location-independent project guidelines
  - Project structure documentation
  - Coding standards
  - Troubleshooting guide

### Fixed
- Duplicate `get_compliance_warnings_for_user` function in crud.py
- Missing `timezone` import in crud.py
- Missing `fixed_at` column in Squawk model
- Incorrect seed module import paths in main.py
- Deprecated `jwt.PyJWTError` exception (replaced with modern exceptions)
- UTF-16 encoding issue in requirements.txt

### Security
- JWT authentication with bcrypt password hashing
- Role-based access control (RBAC)
- Rate limiting (5 login attempts/minute)
- Input validation with Pydantic schemas

### Documentation
- Comprehensive README with accurate tech stack
- Architecture diagrams
- API documentation
- Database schema overview
- User guides for all roles
- Deployment guides (Railway, Vercel, Render)

## [0.9.0] - 2026-06-01

### Added
- Initial beta release
- Basic booking system
- User authentication
- SQLite database

### Known Issues
- Heavy glassmorphism UI (addressed in 1.0.0)
- No FTL compliance checks (added in 1.0.0)
- Limited mobile responsiveness (fixed in 1.0.0)

---

## Version History

- **1.0.0** (2026-07-13): Major release with UI redesign and bug fixes
- **0.9.0** (2026-06-01): Initial beta release

[Unreleased]: https://github.com/siklevis7/fams/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/siklevis7/fams/releases/tag/v1.0.0
[0.9.0]: https://github.com/siklevis7/fams/releases/tag/v0.9.0
