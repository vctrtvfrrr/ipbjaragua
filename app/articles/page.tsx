import ArticlesList from '@/components/ArticlesList'

export default function Articles() {
  return (
    <section className="container mx-auto py-10 xl:px-0">
      <h2 className="font-narrow mb-5 text-3xl text-green-900 uppercase">Artigos</h2>
      <main>
        <ArticlesList className="grid grid-cols-1 gap-x-6 gap-y-10 lg:grid-cols-2 xl:grid-cols-3" />
      </main>
    </section>
  )
}
