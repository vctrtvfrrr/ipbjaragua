import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { db } from './client';
import { articles, songs } from './schema';

migrate(db, { migrationsFolder: './server/db/migrations' });

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const NON_ARTICLE_HEADINGS = new Set(['Agenda Semanal', 'Avisos', 'Aniversariantes', 'Liturgia do Culto']);

function extractArticleSection(body: string): string {
  const lines = body.split('\n');
  let inSection = false;
  const collected: string[] = [];
  for (const line of lines) {
    const h2 = line.match(/^## (.+)$/);
    if (h2 && h2[1]) {
      const heading = h2[1].trim();
      if (!inSection && !NON_ARTICLE_HEADINGS.has(heading)) {
        inSection = true;
        continue;
      }
      if (inSection) break;
    }
    if (inSection) collected.push(line);
  }
  return collected
    .join('\n')
    .replace(/[\s\n]*---\s*$/, '')
    .trim();
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

type LyricSection = { type: 'verse' | 'chorus'; number: number; content: string };

function parseLyrics(raw: string): LyricSection[] {
  const trimmed = raw.trim();
  const lines = trimmed.split('\n');
  if (lines.some((l) => /^\d+\. /.test(l.trim()))) {
    return parseNumberedLyrics(lines);
  }
  return parseParagraphLyrics(trimmed);
}

function parseNumberedLyrics(lines: string[]): LyricSection[] {
  const sections: LyricSection[] = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('**') && line.endsWith('**')) {
      sections.push({
        type: 'chorus',
        number: 0,
        content: line
          .slice(2, -2)
          .replace(/\s*\/\s*/g, '\n')
          .trim(),
      });
      continue;
    }
    const numbered = line.match(/^(\d+)\. (.+)$/);
    if (numbered && numbered[2]) {
      sections.push({
        type: 'verse',
        number: parseInt(numbered[1]),
        content: numbered[2].replace(/\s*\/\s*/g, '\n').trim(),
      });
    }
  }
  return sections;
}

function parseParagraphLyrics(content: string): LyricSection[] {
  const sections: LyricSection[] = [];
  let verseCount = 0;
  for (const paragraph of content.split(/\n\n+/)) {
    const p = paragraph.trim();
    if (!p) continue;
    const isBold = p.startsWith('**') && p.endsWith('**');
    const isItalic = !isBold && p.startsWith('_') && p.endsWith('_');
    if (isBold) {
      sections.push({ type: 'chorus', number: 0, content: p.slice(2, -2).trim() });
    } else if (isItalic) {
      sections.push({ type: 'chorus', number: 0, content: p.slice(1, -1).trim() });
    } else {
      verseCount++;
      sections.push({ type: 'verse', number: verseCount, content: p });
    }
  }
  return sections;
}

type SongFileParsed = { title: string; performer?: string; album?: string; track?: number };

function parseSongFilename(filename: string): SongFileParsed {
  const base = filename.replace(/\.md$/, '');
  const albumMatch = base.match(/^(.+?)\s*\((\d+)\)\s*-\s*(.+)$/);
  if (albumMatch && albumMatch[1] && albumMatch[2] && albumMatch[3]) {
    return { album: albumMatch[1].trim(), track: parseInt(albumMatch[2]), title: albumMatch[3].trim() };
  }
  const parts = base.split(' - ');
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return { performer: parts[0].trim(), title: parts.slice(1).join(' - ').trim() };
  }
  return { title: base };
}

// ─── Seed articles ─────────────────────────────────────────────────────────────

const bulletinsDir = join(process.cwd(), 'content/bulletins');
const bulletinFiles = readdirSync(bulletinsDir)
  .filter((f) => f.endsWith('.md'))
  .sort();

let articleCount = 0;
for (const file of bulletinFiles) {
  const raw = readFileSync(join(bulletinsDir, file), 'utf-8');
  const { data, body } = parseFrontmatter(raw);
  const title = String(data['title'] ?? '');
  const date = String(data['date'] ?? '');
  const index = Number(data['index'] ?? 0);
  const year = Number(data['year'] ?? 0);
  const content = extractArticleSection(body);
  if (!date || !content) {
    console.warn(`Skipping ${file}: missing date or Estudo section`);
    continue;
  }
  db.insert(articles).values({ title, date, index, year, content }).run();
  articleCount++;
}
console.log(`Seeded ${articleCount} articles`);

// ─── Seed songs ────────────────────────────────────────────────────────────────

const musicDir = join(process.cwd(), 'content/music');
const musicFiles = readdirSync(musicDir).filter((f) => f.endsWith('.md'));

const slugsSeen = new Set<string>();
let songCount = 0;
for (const file of musicFiles) {
  const raw = readFileSync(join(musicDir, file), 'utf-8').trim();
  const parsed = parseSongFilename(file);
  const baseSlug = toSlug(parsed.title);
  let slug = baseSlug;
  let suffix = 1;
  while (slugsSeen.has(slug)) slug = `${baseSlug}-${suffix++}`;
  slugsSeen.add(slug);

  const lyricSections = parseLyrics(raw);
  const lyricsJson = lyricSections.length > 0 ? JSON.stringify(lyricSections) : null;

  db.insert(songs)
    .values({
      slug,
      title: parsed.title,
      performer: parsed.performer ?? null,
      album: parsed.album ?? null,
      track: parsed.track ?? null,
      lyrics: lyricsJson,
    })
    .run();
  songCount++;
}
console.log(`Seeded ${songCount} songs`);
