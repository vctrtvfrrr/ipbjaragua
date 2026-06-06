import Link from 'next/link'

export default function Bulletins() {
  return (
    <section className="container mx-auto py-10 xl:px-0">
      <h2 className="font-narrow mb-5 text-3xl text-green-900 uppercase">Boletins Semanais</h2>
      <main>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 50 }, (_, index) => {
            const number = 70 - index
            return (
              <div key={number}>
                <Link href="/bulletins/2026-06-07">
                  <h3 className="font-narrow mt-4 mb-2 text-2xl leading-7">07 de junho de 2026</h3>
                  <small className="mb-2 block text-gray-500">{number}° Edição — Ano II</small>
                </Link>
              </div>
            )
          })}
        </div>
        {/* Paginação */}
      </main>
    </section>
  )
}
