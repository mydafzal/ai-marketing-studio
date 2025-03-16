/**
 * Utility to isolate Replicate import to prevent Vite CJS warnings
 */
import Replicate from 'replicate';

/**
 * Creates and returns a configured Replicate client
 */
export function createReplicateClient(apiToken: string) {
  return new Replicate({
    auth: apiToken
  });
}

export type { Replicate };