export type CapabilityStatus = "UNKNOWN" | "FOUND" | "VERIFIED" | "IMPLEMENTED" | "BROKEN";

export interface MoneyAmount {
  amount: string;
  currency: string;
}

export interface Seller {
  externalId: string;
  username?: string;
  profileUrl?: string;
}

export interface Item {
  externalId: string;
  title: string;
  url: string;
  price?: MoneyAmount;
  brand?: string;
  size?: string;
  condition?: string;
  seller?: Seller;
}

export interface SearchInput {
  query?: string;
  priceFrom?: number;
  priceTo?: number;
  page?: number;
  perPage?: number;
  brandIds?: readonly string[];
  catalogIds?: readonly string[];
  sizeIds?: readonly string[];
  statusIds?: readonly string[];
}

export interface SearchPage {
  items: readonly Item[];
  page: number;
  perPage: number;
  totalItems?: number;
  nextPage?: number;
}
