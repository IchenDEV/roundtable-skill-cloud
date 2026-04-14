export type CredentialStatus = {
  configured?: boolean;
  devBypass?: boolean;
  authenticated?: boolean;
  activeProvider?: string;
  defaultModel?: string | null;
  apiBaseUrl?: string | null;
  providersSaved?: string[];
  hasCredential?: boolean;
  updatedAt?: string | null;
  hasCustomBaseUrl?: boolean;
} | null;
