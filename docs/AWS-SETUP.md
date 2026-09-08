# AWS setup guide

How to create and connect the AWS backend. Phase 1 covers identity (Cognito User Pool); Phase 2 adds data sync (API Gateway + Lambda + DynamoDB) so an account's quiz progress and history follow you across devices.

## Prerequisites

- An AWS account (free tier is enough — see [Cost](#cost) below)
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) configured with credentials (`aws configure`)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)

## Deploy the stack

```bash
sam build
sam deploy --guided
```

The guided deploy asks for a stack name (e.g. `cert-quizz-maker`), a region (pick one close to you, e.g. `eu-west-3`), and confirms IAM resource creation. It writes `samconfig.toml` locally so later deploys are just `sam build && sam deploy`. Both `samconfig.toml` and `.aws-sam/` are gitignored.

When the deploy finishes, the Outputs section prints values for both phases. Put them in a local `.env.local` file (copy the shape from `.env.example`):

```bash
VITE_AWS_REGION=eu-west-3
VITE_COGNITO_USER_POOL_ID=eu-west-3_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_SYNC_API_URL=https://xxxxxxxxxx.execute-api.eu-west-3.amazonaws.com/sync
```

Restart the dev server (`npm run dev`) after creating `.env.local` — Vite only reads env files at startup. Without the Cognito variables the app runs in local-only mode (no auth forms). Without `VITE_SYNC_API_URL` it runs with auth but no sync — progress stays in the browser, as in Phase 1.

## Deploy-user permissions (required)

CloudFormation creates IAM resources (the Lambdas' execution roles), so the deploy user needs IAM rights that managed policies like `PowerUserAccess` **no longer grant**: its first statement is an `Allow` with `NotAction: ["iam:*", "organizations:*", "account:*"]`, which excludes the entire IAM surface and only re-grants a small allowlist (`CreateServiceLinkedRole`, `ListRoles`, …). Attaching an inline policy to the deploy user is the fix — scoped to this stack's role-name prefix so it stays least-privilege:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ManageCfnLambdaExecutionRoles",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:GetRole",
        "iam:UpdateRole",
        "iam:DeleteRole",
        "iam:TagRole",
        "iam:UntagRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:ListRolePolicies",
        "iam:GetRolePolicy",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:ListAttachedRolePolicies",
        "iam:PassRole"
      ],
      "Resource": [
        "arn:aws:iam::<ACCOUNT_ID>:role/cert-quiz-maker-*",
        "arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess"
      ]
    }
  ]
}
```

Two details that are easy to get wrong and produce confusing 403s:

- `iam:AttachRolePolicy`/`DetachRolePolicy` are **multi-resource actions**: the `Allow` must cover *both* the role ARNs and the managed-policy ARN being attached (the SAM `DynamoDBReadPolicy` template attaches `AmazonDynamoDBReadOnlyAccess`).
- The **rollback cleanup calls run as the deploy user too** (`DetachRolePolicy`, `DeleteRole`) — a deployer missing those leaves undeletable orphan roles in `UPDATE_ROLLBACK_COMPLETE`; they are cleaned up automatically on the next deploy once the permission exists.

Without this policy the deploy fails with *"User … is not authorized to perform: iam:CreateRole / iam:AttachRolePolicy … because no identity-based policy allows the action"* and rolls back.

## What the stack creates

| Resource | Purpose |
|---|---|
| Cognito User Pool | Holds the users; sends verification emails (Cognito's built-in sender) |
| Cognito App Client | The browser's identity; no client secret, SRP + refresh-token flows only |
| DynamoDB table (`cert-quizz-maker-sync`) | Two items per user (`PROGRESS` and `HISTORY`), keyed by Cognito user id |
| HTTP API (`/sync`) | GET pulls, PUT pushes; secured by a Cognito JWT authorizer that reuses the pool above |
| Pull Lambda | Read-only IAM — queries the two items for the signed-in user |
| Push Lambda | Write-only IAM — writes the two items for the signed-in user |

There are no hosted UI pages: the app's own `AuthView` collects email/password/verification code and calls Cognito through the AWS Amplify Auth library, which is loaded lazily so local-only users never download it.

## How sync works

Phase 2 connects the app to the backend through `src/services/remoteSync.ts`. The local stores (Pinia + localStorage) remain the UI's read path; sync keeps them equal to exactly one namespace at a time — the guest's device data in local mode, or the signed-in account's data while authenticated:

- **On sign-in**: the current (guest) data is stashed in `userAccount`, then `GET /sync` returns the account's stored `{ progress, history }` and the local stores are **replaced** with it. A pull failure clears the stores (never shows another account's data) and surfaces the sync-error banner. A brand-new account pulls nothing, so it starts empty.
- **Guest migration (opt-in)**: when the device has local data, the welcome screen offers "Upload my local data to an account". It opens the usual auth flow (sign in *or* create an account — the flag survives both the mode switch and email verification) and, after authentication, **merges** the guest data with the account's remote data (progress: newest `lastSeenAt` wins per question; history: dedup by entry id) and pushes the union. Non-destructive in both directions: nothing already on the account is lost, and the guest data moves up intact. On success the guest snapshot is discarded (the data now belongs to the account); if the pull fails, migration aborts, the guest data stays local and nothing is pushed.
- **While signed in**, every mutation pushes the full local state up (`PUT /sync`): after each finished quiz, after deleting a history entry, after resetting a cert's data, and after toggling a question flag in the review views (flags toggled mid-quiz are pushed together with the quiz result). Push is a no-op in local mode. The server stores the payload verbatim — **last-write-wins per record**.
- **On sign-out**: the guest stash is restored into the local stores, so "Continue without an account" finds the device's own data again.

Authentication on every request is a bearer token that Amplify attaches automatically from the Cognito session — no custom token handling.

### Conflict resolution policy (chosen)

**Last-write-wins on the server; replace-on-pull.** The server stores exactly what the client pushes (no server-side merge). On sign-in, the client replaces its local state with the account's remote state — there is no merge step, by design, so accounts on a shared device stay isolated.

This is simple and correct for the common case (one user, one device at a time). The known limitation: two devices editing concurrently between syncs can lose the earlier push. For a single-user study app this is acceptable; a production multi-device app would need vector clocks or operational transformation. Documented here rather than silently defaulting.

## Deliberate: minimal password policy

The password policy is the floor (6 characters, no composition rules) on purpose. Accounts exist only to sync quiz progress; there is no payment data, no personal documents, and every feature works without an account — so an account takeover leaks nothing but a quiz history. The remaining load is carried by what matters more here: SRP (the password never crosses the wire), `PreventUserExistenceErrors` (no account enumeration), and email verification (no account squatting). `AuthView`'s `minlength="6"` mirrors the pool so client and server agree. If the app ever stores anything sensitive, revisit this before anything else.

## Cost

**$0** for this project's usage, with one honest caveat:

- Cognito free tier covers tens of thousands of monthly active users — a personal study tool uses a rounding error of that.
- DynamoDB on-demand: 25 GB storage + 25 RCU/WCU always-free.
- Lambda: 1M requests + 400,000 GB-seconds always-free.
- API Gateway HTTP API: 1M requests/month free for the **first 12 months only** — after that ~$1/million requests, which at personal usage is pennies-to-zero.
- The built-in email sender is limited to a small number of verification emails per day, which is fine for sign-ups.

## DVA-C02 topics this phase exercises

- **User Pool vs Identity Pool**: the pool here issues tokens for *authentication* (who you are); identity pools are for *temporary AWS credentials* (what you may touch). Classic exam distractor.
- **Token trio**: Amplify manages the ID / Access / Refresh JWTs and their silent refresh — check what the SDK does before building custom token storage.
- **SRP auth flow**: the password never travels to the server in the clear; the client proves knowledge of it via the Secure Remote Password protocol (`ALLOW_USER_SRP_AUTH` in the app client).
- **`PreventUserExistenceErrors: ENABLED`**: sign-in/sign-up errors are generic so attackers can't enumerate registered emails.
- **Password policy and self-service sign-up** as User Pool configuration rather than application code.
- **API Gateway Cognito authorizer**: the API verifies the JWT before the Lambda runs — no custom auth code in the handler. The Lambda reads the user id from `event.requestContext.authorizer.jwt.claims.sub`.
- **Least-privilege IAM**: the pull function gets read-only access, the push function write-only — a function should only have the permissions it needs.
- **DynamoDB single-table key design**: partition key scopes data to a user; sort key distinguishes record types within that user.
- **Lambda proxy integration**: the HTTP API passes the whole request (headers, body, authorizer context) to the Lambda, which returns status code + body directly.
