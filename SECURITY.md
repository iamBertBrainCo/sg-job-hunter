# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | ✅                 |

## Reporting a Vulnerability

We take the security of SG Job Hunter seriously. If you discover a security vulnerability, please follow these steps:

### 🚨 Do NOT disclose publicly

Please **do not** create a GitHub issue for security vulnerabilities. Public disclosure could put users at risk before a fix is available.

### ✅ How to report

1. **Email:** Send details to the project maintainer via GitHub private messaging or the contact information in the README
2. **Include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if you have one)

### What to expect

- **Acknowledgment:** Within 48 hours
- **Initial assessment:** Within 1 week
- **Fix timeline:** Depends on severity (critical fixes within 2 weeks)
- **Disclosure:** We will coordinate public disclosure after the fix is available

### Security measures in place

SG Job Hunter implements the following security practices:

- **No hardcoded secrets:** All API keys and credentials are loaded from `.env` files (which are gitignored)
- **Input validation:** User-provided URLs and data are validated before processing
- **Privacy protection:** PII interceptor and privacy guard modules protect personal data
- **Plugin sandboxing:** Plugins run with restricted permissions and allowed host lists
- **Data minimization:** Only necessary data is collected and stored

### Known limitations

- The project is designed for personal use by individual job seekers
- It is not designed for multi-tenant or production deployment
- Browser automation (Playwright) requires trusted execution environment

## Security Best Practices for Users

1. **Never commit `.env` files** — They contain API keys and credentials
2. **Review `.gitignore`** — Ensure sensitive files are excluded
3. **Use strong passwords** — For any accounts the project interacts with
4. **Keep dependencies updated** — Run `npm update` regularly
5. **Review plugin code** — Only install plugins from trusted sources

## Acknowledgments

We thank the security researchers who have helped improve SG Job Hunter's security.
