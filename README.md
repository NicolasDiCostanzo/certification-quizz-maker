# certification-quizz-maker

A certification-agnostic quiz web app for exam preparation. Ships with the **AWS Certified Developer – Associate (DVA-C02)** question bank built in; other certifications are added as new built-in bundles — request one via a GitHub issue.

Built with **Vue 3 + TypeScript + Vite**. Fully static, hostable anywhere, local-first — no backend or account required.

## Highlights

- **Cert-agnostic by design** — all exam-specific data (questions, themes, weights, passing score, time limit) lives in interchangeable JSON files. The app adapts its UI to whatever certification is loaded.
- **DVA-C02 included** — 555 real exam questions, tagged by topic, services, concepts, and question types.
- **Want another certification?** — open a GitHub issue to request it. A maintainer or contributor converts the exam using `SKILL.md` and ships it as a new built-in bundle.
- **Local-first progress** — quiz history, wrong answers, and flagged questions are stored in your browser. Export/import as a JSON file for backup. No account needed.
- **Dark / light mode** — the UI follows your OS appearance setting automatically, no toggle needed.
- **Replay modes** — practice only what you got wrong, only flagged questions, only unattempted ones, or sample by the real exam's domain weights. Questions are always shuffled. Two modes: **Preparation** (no timer, immediate feedback) and **Exam** (timed, deferred feedback, real-exam simulation preset).

## Documentation

| Document | Contents |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | Context file for any AI coding agent (tool-agnostic): stack, commands, architecture rules, conventions |
| [`SKILL.md`](./SKILL.md) | AI-facing spec for maintainers/contributors: how to convert a raw exam dump into the app's JSON format when a new cert is requested |
| [`docs/DATA-MODEL.md`](./docs/DATA-MODEL.md) | Cert-bundle JSON schema + user-progress schema |
| [`docs/FEATURES.md`](./docs/FEATURES.md) | Full feature matrix, Phase 1 implementation checklist, deliberate non-features |

## Getting started

```bash
npm install
npm run dev
```

The app starts on the cert-selector home screen with DVA-C02 preloaded. From there you can start a quiz, configure filters (include/exclude themes), or open a GitHub issue if you want a certification that isn't listed.

### Building for production

```bash
npm run build    # outputs static files to dist/
npm run preview  # serves the production build locally
```

## Adding a new certification

There is no in-app upload. To add a certification:

1. Open a GitHub issue requesting it. If you already have the questions formatted as JSON per `docs/DATA-MODEL.md`, attach it — that's enough for a maintainer to add it directly.
2. Otherwise, if you have the raw questions (e.g. an ExamTopics dump as a `.txt` file), you can convert them yourself: give `SKILL.md` to any LLM of your choice together with your questions, and it returns the formatted JSON. Attach that to the issue, or open a PR adding it as `src/assets/<CODE> questions.json` directly.
3. A maintainer validates the JSON and merges it. Since built-in certs are auto-discovered at build time, it's picked up automatically on the next deploy — no other code changes needed.

## Project layout

```
.
├── SKILL.md                  # AI authoring spec for converting a requested exam into a cert-bundle JSON
├── docs/                     # Human-facing technical documentation
├── index.html                # Vite entry
├── vite.config.ts
└── src/                      # The Vue app
    ├── types.ts              # Shared TypeScript interfaces
    ├── stores/                # Pinia stores (progress)
    ├── composables/           # Quiz loader & related composables
    ├── utils/                 # Schema validator and other pure helpers
    ├── components/            # Cert selector, quiz UI
    └── assets/                # Built-in cert JSON (DVA-C02, and any future cert)
```

## Roadmap

- **Phase 1 (current)** — local-first data layer, cert management, progress, replay modes.
- **Phase 2 (planned)** — optional AWS backend (Cognito + API Gateway + Lambda + DynamoDB) for cloud progress sync across devices. Fully opt-in: quiz-taking never requires an account.

## License

See [LICENSE](./LICENSE).
