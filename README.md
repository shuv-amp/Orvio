# Orvio Pulse

> Most event platforms show organizers what already happened. Orvio predicts what is about to break and gives them a safe, auditable recovery plan.

Orvio Pulse is a four-role Smart Event Management Platform built for PromptWars × AbhiyantriX. It covers the required event lifecycle while concentrating the demo around three memorable operations: explainable team formation, resilient signed QR check-in, and human-approved incident recovery.

## The 90-second path

1. Open **Participant → Match Lab**. Switch recommendations to show deterministic fit components and participant-controlled swaps.
2. Open **Scanner**, disconnect it, scan Aanya’s signed pass, then reconnect. The queued scan is verified; scan again to see replay protection reject the duplicate.
3. Open **Control tower → Simulate disruption**. Review the projected before/after metrics and approve the judge-recovery proposal.
4. Open **Judge workspace**, adjust rubric evidence, and finalize the immutable score.

Every screen is preloaded with clearly labeled synthetic data. Gemini is optional: without a configured Google project, the same demo uses a visible, deterministic fallback rather than failing or pretending an AI call succeeded.

## Requirement → evidence map

| Requirement / evaluator signal | Product evidence | Implementation | Verification |
|---|---|---|---|
| Registration and QR check-in | Signed event pass; offline queue; duplicate rejection | `issueQrToken`, `verifyQrToken`, transactional `recordCheckIn` | Tamper, event-boundary, PII, and replay tests |
| Smart team formation | Ranked teams, fit bars, reasons, skill gaps, structured swap | Deterministic 35/25/20/10/10 model in `matching.ts` | Range, rank, explanation, capacity tests |
| Broadcast center | Urgent live feed and recovery announcement | Scoped announcement model; recovery approval updates feed | Golden demo interaction |
| Interactive judging | Locked rubric v3, evidence feedback, immutable finalize | Weighted domain function and Firestore role rules | Unit tests and deny-by-default rules |
| Leaderboard and analytics | Raw published scores; FairScore advisory | Raw weighted mean; drift never silently edits score | Rubric and insufficient-evidence tests |
| Innovation | Event Pulse + chaos simulator + human approval | Pure risk engine; Gemini only explains approved facts | Threshold and draft-state tests |
| Code quality | Strict TypeScript, bounded modules, pinned lockfile | Next.js App Router, Zod, domain/server split | ESLint, TypeScript, Vitest, production build |
| Security | No PII in QR, strict CSP nonces, replay lock, role isolation | JOSE, Firebase Admin, Firestore Rules, no-store APIs | Zero known production dependency vulnerabilities |
| Accessibility | Semantic landmarks, keyboard controls, live status, reduced motion | Native elements, focus-visible, ARIA status, text status labels | Lint plus manual desktop/mobile pass |
| Google services | Cloud Run, Firestore, Auth claims, Vertex Gemini | Docker/Cloud Build, Admin adapter, structured Gemini response | Health endpoints and fallback-safe demo |

## Run locally

Requirements: Node.js 22+.

```bash
npm ci
cp .env.example .env.local
# Replace QR_SIGNING_SECRET with: openssl rand -base64 32
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Role-specific URLs are `/participant`, `/judge`, `/organizer`, and `/scanner`.

Quality gate:

```bash
npm run verify
npm audit --omit=dev
```

## Deployment reality: free tier vs no billing account

- Firebase Spark needs no payment method, but Firebase’s official pricing matrix marks Cloud Run, Cloud Build, Artifact Registry, and Cloud Logging as unavailable on Spark.
- Cloud Run has a generous usage-free tier and scale-to-zero, but its official quickstart still requires billing to be enabled on the project.
- Therefore, a no-card account cannot honestly produce the mandatory Cloud Run URL without organizer-provided credits or access to a billing-enabled project.

Ask the sponsor desk: **“The submission form requires a Cloud Run URL. Can you attach the event credit/billing account to my project or provide the hackathon project invite?”** This is the contest-compliant path. Do not submit a different host in a field that explicitly validates Cloud Run.

Once access is granted:

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com firestore.googleapis.com aiplatform.googleapis.com
gcloud artifacts repositories create orvio --repository-format=docker --location=asia-south1
printf '%s' "$(openssl rand -base64 32)" | gcloud secrets create qr-signing-secret --data-file=-
gcloud builds submit --config cloudbuild.yaml --substitutions=COMMIT_SHA="$(git rev-parse HEAD)"
```

Before judging, grant the Cloud Run service identity `roles/aiplatform.user` and the minimum Firestore role, mount `QR_SIGNING_SECRET` from Secret Manager, deploy Firestore rules, then verify `/api/healthz` in an incognito window. Keep `min-instances=0` for cost control; warm the URL immediately before the pitch.

Official references: [Firebase pricing](https://firebase.google.com/pricing), [Cloud Run pricing](https://cloud.google.com/run/pricing), [Cloud Run deployment prerequisites](https://docs.cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-nodejs-service).

## Architecture and decisions

- `src/lib/domain`: deterministic, testable match, pulse, and judging logic.
- `src/lib/server`: token signing, Firebase authorization, Firestore transactions, and bounded rate limiting.
- `src/app/api`: schema-validated, no-store route handlers. Gemini failure returns a declared deterministic fallback.
- `firestore.rules`: client access is deny-by-default; used QR nonces and audit writes are server-only.
- `src/proxy.ts`: per-request CSP nonce; no `unsafe-inline` scripts in production.

The complete research, UX, threat model, system diagrams, pitch, and submission runbook are in [`docs/winning-strategy.md`](docs/winning-strategy.md).

## License

Original hackathon implementation. No source code was copied from the inspiration repositories listed in the research document.
