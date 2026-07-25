import Horizon from '@/components/brand/Horizon'

type Props = {
  eyebrow?: string
  title: string
  meta?: React.ReactNode
  children?: React.ReactNode
}

export default function PageHeader({ eyebrow, title, meta, children }: Props) {
  return (
    <>
      <section className="bg-brand-sky print:border-brand-ridge print:bg-transparent print:border-b-2">
        <div className="container mx-auto px-5 md:px-8">
          <div className="max-w-3xl py-12 md:py-16 print:pt-0 print:pb-3">
            {eyebrow ? <p className="eyebrow text-brand-ridge">{eyebrow}</p> : null}
            <h1 className="text-editorial text-brand-ridge mt-4 font-serif">{title}</h1>
            {meta ? (
              <p className="font-narrow text-brand-deep mt-4 text-xl tracking-[0.06em] uppercase">{meta}</p>
            ) : null}
            {children}
          </div>
        </div>
      </section>
      <Horizon className="block h-12 w-full md:h-20 print:hidden" />
    </>
  )
}
