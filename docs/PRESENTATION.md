# Certification Quizz Maker — 45 min talk

Key points only. Print double-sided, one section per spread. Follow your nose.

---

## 1. Why I built this (5 min)

- Existing cert quiz apps: hardcoded per-exam, account-walled, stale dumps.
- This app: **data = JSON, code = generic engine**. One file = new cert.
- Local-first (no account needed). Backend is **optional** AWS sync.
- Built so I could study AWS certs and so anyone can port a cert in minutes.
- Live now: `quiz-cert.com`. Ships DVA-C02 (555Q) + CLF-C02 (716Q) — both added with zero app-code changes.

**Say aloud:** "I built the quiz app I wanted. Then I made it so anyone could build the same thing for any exam."

---

## 2. Demo flow (10 min)

**Prep:** dev server running on localhost:5173. Bookmark /cert route.

- **Home** — two cert cards. "Data-driven. Adapts to whatever JSON is loaded."
- **Configure** — pick CLF-C02, Exam preset. "Real exam sim: count + weights from JSON."
- **Quiz** — answer, flag, finish. Point at timer bar, skip logic.
- **Review** — scored page, breakdown by domain. "Projecting scaled score from percent correct."
- **Dashboard** — history list, reset. "Progress survives refresh."
- **Theme toggle** — dark to light. "Persisted preference."
- *(if live)* **Sign in, sync, sign out** — "Guest data stashed, account restored."

**Live-demo insurance:** If it breaks, say "This is why we have the pipeline" and keep walking.

---

## 3. Architecture (10 min)

### Frontend — Vue 3 + Vite. Static. Hosted anywhere.

- **Hash router (createWebHashHistory)** — static files, no rewrite rules.
- **Build-time cert discovery:** import.meta.glob finds questions JSON files, each becomes a lazy chunk.
- cert-manifest.json (tiny) drives the selector; bundles load on first navigation.
- src/types.ts = **single source of truth** for all shapes. schemaValidator = pure, tested.
- byExamCode in Pinia — certs never mix. Export/import merge, newest lastSeenAt wins.
- src/components/ split into app, auth, cert, filters, history, quiz, review, ui, icons — grouped by **consumer**.
- texts/en.ts (copy), icons/ (SVG), tokens.css (theme vars) — hygiene keeps dark mode + i18n cheap.

**Line to say:** "Frontend is dumb-static. Backend is a sync feature, not a prerequisite."

### Backend — optional AWS (if synced)

One template.yaml: Cognito (identity), HTTP API (JWT gate), 2 Lambdas, DynamoDB single table (PK=user, SK=type), S3+CloudFront (quiz-cert.com, OAC, index fallback).

- RemoteSyncAdapter interface: pull() / push() — no-op when no API URL.
- Policy: last-write-wins server; replace-on-pull client. Concurrent edits = known limit, documented.
- CORS allowlist = prod + localhost. Throttled 10/20.

**If no time:** skip backend details. Mention "one SAM template, $0 at personal scale."

---

## 4. DevOps (8 min)

**Start with the plain-language version (1 min):** DevOps here means making changes repeatable: check the code automatically, then deploy the website and optional backend deliberately. I don't need to be an AWS specialist to explain the path or the choices.

**The path from change to user (4 min):**

```text
change -> pull request -> automated checks -> merge -> manual deploy -> users
```

- GitHub Actions runs seven independent checks on pull requests and pushes to `main`, using Node 22: lint (style and common mistakes), typecheck (TypeScript consistency), unit tests, knip (unused code), Playwright end-to-end tests, production build, and dependency security audit.
- Explain CI as an automated checklist on proposed changes. The jobs run in parallel, so a failure points to a specific kind of problem; deployment is not automatic after these checks.
- Local tools catch issues sooner: Husky runs the configured pre-commit checks, and Dependabot proposes dependency updates. CI repeats the checks in a clean GitHub environment.
- Vitest checks focused behavior. Playwright runs browser journeys against the built app. For E2E, a fake auth service avoids real accounts and AWS; a parity test checks that fake and real auth expose the same API.

**Two deliberate deploys (2 min):**

- **Website:** `npm run deploy:site` builds the app, copies the static files to a private S3 bucket, then tells CloudFront to refresh its cached files. S3 stores the files; CloudFront delivers them to visitors.
- **AWS backend:** `sam build && sam deploy` updates the optional AWS services from `template.yaml`. SAM is AWS's deployment tool for this serverless setup; its outputs go into local `.env.local` configuration.
- These are separate because the static quiz works without the backend. Missing Cognito settings means local-only use; missing the sync URL means sign-in without sync.

**Close with the boundary (1 min):** Most infrastructure is managed by AWS; the project keeps its configuration in one SAM template and its website deploy in one npm script. That makes the path understandable without pretending the tradeoffs disappear. At personal usage the cost is near zero, not a universal guarantee of free use.

**Optional line:** "I'm not presenting myself as a DevOps engineer. I can show how a change is checked, how it reaches the site, and which parts AWS manages for me."

---

## 5. My AI workflow (10 min)

### 5a. Adding a new cert (5 min)

Pipeline (say: **"AI proposes, machines dispose"**):

1. GitHub issue requests it.
2. Any LLM + SKILL.md drafts questions.json — **Rule 1: stop and ask, never guess**.
3. schemaValidator (unit-tested) accepts or errors.
4. PR adds JSON + cert-manifest entry, full CI judges everything.
5. Auto-discovered next deploy. **Zero code changes.**

### 5b. Developing a feature (5 min)

1. Branch feat/xxx.
2. Write/extend the **type** in src/types.ts first — that is the spec.
3. Pure logic in utils/ + colocated .test.ts. Behavior, not copy.
4. UI goes in the right component folder (by **consumer**, not by type).
5. Local gate: lint and typecheck and test.
6. Touch AWS? Update template.yaml + docs/AWS-SETUP.md.

**Line to say:** "The code is easy. The contracts (types, validator, docs, CI) are what make AI safe."

---

## 6. Anything else? (2 min — recommend YES)

**Deliberate non-features** — the app writes down what it refuses:

- No runtime cert upload.
- No auto-fix of invalid JSON.
- No force-fitting drag-and-drop / matching questions.
- No server-side AI formatting.

These are design decisions, not omissions. They live in docs/FEATURES.md.

**Close with either:**

- "The hardest part was not the code — it was deciding what **not** to build."
- "A new cert is a JSON file and a manifest entry. Everything else is plumbing."

---

## Timing cheat sheet

- Why: 5 min
- Demo: 10 min
- Architecture: 10 min
- DevOps: 8 min
- AI workflow: 10 min
- Extras + close: 2 min
- **Total: 45 min**
