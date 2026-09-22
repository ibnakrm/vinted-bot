import { describe, expect, it } from "vitest";

import { VintedMessagingClient } from "./VintedMessagingClient.js";
import {
  ConversationHttpError,
  InvalidConversationInputError,
  InvalidConversationResponseError,
  InvalidMessageThreadsInputError,
  InvalidMessageThreadsResponseError,
  InvalidSendMessageInputError,
  InvalidSentMessageResponseError,
  MessageThreadsHttpError,
  MessageThreadsSessionError,
  SendMessageHttpError
} from "./errors.js";
import {
  buildConversationPath,
  buildMessageThreadsQuery,
  buildSendMessagePath,
  buildSendMessagePayload,
  mapConversationMessage,
  mapConversationResponse,
  mapMessageThread,
  mapMessageThreadsResponse,
  mapSentMessageResponse
} from "./mappers.js";
import type { VintedMarket } from "../session/publicSession.js";
import type { VintedSession } from "../session/VintedSession.js";
import { DiagnosticTransport } from "../diagnostics/DiagnosticTransport.js";
import { MemoryDiagnosticSink } from "../diagnostics/sinks.js";
import type { VintedRequest, VintedResponse, VintedTransport } from "../transport/types.js";
import conversationFixture from "./__fixtures__/conversation-detail-response.sanitised.json" with { type: "json" };
import messageThreadsFixture from "./__fixtures__/message-threads-response.sanitised.json" with { type: "json" };
import sendMessageFixture from "./__fixtures__/send-message-response.sanitised.json" with { type: "json" };

const market: VintedMarket = {
  siteBaseUrl: "https://www.vinted.fr",
  apiBaseUrl: "https://api.vinted.fr",
  hostname: "www.vinted.fr",
  market: "FR"
};

const session: VintedSession = {
  cookies: {
    v_udt: "cookie-live",
    access_token_web: "access-live"
  },
  anonId: "anon-live",
  csrfToken: "csrf-live",
  locale: "fr-FR",
  acquiredAt: "2026-09-22T10:00:00.000Z"
};

class StubTransport implements VintedTransport {
  public readonly requests: VintedRequest[] = [];

  public constructor(private readonly response: VintedResponse<unknown>) {}

  public request<T>(request: VintedRequest): Promise<VintedResponse<T>> {
    this.requests.push(request);
    return Promise.resolve({
      ...this.response,
      requestId: request.requestId
    } as VintedResponse<T>);
  }
}

describe("buildMessageThreadsQuery", () => {
  it("does not send a query on the first page", () => {
    expect(buildMessageThreadsQuery()).toEqual({});
  });

  it("sends only next_cursor for cursor pagination", () => {
    expect(buildMessageThreadsQuery({ nextCursor: "[REDACTED_CURSOR]" })).toEqual({
      next_cursor: "[REDACTED_CURSOR]"
    });
  });

  it("rejects empty cursors", () => {
    expect(() => buildMessageThreadsQuery({ nextCursor: "" })).toThrow(InvalidMessageThreadsInputError);
  });
});

describe("buildConversationPath", () => {
  it("encodes conversation IDs in the observed detail path", () => {
    expect(buildConversationPath("conversation id/with slash")).toBe(
      "/messaging/main/conversations/conversation%20id%2Fwith%20slash"
    );
  });

  it("rejects invalid conversation IDs", () => {
    expect(() => buildConversationPath("")).toThrow(InvalidConversationInputError);
    expect(() => buildConversationPath(Number.NaN)).toThrow(InvalidConversationInputError);
  });
});

describe("send message request mapping", () => {
  it("encodes conversation IDs in the observed replies path", () => {
    expect(buildSendMessagePath("conversation id/with slash")).toBe(
      "/messaging/main/conversations/conversation%20id%2Fwith%20slash/replies"
    );
  });

  it("builds the exact observed text payload without modifying content", () => {
    expect(
      buildSendMessagePayload({
        conversationId: "conversation_111",
        content: "  PRIVATE_MESSAGE_SECRET  "
      })
    ).toEqual({
      content: "  PRIVATE_MESSAGE_SECRET  ",
      is_personal_data_sharing_check_skipped: false,
      photo_temp_uuids: null
    });
  });

  it("rejects invalid conversation IDs and blank content", () => {
    expect(() => buildSendMessagePath("")).toThrow(InvalidSendMessageInputError);
    expect(() => buildSendMessagePayload({ conversationId: "conversation_111", content: "" })).toThrow(
      InvalidSendMessageInputError
    );
    expect(() => buildSendMessagePayload({ conversationId: "conversation_111", content: "   " })).toThrow(
      InvalidSendMessageInputError
    );
  });
});

describe("message thread response mapping", () => {
  it("maps threads, last-message metadata, unread flag and pagination", () => {
    expect(mapMessageThreadsResponse(messageThreadsFixture.page1)).toEqual({
      threads: [
        {
          id: "conversation_1001",
          conversationType: "item",
          createdAt: "2026-09-22T09:10:11+02:00",
          isDeletable: true,
          isUnreadByCurrentUser: true,
          lastMessage: {
            id: "message_5001",
            conversationId: "conversation_1001",
            senderId: "user_2001",
            messageType: "text",
            createdAt: "2026-09-22T09:15:00+02:00"
          },
          oppositeUsers: [
            {
              type: "user"
            }
          ]
        },
        {
          id: "conversation_1002",
          isDeletable: false,
          isUnreadByCurrentUser: false,
          oppositeUsers: []
        }
      ],
      pagination: {
        hasNext: true,
        hasPrev: false,
        nextCursor: "[REDACTED_CURSOR]"
      }
    });
  });

  it("supports empty conversations", () => {
    expect(mapMessageThreadsResponse(messageThreadsFixture.empty)).toEqual({
      threads: [],
      pagination: {
        hasNext: false,
        hasPrev: false
      }
    });
  });

  it("allows optional fields to be absent", () => {
    expect(mapMessageThread({ id: 123 })).toEqual({
      id: "123"
    });
  });

  it("rejects invalid payloads", () => {
    expect(() => mapMessageThreadsResponse("not-json")).toThrow(InvalidMessageThreadsResponseError);
    expect(() => mapMessageThreadsResponse({})).toThrow(InvalidMessageThreadsResponseError);
    expect(() => mapMessageThread({ created_at: "missing id" })).toThrow(InvalidMessageThreadsResponseError);
  });
});

describe("conversation detail response mapping", () => {
  it("maps conversation metadata, messages, plain text and pagination", () => {
    expect(mapConversationResponse(conversationFixture.full)).toEqual({
      id: "conversation_1001",
      allowReply: true,
      conversationType: "item",
      createdAt: "2026-09-22T10:20:30+02:00",
      isUnreadByCurrentUser: false,
      messages: [
        {
          id: "message_5001",
          conversationId: "conversation_1001",
          senderId: "user_2001",
          messageType: "text",
          createdAt: "2026-09-22T10:21:00+02:00",
          text: "SANITISED_MESSAGE"
        },
        {
          id: "message_5002",
          conversationId: "conversation_1001",
          messageType: "system",
          createdAt: "2026-09-22T10:22:00+02:00"
        },
        {
          id: "message_5003",
          conversationId: "conversation_1001",
          senderId: "user_2002",
          messageType: "offer",
          createdAt: "2026-09-22T10:23:00+02:00"
        },
        {
          id: "message_5004",
          conversationId: "conversation_1001",
          senderId: "user_2001",
          messageType: "attachment",
          createdAt: "2026-09-22T10:24:00+02:00"
        }
      ],
      pagination: {
        hasNext: false,
        hasPrev: true,
        prevCursor: "[REDACTED_CURSOR]"
      }
    });
  });

  it("supports empty messages and optional fields", () => {
    expect(mapConversationResponse(conversationFixture.empty)).toEqual({
      id: "conversation_1002",
      allowReply: false,
      messages: [],
      pagination: {
        hasNext: false,
        hasPrev: false
      }
    });
  });

  it("tolerates non-text message data without mapping it as text", () => {
    expect(
      mapConversationMessage({
        id: 123,
        message_type: "system",
        data: {
          body: "do not expose as text"
        }
      })
    ).toEqual({
      id: 123,
      messageType: "system"
    });
  });

  it("rejects invalid conversation payloads", () => {
    expect(() => mapConversationResponse("not-json")).toThrow(InvalidConversationResponseError);
    expect(() => mapConversationResponse({ id: "conversation_1001" })).toThrow(InvalidConversationResponseError);
    expect(() => mapConversationMessage({ message_type: "text" })).toThrow(InvalidConversationResponseError);
  });
});

describe("sent message response mapping", () => {
  it("maps reply_plain response metadata and data.content text", () => {
    expect(mapSentMessageResponse(sendMessageFixture.plainText)).toEqual({
      id: "message_333",
      conversationId: "conversation_111",
      senderId: "user_222",
      createdAt: "2026-09-22T12:00:00Z",
      messageType: "reply_plain",
      text: "SANITISED_MESSAGE"
    });
  });

  it("tolerates missing optional sent message fields", () => {
    expect(mapSentMessageResponse({ id: 123, data: {} })).toEqual({
      id: 123
    });
  });

  it("rejects invalid sent message payloads", () => {
    expect(() => mapSentMessageResponse("not-json")).toThrow(InvalidSentMessageResponseError);
    expect(() => mapSentMessageResponse({ data: { content: "missing id" } })).toThrow(InvalidSentMessageResponseError);
  });
});

describe("VintedMessagingClient", () => {
  it("sends first-page inbox requests to api host without query params", async () => {
    const transport = new StubTransport({
      status: 200,
      statusText: "OK",
      headers: {
        "content-type": "application/json"
      },
      data: messageThreadsFixture.page1
    });
    const client = new VintedMessagingClient({ market, session, transport });

    const result = await client.listMessageThreads();

    expect(result.threads).toHaveLength(2);
    expect(transport.requests[0]).toMatchObject({
      method: "GET",
      host: "api",
      hostname: "api.vinted.fr",
      path: "/messaging/main/inbox",
      query: {},
      headers: {
        accept: "application/json, text/plain, */*",
        cookie: "v_udt=cookie-live; access_token_web=access-live",
        "accept-language": "fr-FR",
        locale: "fr-FR",
        "x-anon-id": "anon-live",
        "x-csrf-token": "csrf-live"
      },
      diagnostics: {
        includeResponseBodyPreview: false
      }
    });
  });

  it("sends next_cursor on next-page requests", async () => {
    const transport = new StubTransport({
      status: 200,
      headers: {},
      data: messageThreadsFixture.empty
    });
    const client = new VintedMessagingClient({ market, session, transport });

    await client.listMessageThreads({ nextCursor: "[REDACTED_CURSOR]" });

    expect(transport.requests[0]?.query).toEqual({
      next_cursor: "[REDACTED_CURSOR]"
    });
  });

  it("accepts a session provider", async () => {
    const client = new VintedMessagingClient({
      market,
      transport: new StubTransport({
        status: 200,
        headers: {},
        data: messageThreadsFixture.empty
      }),
      session: {
        getSession: () => Promise.resolve(session)
      }
    });

    await expect(client.listMessageThreads()).resolves.toEqual({
      threads: [],
      pagination: {
        hasNext: false,
        hasPrev: false
      }
    });
  });

  it("throws on missing session material", async () => {
    const client = new VintedMessagingClient({
      market,
      transport: new StubTransport({
        status: 200,
        headers: {},
        data: messageThreadsFixture.empty
      }),
      session: {
        cookies: {},
        acquiredAt: "2026-09-22T10:00:00.000Z"
      }
    });

    await expect(client.listMessageThreads()).rejects.toThrow(MessageThreadsSessionError);
  });

  it("throws on HTTP non-200", async () => {
    const client = new VintedMessagingClient({
      market,
      session,
      transport: new StubTransport({
        status: 403,
        statusText: "Forbidden",
        headers: {},
        data: { error: "forbidden" }
      })
    });

    await expect(client.listMessageThreads()).rejects.toThrow(MessageThreadsHttpError);
  });

  it("sends conversation detail requests to api host with an encoded conversation ID", async () => {
    const transport = new StubTransport({
      status: 200,
      statusText: "OK",
      headers: {
        "content-type": "application/json"
      },
      data: conversationFixture.full
    });
    const client = new VintedMessagingClient({ market, session, transport });

    const result = await client.getConversation("conversation id/with slash");

    expect(result.messages).toHaveLength(4);
    expect(transport.requests[0]).toMatchObject({
      method: "GET",
      host: "api",
      hostname: "api.vinted.fr",
      path: "/messaging/main/conversations/conversation%20id%2Fwith%20slash",
      query: {},
      headers: {
        accept: "application/json, text/plain, */*",
        cookie: "v_udt=cookie-live; access_token_web=access-live",
        "accept-language": "fr-FR",
        locale: "fr-FR",
        "x-anon-id": "anon-live",
        "x-csrf-token": "csrf-live"
      },
      diagnostics: {
        includeResponseBodyPreview: false
      }
    });
  });

  it("throws conversation-specific errors on HTTP non-200", async () => {
    const client = new VintedMessagingClient({
      market,
      session,
      transport: new StubTransport({
        status: 404,
        statusText: "Not Found",
        headers: {},
        data: { error: "not_found" }
      })
    });

    await expect(client.getConversation("conversation_1001")).rejects.toThrow(ConversationHttpError);
  });

  it("sends text messages with POST, api host, JSON content type and exact minimal payload", async () => {
    const transport = new StubTransport({
      status: 201,
      statusText: "Created",
      headers: {
        "content-type": "application/json"
      },
      data: sendMessageFixture.plainText
    });
    const client = new VintedMessagingClient({ market, session, transport });

    const result = await client.sendMessage({
      conversationId: "conversation id/with slash",
      content: "  SANITISED_MESSAGE  "
    });

    expect(result).toMatchObject({
      id: "message_333",
      messageType: "reply_plain",
      text: "SANITISED_MESSAGE"
    });
    expect(transport.requests[0]).toMatchObject({
      method: "POST",
      host: "api",
      hostname: "api.vinted.fr",
      path: "/messaging/main/conversations/conversation%20id%2Fwith%20slash/replies",
      query: {},
      headers: {
        accept: "application/json, text/plain, */*",
        "content-type": "application/json",
        cookie: "v_udt=cookie-live; access_token_web=access-live",
        "accept-language": "fr-FR",
        locale: "fr-FR",
        "x-anon-id": "anon-live",
        "x-csrf-token": "csrf-live"
      },
      body: {
        content: "  SANITISED_MESSAGE  ",
        is_personal_data_sharing_check_skipped: false,
        photo_temp_uuids: null
      },
      diagnostics: {
        includeRequestBodyPreview: false,
        includeResponseBodyPreview: false
      }
    });
  });

  it("throws send-message errors on HTTP non-201", async () => {
    const client = new VintedMessagingClient({
      market,
      session,
      transport: new StubTransport({
        status: 403,
        statusText: "Forbidden",
        headers: {},
        data: { error: "forbidden" }
      })
    });

    await expect(client.sendMessage({ conversationId: "conversation_111", content: "hello" })).rejects.toThrow(
      SendMessageHttpError
    );
  });

  it("sends private content to transport but never includes request or response bodies in diagnostics", async () => {
    const sink = new MemoryDiagnosticSink();
    const privateMessageBody = "PRIVATE_MESSAGE_SECRET";
    const innerTransport = new StubTransport({
      status: 201,
      statusText: "Created",
      headers: {
        "content-type": "application/json"
      },
      data: {
        conversation_id: "conversation_111",
        created_at: "2026-09-22T12:00:00Z",
        data: {
          content: privateMessageBody,
          id: "message_data_333"
        },
        id: "message_333",
        message_type: "reply_plain",
        sender_id: "user_222"
      }
    });
    const client = new VintedMessagingClient({
      market,
      session,
      transport: new DiagnosticTransport(innerTransport, sink, { includeJsonPreview: true })
    });

    const result = await client.sendMessage({
      conversationId: "conversation_111",
      content: privateMessageBody
    });

    expect(innerTransport.requests[0]?.body).toEqual({
      content: privateMessageBody,
      is_personal_data_sharing_check_skipped: false,
      photo_temp_uuids: null
    });
    expect(result.text).toBe(privateMessageBody);
    const serialized = JSON.stringify(sink.entries);
    expect(serialized).not.toContain(privateMessageBody);
    expect(serialized).not.toContain("cookie-live");
    expect(serialized).not.toContain("access-live");
    expect(serialized).not.toContain("anon-live");
    expect(serialized).not.toContain("csrf-live");
    expect(sink.entries[0]?.request.body.preview).toBeUndefined();
    expect(sink.entries[0]?.response?.body.preview).toBeUndefined();
    expect(serialized).toContain("[REDACTED]");
  });

  it("returns private text to code but never includes it in serialized diagnostics", async () => {
    const sink = new MemoryDiagnosticSink();
    const privateMessageBody = "PRIVATE_MESSAGE_SECRET";
    const innerTransport = new StubTransport({
      status: 200,
      headers: {
        "content-type": "application/json"
      },
      data: {
        id: "conversation_1001",
        messages: [
          {
            id: "message_5001",
            conversation_id: "conversation_1001",
            sender_id: "user_2001",
            message_type: "text",
            created_at: "2026-09-22T10:21:00+02:00",
            data: {
              body: privateMessageBody
            }
          }
        ],
        pagination: {
          has_next: false,
          has_prev: false
        }
      }
    });
    const client = new VintedMessagingClient({
      market,
      session,
      transport: new DiagnosticTransport(innerTransport, sink, { includeJsonPreview: true })
    });

    const result = await client.getConversation("conversation_1001");

    expect(result.messages[0]?.text).toBe(privateMessageBody);
    const serialized = JSON.stringify(sink.entries);
    expect(serialized).not.toContain(privateMessageBody);
    expect(serialized).not.toContain("cookie-live");
    expect(serialized).not.toContain("access-live");
    expect(serialized).not.toContain("anon-live");
    expect(serialized).not.toContain("csrf-live");
    expect(sink.entries[0]?.response?.body.preview).toBeUndefined();
    expect(serialized).toContain("[REDACTED]");
  });

  it("redacts secrets and prevents private response payload preview in serialized diagnostics", async () => {
    const sink = new MemoryDiagnosticSink();
    const privateMessageBody = "PRIVATE_MESSAGE_BODY_SHOULD_NOT_APPEAR";
    const innerTransport = new StubTransport({
      status: 200,
      headers: {
        "content-type": "application/json"
      },
      data: {
        conversations: [
          {
            id: "conversation_1001",
            last_message: {
              id: "message_5001",
              data: {
                body: privateMessageBody
              }
            }
          }
        ],
        pagination: {
          has_next: false,
          has_prev: false
        }
      }
    });
    const client = new VintedMessagingClient({
      market,
      session,
      transport: new DiagnosticTransport(innerTransport, sink, { includeJsonPreview: true })
    });

    await client.listMessageThreads();

    const serialized = JSON.stringify(sink.entries);
    expect(serialized).not.toContain("cookie-live");
    expect(serialized).not.toContain("access-live");
    expect(serialized).not.toContain("anon-live");
    expect(serialized).not.toContain("csrf-live");
    expect(serialized).not.toContain(privateMessageBody);
    expect(sink.entries[0]?.response?.body.preview).toBeUndefined();
    expect(serialized).toContain("[REDACTED]");
  });
});
