export type InstitutionalPageKey = 'home' | 'about' | 'location' | 'register' | 'articles' | 'bulletins' | 'liturgies'

export type InstitutionalPage = {
  path: string
  name: string
  cardLabel: string | null
}

export const INSTITUTIONAL_PAGES: Record<InstitutionalPageKey, InstitutionalPage> = {
  home: { path: '/', name: 'Início', cardLabel: null },
  about: { path: '/about', name: 'Sobre nós', cardLabel: 'Sobre nós' },
  location: { path: '/location', name: 'Localização', cardLabel: 'Localização' },
  register: { path: '/members/register', name: 'Cadastro de membro', cardLabel: 'Cadastro de membro' },
  articles: { path: '/articles', name: 'Artigos', cardLabel: 'Artigos' },
  bulletins: { path: '/bulletins', name: 'Boletins', cardLabel: 'Boletins' },
  liturgies: { path: '/liturgies', name: 'Liturgias', cardLabel: 'Liturgias' },
}

export function isInstitutionalPageKey(value: string): value is InstitutionalPageKey {
  return value in INSTITUTIONAL_PAGES
}
