function requireUrl(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}. See .env.example.`);
  }
  try {
    new URL(value);
  } catch {
    throw new Error(`Environment variable ${name} is not a valid URL: "${value}"`);
  }
  return value.replace(/\/+$/, '');
}

/** Validated frontend configuration. Fails fast at startup if misconfigured. */
export const env = {
  apiUrl: requireUrl('VITE_API_URL'),
} as const;
