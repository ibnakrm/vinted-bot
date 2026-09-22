export class OwnInventoryHttpError extends Error {
  public readonly status: number;
  public readonly statusText: string | undefined;

  public constructor(status: number, statusText?: string) {
    super(`Vinted own inventory request failed with HTTP ${status}${statusText === undefined ? "" : ` ${statusText}`}`);
    this.name = "OwnInventoryHttpError";
    this.status = status;
    this.statusText = statusText;
  }
}

export class OwnInventorySessionError extends Error {
  public constructor(message = "Own inventory requires authenticated session material") {
    super(message);
    this.name = "OwnInventorySessionError";
  }
}

export class InvalidOwnInventoryInputError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "InvalidOwnInventoryInputError";
  }
}

export class InvalidOwnInventoryResponseError extends Error {
  public constructor(message = "Invalid Vinted own inventory response") {
    super(message);
    this.name = "InvalidOwnInventoryResponseError";
  }
}
