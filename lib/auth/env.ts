import { z } from 'zod'

const authEnvSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_OAUTH_REDIRECT_URI: z.url(),
})

const sessionEnvSchema = z.object({
  SESSION_SECRET: z.string().min(32),
})

export function getAuthEnv(env: NodeJS.ProcessEnv = process.env) {
  return authEnvSchema.parse(env)
}

export function getSessionEnv(env: NodeJS.ProcessEnv = process.env) {
  return sessionEnvSchema.parse(env)
}
