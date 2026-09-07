# AWS setup guide

How to create and connect the AWS backend for account sign-in. Phase 1 covers identity only (Cognito User Pool); data sync (API Gateway + Lambda + DynamoDB) comes in Phase 2.

## Prerequisites

- An AWS account (free tier is enough — see [Cost](#cost) below)
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) configured with credentials (`aws configure`)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)

## Deploy the identity stack

```bash
sam build
sam deploy --guided
```

The guided deploy asks for a stack name (e.g. `cert-quizz-maker`), a region (pick one close to you, e.g. `eu-west-3`), and confirms IAM resource creation. It writes `samconfig.toml` locally so later deploys are just `sam build && sam deploy`. Both `samconfig.toml` and `.aws-sam/` are gitignored.

When the deploy finishes, the Outputs section prints three values. Put them in a local `.env.local` file (copy the shape from `.env.example`):

```bash
VITE_AWS_REGION=eu-west-3
VITE_COGNITO_USER_POOL_ID=eu-west-3_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

Restart the dev server (`npm run dev`) after creating `.env.local` — Vite only reads env files at startup. Without these variables the app runs in local-only mode: the auth forms are not wired to any backend.

## What the stack creates

| Resource | Purpose |
|---|---|
| Cognito User Pool | Holds the users; sends verification emails (Cognito's built-in sender) |
| Cognito App Client | The browser's identity; no client secret, SRP + refresh-token flows only |

There are no hosted UI pages: the app's own `AuthView` collects email/password/verification code and calls Cognito through the AWS Amplify Auth library, which is loaded lazily so local-only users never download it.

### Deliberate: minimal password policy

The password policy is the floor (6 characters, no composition rules) on purpose. Accounts exist only to sync quiz progress; there is no payment data, no personal documents, and every feature works without an account — so an account takeover leaks nothing but a quiz history. The remaining load is carried by what matters more here: SRP (the password never crosses the wire), `PreventUserExistenceErrors` (no account enumeration), and email verification (no account squatting). `AuthView`'s `minlength="6"` mirrors the pool so client and server agree. If the app ever stores anything sensitive, revisit this before anything else.

## Cost

**$0** for this project's usage:

- Cognito free tier covers tens of thousands of monthly active users — a personal study tool uses a rounding error of that.
- The built-in email sender is limited to a small number of verification emails per day, which is fine for sign-ups. Upgrading to a verified SES identity for branded emails would still be free tier-eligible, but is not needed.

## DVA-C02 topics this phase exercises

- **User Pool vs Identity Pool**: the pool here issues tokens for *authentication* (who you are); identity pools are for *temporary AWS credentials* (what you may touch). Classic exam distractor.
- **Token trio**: Amplify manages the ID / Access / Refresh JWTs and their silent refresh — check what the SDK does before building custom token storage.
- **SRP auth flow**: the password never travels to the server in the clear; the client proves knowledge of it via the Secure Remote Password protocol (`ALLOW_USER_SRP_AUTH` in the app client).
- **`PreventUserExistenceErrors: ENABLED`**: sign-in/sign-up errors are generic so attackers can't enumerate registered emails.
- **Password policy and self-service sign-up** as User Pool configuration rather than application code.
