export type { VintedSessionProvider, VintedSessionSource } from "../session/VintedSession.js";

export interface SearchItemsInput {
  query?: string;
  page?: number;
  perPage?: number;
  priceFrom?: number;
  priceTo?: number;
}

export interface VintedSearchItemPrice {
  amount: string;
  currency?: string;
}

export interface VintedSearchItem {
  id: string | number;
  title?: string;
  price?: VintedSearchItemPrice;
  url?: string;
  imageUrl?: string;
  brand?: string;
  size?: string;
  displayFirstLine?: string;
  displaySecondLine?: string;
  userId?: string | number;
}

export interface SearchItemsPagination {
  currentPage?: number;
  perPage?: number;
  totalEntries?: number;
  totalPages?: number;
}

export interface SearchItemsResult {
  items: readonly VintedSearchItem[];
  pagination?: SearchItemsPagination;
}
