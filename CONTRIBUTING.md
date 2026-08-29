# Contributing

Quality gate: `npm run verify` — format, ESLint (zero warnings), strict TypeScript, coverage, production build.

## Setup

Node.js 24 (`.nvmrc`).

```bash
npm ci
cp .env.example .env.local
npm run dev
```

## Layout

- `src/lib/domain` — business rules
- `src/lib/server` — signing, Auth, Firestore, request guards
- `src/app/api` — role-gated route handlers

## Standards

- TypeScript strict. No `any`.
- ESLint: `eqeqeq`, `no-var`, `prefer-const`, `no-console`, `no-duplicate-imports`.
- JSDoc on exported domain and server functions.
- Zod after `readJsonObject` on mutating JSON. Sanitize attendee text with `sanitizeUserText`. See [SECURITY.md](SECURITY.md).
- WCAG 2.1 AA: landmarks, `:focus-visible`, skip link, `prefers-reduced-motion`, `prefers-contrast`, `forced-colors`, live status.

Name test suites for the rule they protect: XSS, CSRF / origin, registration, replay, rubric math.
