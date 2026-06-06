import Link from 'next/link'

export default function MainNav() {
  return (
    <ul>
      <li className="inline-block">
        <Link className="block px-3 font-semibold" href="/articles">
          Artigos
        </Link>
      </li>
      <li className="inline-block">
        <Link className="block px-3 font-semibold" href="/bulletins">
          Boletins
        </Link>
      </li>
      <li className="inline-block">
        <Link className="block px-3 font-semibold" href="/liturgies">
          Liturgias
        </Link>
      </li>
      <li className="inline-block">
        <Link className="block px-3 font-semibold" href="/about">
          Sobre Nós
        </Link>
      </li>
      <li className="inline-block">
        <Link className="block px-3 font-semibold" href="/location">
          Como Chegar
        </Link>
      </li>
    </ul>
  )
}
