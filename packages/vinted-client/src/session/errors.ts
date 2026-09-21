export class InvalidMarketUrlError extends Error {
  public constructor(url: string) {
    super(`Invalid Vinted market URL: ${url}`);
    this.name = "InvalidMarketUrlError";
  }
}

export class PublicSessionNetworkError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "PublicSessionNetworkError";
  }
}

export class UnexpectedSessionStatusError extends Error {
  public readonly status: number;

  public constructor(status: number, statusText?: string) {
    super(`Unexpected Vinted public session status: ${status}${statusText === undefined ? "" : ` ${statusText}`}`);
    this.name = "UnexpectedSessionStatusError";
    this.status = status;
  }
}

export class MissingUsableSessionInformationError extends Error {
  public constructor() {
    super("Vinted public session response did not contain usable public session information");
    this.name = "MissingUsableSessionInformationError";
  }
}
