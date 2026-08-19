import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
// Structural: satisfied by PGlite directly, and by postgres-js through a one-line wrapper.
type StatementRunner = { exec: (statement: string) => Promise<unknown> }

const migrationsDirectory = join(process.cwd(), 'db/migrations')

async function resolve(name: string) {
  const entries = await readdir(migrationsDirectory, { withFileTypes: true })
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
  const matches = directories.filter((directory) => directory.endsWith(`_${name}`))

  if (matches.length !== 1) {
    throw new Error(`Expected exactly one migration named "${name}", found ${matches.length}`)
  }

  return { directories, index: directories.indexOf(matches[0]) }
}

async function apply(client: StatementRunner, directory: string) {
  const sql = await readFile(join(migrationsDirectory, directory, 'migration.sql'), 'utf8')
  for (const statement of sql.split('--> statement-breakpoint')) {
    if (statement.trim()) await client.exec(statement)
  }
}

export async function applyMigrationsBefore(client: StatementRunner, name: string) {
  const { directories, index } = await resolve(name)
  for (const directory of directories.slice(0, index)) await apply(client, directory)
}

export async function applyMigration(client: StatementRunner, name: string) {
  const { directories, index } = await resolve(name)
  await apply(client, directories[index])
}

export async function readMigrationSql(name: string) {
  const { directories, index } = await resolve(name)
  return readFile(join(migrationsDirectory, directories[index], 'migration.sql'), 'utf8')
}
