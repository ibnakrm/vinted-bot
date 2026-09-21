import { describe, expect, it } from "vitest";

import { VintedCatalogClient } from "./VintedCatalogClient.js";
import {
  CatalogSearchHttpError,
  CatalogSearchSessionError,
  InvalidCatalogSearchInputError,
  InvalidCatalogSearchResponseError
} from "./errors.js";
import { buildCatalogSearchQuery, mapCatalogSearchItem, mapCatalogSearchResponse } from "./mappers.js";
import type { VintedMarket } from "../session/publicSession.js";
import type { VintedSession } from "../session/VintedSession.js";
import type { VintedRequest, VintedResponse, VintedTransport } from "../transport/types.js";
import { DiagnosticTransport } from "../diagnostics/DiagnosticTransport.js";
import { MemoryDiagnosticSink } from "../diagnostics/sinks.js";
import catalogFixture from "./__fixtures__/catalog-search-response.sanitised.json" with { type: "json" };

const market: VintedMarket = {
  siteBaseUrl: "https://www.vinted.fr",
  apiBaseUrl: "https://api.vinted.fr",
  hostname: "www.vinted.fr",
  market: "FR"
};

const session: VintedSession = {
  cookies: {
    v_udt: "cookie-live",
    anon_id: "anon-cookie"
  },
  anonId: "anon-live",
  locale: "fr-FR",
  acquiredAt: "2026-09-21T09:00:00.000Z"
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

describe("buildCatalogSearchQuery", () => {
  it("builds text query, price and pagination params", () => {
    expect(
      buildCatalogSearchQuery({
        query: "polo Lacoste",
        priceFrom: 10,
        priceTo: 15,
        page: 1,
        perPage: 10
      })
    ).toEqual({
      search_text: "polo Lacoste",
      price_from: 10,
      price_to: 15,
      page: 1,
      per_page: 10
    });
  });

  it("rejects invalid search inputs before building Vinted query params", () => {
    const invalidInputs = [
      { priceFrom: -1 },
      { priceTo: -1 },
      { priceFrom: 20, priceTo: 10 },
      { page: 0 },
      { perPage: 0 },
      { page: Number.NaN },
      { perPage: Number.POSITIVE_INFINITY },
      { priceFrom: Number.NEGATIVE_INFINITY }
    ];

    for (const input of invalidInputs) {
      expect(() => buildCatalogSearchQuery(input)).toThrow(InvalidCatalogSearchInputError);
    }
  });
});

describe("catalog search response mapping", () => {
  it("parses a result from the sanitized fixture", () => {
    expect(mapCatalogSearchResponse(catalogFixture)).toEqual({
      items: [
        {
          id: 123456789,
          title: "polo lacoste",
          price: {
            amount: "10.00",
            currency: "EUR"
          },
          url: "https://www.vinted.fr/items/123456789-sanitised",
          imageUrl: "https://images.example.invalid/sanitised.webp",
          displayFirstLine: "Lacoste",
          displaySecondLine: "M · Très bon état",
          userId: 987654321
        }
      ],
      pagination: {
        currentPage: 1,
        perPage: 10,
        totalEntries: 960,
        totalPages: 96
      }
    });
  });

  it("allows optional item fields to be absent", () => {
    expect(mapCatalogSearchItem({ id: "minimal" })).toEqual({ id: "minimal" });
  });

  it("prefers explicit business fields and keeps item_box values as display metadata only", () => {
    expect(
      mapCatalogSearchItem({
        id: 1,
        brand_title: "Explicit Brand",
        size_title: "Explicit Size",
        price: {
          amount: 12,
          currency_code: "EUR"
        },
        item_box: {
          first_line: "Display Brand",
          second_line: "Display Size · Condition"
        }
      })
    ).toEqual({
      id: 1,
      brand: "Explicit Brand",
      size: "Explicit Size",
      price: {
        amount: "12",
        currency: "EUR"
      },
      displayFirstLine: "Display Brand",
      displaySecondLine: "Display Size · Condition"
    });
  });

  it("supports empty responses", () => {
    expect(mapCatalogSearchResponse({ items: [], pagination: { current_page: 1, per_page: 10 } })).toEqual({
      items: [],
      pagination: {
        currentPage: 1,
        perPage: 10
      }
    });
  });

  it("rejects invalid JSON-like payloads", () => {
    expect(() => mapCatalogSearchResponse("not-json")).toThrow(InvalidCatalogSearchResponseError);
    expect(() => mapCatalogSearchResponse({})).toThrow(InvalidCatalogSearchResponseError);
  });
});

describe("VintedCatalogClient", () => {
  it("sends search requests with session headers and query params", async () => {
    const transport = new StubTransport({
      status: 200,
      statusText: "OK",
      headers: {
        "content-type": "application/json"
      },
      data: catalogFixture
    });
    const client = new VintedCatalogClient({ market, session, transport });

    const result = await client.searchItems({
      query: "polo Lacoste",
      priceFrom: 10,
      priceTo: 15,
      page: 1,
      perPage: 10
    });

    expect(result.items).toHaveLength(1);
    expect(transport.requests[0]).toMatchObject({
      method: "GET",
      host: "api",
      hostname: "api.vinted.fr",
      path: "/svc-catalogue/items",
      query: {
        search_text: "polo Lacoste",
        price_from: 10,
        price_to: 15,
        page: 1,
        per_page: 10
      },
      headers: {
        accept: "application/json, text/plain, */*",
        cookie: "v_udt=cookie-live; anon_id=anon-cookie",
        "x-anon-id": "anon-live",
        "accept-language": "fr-FR"
      }
    });
  });

  it("accepts a session provider", async () => {
    const transport = new StubTransport({
      status: 200,
      headers: {},
      data: { items: [] }
    });
    const client = new VintedCatalogClient({
      market,
      transport,
      session: {
        getSession: () => Promise.resolve(session)
      }
    });

    await expect(client.searchItems({ page: 1 })).resolves.toEqual({ items: [] });
  });

  it("throws on HTTP non-200", async () => {
    const client = new VintedCatalogClient({
      market,
      session,
      transport: new StubTransport({
        status: 403,
        statusText: "Forbidden",
        headers: {},
        data: { error: "forbidden" }
      })
    });

    await expect(client.searchItems({ query: "polo" })).rejects.toThrow(CatalogSearchHttpError);
  });

  it("requires cookie-backed public session material", async () => {
    const client = new VintedCatalogClient({
      market,
      transport: new StubTransport({
        status: 200,
        headers: {},
        data: { items: [] }
      }),
      session: {
        cookies: {},
        anonId: "anon-live",
        acquiredAt: "2026-09-21T09:00:00.000Z"
      }
    });

    await expect(client.searchItems({ query: "polo" })).rejects.toThrow(CatalogSearchSessionError);
  });

  it("does not leak secrets through diagnostics", async () => {
    const sink = new MemoryDiagnosticSink();
    const innerTransport = new StubTransport({
      status: 200,
      headers: {},
      data: { items: [] }
    });
    const client = new VintedCatalogClient({
      market,
      session,
      transport: new DiagnosticTransport(innerTransport, sink)
    });

    await client.searchItems({ query: "polo Lacoste" });

    const serialized = JSON.stringify(sink.entries);
    expect(serialized).not.toContain("cookie-live");
    expect(serialized).not.toContain("anon-cookie");
    expect(serialized).not.toContain("anon-live");
    expect(serialized).toContain("[REDACTED]");
  });
});
