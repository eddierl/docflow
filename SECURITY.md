# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly:

1. **Do not open a public GitHub issue** — security vulnerabilities should be handled privately.
2. **Email me directly** at [edlich6@gmail.com](mailto:edlich6@gmail.com) with a description of the vulnerability.
3. I will acknowledge receipt within **48 hours** and aim to resolve the issue within **7 days**.

### What to Include

- A clear description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment (if known)
- Suggested fix (if you have one)

## Security Measures in This Project

This project implements several security best practices:

- **Helmet** — Automatic security headers (X-Frame-Options, X-Content-Type-Options, HSTS, CSP, etc.)
- **CORS** — Configurable origin allowlist to prevent cross-origin abuse
- **Rate Limiting** — IP-based rate limiting (100 requests per 15-second window)
- **File Upload Protection** — 10 MB size cap + content-type allowlist (PDF, PNG, JPEG, TIFF, TXT only)
- **Input Validation** — UUID format validation on route params; Zod schemas on all environment variables
- **No Stack Trace Leakage** — Error responses return descriptive messages without internal details
- **Dependency Auditing** — pnpm audit in CI pipeline

## Scope

This security policy applies to all code in this repository, including the API, workers, and shared packages. Infrastructure code (Terraform, Dockerfiles) is also in scope.
