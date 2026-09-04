# Features

Single source of truth for every feature discussed for this project, with its current status. Doubles as the Phase 1 implementation checklist.

**Status legend:**

- ✅ **Documented** — specified in these docs; ready to implement.
- 🔜 **Planned** — agreed, Phase 2 or a later layer; specified where relevant.

---

## Certification management

| Feature | Status |
|---|---|
| Cert-agnostic app: all exam-specific data in JSON, generic mechanics in code | ✅ |
| DVA-C02 (555 questions) as the default seed cert for all users | ✅ |
| Built-in certs auto-discovered at build time (`import.meta.glob`); this is the **only** way a cert bundle enters the app — no runtime upload, no client-side storage of bundles | ✅ |
| Cert-selector home screen with per-cert cards (name, code, bank size, real-exam question count, time limit, weights breakdown, passing score, instructions text) | ✅ |
| Cert switching isolates everything per cert (themes, topics, metadata, progress) | ✅ |
| In-app notice on the cert-selector screen: a cert that isn't built in yet is requested by opening a GitHub issue, not uploaded at runtime | ✅ |
| SKILL.md: AI authoring spec with stop-and-ask rule (never guess, never force-fit, never silently drop data) — a **maintainer/contributor tool**, not an end-user upload flow: whoever picks up a requested cert converts the raw exam dump with SKILL.md and an LLM of their choice, then opens a PR adding the resulting JSON as a new `src/assets/<CODE> questions.json`, picked up automatically by the build-time discovery above | ✅ |

## Quiz configuration

| Feature | Status |
|---|---|
| Theme include filters (only questions tagged with selected values) | ✅ |
| Theme exclude filters (drop questions tagged with selected values) | ✅ |
| Filter labels and values derived from each cert's `themes` registry (no hardcoded groups) | ✅ |
| Topic selection (subset of the cert's topics) | ✅ |
| Exam-ratio sampling proportional to `exam.weights`; uniform fallback when weights absent | ✅ |
| Questions are always presented in random order (no user setting) | ✅ |
| Custom question count (or "all") | ✅ |
| **Exam mode** — countdown timer enforcing `exam.timeLimitMinutes`; answer feedback deferred to the end; default preset is the real-exam simulation (`exam.totalQuestions` questions sampled by `exam.weights`) | ✅ |
| **Preparation mode** — no timer; immediate per-question feedback (correct/incorrect + explanation after answering) | ✅ |
| Replay mode: all questions | ✅ |
| Replay mode: only questions I got wrong (`timesWrong > timesCorrect`) | ✅ |
| Replay mode: only flagged questions | ✅ |
| Replay mode: only unattempted questions | ✅ |
| Replay modes compose with theme/topic filters and exam-ratio | ✅ |
| Multi-select questions render as checkboxes; single-select as radio (derived from `answers` type) | ✅ |
| Questions with `promptImages` display the images above the options; per-option images render inline via markdown | ✅ |
| Quiz timer enforcing `exam.timeLimitMinutes` — **exam mode only** (never in preparation mode) | ✅ |

## User progress

| Feature | Status |
|---|---|
| Per-question progress: attempts, timesCorrect, timesWrong, flagged, lastSeenAt | ✅ |
| Progress stored in localStorage via Pinia + `pinia-plugin-persistedstate`; survives refresh | ✅ |
| Progress keyed by `exam.code` — multiple certs coexist without mixing | ✅ |
| Flag/unflag a question during a quiz | ✅ |
| Flag button on the question screen in **both** modes (like real exams' "mark for review"); review screen allows flagging too | ✅ |
| Export progress as a versioned JSON file (protection against browser-data clearing) | ✅ |
| Import progress with merge (per-question, newest `lastSeenAt` wins) | ✅ |
| Optional cloud sync across devices via Cognito + API Gateway + Lambda + DynamoDB | 🔜 Phase 2 |
| Accounts strictly opt-in; guest users see no auth UI and lose no functionality | 🔜 Phase 2 |

---

## Phase 1 implementation checklist

Implementation order (each step depends on the previous):

✅ Test harness setup (Vitest)
✅ SKILL.md — AI authoring spec
✅ src/types.ts — shared interfaces
✅ src/utils/schemaValidator.ts — validator + isQuestionAnswerable
✅ src/utils/markdownImage.ts — inline ![alt](url) parsing
✅ src/composables/useQuizLoader.ts — build-time cert discovery/validation
✅ src/stores/userProgress.ts — Pinia store (attempts/correct/wrong/flag, export/import)
✅ Router + app shell — vue-router, remove HelloWorld.vue boilerplate, nav guard
✅ CertSelectorView.vue — home screen + "request a cert via GitHub issue" notice
✅ Manual light/dark theme toggle + real style.css
✅ src/utils/sampling.ts — exam-ratio-weighted question sampling
✅ src/utils/filterPool.ts — theme include/exclude (AND/OR) + replay-mode filtering
✅ QuizConfigureView.vue — filters, mode, count, replay-mode UI
✅ src/stores/quizSession.ts — active quiz session state (sessionStorage-persisted)
✅ src/utils/scoring.ts — pass/fail + projected scaled score
✅ QuizSessionView.vue — question rendering, timer, flag, feedback
✅ QuizReviewView.vue — score banner, per-question review
✅ Visual polish pass (transitions, cross-screen consistency)
☐ Final integration (build/typecheck/lint/test green + full manual smoke test)

## Deliberate non-features

Recorded so they aren't re-proposed later without revisiting the reasoning:

- Mandatory accounts or any auth wall for basic use.
- Server-side storage of cert bundles in Phase 1.
- Runtime cert upload and client-side (IndexedDB) storage of uploaded bundles by end users — dropped as too much complexity for the value; a cert not yet built in is requested via a GitHub issue and shipped as a new built-in bundle instead.
- Auto-fixing invalid cert JSON — errors are reported (surfaced to whoever is adding the bundle), never silently patched.
- Force-fitting unsupported question types (drag-and-drop, matching, simulations) — SKILL.md and the validator reject them instead.
- Automated or server-side AI formatting of exam dumps — conversion is always manual: whoever picks up a requested cert runs SKILL.md through an LLM of their choice, then submits the resulting JSON as a PR.
- Sharing certs between users — moot now that certs ship as built-ins available to everyone; no per-user cert sharing mechanism is needed.
