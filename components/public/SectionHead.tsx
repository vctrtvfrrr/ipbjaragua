export default function SectionHead({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <div className="mb-8 flex items-center gap-5">
      <h2 id={id} className="eyebrow text-brand-ridge whitespace-nowrap">
        {children}
      </h2>
      <span aria-hidden="true" className="bg-brand-accent h-0.5 flex-1" />
    </div>
  )
}
