# Data Model

This document specifies the two data structures the app works with: the **cert bundle** (a certification's questions and metadata) and **user progress** (per-question stats).

---

## Cert bundle

One JSON file per certification, named `<CODE> questions.json` (e.g. `DVA-C02 questions.json`). The app auto-discovers all files matching `/src/assets/* questions.json` at build time, and accepts additional bundles at runtime via the upload screen (stored in IndexedDB).

### Top-level shape

```jsonc
{
  "version": 2,                        // schema version, integer
  "exam": { },                         // ExamInfo (required)
  "themes": { },                       // taxonomy registry (required)
  "questions": [ ]                     // Question[] (required, non-empty)
}
```

### `exam` — ExamInfo

Metadata about the certification itself. Displayed on the home screen and used for exam-ratio sampling and scoring.

```jsonc
{
  "exam": {
    "name": "AWS Certified Developer - Associate",
    "code": "DVA-C02",
    "totalQuestions": 65,
    "timeLimitMinutes": 130,
    "passingScore": {
      "passingScore": 720,
      "scale": 1000
    },
    "weights": {
      "Development with AWS Services": 32,
      "Deployment": 24,
      "Security": 26,
      "Troubleshooting and Optimization": 18
    },
    "instructions": "You have 130 minutes to complete 65 questions..."
  }
}
```

**Field rules:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | ✅ | Full display name. |
| `code` | string | ✅ | Short unique code (`DVA-C02`, `SAA-C03`, `CKAD`). Used as the progress-storage key and file-name prefix. |
| `totalQuestions` | number | ✅ | Question count on the **real** exam (not the bank size). Used by the exam-mode default preset. |
| `timeLimitMinutes` | number | ✅ | Real exam duration. Used only by exam mode's countdown timer. |
| `passingScore.passingScore` | number | ✅ | Score needed to pass. A raw percentage (0–100) when `scale` is absent; a scaled score (e.g. out of 1000) when `scale` is present. |
| `passingScore.scale` | number | optional | Max scale (e.g. `1000` for AWS scaled scores). Omit for percentage-based certs — `passingScore` is then itself the pass percentage. The pass percentage is always computed as `passingScore / scale`. |
| `weights` | `Record<string, number>` | optional | Keys **must** be topic names used on questions; values are percentages summing to 100. Omit if the cert has no published domain weights — the app then samples uniformly. |
| `instructions` | string | optional | Free-text instructions shown on the home screen. |

### Session scoring

How a quiz session's raw `timesCorrect` / `totalAnswered` maps onto `exam.passingScore`:

1. Compute `percentCorrect = timesCorrect / totalAnswered * 100`.
2. **Pass/fail** is always decided from `percentCorrect` against the pass threshold expressed as a percentage: `passingScore / scale * 100` when `scale` is present, or `passingScore` itself when `scale` is absent (percentage-based certs).
3. When `passingScore.scale` is present, additionally display a **projected scaled score**: `round(percentCorrect / 100 * passingScore.scale)` (e.g. 75% correct on DVA-C02 → a displayed "750 / 1000"). This is a **linear projection**, not a reproduction of the certification's real scoring.
4. Whenever a projected scaled score is shown, the UI must attach a visible disclaimer next to it, e.g.:

   > \* This is a linear projection of your percentage correct onto {examName}'s scale, shown for reference only. Real certification exams score with an undisclosed, difficulty-weighted algorithm (often item-response theory) that varies per certification and cannot be reproduced here — this number has no guaranteed relationship to the score {examName} would actually give you.

5. **Unanswered questions in exam mode count as incorrect** — `totalAnswered` is the session's full question count (the real-exam rule). In preparation mode a session only ends when every question has been answered, so `totalAnswered` is simply the number of answers given.

No such disclaimer is needed for percentage-based certs (no `scale`), since there `percentCorrect` already **is** the number the cert defines.

### `themes` — taxonomy registry

A dictionary mapping **theme groups** to their possible **values**. Each key is also the key used inside a question's nested `themes` object (`"services"`, `"concepts"`, `"questionTypes"` in the built-in bank — see `questions[]` below); the key becomes the filter-group label in the UI and its values become the filter options.

```jsonc
{
  "themes": {
    "services":      ["dynamodb", "lambda", "s3"],
    "concepts":      ["encryption", "caching"],
    "questionTypes": ["troubleshooting", "most-secure"]
  }
}
```

- Keys are free-form strings — they are **not** hardcoded. A networking cert might use `"protocols"`, `"osiLayers"`, `"devices"`. A PMP cert might use `"processGroups"`, `"knowledgeAreas"`. Use lowerCamelCase so the key reads naturally as a question field name.
- The app renders one filter group per key, using the key as the label.
- Every value referenced by a question **should** exist in this registry. The validator warns if a question references an unknown value (it does not hard-fail — new values discovered while authoring are allowed, but the registry should be updated in the same pass).


### `questions[]` — Question

```jsonc
{
  "id": "1",
  "question": "A company is implementing ...",
  "options": ["...", "...", "...", "..."],
  "answers": "C",
  "topic": "Security",
  "url": "https://www.examtopics.com/...",
  "promptImages": ["https://...", "data:image/..."],
  "explanation": "Why C is correct and the other options are wrong.",
  "themes": {
  "services": ["ssm", "secrets-manager", "kms"],
  "concepts": ["encryption", "secrets-management"],
  "questionTypes": ["architecture-decision", "multi-step-scenario"]
  }
}
```

**Field rules:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | ✅ | Unique within the file. Stable across re-generations. |
| `question` | string | ✅ | Full prompt. Unicode preserved. |
| `options` | string[] | ✅ | 2–5 entries. No `A. ` prefixes — the app renders letters. Inline images inside an option are markdown (`![...](...)`). |
| `answers` | string \| string[] | ✅ | Single letter (`"C"`) for single-select; array (`["B","D"]`) for multi-select. Every letter must be within the `options` range. |
| `topic` | string | ✅ | One primary topic. If `exam.weights` exists, must be one of its keys. |
| `explanation` | string | optional | Rationale for the correct answer. Shown as immediate feedback in preparation mode and on the end-of-quiz review screen in both modes. |
| `url` | string | optional | Source/discussion link. Omit the field entirely if unavailable (never `null` or `""`). |
| `promptImages` | string[] | optional | Images referenced **by the question prompt** (diagrams, screenshots). URLs or data URIs. Per-option images do **not** go here — they are inline markdown in `options`. |
| `themes` | object | optional | Nested object keyed by this cert's theme-group names (the keys of the top-level `themes` registry above — `services`/`concepts`/`questionTypes` for DVA-C02, something else for another cert). Each value is an array of strings drawn from that group's registry. Omit a sub-array entirely when it doesn't apply to this question (never `[]`); omit the whole `themes` object when the question has no tags at all. Unknown values are a validator warning, not an error (see below). |

### DVA-C02 canonical themes (reference)

The built-in DVA-C02 bank defines three registry groups (`services` / `concepts` / `questionTypes`), mirrored under a nested `themes` object on every question (e.g. `question.themes.services`):

- **Topics** (4): `Development with AWS Services`, `Deployment`, `Security`, `Troubleshooting and Optimization`
- **Services** (33): `acm`, `amplify`, `api-gateway`, `cloudformation`, `cloudfront`, `cloudwatch`, `codebuild`, `codecommit`, `codedeploy`, `codepipeline`, `cognito`, `container`, `dynamodb`, `ec2`, `efs-ebs`, `elastic-beanstalk`, `elasticache`, `eventbridge`, `iam`, `kinesis`, `kms`, `lambda`, `rds-aurora`, `route53`, `s3`, `sam`, `secrets-manager`, `sns`, `sqs`, `ssm`, `step-functions`, `vpc`, `x-ray`
- **Concepts** (25): `api-design`, `authentication`, `authorization`, `caching`, `cicd-pipeline`, `cost-optimization`, `cross-account`, `data-modeling`, `deployment-strategies`, `disaster-recovery`, `encryption`, `event-driven`, `high-availability`, `iac`, `idempotency-retry`, `least-privilege`, `lifecycle-management`, `logging`, `microservices`, `observability`, `secrets-management`, `serverless`, `testing`, `throttling-concurrency`, `versioning-rollback`
- **Question Types** (8): `architecture-decision`, `configuration`, `how-to-deploy`, `most-cost-effective`, `most-performant`, `most-secure`, `multi-step-scenario`, `troubleshooting`

### Exam weights — DVA-C02 (AWS-official)

| Topic | Weight |
|---|---|
| Development with AWS Services | 32% |
| Deployment | 24% |
| Security | 26% |
| Troubleshooting and Optimization | 18% |

---

## User progress

Progress is **not** part of the cert bundle. It is per-browser, per-user state stored in localStorage via the Pinia `userProgress` store.

### Shape

```ts
interface QuestionProgress {
  questionId: string            // matches Question.id
  attempts: number              // total times answered
  timesCorrect: number
  timesWrong: number
  flagged: boolean              // user-marked for review
  lastSeenAt: number            // epoch ms
}

interface UserProgress {
  byExamCode: Record<string, Record<string, QuestionProgress>>
  //            exam code      question id
}
```

### Replay-mode queries

The store exposes helpers used by the quiz launcher:

| Mode | Predicate |
|---|---|
| Only wrong | `timesWrong > timesCorrect` |
| Only flagged | `flagged === true` |
| Only unattempted | no entry for that question id |
| All / custom | no predicate (combined with theme filters) |

### Export / import

Because localStorage is wiped when the user clears browser data, the store supports:

- **Export** — downloads a versioned JSON file: `{ "format": "quiz-progress", "version": 1, "exportedAt": "<iso>", "byExamCode": { } }`
- **Import** — reads such a file and merges it into the current state (per-question, newest `lastSeenAt` wins).

Note: this export's `version` is unrelated to the cert bundle's top-level `version` (currently `2`, see above) — they version two independent formats and change on their own schedules.

### Storage limits

| Store | Limit | Usage |
|---|---|---|
| localStorage (progress) | ~5 MB | Progress is tiny (a few bytes per question); safe even with thousands of questions. |
| IndexedDB (uploaded certs) | 50 MB+ | Handles multi-MB cert bundles comfortably. |

