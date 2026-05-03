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

export const BulletinSectionsSchema = z.object({
  article: z.string().optional(),
  weekly_agenda: z.string().optional(),
  announcements: z.string().optional(),
  birthdays: z.string().optional(),
  liturgy: z.string().optional(),
});

export type BulletinSections = z.infer<typeof BulletinSectionsSchema>;

export type BulletinDetail = z.infer<typeof BulletinFrontmatterSchema> & { sections: BulletinSections };

const SECTION_HEADING_MAP: Record<string, keyof BulletinSections> = {
  Estudo: 'article',
  'Agenda Semanal': 'weekly_agenda',
  Avisos: 'announcements',
  Aniversariantes: 'birthdays',
  'Liturgia do Culto': 'liturgy',
};

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

function promoteHeadings(html: string): string {
  return html.replace(/<(\/?)h([3-6])(\s|>)/g, (_, slash: string, level: string, suffix: string) => {
    return `<${slash}h${Number(level) - 1}${suffix}`;
  });
}

export async function parseSections(body: string): Promise<BulletinSections> {
  const lines = body.split('\n');
  const chunks: { key: keyof BulletinSections; lines: string[] }[] = [];
  let current: { key: keyof BulletinSections; lines: string[] } | null = null;

  for (const line of lines) {
    const h2Match = line.match(/^## (.+)$/);
    if (h2Match && h2Match[1] !== undefined) {
      const key = SECTION_HEADING_MAP[h2Match[1].trim()];
      if (key !== undefined) {
        current = { key, lines: [] };
        chunks.push(current);
      } else {
        current = null;
      }
      continue;
    }
    if (current !== null) {
      current.lines.push(line);
    }
  }

  const sections: BulletinSections = {};
  for (const chunk of chunks) {
    const html = String(await marked(chunk.lines.join('\n').trim()));
    sections[chunk.key] = chunk.key === 'article' ? promoteHeadings(html) : html;
  }
  return sections;
}

export async function parseBulletin(slug: string): Promise<BulletinDetail> {
  const filePath = join(process.cwd(), 'content', `${slug}.md`);
  const raw = readFileSync(filePath, 'utf-8');
  const { data, body } = parseFrontmatter(raw);
  const meta = BulletinFrontmatterSchema.parse(data);
  const sections = await parseSections(body);
  return { ...meta, sections };
}
