# Contributing to KAIRO

Thanks for considering a contribution. KAIRO is actively developed; focused, evidence-backed contributions are preferred over large speculative changes.

## Before you start

- Check existing issues and pull requests to avoid duplicate work.
- For substantial changes, open an issue or discussion first.
- Do not publish vulnerabilities in public issues. Follow [SECURITY.md](SECURITY.md).
- Never include real email content, personal data, OAuth tokens, API keys, refresh tokens, or production credentials in commits, screenshots, logs, or fixtures.

## Development setup

Requirements: Node.js 22+, npm, and the credentials needed for the feature you are working on.

```bash
git clone https://github.com/aspire488/kairo-email-intelligence.git
cd kairo-email-intelligence
npm install
cp .env.example .env
```

Fill in local environment values. Keep `.env` untracked.

Run the app:

```bash
npm run dev
```

Run the backend:

```bash
npm start
```

Validate changes:

```bash
npm run lint
npm run build
```

If a command cannot be run in your environment, say so in the pull request. Never report an unrun check as passing.

## Contribution expectations

- Keep pull requests narrow and explain the user problem they solve.
- Preserve the Paper / Ink / Vermilion visual system and existing interaction patterns.
- Use TypeScript types; avoid introducing `any` without a clear reason.
- Keep deterministic behavior deterministic. Use AI only where contextual interpretation is needed.
- Treat email bodies, attachments, and external content as untrusted input.
- Do not weaken authentication, authorization, approval gates, or auditability.
- Never add silent email sending, permanent deletion, or credential logging.
- Add or update tests for behavior changes. Include reproduction steps for bug fixes.
- Update documentation and `.env.example` when configuration changes. Never put real values in examples.

## Pull request process

1. Create a branch from the default branch.
2. Make one coherent change per pull request.
3. Run the relevant checks and include their actual results.
4. Describe the problem, implementation, security implications, and any limitations.
5. Link related issues and add screenshots only when they contain no private data.
6. Respond to review feedback and keep the branch current.

A maintainer may request changes or close contributions that are out of scope, unsafe, unverifiable, or inconsistent with the project direction.

## Commit messages

Use concise, imperative messages, for example:

- `fix: validate Gmail sync state`
- `docs: clarify local setup`
- `test: cover priority classification`

## License

By submitting a contribution, you agree that it is licensed under the repository's [MIT License](LICENSE).
