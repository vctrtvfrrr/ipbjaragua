import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { defineEventHandler } from 'h3';

export default defineEventHandler(() => {
  const contentDir = join(process.cwd(), 'content/bulletins');
  const files = readdirSync(contentDir);
  return files
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace('.md', ''))
    .sort((a, b) => b.localeCompare(a));
});
