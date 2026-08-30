# Google Cloud

Orvio Pulse uses five Google services for core event operations. Each integration is wired in source. Vertex AI has a labeled deterministic fallback when a project is not configured.

## 1. Cloud Run

Hosts the Next.js App Router, role UIs, and JSON APIs. Scale-to-zero, 512 MiB, max 3 instances, concurrency 80.

| File                           | Role                                                            |
| ------------------------------ | --------------------------------------------------------------- |
| `Dockerfile`                   | Multi-stage standalone image, non-root `nextjs` user (UID 1001) |
| `cloudbuild.yaml`              | Build, push to Artifact Registry, `gcloud run deploy`           |
| `src/app/api/healthz/route.ts` | Liveness                                                        |
| `src/app/api/readyz/route.ts`  | Readiness, including `APP_MODE`                                 |

## 2. Cloud Firestore

Atomic check-in and nonce replay lock, immutable finalized scores, organizer-only audit logs, live event-scoped documents.

| File                                  | Role                                                       |
| ------------------------------------- | ---------------------------------------------------------- |
| `src/lib/server/check-in-store.ts`    | Ticket check-in + `qrNonces` in one transaction            |
| `src/lib/server/firebase-admin.ts`    | Admin SDK (server identity)                                |
| `firestore.rules`                     | Deny-by-default; clients cannot write audit or used nonces |
| `tests/rules/firestore.rules.test.ts` | Seven emulator authorization cases                         |

## 3. Firebase Authentication

Mutating APIs verify Firebase ID tokens and custom `role` claims (`participant`, `judge`, `organizer`). Demo mode is labeled synthetic and restricted to `abhiyantrix-2026`.

| File                                   | Role                                        |
| -------------------------------------- | ------------------------------------------- |
| `src/lib/server/firebase-admin.ts`     | `verifyIdToken(..., true)` + role allowlist |
| `src/app/api/check-ins/issue/route.ts` | Participant / organizer                     |
| `src/app/api/check-ins/sync/route.ts`  | Organizer / scanner                         |
| `src/app/api/recovery/route.ts`        | Organizer                                   |
| `src/app/api/registration/route.ts`    | Participant / organizer                     |

## 4. Vertex AI / Google AI Studio Gemini

Recovery copy only. Pulse already computed the actions, projections, and approval boundary. Gemini may rewrite `summary` and `announcement` against a JSON schema. It cannot invent numbers or mutate state.

| File                            | Role                                                                        |
| ------------------------------- | --------------------------------------------------------------------------- |
| `src/app/api/recovery/route.ts` | `@google/genai` client (supports Vertex AI or Google AI Studio key), schema |
| `src/lib/domain/pulse.ts`       | Actions and before/after metrics (no model)                                 |

Supported configurations:

1. **Google AI Studio:** provide `GEMINI_API_KEY`.
2. **Vertex AI:** provide `GOOGLE_CLOUD_PROJECT` and, optionally, `GOOGLE_CLOUD_LOCATION`.
3. **Deterministic fallback:** leave both unset to return `source: "deterministic-fallback"`.

## 5. Cloud Build and Artifact Registry

`cloudbuild.yaml` builds the image, pushes to `{region}-docker.pkg.dev/$PROJECT_ID/orvio/orvio-pulse:$COMMIT_SHA`, and deploys that digest to Cloud Run.

| File                | Role                                      |
| ------------------- | ----------------------------------------- |
| `cloudbuild.yaml`   | docker build / push / `gcloud run deploy` |
| `package-lock.json` | `npm ci` inside the image                 |

## Environment

Documented in `.env.example`. Secrets stay in Secret Manager / Cloud Run env, never in git.

| Variable                | Service                                     |
| ----------------------- | ------------------------------------------- |
| `GOOGLE_CLOUD_PROJECT`  | Vertex AI + Firebase project                |
| `GOOGLE_CLOUD_LOCATION` | Vertex region (default `us-central1`)       |
| `FIREBASE_PROJECT_ID`   | Admin SDK                                   |
| `QR_SIGNING_SECRET`     | Pass signing                                |
| `APP_MODE`              | `demo` (labeled) or `cloud` (Firebase Auth) |
