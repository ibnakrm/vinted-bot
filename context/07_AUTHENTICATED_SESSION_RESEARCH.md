# Authenticated Session Research

Last updated: 2026-09-21  
Backlog item: `VNT-101 - Authenticated session research`

## Status

Authenticated session evidence has been verified from an authorized browser HAR supplied by the user.

Current state: `authenticated_session_recognition` is `VERIFIED` from sanitized HAR evidence. No current-user/me/account endpoint was present in the HAR, so current-user identity proof remains weaker than authenticated-session recognition.

## Safety Rules

- Do not commit raw HAR files, copied cURL commands, cookies, tokens, bearer values, CSRF values or session IDs.
- Do not automate login, solve CAPTCHA, bypass access controls or use a third-party account.
- Store temporary raw captures only outside the repository, for example under `/private/tmp/`, and delete them after extracting sanitized facts.
- Record names and shapes only unless a value is explicitly safe and non-identifying.
- Redact user identifiers as type-only evidence, for example `[REDACTED_NUMBER]` or `[REDACTED_STRING]`.

## Minimal Manual Reproduction Procedure

Use the user's own logged-in browser session.

1. Open Vinted in the browser on the target market, initially FR unless a different market is intentionally chosen.
2. Open DevTools > Network.
3. Enable `Preserve log`.
4. Filter to `Fetch/XHR`.
5. Navigate naturally to a read-only account-owned area, preferably the current account/profile/settings page.
6. Identify a simple `GET` request that appears to return current-user or account-owned data.
7. Do not execute write actions such as message send, offer send, favorite, listing create/update/delete or checkout.
8. If using `Copy as cURL` or HAR, save it outside the repository and extract only sanitized facts.
9. Delete the raw cURL/HAR after extraction.

## Minimum Facts To Extract

For each candidate proof request, capture only:

- market and host;
- HTTP method;
- route path;
- query parameter names, with sensitive values redacted;
- status code;
- response content type;
- request header names;
- cookie names, not values;
- presence or absence of `access_token_web`, `refresh_token_web`, `anon_id`, `v_udt` and CSRF-related signals;
- whether a current user/account identifier appears, redacted as type only;
- top-level response keys and relevant nested key names, without private values.

## Guest Versus Authenticated Comparison

Known public FR fixture already observed cookie names including `access_token_web` and `refresh_token_web` during public session acquisition. Therefore, the mere presence of those cookie names is not sufficient evidence of authentication.

Authenticated state must be proven by a read-only request whose response is account-specific, such as a current-user endpoint or another endpoint that returns data bound to the logged-in account.

## Candidate Proof Endpoint Criteria

Preferred proof order:

1. current user / me / account profile endpoint;
2. own inventory read endpoint;
3. other read-only account-owned endpoint.

A route remains `FOUND` until reproduced against the current authorized browser session. It becomes `VERIFIED` only after current reproduction with sanitized evidence. It becomes `IMPLEMENTED` only after typed code, tests, diagnostics safety and sanitized fixture are present.

## Sanitized Fixture Shape If Verification Succeeds

Create a fixture under `fixtures/vinted/session/` only after successful reproduction. It should contain:

```json
{
  "capability": "authenticated_session_recognition",
  "status": "VERIFIED",
  "verifiedAt": "YYYY-MM-DDTHH:mm:ss.sssZ",
  "market": "FR",
  "request": {
    "method": "GET",
    "host": "api|site",
    "hostname": "api.vinted.fr",
    "path": "/sanitized/path",
    "queryParamNames": []
  },
  "response": {
    "status": 200,
    "contentType": "application/json",
    "topLevelKeys": []
  },
  "observed": {
    "cookieNames": [],
    "headerNames": [],
    "hasAccountSpecificIdentity": true,
    "userIdentifierType": "number|string|unknown"
  },
  "redactionChecked": true
}
```

Do not include real cookie values, token values, CSRF values, bearer values, user IDs, email addresses, usernames, addresses, private messages or listing drafts.

## HAR Analysis - 2026-09-21

Source: authorized browser HAR from the user's own logged-in Vinted session. The raw HAR is outside the repository and must never be committed.

### Inventory Summary

- Total HAR entries: 139
- Vinted entries inspected: 14
- `www.vinted.fr` entries: 9
- `api.vinted.fr` entries: 5
- Useful account-specific read-only requests found: 3
- Current-user/me/account endpoint found: no

### Explicit Routes Checked

| Route | Found | Method | Host | Status | Response shape | Notes |
| --- | --- | --- | --- | ---: | --- | --- |
| `/messaging/main/users/unread_count` | yes | GET | `api.vinted.fr` | 200 | root key `unread_count` | Account-specific session evidence, not a strong current-user identity proof. |
| `/inbox-notifications/v1/notifications/unread_count` | yes | GET | `api.vinted.fr` | 200 | root key `count` | Account-specific session evidence, not a strong current-user identity proof. |
| `/api/v2/users/{user_id}/items/favourites` | yes | GET | `www.vinted.fr` | 200 | root keys `code`, `items`, `pagination` | Best proof request found in this HAR; user id is redacted and not stored. |

### Current-User Endpoint Search

No route matching the searched current-user/account patterns was found in the HAR:

- `/api/v2/users/current`
- `/api/v2/users/me`
- `/me`
- `/current_user`
- `/profile`
- `/account`

### Chosen Proof Endpoint

Chosen endpoint:

```text
GET https://www.vinted.fr/api/v2/users/[REDACTED_USER_ID]/items/favourites
```

Why it was chosen:

- It is read-only.
- It returned `200`.
- It is account-specific and scoped to a user path.
- Its decoded JSON response shape contains `code`, `items` and `pagination`.
- No stronger current-user/me/account endpoint was present in the HAR.

Important limitation: this is authenticated-session evidence, not a strong current-user identity proof. The response shape observed here does not expose a current-user identity field that can be safely documented.

### Guest vs Authenticated Signals

| Signal | Guest observed | Auth HAR observed | Conclusion |
| --- | --- | --- | --- |
| Cookie names | yes in public session fixture | not observable in this HAR | Cookie names cannot be compared from this HAR export. |
| `access_token_web` / `refresh_token_web` names | yes in public session fixture | not observable in this HAR | Names alone are not auth proof because they appeared in the public fixture. |
| `X-Anon-Id` | yes in public session fixture | request header name observed | Shared/public identity signal; not sufficient alone for auth proof. |
| `X-CSRF-Token` | not observed in public session reproduction | request header name observed | Auth HAR includes CSRF header name on account-specific reads; value is not stored. |
| `Authorization` | not observed | not observed | No bearer/auth header evidence in this HAR. |
| Account-specific route | no/unknown | yes | Best evidence of authenticated session context in this HAR. |
| User id in response | no/unknown | no | No strong current-user identity proof from response body. |
| User id in request path | no/unknown | yes, redacted | Helps identify account-scoped request but must not be treated as response identity proof. |

### Headers Observed On Chosen Proof Request

Header names only:

- `accept`
- `accept-encoding`
- `accept-language`
- `locale`
- `priority`
- `referer`
- `sec-ch-ua`
- `sec-ch-ua-mobile`
- `sec-ch-ua-platform`
- `sec-fetch-dest`
- `sec-fetch-mode`
- `sec-fetch-site`
- `user-agent`
- `x-anon-id`
- `x-csrf-token`

### Not Observable In This HAR

- Request `Cookie` header.
- Individual request cookie names.
- Response `Set-Cookie` names.
- `Authorization` header.
- Token values.
- CSRF value.
- Exact session expiry or refresh behavior.
