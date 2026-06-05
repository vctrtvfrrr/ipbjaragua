// Explicit import (not auto-imported): this util is unit-tested in the node env, where Nuxt auto-imports don't exist.
import formatDate from './format-date';

export const SITE_NAME = 'IPB de Jaguará do Sul';

export type SeoMeta = {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogType: 'website' | 'article';
  twitterCard: 'summary_large_image';
  articleAuthor?: string[];
  articlePublishedTime?: string;
};

/** Turn markdown into a plain-text, single-line summary suitable for a meta description. */
export function summarize(markdown: string, max = 160): string {
  const text = markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // links/images → label
    .replace(/[#*_`~>]/g, '') // common markdown tokens
    .replace(/\s+/g, ' ')
    .trim();

  return text.length > max ? text.slice(0, max - 1).trimEnd() + '…' : text;
}

function card(title: string, description: string, ogType: SeoMeta['ogType']): SeoMeta {
  return { title, description, ogTitle: title, ogDescription: description, ogType, twitterCard: 'summary_large_image' };
}

export function homeSeo(): SeoMeta {
  return card(
    SITE_NAME,
    'Artigos, boletim, avisos e liturgias da Igreja Presbiteriana do Brasil em Jaguará do Sul.',
    'website',
  );
}

export function articleSeo(article: { title: string; author: string | null; date: string; content: string }): SeoMeta {
  return {
    ...card(article.title, summarize(article.content), 'article'),
    articleAuthor: article.author ? [article.author] : undefined,
    articlePublishedTime: article.date,
  };
}

export function liturgySeo(liturgy: { date: string; theme: string }): SeoMeta {
  const theme = liturgy.theme?.trim();
  const date = formatDate(liturgy.date);
  const title = theme ? `Liturgia — ${date} · ${theme}` : `Liturgia — ${date}`;
  return card(title, `Ordem do culto de ${date}${theme ? `: ${theme}` : ''}.`, 'website');
}

export function bulletinSeo(bulletin: { date: string }): SeoMeta {
  const date = formatDate(bulletin.date);
  return card(`Boletim — ${date}`, `Boletim dominical de ${date}.`, 'website');
}
