import { seedE2eDatabase } from './seed-db'

export default async function globalSetup() {
  await seedE2eDatabase()
}
