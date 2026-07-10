import { z } from 'zod'

export const nullableTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || null)

export const requiredTrimmedString = (message: string) => z.string().trim().min(1, message)
