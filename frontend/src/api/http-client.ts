import { env } from '../config/env';
import { ApiError } from './api-error';

export async function getJson<T>(
  path: string,
  parse: (body: unknown) => T,
  signal?: AbortSignal,
): Promise<T> {
  const url = `${env.apiUrl}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal,
    });
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }
    throw new ApiError(
      `Could not reach ${url}. Check that the backend is running and that its CORS_ORIGINS includes ${window.location.origin}.`,
    );
  }

  if (!response.ok) {
    throw new ApiError(
      `Server responded with ${response.status} ${response.statusText}`,
      response.status,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError('Server returned invalid JSON', response.status);
  }
  return parse(body);
}
