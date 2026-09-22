import { InvalidOwnInventoryInputError, InvalidOwnInventoryResponseError } from "./errors.js";
import type {
  OwnInventoryInput,
  OwnInventoryItem,
  OwnInventoryPagination,
  OwnInventoryResult
} from "./types.js";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function optionalStringOrNumber(value: unknown): string | number | undefined {
  return typeof value === "string" || typeof value === "number" ? value : undefined;
}

function optionalFiniteNumber(value: number | undefined, fieldName: keyof OwnInventoryInput): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Number.isFinite(value)) {
    throw new InvalidOwnInventoryInputError(`${String(fieldName)} must be a finite number`);
  }

  return value;
}

function mapPrice(rawItem: UnknownRecord): OwnInventoryItem["price"] {
  const price = rawItem.price;
  if (isRecord(price)) {
    const amount = optionalStringOrNumber(price.amount);
    if (amount === undefined) {
      return undefined;
    }

    const mapped: NonNullable<OwnInventoryItem["price"]> = { amount: String(amount) };
    const currency = optionalString(price.currency_code) ?? optionalString(price.currency) ?? optionalString(rawItem.currency);
    if (currency !== undefined) {
      mapped.currency = currency;
    }
    return mapped;
  }

  const amount = optionalStringOrNumber(price);
  if (amount === undefined) {
    return undefined;
  }

  const mapped: NonNullable<OwnInventoryItem["price"]> = { amount: String(amount) };
  const currency = optionalString(rawItem.currency);
  if (currency !== undefined) {
    mapped.currency = currency;
  }
  return mapped;
}

function mapImageUrl(rawItem: UnknownRecord): string | undefined {
  const photos = rawItem.photos;
  if (!Array.isArray(photos)) {
    return undefined;
  }

  const firstPhoto = photos.find((photo) => isRecord(photo));
  if (!isRecord(firstPhoto)) {
    return undefined;
  }

  return optionalString(firstPhoto.full_size_url) ?? optionalString(firstPhoto.url);
}

export function buildOwnInventoryQuery(input: OwnInventoryInput): Record<string, string | number> {
  const query: Record<string, string | number> = {};
  const page = optionalFiniteNumber(input.page, "page");
  const perPage = optionalFiniteNumber(input.perPage, "perPage");
  const order = input.order ?? "relevance";

  if (input.userId === "" || input.userId === undefined || input.userId === null) {
    throw new InvalidOwnInventoryInputError("userId is required");
  }
  if (page !== undefined && page < 1) {
    throw new InvalidOwnInventoryInputError("page must be greater than or equal to 1");
  }
  if (perPage !== undefined && perPage < 1) {
    throw new InvalidOwnInventoryInputError("perPage must be greater than or equal to 1");
  }
  if (order !== "relevance") {
    throw new InvalidOwnInventoryInputError("order must be relevance");
  }

  if (page !== undefined) {
    query.page = page;
  }
  if (perPage !== undefined) {
    query.per_page = perPage;
  }
  query.order = order;

  return query;
}

export function mapOwnInventoryItem(value: unknown): OwnInventoryItem {
  if (!isRecord(value)) {
    throw new InvalidOwnInventoryResponseError("Own inventory item is not an object");
  }

  const id = optionalStringOrNumber(value.id);
  if (id === undefined) {
    throw new InvalidOwnInventoryResponseError("Own inventory item is missing an id");
  }

  const item: OwnInventoryItem = { id };

  const title = optionalString(value.title);
  if (title !== undefined) {
    item.title = title;
  }

  const userId = optionalStringOrNumber(value.user_id);
  if (userId !== undefined) {
    item.userId = userId;
  }

  const price = mapPrice(value);
  if (price !== undefined) {
    item.price = price;
  }

  const status = optionalString(value.status);
  if (status !== undefined) {
    item.status = status;
  }

  const isDraft = optionalBoolean(value.is_draft);
  if (isDraft !== undefined) {
    item.isDraft = isDraft;
  }
  const isClosed = optionalBoolean(value.is_closed);
  if (isClosed !== undefined) {
    item.isClosed = isClosed;
  }
  const isReserved = optionalBoolean(value.is_reserved);
  if (isReserved !== undefined) {
    item.isReserved = isReserved;
  }
  const isHidden = optionalBoolean(value.is_hidden);
  if (isHidden !== undefined) {
    item.isHidden = isHidden;
  }
  const canEdit = optionalBoolean(value.can_edit);
  if (canEdit !== undefined) {
    item.canEdit = canEdit;
  }
  const canPushUp = optionalBoolean(value.can_push_up);
  if (canPushUp !== undefined) {
    item.canPushUp = canPushUp;
  }

  const favouriteCount = optionalNumber(value.favourite_count);
  if (favouriteCount !== undefined) {
    item.favouriteCount = favouriteCount;
  }

  const viewCount = optionalNumber(value.view_count);
  if (viewCount !== undefined) {
    item.viewCount = viewCount;
  }

  const path = optionalString(value.path);
  if (path !== undefined) {
    item.path = path;
  }

  const imageUrl = mapImageUrl(value);
  if (imageUrl !== undefined) {
    item.imageUrl = imageUrl;
  }

  return item;
}

function mapPagination(value: unknown): OwnInventoryPagination | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const pagination: OwnInventoryPagination = {};
  const currentPage = optionalNumber(value.current_page);
  const totalPages = optionalNumber(value.total_pages);
  const totalEntries = optionalNumber(value.total_entries);
  const perPage = optionalNumber(value.per_page);
  const time = optionalNumber(value.time);

  if (currentPage !== undefined) {
    pagination.currentPage = currentPage;
  }
  if (totalPages !== undefined) {
    pagination.totalPages = totalPages;
  }
  if (totalEntries !== undefined) {
    pagination.totalEntries = totalEntries;
  }
  if (perPage !== undefined) {
    pagination.perPage = perPage;
  }
  if (time !== undefined) {
    pagination.time = time;
  }

  return Object.keys(pagination).length === 0 ? undefined : pagination;
}

export function mapOwnInventoryResponse(value: unknown): OwnInventoryResult {
  if (!isRecord(value)) {
    throw new InvalidOwnInventoryResponseError("Own inventory response is not an object");
  }

  if (!Array.isArray(value.items)) {
    throw new InvalidOwnInventoryResponseError("Own inventory response is missing items array");
  }

  const result: OwnInventoryResult = {
    items: value.items.map((item) => mapOwnInventoryItem(item))
  };

  const pagination = mapPagination(value.pagination);
  if (pagination !== undefined) {
    result.pagination = pagination;
  }

  return result;
}
