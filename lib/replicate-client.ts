/**
 * Utility to isolate Replicate import to prevent Vite CJS warnings
 */
import Replicate from 'replicate';

/**
 * Creates and returns a configured Replicate client
 */
export function createReplicateClient(apiToken: string) {
  try {
    return new Replicate({
      auth: apiToken
    });
  } catch (error) {
    console.error("Error creating Replicate client:", error);
    throw new Error("Failed to initialize Replicate client");
  }
}

// Global in-memory cache for predictions to handle webhook data between serverless functions
let predictionCache: Record<string, any> = {};

export function cachePrediction(predictionId: string, data: any): void {
  predictionCache[predictionId] = data;
}

export function getCachedPrediction(predictionId: string): any {
  return predictionCache[predictionId] || null;
}

export type { Replicate };