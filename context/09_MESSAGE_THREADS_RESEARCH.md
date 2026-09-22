# Message Threads Research

Last updated: 2026-09-22  
Backlog item: `VNT-103 - Current message-thread mapping`

## Status

Current message-thread list endpoint is verified from an authorized FR browser HAR and implemented as a read-only adapter.

Current status for `Read message threads`: `IMPLEMENTED`.

## HAR Analysis - 2026-09-22

Source: local authorized browser HAR from the user's own logged-in Vinted session. The raw HAR is outside the repository and must never be committed.

### Search Scope

Searched Vinted requests on:

- `www.vinted.fr`
- `api.vinted.fr`

Searched for route/path/response signals related to:

- message
- messages
- messaging
- thread
- threads
- conversation
- conversations
- inbox
- chat
- chats
- `/api/v2/users/{user_id}/msg_threads`
- `/messaging/...`
- `/inbox/...`
- `/messages/...`
- `/threads/...`

### Messaging Candidates Observed

| Method | Host | Path | Status | Content type | Query params | Response root keys | Pagination | Thread fields | Classification |
| --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- |
| GET | `api.vinted.fr` | `/messaging/main/users/unread_count` | 200 | `application/json` | none | `unread_count` | none | none | Account-specific unread counter only; not a thread-list endpoint. |
| GET | `api.vinted.fr` | `/inbox-notifications/v1/notifications/unread_count` | 200 | `application/json` | none | `count` | none | none | Account-specific notification counter only; not a thread-list endpoint. |

No route matching `/api/v2/users/{user_id}/msg_threads`, `/threads`, `/conversations`, `/messages` or a response containing a thread/conversation collection was present in the HAR.

## Verified Inbox Route - 2026-09-22

Source: later authorized browser HAR from the user's own logged-in Vinted session. The raw HAR is outside the repository and must never be committed.

Verified request:

- `GET https://api.vinted.fr/messaging/main/inbox`
- host class: `api`
- path: `/messaging/main/inbox`
- status: `200`
- content type: `application/json`

Pagination request observed:

- `GET https://api.vinted.fr/messaging/main/inbox?next_cursor=[REDACTED]`
- status: `200`

Observed request header names:

- `accept`
- `accept-language`
- `locale`
- `origin`
- `platform`
- `referer`
- `user-agent`
- `x-anon-id`
- `x-csrf-token`
- `x-next-app`

Important auth notes:

- Cookies were not observable in the HAR; do not conclude they are absent or unnecessary.
- `Authorization` was not observed.
- Header names above are observed, not proven mandatory.

Observed response shape:

- root keys: `conversations`, `pagination`
- conversation fields: `conversation_type`, `created_at`, `data`, `id`, `is_deletable`, `is_unread_by_current_user`, `labels`, `last_message`, `nudges`, `opposite_users`
- `last_message` fields: `conversation_id`, `created_at`, `data`, `id`, `message_type`, `sender_id`
- pagination fields: `has_next`, `has_prev`, `next_cursor`, `prev_cursor`

Implementation notes:

- `packages/vinted-client/src/messaging/VintedMessagingClient.ts` sends `host: "api"` and path `/messaging/main/inbox`.
- `ListMessageThreadsInput` only supports `nextCursor`; no `page`, `perPage` or `userId` was added because those were not observed.
- The mapper exposes metadata only: conversation ID/type, timestamps, unread/deletable flags, last-message metadata and opposite-user `type`.
- Message body/content, real usernames and photos are not mapped.
- `next_cursor` is stored as an opaque string and must not be decoded or interpreted.
- Messaging requests set `diagnostics.includeResponseBodyPreview = false`, so response JSON previews are suppressed even if a diagnostic transport enables previews globally.
- Sanitized fixture: `fixtures/vinted/messaging/message-threads-fr.sanitised.json`.

Route observed for a future scoped task only:

- `GET /messaging/main/conversations/[CONVERSATION_ID]` -> `200`
- Candidate for `VNT-104 - Message read adapter`; not implemented by VNT-103.

## Diagnostic Privacy Decision

Messaging responses can contain private message bodies, usernames, attachments, addresses or negotiation details. For future messaging adapters:

- do not enable JSON body previews for messaging diagnostics;
- do not store raw response payloads in diagnostics, logs or fixtures;
- fixtures must use fully fictitious IDs, usernames and message metadata;
- do not map or expose message body content in a thread-list model unless a later task explicitly requires it.

`DiagnosticTransport` now supports a per-request `diagnostics.includeResponseBodyPreview` override. `VintedMessagingClient` disables response body previews for `/messaging/main/inbox`.

## Evidence Needed Next For VNT-104

Minimum sanitized facts needed for the message detail route:

- method, host and sanitized path;
- query parameter names if present;
- status and content type;
- request header names only;
- response root keys;
- pagination/message ordering behavior if present;
- message metadata fields without body/content;
- attachment/media fields, if any, sanitized and privacy-reviewed.
