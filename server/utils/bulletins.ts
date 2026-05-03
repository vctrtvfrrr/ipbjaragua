import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { marked } from 'marked';
import * as z from 'zod';

export const BulletinFrontmatterSchema = z.object({
  title: z.string(),
  date: z.string(),
  index: z.number(),
  year: z.number(),
});

export type BulletinDetail = z.infer<typeof BulletinFrontmatterSchema> & { content: string };

function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match || match[1] === undefined || match[2] === undefined) return { data: {}, body: raw };
  const data: Record<string, unknown> = {};
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim();
    data[key] = isNaN(Number(val)) ? val : Number(val);
  }
  return { data, body: match[2] };
}

export async function parseBulletin(slug: string): Promise<BulletinDetail> {
  const filePath = join(process.cwd(), 'content', `${slug}.md`);
  const raw = readFileSync(filePath, 'utf-8');
  const { data, body } = parseFrontmatter(raw);
  const meta = BulletinFrontmatterSchema.parse(data);
  const content = String(await marked(body));
  return { ...meta, content };
}
