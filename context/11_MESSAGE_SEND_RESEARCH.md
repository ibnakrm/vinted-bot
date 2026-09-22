# Message Send Research

Last updated: 2026-09-22  
Backlog item: `VNT-301 - Send message adapter`

## Status

Current plain text reply endpoint is verified from an authorized FR browser HAR and implemented as a scoped write adapter.

Current status for `Send message`: `IMPLEMENTED`.

## Safety Scope

This task implements only a direct plain text reply to an existing conversation.

Not implemented:

- photo messages;
- photo upload;
- create conversation;
- send offer;
- accept/decline offer;
- automatic replies;
- bulk messaging;
- favorite automations.

## Verified Route

- method: `POST`
- URL: `https://api.vinted.fr/messaging/main/conversations/{conversationId}/replies`
- host class: `api`
- sanitized path: `/messaging/main/conversations/[CONVERSATION_ID]/replies`
- observed status: `201`
- content type: `application/json`
- query: none observed

## Observed Request Shape

Plain text message payload:

```json
{
  "content": "SANITISED_MESSAGE",
  "is_personal_data_sharing_check_skipped": false,
  "photo_temp_uuids": null
}
```

Implementation constraints:

- `content` is forwarded unchanged after rejecting empty/whitespace-only input.
- `is_personal_data_sharing_check_skipped` is always `false` and is not exposed in the public client input.
- `photo_temp_uuids` is always `null` for plain text messages.
- No extra request properties are invented.

## Observed Response Shape

Root fields:

- `conversation_id`
- `created_at`
- `data`
- `id`
- `message_type`
- `sender_id`

`data` fields observed:

- `content`
- `id`

Observed message type:

- `reply_plain`

The mapper does not hardcode that every future response must have `reply_plain`; it maps the observed `message_type` as returned.

## Observed Header Names

Header names observed in the HAR:

- `accept`
- `accept-language`
- `content-type`
- `locale`
- `origin`
- `platform`
- `referer`
- `user-agent`
- `x-anon-id`
- `x-csrf-token`
- `x-next-app`

Implementation sends `Content-Type: application/json`.

Important auth notes:

- `Authorization`: not observed.
- Cookies: not established from this capture.
- Header names above are observed, not proven mandatory.

## Privacy Policy

This route contains private message text in both request and response bodies.

`VintedMessagingClient.sendMessage()` therefore forces:

- request body preview disabled;
- response body preview disabled.

The adapter still sends the exact text to the transport and returns `data.content` as `text` to code. Tests include `PRIVATE_MESSAGE_SECRET` and prove it reaches the simulated transport and mapped result while staying absent from `JSON.stringify(diagnostics)`.

## Fixture

Sanitized evidence fixture:

- `fixtures/vinted/messaging/send-message-fr.sanitised.json`

Package test fixture:

- `packages/vinted-client/src/messaging/__fixtures__/send-message-response.sanitised.json`

The fixtures contain only fictitious IDs and sanitized message content.

## Unknowns

- Which headers/cookies are required outside the browser versus merely observed.
- Whether Vinted has server-side validation constraints such as max content length.
- How attachment/photo replies are uploaded and referenced.
- Whether other reply payload variants exist for offers or system-like actions.
- Whether non-FR markets share the same reply route and payload.
