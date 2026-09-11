# AWS backend: context for whoever implements it

This is background and open questions, not a spec. **Phase 1 (identity) and Phase 2 (data sync) are now built**: a Cognito User Pool, DynamoDB table, HTTP API, and pull/push Lambdas defined in `template.yaml`, wired to the app through `src/services/auth.ts`, `src/services/remoteSync.ts`, and `AuthView` — deploy steps in `docs/AWS-SETUP.md`. Treat every remaining architecture note below as *one plausible option*, not the intended design. When you actually sit down to do this, you'll know things this doc doesn't (current AWS/Amplify APIs, your own constraints, whatever changed on the frontend since this was written) — follow that over anything written here. If something below turns out to be a bad fit, ignore it rather than working around it to stay consistent with this file.

---

## What already exists on the frontend

This part is factual — it describes code that's already in the repo, not a proposal.

| Piece | File | Role |
|---|---|---|
| `RemoteSyncAdapter` interface | `src/services/remoteSync.ts` | `pull(): Promise<RemoteSyncPayload \| null>`, `push(payload): Promise<void>` — the shape the frontend talks to the backend through. A real implementation (bearer-token fetch against the HTTP API) is returned when `VITE_SYNC_API_URL` is set; otherwise the no-op `localOnlySyncAdapter`. |
| `localOnlySyncAdapter` | `src/services/remoteSync.ts` | No-op implementation, returned by `getSyncAdapter()` when no API URL is configured. |
| Auth client | `src/services/auth.ts` | Thin wrapper over `aws-amplify/auth` (dynamically imported, so local-only users never download it): `signUp`, `confirmSignUp`, `signIn`, `signOut`. |
| `useAccount()` | `src/composables/useAccount.ts` | Real sign-up/confirm/sign-in/sign-out against Cognito; sets account state only after auth succeeds. Sign-in stashes the guest data, then pulls the account's remote data and **replaces** the local stores with it (never merges across accounts). Mutations (quiz finished, history entry deleted, progress reset, flag toggled) push the full local state up — only while signed in. Sign-out restores the guest stash. Pull/push failures surface through `syncError` instead of unhandled rejections. |
| `useUserAccountStore` | `src/stores/userAccount.ts` | Holds `accountMode: 'account' \| 'local' \| null`, the signed-in `user` (`AuthUser`: id + email), and the persisted guest snapshot (`guestProgress`/`guestHistory`) captured at sign-in and restored at sign-out. Whether this is the right place/shape for real auth tokens is still an open question — Amplify currently manages tokens internally. |
| `ProgressExportFile` / `HistoryExportFile` | `src/types.ts` | The versioned JSON shapes the existing local export/import already uses. A candidate wire format for sync, since reusing them avoids a second format — but not mandatory if a real backend needs something else. |
| `exportProgress`/`importProgress` | `src/stores/userProgress.ts` | Per-question merge, newest `lastSeenAt` wins. |
| `exportHistory`/`importHistory` | `src/stores/quizHistory.ts` | Per-entry merge by id (entries are immutable once recorded). |

## One possible shape for the backend

**Update: this sketch is no longer hypothetical — Phase 2 was implemented exactly along these lines** (Cognito User Pool + HTTP API with a Cognito JWT authorizer + two Lambdas + a single DynamoDB table; see `template.yaml` and `docs/AWS-SETUP.md`). The section is kept for the reasoning behind the shape; treat it as history, not as an open proposal.

Cognito + API Gateway + Lambda + DynamoDB is what `docs/FEATURES.md` names as the Phase 2 direction, so it's sketched here as a starting point for thinking about it — not a locked-in architecture. Other shapes (AppSync/GraphQL, Amplify Gen 2's backend-as-code, a different auth provider entirely) could just as reasonably fit; whoever does this work should make that call with real requirements in hand, not because a doc said so.

A rough sketch of how the pieces could relate:

- Something needs to own identity and issue a token the frontend can attach to requests — Cognito User Pool is AWS's default answer here, but it's a decision point, not a given.
- Something needs to check that token before letting a request through — API Gateway's built-in Cognito-authorizer option is the simplest version of this (no custom code), and is worth trying before reaching for a Lambda authorizer.
- Something needs to actually read/write the data — a couple of small Lambda functions and a DynamoDB table is a reasonable default for data this simple (a per-user progress blob and a per-user history blob), but if the rest of the stack ends up using something else, there's no reason to force this in.

If a DynamoDB-shaped store does end up being used, the two export formats above map onto it almost for free — one item for `progress`, one for `history`, keyed by user id — which is worth knowing about even if the final schema looks different.

## Things worth deciding deliberately, not defaulting into

- **Whether `push` should merge server-side or trust the client to have already merged.** Resolved: last-write-wins on the server (it stores exactly what's pushed). On sign-in the client **replaces** its local state with the account's remote state — no merge, by design, so accounts on a shared device stay isolated. The only remaining merge is the opt-in guest migration (progress: newest `lastSeenAt` wins; history: dedup by entry id). Documented in `docs/AWS-SETUP.md` — the known limitation is concurrent multi-device edits, acceptable for this single-user study app.
- **What `accountMode: 'account'` should mean.** ~~Right now it's set the moment someone clicks a Welcome card~~ Resolved: it is now set only after real authentication succeeds, alongside the stored `AuthUser`.
- **Token storage and refresh.** Most auth SDKs (Amplify's included) handle this internally — worth checking what the chosen SDK already does before building anything custom in a store.
- **Sign-out.** ~~Doesn't exist anywhere yet~~ Resolved: implemented in `useAccount().signOut()`, exposed by the header account chip; clears the stored user and `accountMode` and returns to the welcome screen.
- **Error/offline UX for a failed sync.** ~~No error handling at all~~ Resolved: failures are caught and surfaced via `syncError`, which a dismissible banner in `App.vue` displays.
- **What happens to a guest's existing local data on first sign-in.** ~~Merged into the account~~ Revisited: guest data is now **stashed** (persisted snapshot in `userAccount`) at sign-in and **restored** at sign-out — it never mixes with the account's data. A guest who signs in sees the account's data, not a merged blob. An explicit opt-in path — "Upload my local data to an account" on the welcome screen, shown only when local data exists — signs the user in (existing or new account) and merges the guest snapshot with the account's remote data before pushing; on success the snapshot is discarded.
- **Multi-user devices.** Resolved via account isolation: the local stores act as a namespace switch — guest data while in local mode, the signed-in account's data while authenticated. Signing in as a different account loads that account's data from the backend, so accounts on a shared device no longer inherit each other's history. The guest snapshot is the only device-scoped data, and it belongs to no account.

## Further reading

Current as of when this was written — re-check before relying on specifics, SDKs and consoles change:

- [Sign-up — AWS Amplify Gen 2 docs](https://docs.amplify.aws/vue/build-a-backend/auth/connect-your-frontend/sign-up/)
- [Sign-in — AWS Amplify Gen 2 docs](https://docs.amplify.aws/vue/frontend/auth/sign-in/)
- [Control access to an HTTP API with a JWT authorizer — API Gateway docs](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-jwt-authorizer.html)
