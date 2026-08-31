# certification-quizz-maker

A certification-agnostic quiz web app for exam preparation. Ships with the **AWS Certified Developer – Associate (DVA-C02)** question bank built in; any other certification can be added by uploading a JSON file — no code changes required.

Built with **Vue 3 + TypeScript + Vite**. Fully static, hostable anywhere, local-first — no backend or account required.

## Highlights

- **Cert-agnostic by design** — all exam-specific data (questions, themes, weights, passing score, time limit) lives in interchangeable JSON files. The app adapts its UI to whatever certification is loaded.
- **DVA-C02 included** — 555 real exam questions, tagged by topic, services, concepts, and question types.
- **Bring your own exam** — have questions in a `.txt` file? Download the built-in authoring guide (`SKILL.md`), give it to any LLM together with your questions, and upload the JSON it returns. The app provides the skill and consumes JSON; the conversion happens in your LLM.
- **Local-first progress** — quiz history, wrong answers, and flagged questions are stored in your browser. Export/import as a JSON file for backup. No account needed.
- **Replay modes** — practice only what you got wrong, only flagged questions, only unattempted ones, or sample by the real exam's domain weights. Questions are always shuffled. Two modes: **Preparation** (no timer, immediate feedback) and **Exam** (timed, deferred feedback, real-exam simulation preset).

## Documentation

| Document | Contents |
|---|---|
| [`SKILL.md`](./SKILL.md) | AI-facing spec: how to convert a raw exam dump into the app's JSON format *(to be written — Phase 1 deliverable)* |
| [`docs/DATA-MODEL.md`](./docs/DATA-MODEL.md) | Cert-bundle JSON schema + user-progress schema |
| [`docs/FEATURES.md`](./docs/FEATURES.md) | Full feature matrix, Phase 1 implementation checklist, deliberate non-features |

## Getting started

```bash
npm install
npm run dev
```

The app starts on the cert-selector home screen with DVA-C02 preloaded. From there you can start a quiz, configure filters (include/exclude themes), or upload another certification.

### Building for production

```bash
npm run build    # outputs static files to dist/
npm run preview  # serves the production build locally
```

## Adding a new certification

Two paths:

1. **You already have JSON** (formatted per `docs/DATA-MODEL.md`) — drop it into the app via the upload screen. It's validated, saved in your browser (IndexedDB), and appears alongside DVA-C02.

2. **You have questions in a `.txt` file** (e.g. an ExamTopics dump) — download or copy `SKILL.md` from the upload screen, give it to any LLM of your choice together with your `.txt`, and get the formatted JSON back. Then upload that JSON to the app: it's validated and saved. The `.txt` never touches the app.

## Project layout

```
.
├── SKILL.md                  # AI authoring spec (to be created; bundled into the app)
├── docs/                     # Human-facing technical documentation
├── index.html                # Vite entry
├── vite.config.ts
└── src/                      # The Vue app
    ├── types.ts              # Shared TypeScript interfaces (to be created)
    ├── stores/               # Pinia stores (progress) (to be created)
    ├── composables/          # Quiz loader & related composables (to be created)
    ├── utils/                # Validator, IndexedDB wrapper (to be created)
    ├── components/           # Cert selector, upload, quiz UI
    └── assets/               # Built-in cert JSON (DVA-C02)
```

## Roadmap

- **Phase 1 (current)** — local-first data layer, cert management, upload, progress, replay modes.
- **Phase 2 (planned)** — optional AWS backend (Cognito + API Gateway + Lambda + DynamoDB) for cloud progress sync across devices. Fully opt-in: cert upload and quiz-taking never require an account.

## License

See [LICENSE](./LICENSE).
