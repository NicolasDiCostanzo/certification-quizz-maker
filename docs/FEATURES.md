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
| Built-in certs auto-discovered at build time (`import.meta.glob`) | ✅ |
| Upload a pre-formatted cert-bundle JSON at runtime | ✅ |
| Uploaded certs stored in IndexedDB; deletable; built-ins are not | ✅ |
| Uploaded cert shadows a built-in with the same `exam.code` | ✅ |
| Cert-selector home screen with per-cert cards (name, code, bank size, real-exam question count, time limit, weights breakdown, passing score, instructions text) | ✅ |
| Cert switching isolates everything per cert (themes, topics, metadata, progress) | ✅ |
| SKILL.md: AI authoring spec with stop-and-ask rule (never guess, never force-fit, never silently drop data) | ✅ (spec'd; file itself is a Phase 1 deliverable) |
| SKILL.md is retrievable by the end user from within the app: bundled at build time (Vite `?raw` import) and offered on the upload screen with **copy-to-clipboard** and **download** buttons — no server needed, travels with every deployment | ✅ |
| Conversion flow (fully external): the user has questions in a `.txt` file; they upload it to any LLM of their choice **together with the SKILL.md provided by the app**; the LLM returns the JSON; the user uploads that JSON to the app, where it is validated and saved. The `.txt` never touches the app — the app only delivers SKILL.md and consumes JSON | ✅ |

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

1. ☑ `SKILL.md` — AI authoring spec (Rule #1 stop-and-ask, schema, taxonomies, worked example, DVA-C02 reference)
2. ☐ `src/types.ts` — all shared interfaces
3. ☑ Migrate `src/assets/DVA-C02 questions.json` to the cert-bundle schema (555 questions preserved; validate JSON) — done via `scripts/migrate-cert-bundle.py`; 8 image-source questions (75, 139, 235, 441, 452, 481, 501, 541) intentionally keep empty options until real content is authored
4. ☐ `src/utils/schemaValidator.ts` — pure validator
5. ☐ `src/stores/userProgress.ts` — Pinia store with `persist: true`, export/import
6. ☐ `src/utils/certStorage.ts` — IndexedDB wrapper
7. ☐ `src/composables/useQuizLoader.ts` — build-time + IndexedDB discovery, merge, selection
8. ☐ `src/components/CertSelector.vue` — home screen
9. ☐ `src/components/UploadCert.vue` — JSON upload + SKILL.md delivery for external LLM conversion (copy/download via `?raw`)
10. ☐ `src/main.ts` + `package.json` — Pinia + persistedstate wiring
11. ☐ `npm install` && `npm run build` passes
12. ☐ Smoke test: DVA-C02 loads with 555 questions, 4 topics, 3 theme groups; upload/validate/delete cycle works; progress survives refresh; export→import round-trips

## Deliberate non-features

Recorded so they aren't re-proposed later without revisiting the reasoning:

- Mandatory accounts or any auth wall for basic use.
- Server-side storage of cert bundles in Phase 1.
- Auto-fixing invalid cert JSON on upload — errors are reported, the user decides.
- Force-fitting unsupported question types (drag-and-drop, matching, simulations) — SKILL.md and the validator reject them instead.
- Automated or server-side AI formatting of exam dumps — conversion is always manual: the user uploads their questions set and SKILL.md guides their own LLM to convert it into the JSON format the app expects.
- Sharing certs between users — possible future Phase 2+ item, not committed.

