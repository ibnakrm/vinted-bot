export interface VintedSession {
  cookies: Record<string, string>;
  anonId?: string;
  csrfToken?: string;
  locale?: string;
  acquiredAt: string;
  expiresAt?: string;
}

export interface VintedSessionProvider {
  getSession(): Promise<VintedSession>;
}

export type VintedSessionSource = VintedSession | VintedSessionProvider | (() => Promise<VintedSession> | VintedSession);
