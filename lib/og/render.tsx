import { ImageResponse } from 'next/og'
import { loadLogoDataUri, loadOgFonts } from './assets'
import { CHURCH_NAME, OG_COLORS, OG_SIZE } from './config'
import { fitTitleFontSize, OG_TITLE_MAX_LINES } from './text'

type CardContent = {
  label?: string
  title?: string
  metaLines?: string[]
  draft?: boolean
}

function DraftBadge() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 56,
        right: 64,
        display: 'flex',
        backgroundColor: OG_COLORS.red,
        color: '#ffffff',
        fontFamily: 'PT Sans',
        fontWeight: 700,
        fontSize: 24,
        letterSpacing: 4,
        textTransform: 'uppercase',
        padding: '10px 22px',
        borderRadius: 999,
      }}
    >
      Rascunho
    </div>
  )
}

function Identity({ logo, large }: { logo: string; large?: boolean }) {
  const logoHeight = large ? 200 : 86
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: large ? 32 : 24 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo} height={logoHeight} alt="" style={{ height: logoHeight }} />
      <div
        style={{
          display: 'flex',
          fontFamily: 'PT Serif',
          fontWeight: 700,
          fontSize: large ? 68 : 40,
          color: OG_COLORS.green,
          lineHeight: 1.05,
          maxWidth: large ? 720 : 620,
        }}
      >
        {CHURCH_NAME}
      </div>
    </div>
  )
}

function Card({ logo, content, identityOnly }: { logo: string; content: CardContent; identityOnly?: boolean }) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: OG_SIZE.width,
        height: OG_SIZE.height,
        backgroundColor: OG_COLORS.background,
        fontFamily: 'PT Sans',
        color: OG_COLORS.ink,
        padding: 72,
        justifyContent: identityOnly ? 'center' : 'space-between',
        alignItems: identityOnly ? 'center' : 'flex-start',
      }}
    >
      {content.draft ? <DraftBadge /> : null}

      <div style={{ display: 'flex', width: '100%' }}>
        <Identity logo={logo} large={identityOnly} />
      </div>

      {identityOnly ? null : (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 20 }}>
          {content.label ? (
            <div
              style={{
                display: 'flex',
                fontFamily: 'PT Sans',
                fontWeight: 700,
                fontSize: 30,
                letterSpacing: 6,
                textTransform: 'uppercase',
                color: OG_COLORS.red,
              }}
            >
              {content.label}
            </div>
          ) : null}

          {content.title ? (
            <div
              style={{
                display: 'flex',
                fontFamily: 'PT Sans Narrow',
                fontWeight: 700,
                fontSize: fitTitleFontSize(content.title),
                lineHeight: 1.05,
                color: OG_COLORS.green,
                lineClamp: OG_TITLE_MAX_LINES,
                textOverflow: 'ellipsis',
              }}
            >
              {content.title}
            </div>
          ) : null}

          {content.metaLines && content.metaLines.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {content.metaLines.map((line, i) => (
                <div key={i} style={{ display: 'flex', fontSize: 32, color: OG_COLORS.gray }}>
                  {line}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: OG_SIZE.width,
          height: 18,
          display: 'flex',
          backgroundColor: OG_COLORS.green,
        }}
      />
    </div>
  )
}

async function renderCard(content: CardContent, identityOnly?: boolean): Promise<ImageResponse> {
  const [fonts, logo] = await Promise.all([loadOgFonts(), loadLogoDataUri()])
  return new ImageResponse(<Card logo={logo} content={content} identityOnly={identityOnly} />, { ...OG_SIZE, fonts })
}

export function renderIdentityCard(): Promise<ImageResponse> {
  return renderCard({}, true)
}

export function renderInstitutionalCard(pageName: string): Promise<ImageResponse> {
  return renderCard({ title: pageName })
}

export function renderArticleCard(article: { title: string; longDate: string }): Promise<ImageResponse> {
  return renderCard({ label: 'Artigo', title: article.title, metaLines: [article.longDate] })
}

export function renderBulletinCard(bulletin: {
  title: string
  longDate: string
  subtitle: string
  draft?: boolean
}): Promise<ImageResponse> {
  return renderCard({
    label: 'Boletim',
    title: bulletin.title,
    metaLines: [bulletin.longDate, bulletin.subtitle],
    draft: bulletin.draft,
  })
}

export function renderLiturgyCard(liturgy: {
  theme: string
  longDate: string
  time: string | null
}): Promise<ImageResponse> {
  const metaLines = [`${liturgy.longDate} às ${liturgy.time}`]
  return renderCard({ label: 'Liturgia', title: liturgy.theme, metaLines })
}

export function ogNotFound(): Response {
  return new Response('Not found', { status: 404 })
}
