/**
 * Utility functions for working with Replicate prediction results
 */
import { kv } from '@vercel/kv'

export interface PredictionData {
  id: string
  status: string
  created_at: string
  completed_at?: string
  output?: string | string[]
  error?: string
  logs?: string
  metrics?: {
    predict_time?: number
  }
}

/**
 * Retrieves a prediction result from the KV store
 * @param id The prediction ID
 * @returns The prediction data or null if not found
 */
export async function getPredictionResult(id: string): Promise<PredictionData | null> {
  try {
    const key = `video:${id}`
    const result = await kv.get(key)
    
    if (result) {
      return typeof result === 'string' ? JSON.parse(result) : result as PredictionData
    }
    
    return null
  } catch (error) {
    console.error("Error retrieving prediction result from KV:", error)
    return null
  }
}