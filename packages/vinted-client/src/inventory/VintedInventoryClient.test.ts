import { describe, expect, it } from "vitest";

import { VintedInventoryClient } from "./VintedInventoryClient.js";
import {
  InvalidOwnInventoryInputError,
  InvalidOwnInventoryResponseError,
  OwnInventoryHttpError,
  OwnInventorySessionError
} from "./errors.js";
import { buildOwnInventoryQuery, mapOwnInventoryItem, mapOwnInventoryResponse } from "./mappers.js";
import type { OwnInventoryInput } from "./types.js";
import type { VintedMarket } from "../session/publicSession.js";
import type { VintedSession } from "../session/VintedSession.js";
import type { VintedRequest, VintedResponse, VintedTransport } from "../transport/types.js";
import { DiagnosticTransport } from "../diagnostics/DiagnosticTransport.js";
import { MemoryDiagnosticSink } from "../diagnostics/sinks.js";
import inventoryFixture from "./__fixtures__/own-inventory-response.sanitised.json" with { type: "json" };

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
  acquiredAt: "2026-09-21T17:30:00.000Z"
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

describe("buildOwnInventoryQuery", () => {
  it("builds observed pagination and order params", () => {
    expect(
      buildOwnInventoryQuery({
        userId: 123,
        page: 1,
        perPage: 20
      })
    ).toEqual({
      page: 1,
      per_page: 20,
      order: "relevance"
    });
  });

  it("rejects invalid inputs and unobserved order values", () => {
    const invalidInputs = [
      { userId: "", page: 1 },
      { userId: 123, page: 0 },
      { userId: 123, perPage: 0 },
      { userId: 123, page: Number.NaN },
      { userId: 123, perPage: Number.POSITIVE_INFINITY },
      { userId: 123, order: "newest" }
    ];

    for (const input of invalidInputs) {
      expect(() => buildOwnInventoryQuery(input as OwnInventoryInput)).toThrow(InvalidOwnInventoryInputError);
    }
  });
});

describe("own inventory response mapping", () => {
  it("maps page 1 items and pagination", () => {
    expect(mapOwnInventoryResponse(inventoryFixture.page1)).toEqual({
      items: [
        {
          id: 111111111,
          title: "sanitised listed item",
          userId: 999999999,
          price: {
            amount: "12.00",
            currency: "EUR"
          },
          status: "En ligne",
          isDraft: false,
          isClosed: false,
          isReserved: false,
          isHidden: false,
          canEdit: true,
          canPushUp: true,
          favouriteCount: 4,
          viewCount: 42,
          path: "/items/111111111-sanitised-listed-item",
          imageUrl: "https://images.example.invalid/own-inventory.webp"
        }
      ],
      pagination: {
        currentPage: 1,
        totalPages: 2,
        totalEntries: 23,
        perPage: 20,
        time: 123
      }
    });
  });

  it("maps page 2 pagination", () => {
    expect(mapOwnInventoryResponse(inventoryFixture.page2).pagination).toEqual({
      currentPage: 2,
      totalPages: 2,
      totalEntries: 23,
      perPage: 20,
      time: 456
    });
  });

  it("supports empty responses", () => {
    expect(mapOwnInventoryResponse(inventoryFixture.empty)).toEqual({
      items: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalEntries: 0,
        perPage: 20,
        time: 789
      }
    });
  });

  it("allows optional item fields to be absent and normalizes numeric prices to strings", () => {
    expect(
      mapOwnInventoryItem({
        id: "minimal",
        price: {
          amount: 10,
          currency_code: "EUR"
        }
      })
    ).toEqual({
      id: "minimal",
      price: {
        amount: "10",
        currency: "EUR"
      }
    });
  });

  it("rejects invalid payloads", () => {
    expect(() => mapOwnInventoryResponse("not-json")).toThrow(InvalidOwnInventoryResponseError);
    expect(() => mapOwnInventoryResponse({})).toThrow(InvalidOwnInventoryResponseError);
    expect(() => mapOwnInventoryItem({ title: "missing id" })).toThrow(InvalidOwnInventoryResponseError);
  });
});

describe("VintedInventoryClient", () => {
  it("sends own inventory requests to site host with wardrobe route, encoded userId and observed query params", async () => {
    const transport = new StubTransport({
      status: 200,
      statusText: "OK",
      headers: {
        "content-type": "application/json"
      },
      data: inventoryFixture.page1
    });
    const client = new VintedInventoryClient({ market, session, transport });

    const result = await client.getOwnInventory({
      userId: "user id/with slash",
      page: 1,
      perPage: 20,
      order: "relevance"
    });

    expect(result.items).toHaveLength(1);
    expect(transport.requests[0]).toMatchObject({
      method: "GET",
      host: "site",
      hostname: "www.vinted.fr",
      path: "/api/v2/wardrobe/user%20id%2Fwith%20slash/items",
      query: {
        page: 1,
        per_page: 20,
        order: "relevance"
      },
      headers: {
        accept: "application/json, text/plain, */*",
        cookie: "v_udt=cookie-live; access_token_web=access-live",
        "accept-language": "fr-FR",
        locale: "fr-FR",
        "x-anon-id": "anon-live",
        "x-csrf-token": "csrf-live"
      }
    });
  });

  it("accepts a session provider", async () => {
    const transport = new StubTransport({
      status: 200,
      headers: {},
      data: inventoryFixture.empty
    });
    const client = new VintedInventoryClient({
      market,
      transport,
      session: {
        getSession: () => Promise.resolve(session)
      }
    });

    await expect(client.getOwnInventory({ userId: 123, page: 1, perPage: 20 })).resolves.toMatchObject({
      items: []
    });
  });

  it("throws on missing session material", async () => {
    const client = new VintedInventoryClient({
      market,
      transport: new StubTransport({
        status: 200,
        headers: {},
        data: inventoryFixture.empty
      }),
      session: {
        cookies: {},
        acquiredAt: "2026-09-21T17:30:00.000Z"
      }
    });

    await expect(client.getOwnInventory({ userId: 123 })).rejects.toThrow(OwnInventorySessionError);
  });

  it("throws on HTTP non-200", async () => {
    const client = new VintedInventoryClient({
      market,
      session,
      transport: new StubTransport({
        status: 403,
        statusText: "Forbidden",
        headers: {},
        data: { error: "forbidden" }
      })
    });

    await expect(client.getOwnInventory({ userId: 123 })).rejects.toThrow(OwnInventoryHttpError);
  });

  it("does not leak secrets through diagnostics", async () => {
    const sink = new MemoryDiagnosticSink();
    const innerTransport = new StubTransport({
      status: 200,
      headers: {},
      data: inventoryFixture.empty
    });
    const client = new VintedInventoryClient({
      market,
      session,
      transport: new DiagnosticTransport(innerTransport, sink)
    });

    await client.getOwnInventory({ userId: 123, page: 1, perPage: 20 });

    const serialized = JSON.stringify(sink.entries);
    expect(serialized).not.toContain("cookie-live");
    expect(serialized).not.toContain("access-live");
    expect(serialized).not.toContain("anon-live");
    expect(serialized).not.toContain("csrf-live");
    expect(serialized).toContain("[REDACTED]");
  });
});
