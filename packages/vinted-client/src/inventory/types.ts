export type OwnInventoryOrder = "relevance";

export interface OwnInventoryInput {
  userId: string | number;
  page?: number;
  perPage?: number;
  order?: OwnInventoryOrder;
}

export interface OwnInventoryItemPrice {
  amount: string;
  currency?: string;
}

export interface OwnInventoryItem {
  id: string | number;
  title?: string;
  userId?: string | number;
  price?: OwnInventoryItemPrice;
  status?: string;
  isDraft?: boolean;
  isClosed?: boolean;
  isReserved?: boolean;
  isHidden?: boolean;
  canEdit?: boolean;
  canPushUp?: boolean;
  favouriteCount?: number;
  viewCount?: number;
  path?: string;
  imageUrl?: string;
}

export interface OwnInventoryPagination {
  currentPage?: number;
  totalPages?: number;
  totalEntries?: number;
  perPage?: number;
  time?: number;
}

export interface OwnInventoryResult {
  items: readonly OwnInventoryItem[];
  pagination?: OwnInventoryPagination;
}
