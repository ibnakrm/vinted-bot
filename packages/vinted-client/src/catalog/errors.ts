export class CatalogSearchHttpError extends Error {
  public readonly status: number;
  public readonly statusText: string | undefined;

  public constructor(status: number, statusText?: string) {
    super(`Vinted catalog search failed with HTTP ${status}${statusText === undefined ? "" : ` ${statusText}`}`);
    this.name = "CatalogSearchHttpError";
    this.status = status;
    this.statusText = statusText;
  }
}

export class InvalidCatalogSearchResponseError extends Error {
  public constructor(message = "Invalid Vinted catalog search response") {
    super(message);
    this.name = "InvalidCatalogSearchResponseError";
  }
}

export class CatalogSearchSessionError extends Error {
  public constructor(message = "Catalog search requires a public session with cookies") {
    super(message);
    this.name = "CatalogSearchSessionError";
  }
}
