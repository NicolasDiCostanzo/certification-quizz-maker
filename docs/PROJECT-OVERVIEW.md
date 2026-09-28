# Project overview: `certification-quizz-maker`

> A **cert-agnostic, local-first quiz app** (Vue 3 + TypeScript) with **static hosting + optional AWS sync**, where **all exam knowledge lives in versioned JSON** and **AI agents contribute under strict, machine-checkable guardrails**.

Live at `quiz-cert.com`. Ships with **DVA-C02 (555 questions)** and **CLF-C02 (716 questions)** built in.

> 🎙️ *Say: "Cert-agnostic, local-first, JSON-powered, AI-assisted — that one sentence is the whole talk. And it's live, with two real question banks, so this isn't a toy."*

---

## 1. Architecture

### Big picture

- **Static frontend** (Vue 3 + hash-history Router, `useQuizLoader` + validator) hosted on **S3 + CloudFront**.
- **Cert bundles** enter at build time only: `cert-manifest.json` (tiny, bundled) drives the selector; each `<CODE> questions.json` loads as its own lazy chunk on first navigation.
- **Browser state** via Pinia + localStorage (progress / history / prefs); active session in sessionStorage.
- **Optional AWS backend** (Cognito → API Gateway JWT authorizer → pull/push Lambdas → DynamoDB) used only when signed in.

> 🎙️ *Say: "The frontend is dumb-static and the backend is optional — unplug AWS entirely and the app still fully works."*

### Cert-agnostic core

- **All exam-specific data lives in JSON** (questions, topics, theme registries, domain weights, passing score, time limit). Code never hardcodes an exam's taxonomy.
- **One entry path, enforced in code:** JSON file + manifest entry → `import.meta.glob` discovery → router guard `ensureCertLoaded` → `validateCertBundle` → failures **excluded and logged, never auto-fixed**.
- Adding CLF-C02 required **zero app-code changes**.

> 🎙️ *Say: "Adding an exam is adding a file, not building a feature — CLF-C02 shipped with zero app-code changes."*

### State

| Store | Persisted in | Key idea |
|---|---|---|
| `userProgress` | localStorage | `byExamCode[code][questionId]` — certs never mix; export/import merge, newest `lastSeenAt` wins |
| `quizSession` | sessionStorage | active quiz survives refresh, dies with tab |
| `quizHistory` | localStorage | immutable per-attempt entries, per-cert dashboard |
| `userAccount` | localStorage | guest snapshot stashed at sign-in, restored at sign-out |
| `userPreferences` | localStorage | theme (`dark` default) via `data-theme` + `tokens.css` |

> 🎙️ *Say: just explain two stores — `byExamCode`, the one line that lets ten certs coexist without mixing, and the guest stash that keeps shared devices sane. Flash the rest.*

### Quiz engine

- **Preparation mode:** no timer, immediate feedback. **Exam mode:** countdown from `timeLimitMinutes`, deferred feedback, real-exam simulation preset sampled by `weights`.
- Sampling respects `exam.weights` (uniform fallback); always shuffled; multi-select derived from `answers` type.
- Scoring: `percentCorrect` decides pass/fail; scaled certs add a projected scaled score with disclaimer. Unanswered counts as incorrect.
- Replay modes (wrong / flagged / unattempted / all) compose with theme include/exclude and topic filters.

> 🎙️ *Say: two modes, two audiences — Preparation is for learning (no timer, instant feedback), Exam is for performing (countdown, deferred feedback, weighted like the real exam). Mention "unanswered counts as wrong" — examiners nod at that.*

### Sync design (opt-in backend)

- Frontend talks through a `RemoteSyncAdapter` interface (`pull` / `push`); a no-op adapter is used when no API URL is configured, so local-only users never download auth code (Amplify is dynamically imported).
- Policy: **last-write-wins on the server, replace-on-pull on the client.** Documented limitation: concurrent two-device edits can lose one push — acceptable for a study app.
- Sign-in replaces local state with the account's remote state; an explicit opt-in path merges guest data on first migration.

> 🎙️ *Say: "The frontend never talks to a database — only to a two-method interface, pull/push, with a no-op version when there's no backend." Then own the tradeoff: last-write-wins is simple and right for a study app; audiences respect an admitted limitation more than a hidden one.*

### Component organization

```
src/components/app|auth|cert|filters|history|quiz|review|ui (+ icons/)
src/views/             route-level components only
src/texts/en.ts        all user-facing copy
src/components/icons/  all SVG, never inline
src/styles/tokens.css  single source of truth for theme variables
src/types.ts           single schema source of truth
```

Feature folders grouped by consumer; `ui/` holds true primitives; no barrel files; relative imports only.

> 🎙️ *Say: folders follow consumers, not file types — `quiz/` belongs to the session screen, `review/` to review, `ui/` to everyone. Copy in `en.ts`, icons in `icons/`, theme vars in `tokens.css` is what keeps dark mode and i18n cheap.*

### Deliberate architecture choices

| Choice | Reason |
|---|---|
| Hash router (`createWebHashHistory`) | static files work on any host with no SPA-rewrite rules |
| No runtime cert upload | certs ship built-in, requested via GitHub issue — avoids IndexedDB/validation/abuse complexity |
| Validator reports, never patches | silent auto-fix hides data corruption |
| 6-char password floor | accounts guard quiz history, not money; SRP + no-enumeration + email verification carry the weight |
| Local-first, account optional | every feature works without an account |

> 🎙️ *Say: don't read the table — tell one story. The hash router looks "old-school" but it's what lets static hosting work anywhere with zero rewrite rules. "Every row here is a mistake we chose not to make twice."*

---

## 2. DevOps

### CI — 7 parallel jobs (`.github/workflows/ci.yml`, Node 22)

`lint` → `typecheck (vue-tsc)` → `test (Vitest + jsdom)` → `knip` (dead code) → `e2e (Playwright + fake-auth)` → `build` → `audit (high)`.

Concurrency `cancel-in-progress`, `npm ci`, Dependabot bumps, Husky pre-commit hooks. Local rule: `lint && typecheck && test` green before work counts as done.

> 🎙️ *Say: seven jobs, all parallel, all blocking — and the pipeline is the real reviewer when AI writes code.*

### Testing

- Colocated unit tests (`*.test.ts` next to code); behavior over copy — *"test the what, not the how."*
- E2E via Playwright against the production preview server. `VITE_E2E_FAKE_AUTH=true` swaps `services/auth` for `auth.fake.ts` through a Vite alias, and a parity test asserts both expose the same API so the swap can't drift.

> 🎙️ *Say: quote the philosophy — "test the what, not the how." Then the clever bit: E2E runs against a fake auth module, with a parity test so the fake can't drift from the real thing. That detail earns credibility.*

### Infrastructure as code — one `template.yaml` (SAM/CloudFormation)

- **Identity:** Cognito User Pool (email login, SRP, `PreventUserExistenceErrors`) + app client.
- **Sync:** HTTP API with Cognito JWT authorizer → `pull` / `push` Lambdas (`src/lambda/`, Node 22, arm64) → DynamoDB single table (`PK=user`, `SK=progress|history`), on-demand billing, point-in-time recovery. Pull gets read-only IAM, push write-only.
- **Hosting:** private S3 bucket (Origin Access Control) + CloudFront (`quiz-cert.com` + `www`, ACM cert, `index.html` fallback on 403/404, compression, `PriceClass_100`).
- **Config:** SAM outputs → local `.env.local` (`VITE_COGNITO_*`, `VITE_SYNC_API_URL`); no secrets in the repo. Missing vars degrade gracefully: no Cognito = local-only, no sync URL = auth without sync.
- **Deploy:** `sam build && sam deploy` for the backend; `npm run deploy:site` (S3 sync + CloudFront invalidation) for the frontend. CORS allowlist = production domains + `localhost:5173/4173`; API throttled at 10/20 req/s.

> 🎙️ *Say: "One file owns all of AWS." Walk it top-down in 30 seconds: Cognito for who-you-are → API Gateway checks the JWT → two tiny Lambdas → one DynamoDB table keyed by user. Least privilege in one line: pull reads, push writes, nothing more.*

### Cost

~$0 at personal scale: Cognito Lite 10k free MAU, DynamoDB 25 GB free + on-demand pennies, Lambda 1M requests free, API Gateway 1M requests free for 12 months.

> 🎙️ *Say: this is your laugh line — "My AWS bill for all of this is essentially zero." It lands every time.*

---

## 3. AI workflow

### The three files that run the robots

| File | Role |
|---|---|
| `AGENTS.md` | Tool-agnostic agent context: stack, commands, layout, 7 inviolable architecture rules, testing philosophy, conventions (strict TS, comment-free source, colocated tests, agent never touches git) |
| `SKILL.md` | Maintainer tool (not a user feature): converts a raw exam dump into bundle JSON. **Rule #1: stop and ask — never guess, never force-fit, never silently drop data**, plus a pre-return checklist |
| `docs/` (`DATA-MODEL.md`, `FEATURES.md` incl. *Deliberate non-features*, `AWS-BACKEND.md`, `AWS-SETUP.md`) | Human-facing rationale — design reasoning lives here, not in code comments |

> 🎙️ *Say: `AGENTS.md` is the employee handbook any AI must obey, `SKILL.md` is the recipe with "stop and ask" as rule #1, `docs/` is the company memory — the why, never the what.*

### The verification loop

```
Human requests cert (GitHub issue)
  → any LLM + SKILL.md → candidate JSON
  → schemaValidator (unit-tested) → pass or human-readable errors
  → PR adds JSON + manifest entry → CI (lint/typecheck/test/knip/e2e/build/audit)
  → auto-discovered on next deploy, no code changes
```
```

> 🎙️ *Say: walk it like an assembly line — "AI proposes, machines dispose." Human requests, any LLM drafts, the validator judges, CI re-judges everything.*

### Why AI is safe here

- Contracts are machine-checkable: `types.ts` + `schemaValidator` + CI.
- Bad bundles are excluded by the router, never patched.
- The *Deliberate non-features* list stops agents re-proposing upload, auto-fix, or server-side AI formatting.
- The `auth.fake` parity test stops E2E drift.
- Recent agent-executed work under these rules: CLF-C02 addition and the `components/` reorganization (flat root → `app/auth/cert/filters/history/quiz/review/ui`, full suite re-greened).

> 🎙️ *Say: four guardrails in 20 seconds — machine-checkable contracts, bad data excluded never patched, a written non-goals list, and real proof: the last two contributions were agent-executed under these rules.*

---

## Key documents

| Document | Contents |
|---|---|
| `AGENTS.md` | agent context, architecture rules, conventions |
| `SKILL.md` | exam-dump → JSON conversion spec |
| `docs/DATA-MODEL.md` | cert-bundle + user-progress schema |
| `docs/FEATURES.md` | feature matrix, Phase 1 checklist, non-features |
| `docs/AWS-SETUP.md` | backend deploy guide, conflict policy, cost |
| `docs/AWS-BACKEND.md` | backend background and resolved decisions |

## Takeaways

1. **Data as versioned JSON > hardcoded features** — a new certification is one file, not a feature.
2. **Local-first with opt-in cloud** beats account-walled — every feature works offline without signing up.
3. **One SAM file + static hosting** = explainable, ~$0 DevOps.
4. **AI scales only with machine-checkable contracts** (types + validator + CI) and explicit non-goals.

> 🎙️ *Say: read the four takeaways slowly, one by one — they're your applause lines. Close with: "The code is the easy part. The contracts around it are the project."*

