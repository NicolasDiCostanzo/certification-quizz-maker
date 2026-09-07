# AWS backend: context for whoever implements it

This is background and open questions, not a spec. **Phase 1 (identity) is now built**: a Cognito User Pool defined in `template.yaml` and wired to the app through `src/services/auth.ts` and `AuthView` — deploy steps in `docs/AWS-SETUP.md`. The sync backend (API, Lambda, DynamoDB) still does not exist. Treat every remaining architecture note below as *one plausible option*, not the intended design. When you actually sit down to do this, you'll know things this doc doesn't (current AWS/Amplify APIs, your own constraints, whatever changed on the frontend since this was written) — follow that over anything written here. If something below turns out to be a bad fit, ignore it rather than working around it to stay consistent with this file.

---

## What already exists on the frontend

This part is factual — it describes code that's already in the repo, not a proposal.

| Piece | File | Role |
|---|---|---|
| `RemoteSyncAdapter` interface | `src/services/remoteSync.ts` | `pull(): Promise<RemoteSyncPayload \| null>`, `push(payload): Promise<void>` — whatever backend gets built, this is the shape the frontend currently expects to talk to it through. Worth re-examining whether it's still the right shape once real requirements show up, rather than assuming it is. |
| `localOnlySyncAdapter` | `src/services/remoteSync.ts` | Current no-op implementation, returned by `getSyncAdapter()`. |
| Auth client | `src/services/auth.ts` | Thin wrapper over `aws-amplify/auth` (dynamically imported, so local-only users never download it): `signUp`, `confirmSignUp`, `signIn`, `signOut`. |
| `useAccount()` | `src/composables/useAccount.ts` | Real sign-up/confirm/sign-in/sign-out against Cognito; sets account state only after auth succeeds; after sign-in it pulls remote data, then pushes merged local data up (guest migration); pull/push failures surface through `syncError` instead of unhandled rejections. |
| `useUserAccountStore` | `src/stores/userAccount.ts` | Holds `accountMode: 'account' \| 'local' \| null` and the signed-in `user` (`AuthUser`: id + email). Whether this is the right place/shape for real auth tokens is still an open question — Amplify currently manages tokens internally. |
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

 **Whether `push` should merge server-side or trust the client to have already merged.** The frontend now pulls remote data and pushes the merged local state up on every sign-in; the server side (which will receive those pushes) still needs a deliberate conflict policy.
- **What `accountMode: 'account'` should mean.** ~~Right now it's set the moment someone clicks a Welcome card~~ Resolved: it is now set only after real authentication succeeds, alongside the stored `AuthUser`.
- **Token storage and refresh.** Most auth SDKs (Amplify's included) handle this internally — worth checking what the chosen SDK already does before building anything custom in a store.
- **Sign-out.** ~~Doesn't exist anywhere yet~~ Resolved: implemented in `useAccount().signOut()`, exposed by the header account chip; clears the stored user and `accountMode` and returns to the welcome screen.
- **Error/offline UX for a failed sync.** ~~No error handling at all~~ Partially resolved: failures are caught and surfaced via `syncError` (no unhandled rejections), but nothing *displays* that state yet — the user-visible UX (toast, banner, retry) is still a product decision for Phase 2.
- **What happens to a guest's existing local data on first sign-in.** ~~Unresolved~~ Partially resolved: sign-in now pulls remote, merges locally, then pushes the merged state up, so the guest's data is not lost — but until the real backend exists, the push is a no-op, and the server-side merge policy is still open.
- **Multi-user devices.** Local progress/history are device-scoped, not account-scoped: sign-out deliberately does not clear them (they are the only copy until the sync backend exists), so a second account signing in on the same browser inherits the device's local data through guest migration. Whether data must be isolated per user, wiped on sign-out, or legitimately stays device-scoped is an open Phase 2 decision — make it once server-side partitioning exists, not before.

## Further reading

Current as of when this was written — re-check before relying on specifics, SDKs and consoles change:

- [Sign-up — AWS Amplify Gen 2 docs](https://docs.amplify.aws/vue/build-a-backend/auth/connect-your-frontend/sign-up/)
- [Sign-in — AWS Amplify Gen 2 docs](https://docs.amplify.aws/vue/frontend/auth/sign-in/)
- [Control access to REST APIs using Cognito user pools as an authorizer — API Gateway docs](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-integrate-with-cognito.html)
