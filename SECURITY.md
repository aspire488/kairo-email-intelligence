# Security Policy

KAIRO handles access to personal email. Security reports are taken seriously.

## Supported versions

KAIRO is currently in active development and has no stable release. The latest state of the default branch is the only development line receiving security fixes.

## Reporting a vulnerability

**Do not report vulnerabilities in public GitHub issues, discussions, or pull requests.**

Use GitHub's private vulnerability reporting feature on this repository if it is enabled. If it is unavailable, contact the maintainer privately through GitHub and request a secure reporting channel. Include:

- A concise description and impact.
- Steps to reproduce or a proof of concept.
- Affected commit, branch, or component.
- Any suggested mitigation.

Do not include real inbox contents, personal data, access tokens, or live credentials in the report unless strictly necessary; redact them wherever possible.

## Response

The maintainer will acknowledge a report as soon as reasonably possible, investigate its impact, and coordinate a fix and disclosure timeline with the reporter. No fixed response-time SLA is currently offered.

## Security expectations

- Never commit secrets or real user email data.
- Treat email content and attachments as untrusted input.
- Require authorization on every sensitive server-side operation.
- Require explicit approval for consequential Gmail actions.
- Avoid logging tokens, message bodies, or unnecessary personal data.
