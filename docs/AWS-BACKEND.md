# AWS backend: context for whoever implements it

This is background and open questions, not a spec. Nothing here has been built or decided — no Cognito pool exists, no API, no Lambda, nothing. Treat every architecture note and code fragment below as *one plausible option*, not the intended design. When you actually sit down to do this, you'll know things this doc doesn't (current AWS/Amplify APIs, your own constraints, whatever changed on the frontend since this was written) — follow that over anything written here. If something below turns out to be a bad fit, ignore it rather than working around it to stay consistent with this file.

---

## What already exists on the frontend

This part is factual — it describes code that's already in the repo, not a proposal.

| Piece | File | Role |
|---|---|---|
| `RemoteSyncAdapter` interface | `src/services/remoteSync.ts` | `pull(): Promise<RemoteSyncPayload \| null>`, `push(payload): Promise<void>` — whatever backend gets built, this is the shape the frontend currently expects to talk to it through. Worth re-examining whether it's still the right shape once real requirements show up, rather than assuming it is. |
| `localOnlySyncAdapter` | `src/services/remoteSync.ts` | Current no-op implementation, returned by `getSyncAdapter()`. |
| `useAccount()` | `src/composables/useAccount.ts` | Calls `pull()` after `createAccount`/`signIn` and merges the result via `importProgress`/`importHistory`. Has two `TODO(AWS)` markers where real backend calls would go. |
| `useUserAccountStore` | `src/stores/userAccount.ts` | Holds `accountMode: 'account' \| 'local' \| null`. Whether this is the right place/shape for real auth state (user id, tokens, signed-in flag) is an open question, not a given. |
| `ProgressExportFile` / `HistoryExportFile` | `src/types.ts` | The versioned JSON shapes the existing local export/import already uses. A candidate wire format for sync, since reusing them avoids a second format — but not mandatory if a real backend needs something else. |
| `exportProgress`/`importProgress` | `src/stores/userProgress.ts` | Per-question merge, newest `lastSeenAt` wins. |
| `exportHistory`/`importHistory` | `src/stores/quizHistory.ts` | Per-entry merge by id (entries are immutable once recorded). |

## One possible shape for the backend

Cognito + API Gateway + Lambda + DynamoDB is what `docs/FEATURES.md` names as the Phase 2 direction, so it's sketched here as a starting point for thinking about it — not a locked-in architecture. Other shapes (AppSync/GraphQL, Amplify Gen 2's backend-as-code, a different auth provider entirely) could just as reasonably fit; whoever does this work should make that call with real requirements in hand, not because a doc said so.

A rough sketch of how the pieces could relate:

- Something needs to own identity and issue a token the frontend can attach to requests — Cognito User Pool is AWS's default answer here, but it's a decision point, not a given.
- Something needs to check that token before letting a request through — API Gateway's built-in Cognito-authorizer option is the simplest version of this (no custom code), and is worth trying before reaching for a Lambda authorizer.
- Something needs to actually read/write the data — a couple of small Lambda functions and a DynamoDB table is a reasonable default for data this simple (a per-user progress blob and a per-user history blob), but if the rest of the stack ends up using something else, there's no reason to force this in.

If a DynamoDB-shaped store does end up being used, the two export formats above map onto it almost for free — one item for `progress`, one for `history`, keyed by user id — which is worth knowing about even if the final schema looks different.

## Things worth deciding deliberately, not defaulting into

- **Whether `push` should merge server-side or trust the client to have already merged.** The frontend currently merges locally before it would push (via `importProgress`/`importHistory`), so a naive "last write wins" `push` might be fine for a single device at a time — but it's worth actually deciding this once multi-device usage is a real scenario, not assuming it forever because it wasn't a problem on day one.
- **What `accountMode: 'account'` should mean.** Right now it's set the moment someone clicks a Welcome card, before any real auth happens. Whatever auth flow gets built (email confirmation, magic link, social login, whatever) will have its own natural point where "this is now a real account" becomes true — that's worth locating rather than keeping the current optimistic-set-immediately behavior by default.
- **Token storage and refresh.** Most auth SDKs (Amplify's included) handle this internally — worth checking what the chosen SDK already does before building anything custom in a store.
- **Sign-out.** Doesn't exist anywhere yet — no button, no function, no state reset. Needed before any of this ships, however it ends up being built.
- **Error/offline UX for a failed sync.** `pullRemoteData()` currently has no error handling at all. What a failed sync should look like to the user (silent fallback, a toast, a retry) is a product decision that hasn't been made — don't let the absence of a decision turn into an accidental default of "unhandled promise rejection."
- **What happens to a guest's existing local data on first sign-in.** The current merge-on-pull logic only pulls remote into local; it doesn't push the guest's pre-existing local progress anywhere. Whether first-sign-in should push local data up, merge both ways, or ask the user is unresolved.

## Further reading

Current as of when this was written — re-check before relying on specifics, SDKs and consoles change:

- [Sign-up — AWS Amplify Gen 2 docs](https://docs.amplify.aws/vue/build-a-backend/auth/connect-your-frontend/sign-up/)
- [Sign-in — AWS Amplify Gen 2 docs](https://docs.amplify.aws/vue/frontend/auth/sign-in/)
- [Control access to REST APIs using Cognito user pools as an authorizer — API Gateway docs](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-integrate-with-cognito.html)
