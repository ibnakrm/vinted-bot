export class MessageThreadsHttpError extends Error {
  public readonly status: number;
  public readonly statusText: string | undefined;

  public constructor(status: number, statusText?: string) {
    super(`Vinted message threads request failed with HTTP ${status}${statusText === undefined ? "" : ` ${statusText}`}`);
    this.name = "MessageThreadsHttpError";
    this.status = status;
    this.statusText = statusText;
  }
}

export class MessageThreadsSessionError extends Error {
  public constructor(message = "Message threads require authenticated session material") {
    super(message);
    this.name = "MessageThreadsSessionError";
  }
}

export class InvalidMessageThreadsInputError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "InvalidMessageThreadsInputError";
  }
}

export class InvalidMessageThreadsResponseError extends Error {
  public constructor(message = "Invalid Vinted message threads response") {
    super(message);
    this.name = "InvalidMessageThreadsResponseError";
  }
}
