import Image from "next/image";
import localFont from "next/font/local";
import { PT_Sans_Narrow } from 'next/font/google'
import logo from '../public/logo.svg'

const zapfhumnst = localFont({
  src: "../public/fonts/zhum601b-webfont.woff2",
  display: "swap",
});

const ptSansNarrow = PT_Sans_Narrow({
  subsets: ['latin'],
  display: "swap",
  weight: ["400"]
})

export default function Main() {
  return (
    <div className="flex h-screen justify-center items-center">
      <header>
        <div className="flex items-center mb-2">
          <Image src={logo} alt="" width={102} height={80} style={{ filter: 'invert(.22) sepia(1) saturate(4) hue-rotate(90deg)' }} />
          <div className="flex flex-col ml-2">
            <h1
              className={`${zapfhumnst.className} uppercase text-2xl font-bold tracking-tighter`}
            >
              Igreja Presbiteriana <span className="text-xl">de</span>{" "}
              Jaraguá <span className="text-xl">do</span> Sul
            </h1>
            <address className={ptSansNarrow.className}>
              Av. Mal. Deodoro da Fonseca, 1451 - Centro, Jaraguá do Sul -
              SC, CEP: 89251-700
            </address>
            <p className={`${ptSansNarrow.className} tracking-wider`}>
              <span>Tel.: (47) 98809-9451</span> |{" "}
              <span>www.ipbjaragua.org.br</span> |{" "}
              <span>contato@ipbjaragua.org.br</span>
            </p>
          </div>
        </div>
      </header>
    </div>
  );
}
