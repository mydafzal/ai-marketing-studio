import { z } from 'zod'

const mediaFileSchema = z.object({
  file: z.instanceof(File),
  type: z.string(),
  url: z.string().url(),
  name: z.string(),
  dimensions: z.string(),
  size: z.number()
})

export const campaignSchema = z.object({
  mediaFiles: z.array(mediaFileSchema).min(1, 'Media files are required'),
  url: z.string().min(1, 'URL is required').url('Invalid URL'),
  budget: z
    .string()
    .trim()
    .min(1, 'Budget is required')
    .refine(val => !isNaN(Number(val)), 'Budget must be a number'),
  description: z.string().optional()
})
