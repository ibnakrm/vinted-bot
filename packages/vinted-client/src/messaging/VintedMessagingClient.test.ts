import { describe, expect, it } from "vitest";

import { VintedMessagingClient } from "./VintedMessagingClient.js";
import {
  InvalidMessageThreadsInputError,
  InvalidMessageThreadsResponseError,
  MessageThreadsHttpError,
  MessageThreadsSessionError
} from "./errors.js";
import { buildMessageThreadsQuery, mapMessageThread, mapMessageThreadsResponse } from "./mappers.js";
import type { VintedMarket } from "../session/publicSession.js";
import type { VintedSession } from "../session/VintedSession.js";
import { DiagnosticTransport } from "../diagnostics/DiagnosticTransport.js";
import { MemoryDiagnosticSink } from "../diagnostics/sinks.js";
import type { VintedRequest, VintedResponse, VintedTransport } from "../transport/types.js";
import messageThreadsFixture from "./__fixtures__/message-threads-response.sanitised.json" with { type: "json" };

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
