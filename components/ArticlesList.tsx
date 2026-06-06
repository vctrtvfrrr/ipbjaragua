import Image from 'next/image'
import Link from 'next/link'

export default function ArticlesList({ className }: { className: string }) {
  return (
    <>
      <div className={className}>
        {Array.from({ length: 12 }, (_, index) => {
          const number = index + 1
          return (
            <div key={number}>
              <Link href="/articles/details">
                <Image
                  className="h-auto w-full rounded"
                  src="/images/featured-image.png"
                  width={340}
                  height={100}
                  alt="A justiça e a misericórdia de Deus não se contradizem"
                />
                <h3 className="font-narrow mt-4 mb-2 text-2xl leading-7">
                  A justiça e a misericórdia de Deus não se contradizem
                </h3>
              </Link>
              <small className="mb-2 block text-gray-500">Rev. Jean Carlos Almeida &mdash; 07 de junho de 2026</small>
              <p className="text-justify">
                Como Deus pode ser justo e misericordioso ao mesmo tempo? A cruz revela a resposta definitiva em Cristo.
              </p>
            </div>
          )
        })}
      </div>
      {/* Paginação */}
    </>
  )
}
