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

export class ConversationHttpError extends Error {
  public readonly status: number;
  public readonly statusText: string | undefined;

  public constructor(status: number, statusText?: string) {
    super(`Vinted conversation request failed with HTTP ${status}${statusText === undefined ? "" : ` ${statusText}`}`);
    this.name = "ConversationHttpError";
    this.status = status;
    this.statusText = statusText;
  }
}

export class InvalidConversationInputError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "InvalidConversationInputError";
  }
}

export class InvalidConversationResponseError extends Error {
  public constructor(message = "Invalid Vinted conversation response") {
    super(message);
    this.name = "InvalidConversationResponseError";
  }
}

export class SendMessageHttpError extends Error {
  public readonly status: number;
  public readonly statusText: string | undefined;

  public constructor(status: number, statusText?: string) {
    super(`Vinted send message request failed with HTTP ${status}${statusText === undefined ? "" : ` ${statusText}`}`);
    this.name = "SendMessageHttpError";
    this.status = status;
    this.statusText = statusText;
  }
}

export class InvalidSendMessageInputError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "InvalidSendMessageInputError";
  }
}

export class InvalidSentMessageResponseError extends Error {
  public constructor(message = "Invalid Vinted sent message response") {
    super(message);
    this.name = "InvalidSentMessageResponseError";
  }
}
