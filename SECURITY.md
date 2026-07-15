# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **security@kfms.rw**

You should receive a response within 48 hours. If for some reason you do not, please follow up to ensure we received your original message.

Please include the following information:

- Type of issue (e.g. SQL injection, XSS, authentication bypass)
- Full paths of source file(s) related to the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Security Best Practices

When deploying KFMS:

### Environment Variables
- Never commit `.env` files to version control
- Use strong, random values for `KFMS_JWT_SECRET`
- Rotate secrets regularly

### Database
- Use PostgreSQL in production (SQLite is for development only)
- Enable SSL/TLS for database connections
- Regular backups with encryption
- Restrict database access to application only

### Authentication
- Enforce strong password policies
- Enable 2FA for administrator accounts (when available)
- Monitor failed login attempts
- Set appropriate JWT expiration times

### Network Security
- Always use HTTPS in production
- Configure proper CORS origins (`KFMS_ALLOWED_ORIGINS`)
- Use a Web Application Firewall (WAF)
- Rate limiting is enabled by default (SlowAPI)

### Updates
- Keep dependencies up to date
- Monitor security advisories
- Apply patches promptly

## Known Security Considerations

### Default Credentials
The default admin credentials (`admin@kfms.local` / `Admin123`) should be changed immediately after first deployment.

### SQLite in Production
SQLite is not recommended for production. It lacks:
- Concurrent write support
- Network access controls
- Advanced security features

Use PostgreSQL or MySQL for production deployments.

### JWT Storage
JWTs are stored in localStorage. For enhanced security, consider implementing:
- HttpOnly cookies
- Refresh token rotation
- Short-lived access tokens

## Security Update Process

1. Security issue reported
2. Issue confirmed and assessed
3. Patch developed and tested
4. Security advisory published
5. Patch released
6. Public disclosure (after users have time to update)

## Contact

For security concerns: security@kfms.rw

Thank you for helping keep KFMS and its users safe!
