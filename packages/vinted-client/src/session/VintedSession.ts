export interface VintedSession {
  cookies: Record<string, string>;
  anonId?: string;
  csrfToken?: string;
  locale?: string;
  acquiredAt: string;
  expiresAt?: string;
}
