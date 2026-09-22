# Message Threads Research

Last updated: 2026-09-22  
Backlog item: `VNT-103 - Current message-thread mapping`

## Status

No current message-thread list endpoint was found in the local authorized HAR inspected for VNT-103.

Current status for `Read message threads`: `FOUND` from historical evidence only, not current reproduction.

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

## Diagnostic Privacy Decision

Messaging responses can contain private message bodies, usernames, attachments, addresses or negotiation details. For future messaging adapters:

- do not enable JSON body previews for messaging diagnostics;
- do not store raw response payloads in diagnostics, logs or fixtures;
- fixtures must use fully fictitious IDs, usernames and message metadata;
- do not map or expose message body content in a thread-list model unless a later task explicitly requires it.

The existing `DiagnosticTransport` supports JSON previews when `includeJsonPreview` is enabled globally. Any future messaging adapter or diagnostic wrapper must ensure previews are disabled for messaging routes.

## Targeted DevTools Procedure Needed

To continue VNT-103, capture a new authorized HAR focused on the conversation list:

1. Open Vinted while logged in.
2. Open DevTools > Network.
3. Filter to `Fetch/XHR`.
4. Clear the Network log.
5. Open the messaging / inbox page.
6. Wait until the conversation list is visible.
7. Scroll the conversation list to trigger pagination if present.
8. Optionally open one thread, then return to the list, without sending any message.
9. Export the HAR outside the repository.

Do not send messages, offers or perform any write action during the capture.

## Evidence Needed Next

Minimum sanitized facts needed for a thread-list route:

- method, host and sanitized path;
- query parameter names;
- status and content type;
- request header names only;
- response root keys;
- pagination fields or cursor fields;
- thread collection key and thread field names;
- participant/user field names;
- last-message metadata keys, without body/content;
- whether unread state/count is present.
