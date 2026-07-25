import type { Metadata } from 'next'
import { formatBulletinSubtitle } from '@/lib/bulletin'
import { formatLongDatePtBR, formatTimePtBR } from '@/lib/date'
import { CHURCH_NAME, OG_SIZE } from './config'
import { INSTITUTIONAL_PAGES, type InstitutionalPageKey } from './pages'

const TITLE_SUFFIX = ` — ${CHURCH_NAME}`

const INSTITUTIONAL_DESCRIPTIONS: Record<InstitutionalPageKey, string> = {
  home: 'IPB de Jaraguá do Sul: boletins semanais, artigos e as liturgias dos nossos cultos.',
  about: 'Conheça a IPB de Jaraguá do Sul: nossa história, nossa fé e nossa comunidade.',
  location: 'Onde encontrar a IPB de Jaraguá do Sul: endereço, mapa e como chegar.',
  register: 'Cadastre-se como membro da IPB de Jaraguá do Sul.',
  articles: 'Artigos e reflexões publicados pela IPB de Jaraguá do Sul.',
  bulletins: 'Boletins semanais da IPB de Jaraguá do Sul.',
  liturgies: 'Liturgias dos cultos da IPB de Jaraguá do Sul.',
}

type SocialImage = { path: string; alt: string }

type SocialInput = {
  title: string | { absolute: string }
  ogTitle: string
  description?: string
  canonical?: string
  ogType?: 'website' | 'article'
  image: SocialImage
  noindex?: boolean
  publishedTime?: string
}

function socialMetadata(input: SocialInput): Metadata {
  const { title, ogTitle, description, canonical, ogType = 'website', image, noindex, publishedTime } = input
  const images = [{ url: image.path, width: OG_SIZE.width, height: OG_SIZE.height, alt: image.alt }]

  return {
    title,
    ...(description ? { description } : {}),
    ...(canonical ? { alternates: { canonical } } : {}),
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: ogType,
      siteName: CHURCH_NAME,
      locale: 'pt_BR',
      title: ogTitle,
      ...(description ? { description } : {}),
      ...(canonical ? { url: canonical } : {}),
      ...(publishedTime ? { publishedTime } : {}),
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      ...(description ? { description } : {}),
      images,
    },
  }
}

export function institutionalMetadata(key: InstitutionalPageKey): Metadata {
  const page = INSTITUTIONAL_PAGES[key]
  const isHome = key === 'home'
  const heading = isHome ? CHURCH_NAME : `${page.name}${TITLE_SUFFIX}`

  return socialMetadata({
    title: isHome ? { absolute: CHURCH_NAME } : page.name,
    ogTitle: heading,
    description: INSTITUTIONAL_DESCRIPTIONS[key],
    canonical: page.path,
    image: {
      path: `/og/${key}`,
      alt: `Imagem de compartilhamento da página ${page.name} da ${CHURCH_NAME}`,
    },
  })
}

export type ArticleMeta = { slug: string; title: string; excerpt: string | null; date: Date }

export function articleMetadata(article: ArticleMeta): Metadata {
  return socialMetadata({
    title: article.title,
    ogTitle: `${article.title}${TITLE_SUFFIX}`,
    ...(article.excerpt ? { description: article.excerpt } : {}),
    canonical: `/articles/${article.slug}`,
    ogType: 'article',
    publishedTime: article.date.toISOString(),
    image: {
      path: `/articles/${article.slug}/og`,
      alt: `Imagem de compartilhamento do Artigo ${article.title}`,
    },
  })
}

export type BulletinMeta = { date: Date; slug: string; title: string; edition: number }

export function bulletinMetadata(bulletin: BulletinMeta, options: { preview?: boolean } = {}): Metadata {
  const longDate = formatLongDatePtBR(bulletin.date)
  const subtitle = formatBulletinSubtitle(bulletin.edition, bulletin.date)
  const previewSuffix = options.preview ? ' em Rascunho' : ''
  const imagePath = `/bulletins/${bulletin.slug}/og${options.preview ? '?preview=1' : ''}`

  return socialMetadata({
    title: bulletin.title,
    ogTitle: `${bulletin.title}${TITLE_SUFFIX}`,
    description: `${subtitle} — ${longDate}`,
    ...(options.preview ? { noindex: true } : { canonical: `/bulletins/${bulletin.slug}` }),
    image: {
      path: imagePath,
      alt: `Imagem de compartilhamento do Boletim ${bulletin.title}, de ${longDate}${previewSuffix}`,
    },
  })
}

export type LiturgyMeta = { slug: string; theme: string; time: string; date: Date; description: string | null }

export function liturgyMetadata(liturgy: LiturgyMeta, options: { draft?: boolean } = {}): Metadata {
  const longDate = formatLongDatePtBR(liturgy.date)
  const title = `${liturgy.theme} — ${longDate} às ${formatTimePtBR(liturgy.time)}`

  return socialMetadata({
    title,
    ogTitle: `${title}${TITLE_SUFFIX}`,
    ...(liturgy.description ? { description: liturgy.description } : {}),
    ...(options.draft ? { noindex: true } : { canonical: `/liturgies/${liturgy.slug}` }),
    image: {
      path: `/liturgies/${liturgy.slug}/og`,
      alt: `Imagem de compartilhamento da Liturgia ${liturgy.theme}, de ${longDate}`,
    },
  })
}
