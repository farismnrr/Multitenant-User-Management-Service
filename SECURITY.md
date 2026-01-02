# Security Policy

## Supported Versions

We actively maintain the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1.0 | :x:                |

## Reporting a Vulnerability

We take the security of this project seriously. If you believe you have found a security vulnerability, please report it to us by following these steps:

1. **Do not open a public issue.**
2. Send an email to the project maintainer at `farismunir.net@gmail.com`.
3. Include as much detail as possible, including steps to reproduce the issue.

We will acknowledge your report within 48 hours and provide a timeline for a fix if necessary.

## Security Hardening Efforts

This project undergoes regular security audits and hardening, including:

- **Dynamic OIDC Validation**: Robust origin and protocol validation for SSO redirect URIs.
- **Dependency Auditing**: Automatic scanning via Dependabot and CodeQL.
- **Secure Redirection**: Explicit sanitization of URL fragments and base URL validation to prevent XSS and Open Redirects.
- **Non-Root Execution**: Docker images are configured to run as a non-privileged user.
- **Multi-Stage Builds**: Minimal runtime images to reduce attack surface.
