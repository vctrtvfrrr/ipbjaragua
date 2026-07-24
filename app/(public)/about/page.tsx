import PageHeader from '@/components/public/PageHeader'
import { institutionalMetadata } from '@/lib/og/metadata'

export const metadata = institutionalMetadata('about')

export default function About() {
  return (
    <main>
      <PageHeader eyebrow="Institucional" title="Sobre nós" />

      {/* TODO: substituir pelo texto institucional aprovado (issue #42 mantém o preenchimento). */}
      <div className="container mx-auto px-5 pt-6 pb-20 md:px-8">
        <div className="prose prose-lg prose-headings:font-serif prose-headings:text-brand-ridge">
          <p>
            Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum
            tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas
            semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien
            ullamcorper pharetra. Vestibulum erat wisi, condimentum sed, commodo vitae, ornare sit amet, wisi. Aenean
            fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci, sagittis tempus lacus enim ac dui.
          </p>
          <ul>
            <li>Lorem ipsum dolor sit amet, consectetuer adipiscing elit.</li>
            <li>Aliquam tincidunt mauris eu risus.</li>
            <li>Vestibulum auctor dapibus neque.</li>
          </ul>
          <p>
            Ligula est ut, curae rhoncus ultrices mi non. Et viverra blandit, congue nullam, urna mollis potenti
            consectetur semper ad senectus. Pharetra condimentum, nulla conubia nostra cras. Condimentum velit euismod,
            eget ligula sem sodales bibendum. Aliquet vulputate dui congue, lacinia venenatis quisque, nec adipiscing
            suscipit ante ut accumsan bibendum lobortis. Convallis ante, torquent arcu justo.
          </p>
        </div>
      </div>
    </main>
  )
}
