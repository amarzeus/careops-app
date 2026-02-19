# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | ✅ Actively maintained |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in CareOps, please disclose it
responsibly by emailing:

📧 **amarzeus.dev@gmail.com**

Please include the following details:
- A description of the vulnerability and its potential impact
- Steps to reproduce the issue
- Any suggested mitigations

You will receive an acknowledgement within **48 hours** and a resolution update
within **7 days**.

## Scope

The following are in scope for vulnerability reports:

- Authentication and authorisation bypass
- SQL injection / NoSQL injection
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Sensitive data exposure (API keys, tokens, PII)
- Server-side request forgery (SSRF)
- Insecure dependencies with known CVEs

## Out of Scope

- Social engineering attacks
- Denial-of-service attacks involving volumetric traffic
- Issues in third-party services (Google, Twilio, Vapi) that are outside our control

## Responsible Disclosure

We follow a **90-day responsible disclosure** timeline. After 90 days from
initial report, we may publicly disclose the vulnerability along with the fix.
