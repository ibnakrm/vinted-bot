# Message Read Research

Last updated: 2026-09-22  
Backlog item: `VNT-104 - Message read adapter`

## Status

Current conversation detail read endpoint is verified from an authorized FR browser HAR described for VNT-104 and implemented as a read-only adapter.

Current status for `Read messages`: `IMPLEMENTED`.

## Evidence Boundary

Source: authorized browser HAR from the user's own logged-in Vinted session, summarized in the VNT-104 task prompt. The raw HAR was not found in the available local paths during implementation and must never be committed.

Because the raw HAR was not available to inspect directly in this execution, this document records only the sanitized facts supplied by the task plus the conservative fixture shape used for tests. No additional header requirement, cookie requirement or write behavior is inferred.

## Verified Conversation Detail Route

Verified request:

- `GET https://api.vinted.fr/messaging/main/conversations/[CONVERSATION_ID]`
- host class: `api`
- path template: `/messaging/main/conversations/{conversationId}`
- status: `200`
- content type: `application/json`
- query: none observed

Implementation:

- `packages/vinted-client/src/messaging/VintedMessagingClient.ts`
- method: `getConversation(conversationId: string | number)`
- encoded path: `/messaging/main/conversations/${encodeURIComponent(String(conversationId))}`
- request diagnostics: `includeResponseBodyPreview = false`
- writes: none

## Observed Request Header Names

Header names previously observed on messaging traffic:

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

- Cookies were not observable in HAR; do not conclude they are absent or unnecessary.
- `Authorization` was not observed.
- Header names above are observed, not proven mandatory.

## Observed Response Shape

Root fields observed:

- `allow_reply`
- `conversation_type`
- `created_at`
- `data`
- `id`
- `is_deletable`
- `is_peeking`
- `is_seen`
- `is_unread_by_current_user`
- `localization`
- `messages`
- `opposite_users`
- `pagination`
- `peeking_as_side`

Message fields observed:

- `conversation_id`
- `created_at`
- `data`
- `id`
- `message_type`
- `sender_id`

## Mapping Scope

Mapped conversation fields:

- `id`
- `allowReply`
- `conversationType`
- `createdAt`
- `isUnreadByCurrentUser`
- `messages`
- `pagination`

Mapped message fields:

- `id`
- `conversationId`
- `senderId`
- `messageType`
- `createdAt`
- `text`, only for plain text messages where `message_type === "text"` and `data.body` is a string

Non-text message data is tolerated but not mapped into business fields in VNT-104. This avoids incorrectly treating system, offer or attachment payloads as user-written text.

## Pagination

The sanitized fixture preserves cursor-style pagination:

- `has_next`
- `has_prev`
- `next_cursor`
- `prev_cursor`

Cursors are opaque. Do not decode or interpret them.

## Privacy Policy

The adapter may return message text to the caller because reading message text is the product behavior of `VNT-104`.

Diagnostics are different: they must not log message bodies, message `data`, private usernames, attachment URLs or negotiated text. `VintedMessagingClient.getConversation()` therefore forces response body previews off at request level, even when the global `DiagnosticTransport` is configured with `includeJsonPreview: true`.

Test coverage includes a simulated `PRIVATE_MESSAGE_SECRET` body that is returned by `getConversation()` but absent from `JSON.stringify(diagnostics)`.

## Fixture

Sanitized evidence fixture:

- `fixtures/vinted/messaging/conversation-detail-fr.sanitised.json`

Package test fixture:

- `packages/vinted-client/src/messaging/__fixtures__/conversation-detail-response.sanitised.json`

The fixtures contain fictitious IDs, redacted usernames, sanitized message text and redacted attachment/cursor values only.

## Open Questions

- Which exact message `data` shapes appear for every Vinted `message_type` in the raw HAR and in other real conversations?
- Does plain text always use `data.body`, or are there locale/market/client variants?
- Does the detail route support pagination queries, and if so which cursor/query names are sent for older/newer messages?
- Which headers are actually required outside the browser versus merely observed?
- Does the route shape remain stable across non-FR markets?
