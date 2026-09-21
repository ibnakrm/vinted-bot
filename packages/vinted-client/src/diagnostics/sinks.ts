import type { DiagnosticSink, HttpExchangeDiagnostic } from "./types.js";

export class MemoryDiagnosticSink implements DiagnosticSink {
  public readonly entries: HttpExchangeDiagnostic[] = [];

  public write(entry: HttpExchangeDiagnostic): void {
    this.entries.push(entry);
  }
}

export class ConsoleDiagnosticSink implements DiagnosticSink {
  public write(entry: HttpExchangeDiagnostic): void {
    console.info(JSON.stringify(entry));
  }
}
