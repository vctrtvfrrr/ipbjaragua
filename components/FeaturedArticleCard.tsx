import Link from 'next/link'
import type { Article } from '@/db/queries/articles'

export default function FeaturedArticleCard({ article }: { article: Article | undefined }) {
  if (!article) return null

  return (
    <li className="my-2 w-full overflow-hidden px-2 md:w-1/3 lg:w-1/3 xl:w-1/3">
      <Link href={`/articles/${article.slug}`}>
        <div
          className="relative mx-2 flex items-center justify-center overflow-hidden rounded bg-gray-300 bg-cover bg-center"
          style={{
            height: '260px',
            backgroundImage: 'url(/images/featured-image.png)',
          }}
        >
          <div className="absolute z-10 h-full w-full bg-black opacity-50"></div>
          <div className="relative z-20 p-5 text-center">
            <span className="inline-block text-xs tracking-wide text-white uppercase">Artigo</span>
            <h2 className="my-5 font-serif text-xl font-semibold text-white">{article.title}</h2>
            {article.author ? (
              <span className="inline-block font-sans text-xs text-white">{article.author}</span>
            ) : null}
          </div>
        </div>
      </Link>
    </li>
  )
}
