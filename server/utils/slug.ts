import slugify from 'slugify';

export function generateSlug(title: string): string {
  const raw = slugify(title, { lower: true, strict: true, locale: 'pt' });
  return raw.length > 100 ? raw.slice(0, 100).replace(/-[^-]*$/, '') : raw;
}
