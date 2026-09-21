export class VintedTransportError extends Error {
  public readonly status: number | undefined;
  public readonly requestId: string | undefined;

  public constructor(message: string, options: { status?: number; requestId?: string } = {}) {
    super(message);
    this.name = "VintedTransportError";
    this.status = options.status;
    this.requestId = options.requestId;
  }
}

export class CapabilityUnavailableError extends Error {
  public readonly capability: string;

  public constructor(capability: string, message = "Vinted capability is not available") {
    super(`${message}: ${capability}`);
    this.name = "CapabilityUnavailableError";
    this.capability = capability;
  }
}
