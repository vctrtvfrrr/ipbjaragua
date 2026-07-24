import Image from 'next/image'

const ASSETS = {
  symbol: { src: '/images/brand/logo-symbol.svg', width: 430, height: 407 },
  horizontal: { src: '/images/brand/logo-horizontal.svg', width: 1123, height: 407 },
  vertical: { src: '/images/brand/logo-vertical.svg', width: 653, height: 739 },
} as const

type Props = {
  variant: keyof typeof ASSETS
  alt?: string
  className?: string
  priority?: boolean
}

export default function BrandMark({ variant, alt = '', className, priority }: Props) {
  const asset = ASSETS[variant]

  return (
    <Image
      src={asset.src}
      width={asset.width}
      height={asset.height}
      alt={alt}
      className={className}
      priority={priority}
      unoptimized
    />
  )
}
