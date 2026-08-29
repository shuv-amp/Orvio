# Security

## Reporting

Do not file public issues for exploitable bugs. Contact the maintainer privately.

## Trust boundaries

| Boundary   | Control                                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| Browser UI | Role workspaces are UX. Privileged writes are server-authorized.                                         |
| JSON APIs  | Same-origin `Origin`, Zod contracts, 8 KB body cap, per-identity rate limits, `Cache-Control: no-store`. |
| QR passes  | HS256, audience `orvio-check-in`, 8-hour expiry, ticket UUID + nonce only. No name, email, or phone.     |
| Firestore  | Deny-by-default. Used nonces and audit logs are Admin SDK only. Finalized scores are immutable.          |
| Gemini     | Bounded JSON in. Cannot invent actions or mutate state. Organizer approval is required.                  |

## XSS

React encodes JSX text. Attendee-authored strings pass `sanitizeUserText` / `escapeHtml` and are rejected if they contain HTML. There is no `dangerouslySetInnerHTML`, `innerHTML`, or `eval`.

## CSRF

State-changing handlers require an `Origin` header whose host matches the request URL. They do not trust the `Host` header for this comparison.

## Secrets

- Never commit `.env*` files or service-account JSON.
- `QR_SIGNING_SECRET` is at least 32 bytes in production.
- `NEXT_PUBLIC_*` values are public. Authorization is Auth custom claims and Firestore rules.

## Demo and production

`APP_MODE=demo` issues synthetic identities for `abhiyantrix-2026` only. Cloud mode verifies Firebase ID tokens and role claims. Production refuses to sign QR codes without `QR_SIGNING_SECRET`.
