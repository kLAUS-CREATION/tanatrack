// Auth runs against the custom NestJS backend (see lib/features/services/auth.api.ts),
// so these are plain types describing the session/user payloads it returns.

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  emailVerified?: boolean;
  image?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Session {
  user: User;
  session?: {
    id: string;
    token?: string;
    userId?: string;
    expiresAt?: string;
  };
}
