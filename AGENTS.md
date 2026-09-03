# AGENTS.md — context for AI coding agents

This file gives any LLM / coding agent (Claude Code, Codex, Cursor, Cline, Gemini CLI, Zed, …) the context it needs to work on this repository. Read it before making changes.

## What this project is

**certification-quizz-maker** — a cert-agnostic quiz web app for exam preparation. Fully static (no backend, no accounts), local-first: progress lives in the browser's localStorage. Ships with the AWS Certified Developer – Associate (DVA-C02) question bank (555 questions) built in; other certifications are added as new built-in JSON bundles (see "Adding a certification" below).

## Tech stack

- **Vue 3** (Composition API, `<script setup lang="ts">`) + **TypeScript** (strict) + **Vite**
- **Pinia** for state, with `pinia-plugin-persistedstate` for localStorage persistence
- **Vue Router 5** with **hash history** (`createWebHashHistory`) — deliberate: the app is static files with no backend, so deep links must work on any host without SPA-fallback rewrites. Don't switch to HTML5 history mode.
- **Vitest** (jsdom environment) + `@vue/test-utils` for tests
- **ESLint** (flat config, `eslint-plugin-vue` + `@vue/eslint-config-typescript`)
- **Husky** pre-commit hooks
- **Dark/light mode** — dark by default, with a manual two-state sun/moon switch (`App.vue` header) persisted in the `userPreferences` Pinia store: it sets `data-theme` to `dark`/`light` on `<html>` (via `useThemeMode`), and `src/styles/tokens.css` (the single source of truth for theme tokens, imported by `src/style.css`). New styles must use those custom properties (`--text`, `--text-h`, `--bg`, `--border`, `--accent`, `--accent-bg`, `--shadow`, …) instead of hardcoded colors so both themes keep working. User-facing strings live in `src/texts/en.ts`, SVG icons in `src/components/icons/`, never inline in components.

## Commands

```bash
npm install          # install
npm run dev          # dev server
npm run build        # vue-tsc -b && vite build → dist/ (type-checks as part of build)
npm run preview      # serve the production build
npm run typecheck    # vue-tsc -b --noEmit
npm run lint         # eslint .
npm run lint:fix     # eslint . --fix
npm run test         # vitest run (single pass)
npm run test:watch   # vitest watch
```

CI (`.github/workflows/ci.yml`, Node 22) runs **lint, typecheck, test, build, and `npm audit --audit-level=high`** on every PR — run `npm run lint && npm run typecheck && npm run test` locally before considering work done.

## Project layout

```
index.html                  Vite entry
src/
  main.ts                   App bootstrap: Pinia (+ persistedstate plugin) + router
  App.vue
  types.ts                  ALL shared TypeScript interfaces (cert bundle, progress, quiz config/session) — the schema source of truth in code
  router/index.ts           Hash-history router; route guard redirects unknown :certCode to home
  views/                    Route-level components: CertSelectorView, QuizConfigureView, QuizSessionView, QuizReviewView
  stores/userProgress.ts    Pinia store: per-question progress keyed by exam code; export/import with merge
  composables/useQuizLoader.ts  Build-time cert discovery (import.meta.glob) + validation
  utils/schemaValidator.ts  Pure cert-bundle validator (+ isQuestionAnswerable); has tests
  utils/markdownImage.ts    Per-option inline image rendering helper
  assets/                   Built-in cert bundles: "<CODE> questions.json" (DVA-C02 today)
docs/
  DATA-MODEL.md             Full cert-bundle + user-progress schema spec
  FEATURES.md               Feature matrix / Phase 1 checklist / deliberate non-features
SKILL.md                    AI spec for converting a raw exam dump into a cert-bundle JSON
```

## Core architecture rules (don't break these)

1. **Cert bundles enter the app one way only**: a JSON file matching `/src/assets/*questions.json`, discovered at **build time** via `import.meta.glob` in `useQuizLoader.ts`. There is **no runtime upload and no client-side storage of bundles** — this was a deliberate design decision (see "Deliberate non-features" in `docs/FEATURES.md`); don't re-propose it.
2. **Everything exam-specific lives in the JSON bundle** (questions, themes, topics, weights, passing score, time limit). App mechanics are generic. Never hardcode a certification's data (theme group names like `services`/`concepts`/`questionTypes` are data, not code).
3. **A bundle failing validation is excluded and logged**, never auto-fixed. The validator reports errors; it does not silently patch them (`docs/FEATURES.md`, non-features).
4. **Progress is keyed by `exam.code`** (`byExamCode` in the Pinia store), so multiple certs coexist without mixing. Export format is versioned (`format: 'quiz-progress'`, `version: 1`); import merges per-question, newest `lastSeenAt` wins.
5. **Two quiz modes**: `preparation` (no timer, immediate feedback) and `exam` (countdown from `exam.timeLimitMinutes`, deferred feedback). Unanswered questions always count as incorrect in both modes. Scoring rules, including the scaled-score linear-projection disclaimer requirement, are specified in `docs/DATA-MODEL.md` — follow them exactly when touching scoring/UI.
6. **Questions are always shuffled**; there is no user setting for order.
7. **Deliberate non-features** are recorded in `docs/FEATURES.md` (no mandatory accounts, no runtime cert upload, no auto-fixing invalid JSON, no force-fitting drag-and-drop/matching questions, no server-side AI formatting). Revisit the reasoning before proposing any of them.

## Testing philosophy

When writing tests for this project, focus on **major and crucial behavior**. Do not write tests for trivial stuff like checking the text in an element.

**Worth testing (behavior):**
- Scoring logic, pass/fail thresholds, projected scaled scores
- Filter composition (AND/OR semantics, exclude logic, replay modes)
- Session state transitions (start → answer → finish → review)
- Answer correctness (single vs multi-select, deduplication)
- Data validation (cert-bundle schema rules)

**Not worth testing (implementation details):**
- That a specific label string renders in a DOM element (e.g. `expect(wrapper.find('h1').text()).toContain('Some Title')`)
- That a button has a certain CSS class
- That a component renders the right number of children
- That a specific HTML structure is used

If a test would break only by changing copy (not behavior), it's too trivial. Test the *what*, not the *how*.

## Adding a certification

There is no in-app upload. A new cert = a new `src/assets/<CODE> questions.json` bundle. Raw exam dumps are converted by an LLM using the root **`SKILL.md`** (a maintainer/contributor spec with a strict stop-and-ask rule: never guess, never force-fit, never silently drop data). If your task is "convert these questions" or "add cert X", read `SKILL.md` first and follow it; the resulting JSON must pass `src/utils/schemaValidator.ts` (validate via `npm run test`, which covers the validator).

Known quirk: questions with no non-empty `options` are kept in the bundle but excluded from the active quiz pool by `isQuestionAnswerable` (the loader's `activePool()` filters them out, and the validator emits a warning). The DVA-C02 bank currently has zero such questions — but if you see the warning for a newly added bundle, it's expected behavior, not a bug: author the missing options rather than deleting the questions.

## What the agent should do

### Scope
The agent may modify any file in the repository, including CI configuration (`.github/workflows/`) and dependencies (`package.json`). There is no restricted directory.

### Git
The agent **must not** interact with the git repository: no `git add`, `git commit`, `git push`, or any other git command. When a unit of work is complete and ready for review, tell the user what was changed and that it should be committed.

### When things go wrong
- **Test failures / bugs:** stop and ask the user. Do not unilaterally decide whether to fix the code or the tests.
- **Conflicting instructions:** if the user requests something that violates an architecture rule (section "Core architecture rules" below), warn the user and ask for confirmation before proceeding.

### Output
Explain changes briefly and clearly. The user will ask for more detail if needed — lead with the essentials.

### TODO / FIXME comments
`TODO` and `FIXME` markers are acceptable in code. The comment-free convention below applies to design rationale, not task tracking.

## Conventions

- TypeScript strict; shared types live in `src/types.ts` — extend them there rather than redefining interfaces locally.
- Tests are colocated with the code (e.g. `src/stores/userProgress.test.ts`, `src/router/index.test.ts`) using Vitest; add/adjust tests for behavior changes.
- `src/assets/**` is ESLint-ignored (the question banks are data, not code).
- Source files are kept **comment-free**: design rationale lives in `AGENTS.md`, `docs/`, and `SKILL.md` — don't add explanatory comments to code, put new rationale in the docs instead.
- Branch naming follows `feat/…` style; commits go through Husky hooks.

## First session

After reading this file, read `docs/FEATURES.md` for the current project state and Phase 1 checklist. Then follow the routing table below for the task at hand.

## Where to look first

- Schema questions (any JSON field, scoring rules) → `docs/DATA-MODEL.md`
- What a feature should do / status → `docs/FEATURES.md`
- Converting an exam dump → `SKILL.md`
- Bundle validation rules → `src/utils/schemaValidator.ts` + its tests
