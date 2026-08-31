# SKILL.md — Converting an exam dump into a cert-bundle JSON

You are converting a raw certification exam question dump (plain text, e.g. an
ExamTopics export) into the JSON format this app consumes. Read this whole
document before producing any output.

## Rule #1 — stop and ask

This overrides every other instruction here.

- **Never guess.** If a **required** field (e.g. question text, options,
  answer letter, topic) or a piece of source data that must be preserved is
  ambiguous, missing, or contradictory in the source text, stop and ask the
  user for clarification instead of inventing a value. Explicitly optional
  fields — `url`, `explanation`, `promptImages`, and `themes` — may remain
  absent without blocking: if the source doesn't substantiate them, simply
  omit them (never fill them with guesses, `null`, `""`, or `[]`).
- **Never force-fit.** If a question doesn't fit this schema (see "Unsupported
  question types" below), say so and stop. Do not approximate it as a
  multiple-choice question.
- **Never silently drop data.** If you can't confidently place a piece of
  information (an image, a caveat in the discussion, an option you're unsure
  about), tell the user what you're unsure about and why, rather than omitting
  it without comment.

When in doubt, produce a shorter, correct, partial answer and ask, rather than
a complete but guessed one.

## Output format

Produce **one JSON file** shaped like this:

```jsonc
{
  "version": 2,
  "exam": { /* ExamInfo, see below */ },
  "themes": { /* taxonomy registry, see below */ },
  "questions": [ /* Question[], see below */ ]
}
```

### `exam` (ExamInfo)

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Full display name of the certification. |
| `code` | string | yes | Short unique code (e.g. `DVA-C02`, `SAA-C03`). Ask the user if unclear. |
| `totalQuestions` | number | yes | Question count on the **real** exam — not the size of the question bank you're converting. Ask the user; don't infer this from the dump's question count. |
| `timeLimitMinutes` | number | yes | Real exam duration in minutes. Ask the user if not stated anywhere in the source material. |
| `passingScore.passingScore` | number | yes | The passing score. A plain percentage (0-100) if the cert has no scaled score, or a scaled value (e.g. `720`) if it does. |
| `passingScore.scale` | number | no | Max of the scale (e.g. `1000`). Omit entirely for percentage-based certs. |
| `weights` | `Record<string, number>` | no | Maps each topic name (must exactly match the `topic` values you assign to questions) to a percentage; values must sum to 100. Omit the whole field if the cert has no published domain weights — do not invent weights. |
| `instructions` | string | no | Free-text instructions shown to the user. |

### `themes` (taxonomy registry)

A dictionary of theme-group name → list of allowed values, e.g.:

```jsonc
"themes": {
  "services":      ["dynamodb", "lambda", "s3"],
  "concepts":      ["encryption", "caching"],
  "questionTypes": ["troubleshooting", "most-secure"]
}
```

- Keys are free-form, lowerCamelCase, and specific to the certification's
  domain (a networking cert might use `protocols`, `osiLayers`; a PMP cert
  might use `processGroups`, `knowledgeAreas`). Don't reuse AWS-specific
  groups for a non-AWS cert.
- Build this registry from the questions you actually tag — every value you
  put on a question should exist here. If you're not confident a tag is
  meaningful or consistent across questions, ask rather than inventing
  one-off tags.

### `questions[]` (Question)

```jsonc
{
  "id": "1",
  "question": "Full question text, unicode preserved.",
  "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
  "answers": "C",
  "topic": "Security",
  "url": "https://... (optional, omit the field entirely if unavailable)",
  "explanation": "Why the correct answer is correct (optional). Don't make up things, fill only if an explanation is provided in the file provided",
  "promptImages": ["https://... (optional, only images belonging to the prompt itself)"],
  "themes": {
    "services": ["kms", "secrets-manager"],
    "concepts": ["encryption", "secrets-management"],
    "questionTypes": ["architecture-decision"]
  }
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | Unique within the file. Reuse the source dump's question number as a string if there is one. |
| `question` | string | yes | Full prompt, unicode preserved. |
| `options` | string[] | yes | 2-5 entries, no `A. ` letter prefixes — the app renders letters itself. An image that belongs to a specific *option* (not the prompt) is embedded inline as markdown: `![alt](url)`. |
| `answers` | string \| string[] | yes | A single letter (`"C"`) for single-select, an array (`["B","D"]`) for multi-select. The cardinality must match the source question's type: single-select questions use a string — never a one-item array like `["C"]`; multi-select questions use an array with one entry per correct answer, matching the number of answers the source states. Arrays must be non-empty with no duplicate letters. Every letter must be within the `options` range. Take the accepted answer from the source; if the source shows disagreement (e.g. community votes conflicting with a stated "most accepted answer") and no answer is clearly authoritative, stop and ask. |
| `topic` | string | yes | The question's primary topic/domain. If `exam.weights` is present, this **must** be one of its keys — don't introduce a topic that isn't in the weights table without asking first. |
| `explanation` | string | no | Rationale for the correct answer, if the source material supports one. Don't fabricate an explanation the source doesn't substantiate. |
| `url` | string | no | Source/discussion link. Omit the field entirely if unavailable — never `null` or `""`. |
| `promptImages` | string[] | no | Images belonging to the **prompt** (diagrams, screenshots), not to an individual option. Omit entirely when empty. |
| `themes` | object | no | Nested object with `services` / `concepts` / `questionTypes` (or whatever groups this cert's `themes` registry defines) as string arrays. Omit a sub-array entirely when it doesn't apply to this question — never an empty array. |

## Unsupported question types — stop, don't force-fit

This schema only supports single-select and multi-select multiple choice.
If the source material contains any of the following, **do not** convert them
into a multiple-choice approximation — flag them to the user and skip them:

- Drag-and-drop / ordering questions
- Matching questions (pairing items from two columns)
- Simulation-style questions (interacting with a mocked console/UI)
- Any other format that isn't "pick one/several options from a fixed list"

## Worked example

Source (raw dump excerpt):

```
════════════════════════════════════════════════════════════
QUESTION #1    Exam AWS Certified Developer - Associate DVA-C02 topic 1 question 1 discussion
════════════════════════════════════════════════════════════

Question:
A company is implementing an application on Amazon EC2 instances. The application needs to process incoming transactions. When the application detects a transaction that is not valid, the application must send a chat message to the company's support team. To send the message, the application needs to retrieve the access token to authenticate by using the chat API. A developer needs to implement a solution to store the access token. The access token must be encrypted at rest and in transit. The access token must also be accessible from other AWS accounts. Which solution will meet these requirements with the LEAST management overhead?

Options:
  A. Use an AWS Systems Manager Parameter Store SecureString parameter that uses an AWS Key Management Service (AWS KMS) AWS managed key to store the access token. Add a resource-based policy to the parameter to allow access from other accounts. Update the IAM role of the EC2 instances with permissions to access Parameter Store. Retrieve the token from Parameter Store with the decrypt flag enabled. Use the decrypted access token to send the message to the chat.
  B. Encrypt the access token by using an AWS Key Management Service (AWS KMS) customer managed key. Store the access token in an Amazon DynamoDB table. Update the IAM role of the EC2 instances with permissions to access DynamoDB and AWS KMS. Retrieve the token from DynamoDDecrypt the token by using AWS KMS on the EC2 instances. Use the decrypted access token to send the message to the chat.
  C. Use AWS Secrets Manager with an AWS Key Management Service (AWS KMS) customer managed key to store the access token. Add a resource-based policy to the secret to allow access from other accounts. Update the IAM role of the EC2 instances with permissions to access Secrets Manager. Retrieve the token from Secrets Manager. Use the decrypted access token to send the message to the chat.
  D. Encrypt the access token by using an AWS Key Management Service (AWS KMS) AWS managed key. Store the access token in an Amazon S3 bucket. Add a bucket policy to the S3 bucket to allow access from other accounts. Update the IAM role of the EC2 instances with permissions to access Amazon S3 and AWS KMS. Retrieve the token from the S3 bucket. Decrypt the token by using AWS KMS on the EC2 instances. Use the decrypted access token to send the massage to the chat.

Community Votes:
  A → 2 vote(s)
  C → 13 vote(s)

Most Accepted Answer:
  C. Use AWS Secrets Manager with an AWS Key Management Service (AWS KMS) customer managed key to store the access token. Add a resource-based policy to the secret to allow access from other accounts. Update the IAM role of the EC2 instances with permissions to access Secrets Manager. Retrieve the token from Secrets Manager. Use the decrypted access token to send the message to the chat.

URL: https://www.examtopics.com/discussions/amazon/view/102778-exam-aws-certified-developer-associate-dva-c02-topic-1-question-1-discussion/
```

Converted output (one entry of `questions[]`, plus what it contributes to
`themes`):

```json
{
  "id": "1",
  "question": "A company is implementing an application on Amazon EC2 instances. The application needs to process incoming transactions. When the application detects a transaction that is not valid, the application must send a chat message to the company's support team. To send the message, the application needs to retrieve the access token to authenticate by using the chat API. A developer needs to implement a solution to store the access token. The access token must be encrypted at rest and in transit. The access token must also be accessible from other AWS accounts. Which solution will meet these requirements with the LEAST management overhead?",
  "options": [
    "Use an AWS Systems Manager Parameter Store SecureString parameter that uses an AWS Key Management Service (AWS KMS) AWS managed key to store the access token. Add a resource-based policy to the parameter to allow access from other accounts. Update the IAM role of the EC2 instances with permissions to access Parameter Store. Retrieve the token from Parameter Store with the decrypt flag enabled. Use the decrypted access token to send the message to the chat.",
    "Encrypt the access token by using an AWS Key Management Service (AWS KMS) customer managed key. Store the access token in an Amazon DynamoDB table. Update the IAM role of the EC2 instances with permissions to access DynamoDB and AWS KMS. Retrieve the token from DynamoDDecrypt the token by using AWS KMS on the EC2 instances. Use the decrypted access token to send the message to the chat.",
    "Use AWS Secrets Manager with an AWS Key Management Service (AWS KMS) customer managed key to store the access token. Add a resource-based policy to the secret to allow access from other accounts. Update the IAM role of the EC2 instances with permissions to access Secrets Manager. Retrieve the token from Secrets Manager. Use the decrypted access token to send the message to the chat.",
    "Encrypt the access token by using an AWS Key Management Service (AWS KMS) AWS managed key. Store the access token in an Amazon S3 bucket. Add a bucket policy to the S3 bucket to allow access from other accounts. Update the IAM role of the EC2 instances with permissions to access Amazon S3 and AWS KMS. Retrieve the token from the S3 bucket. Decrypt the token by using AWS KMS on the EC2 instances. Use the decrypted access token to send the massage to the chat."
  ],
  "answers": "C",
  "topic": "Security",
  "url": "https://www.examtopics.com/discussions/amazon/view/102778-exam-aws-certified-developer-associate-dva-c02-topic-1-question-1-discussion/",
  "themes": {
    "services": ["ssm", "secrets-manager", "s3", "kms", "iam", "ec2"],
    "concepts": ["encryption", "secrets-management", "cross-account", "authentication", "authorization"],
    "questionTypes": ["architecture-decision", "multi-step-scenario"]
  }
}
```

Notes on how this was derived, since the reasoning isn't visible in the JSON
itself:

- `answers: "C"` comes from "Most Accepted Answer" — the community-vote count
  (`A → 2`, `C → 13`) corroborates it rather than contradicting it. If votes
  had favored a different answer than "Most Accepted Answer", that would be a
  case to stop and ask rather than pick one silently.
- `topic: "Security"` was assigned because the question is fundamentally about
  encrypting and cross-account-sharing a secret — it must be one of
  `exam.weights`' keys for this cert (see the DVA-C02 reference below).
- `themes.services` lists every AWS service the four options collectively
  reference (SSM, Secrets Manager, S3, KMS are the four storage options; IAM
  and EC2 are the compute/permissions context), not just the correct one —
  tag for what the question *involves*, not only the right answer.
- No `explanation` or `promptImages` were added: the source dump doesn't
  provide a substantiated rationale beyond the discussion thread's opinions,
  and there is no image in this question.

## DVA-C02 taxonomy reference

Use this reference when converting more DVA-C02 material, or as a model for
how granular a taxonomy should be for a similarly-scoped cert. Don't reuse it
for a different certification.

**Topics (4)**: `Development with AWS Services`, `Deployment`, `Security`, `Troubleshooting and Optimization`

**Services (33)**: `acm`, `amplify`, `api-gateway`, `cloudformation`, `cloudfront`, `cloudwatch`, `codebuild`, `codecommit`, `codedeploy`, `codepipeline`, `cognito`, `container`, `dynamodb`, `ec2`, `efs-ebs`, `elastic-beanstalk`, `elasticache`, `eventbridge`, `iam`, `kinesis`, `kms`, `lambda`, `rds-aurora`, `route53`, `s3`, `sam`, `secrets-manager`, `sns`, `sqs`, `ssm`, `step-functions`, `vpc`, `x-ray`

**Concepts (25)**: `api-design`, `authentication`, `authorization`, `caching`, `cicd-pipeline`, `cost-optimization`, `cross-account`, `data-modeling`, `deployment-strategies`, `disaster-recovery`, `encryption`, `event-driven`, `high-availability`, `iac`, `idempotency-retry`, `least-privilege`, `lifecycle-management`, `logging`, `microservices`, `observability`, `secrets-management`, `serverless`, `testing`, `throttling-concurrency`, `versioning-rollback`

**Question Types (8)**: `architecture-decision`, `configuration`, `how-to-deploy`, `most-cost-effective`, `most-performant`, `most-secure`, `multi-step-scenario`, `troubleshooting`

**Exam weights**: Development with AWS Services 32%, Deployment 24%, Security 26%, Troubleshooting and Optimization 18%

## Before you return the JSON — checklist

- [ ] Top level has exactly `version` (`2`), `exam`, `themes`, `questions`.
- [ ] Every `options` array has 2-5 entries, none with an `A. `/`B. ` prefix.
- [ ] Every `answers` letter is within that question's `options` range.
- [ ] Every `topic` is present, and — if `exam.weights` exists — is one of its keys.
- [ ] No optional field is present as `null`, `""`, or `[]`; it's omitted entirely instead.
- [ ] Every value under a question's `themes` exists in the top-level `themes` registry.
- [ ] No drag-and-drop / matching / simulation question was force-fit — those were flagged and skipped instead.
- [ ] Anything you were unsure about was raised with the user, not guessed.
