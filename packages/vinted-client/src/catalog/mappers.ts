import { InvalidCatalogSearchInputError, InvalidCatalogSearchResponseError } from "./errors.js";
import type { SearchItemsInput, SearchItemsPagination, SearchItemsResult, VintedSearchItem } from "./types.js";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function optionalStringOrNumber(value: unknown): string | number | undefined {
  return typeof value === "string" || typeof value === "number" ? value : undefined;
}

function optionalFiniteNumber(value: number | undefined, fieldName: keyof SearchItemsInput): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Number.isFinite(value)) {
    throw new InvalidCatalogSearchInputError(`${String(fieldName)} must be a finite number`);
  }

  return value;
}

function mapPrice(rawItem: UnknownRecord): VintedSearchItem["price"] {
  const price = rawItem.price;
  if (isRecord(price)) {
    const amount = optionalStringOrNumber(price.amount);
    if (amount === undefined) {
      return undefined;
    }

    const mapped: NonNullable<VintedSearchItem["price"]> = { amount: String(amount) };
    const currency = optionalString(price.currency_code) ?? optionalString(price.currency);
    if (currency !== undefined) {
      mapped.currency = currency;
    }
    return mapped;
  }

  const amount = optionalStringOrNumber(price);
  return amount === undefined ? undefined : { amount: String(amount) };
}

function mapImageUrl(rawItem: UnknownRecord): string | undefined {
  const photo = rawItem.photo;
  if (!isRecord(photo)) {
    return undefined;
  }

  return optionalString(photo.full_size_url) ?? optionalString(photo.url);
}

function mapBrand(rawItem: UnknownRecord): string | undefined {
  return optionalString(rawItem.brand_title);
}

function mapSize(rawItem: UnknownRecord): string | undefined {
  return optionalString(rawItem.size_title);
}

function mapDisplayLines(rawItem: UnknownRecord): Pick<VintedSearchItem, "displayFirstLine" | "displaySecondLine"> {
  const itemBox = rawItem.item_box;
  if (!isRecord(itemBox)) {
    return {};
  }

  const display: Pick<VintedSearchItem, "displayFirstLine" | "displaySecondLine"> = {};
  const firstLine = optionalString(itemBox.first_line);
  const secondLine = optionalString(itemBox.second_line);

  if (firstLine !== undefined) {
    display.displayFirstLine = firstLine;
  }
  if (secondLine !== undefined) {
    display.displaySecondLine = secondLine;
  }

  return display;
}

function mapUserId(rawItem: UnknownRecord): string | number | undefined {
  const user = rawItem.user;
  if (!isRecord(user)) {
    return undefined;
  }

  return optionalStringOrNumber(user.id);
}

export function buildCatalogSearchQuery(input: SearchItemsInput): Record<string, string | number> {
  const query: Record<string, string | number> = {};
  const priceFrom = optionalFiniteNumber(input.priceFrom, "priceFrom");
  const priceTo = optionalFiniteNumber(input.priceTo, "priceTo");
  const page = optionalFiniteNumber(input.page, "page");
  const perPage = optionalFiniteNumber(input.perPage, "perPage");

  if (priceFrom !== undefined && priceFrom < 0) {
    throw new InvalidCatalogSearchInputError("priceFrom must be greater than or equal to 0");
  }
  if (priceTo !== undefined && priceTo < 0) {
    throw new InvalidCatalogSearchInputError("priceTo must be greater than or equal to 0");
  }
  if (priceFrom !== undefined && priceTo !== undefined && priceFrom > priceTo) {
    throw new InvalidCatalogSearchInputError("priceFrom must be less than or equal to priceTo");
  }
  if (page !== undefined && page < 1) {
    throw new InvalidCatalogSearchInputError("page must be greater than or equal to 1");
  }
  if (perPage !== undefined && perPage < 1) {
    throw new InvalidCatalogSearchInputError("perPage must be greater than or equal to 1");
  }

  if (input.query !== undefined && input.query.length > 0) {
    query.search_text = input.query;
  }
  if (priceFrom !== undefined) {
    query.price_from = priceFrom;
  }
  if (priceTo !== undefined) {
    query.price_to = priceTo;
  }
  if (page !== undefined) {
    query.page = page;
  }
  if (perPage !== undefined) {
    query.per_page = perPage;
  }

  return query;
}

export function mapCatalogSearchItem(value: unknown): VintedSearchItem {
  if (!isRecord(value)) {
    throw new InvalidCatalogSearchResponseError("Catalog item is not an object");
  }

  const id = optionalStringOrNumber(value.id);
  if (id === undefined) {
    throw new InvalidCatalogSearchResponseError("Catalog item is missing an id");
  }

  const item: VintedSearchItem = { id };

  const title = optionalString(value.title);
  if (title !== undefined) {
    item.title = title;
  }

  const price = mapPrice(value);
  if (price !== undefined) {
    item.price = price;
  }

  const url = optionalString(value.url);
  if (url !== undefined) {
    item.url = url;
  }

  const imageUrl = mapImageUrl(value);
  if (imageUrl !== undefined) {
    item.imageUrl = imageUrl;
  }

  const brand = mapBrand(value);
  if (brand !== undefined) {
    item.brand = brand;
  }

  const size = mapSize(value);
  if (size !== undefined) {
    item.size = size;
  }

  Object.assign(item, mapDisplayLines(value));

  const userId = mapUserId(value);
  if (userId !== undefined) {
    item.userId = userId;
  }

  return item;
}

function mapPagination(value: unknown): SearchItemsPagination | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const pagination: SearchItemsPagination = {};
  const currentPage = optionalNumber(value.current_page);
  const perPage = optionalNumber(value.per_page);
  const totalEntries = optionalNumber(value.total_entries);
  const totalPages = optionalNumber(value.total_pages);

  if (currentPage !== undefined) {
    pagination.currentPage = currentPage;
  }
  if (perPage !== undefined) {
    pagination.perPage = perPage;
  }
  if (totalEntries !== undefined) {
    pagination.totalEntries = totalEntries;
  }
  if (totalPages !== undefined) {
    pagination.totalPages = totalPages;
  }

  return Object.keys(pagination).length === 0 ? undefined : pagination;
}

export function mapCatalogSearchResponse(value: unknown): SearchItemsResult {
  if (!isRecord(value)) {
    throw new InvalidCatalogSearchResponseError("Catalog search response is not an object");
  }

  if (!Array.isArray(value.items)) {
    throw new InvalidCatalogSearchResponseError("Catalog search response is missing items array");
  }

  const result: SearchItemsResult = {
    items: value.items.map((item) => mapCatalogSearchItem(item))
  };

  const pagination = mapPagination(value.pagination);
  if (pagination !== undefined) {
    result.pagination = pagination;
  }

  return result;
}
